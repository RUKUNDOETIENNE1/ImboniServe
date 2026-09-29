/**
 * WhatsApp Order Service
 * Handles staff-assisted ordering via Twilio WhatsApp
 */

import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils/currency'
import { normalizePhone, maskPhone } from '@/lib/utils/phone'
import { logger } from '@/lib/logger'
import { KitchenDispatchService } from './kitchen-dispatch.service'
import twilio from 'twilio'

const log = logger.child({ service: 'whatsapp-order' })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

let twilioClient: any = null
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
}

export interface ProcessIncomingOptions {
  /** Provider message id (Twilio MessageSid) for idempotent delivery */
  messageSid?: string
}

export interface ProcessResult {
  success: boolean
  reply: string
  orderId?: string
  /** True when the message was already processed (idempotent replay) */
  duplicate?: boolean
}

type ParsedItem = { quantity: number; name: string; note?: string; instructionTags?: string[] }

export class WhatsAppOrderService {
  /**
   * Process incoming WhatsApp message from staff.
   * Idempotent on opts.messageSid: a re-delivered webhook never creates a
   * second Sale.
   */
  static async processIncomingMessage(from: string, body: string, opts: ProcessIncomingOptions = {}): Promise<ProcessResult> {
    log.info('Processing WhatsApp message', {
      from: maskPhone(from),
      bodyLength: typeof body === 'string' ? body.length : 0,
      messageSid: opts.messageSid,
    })

    // Idempotency: a previously processed provider message id short-circuits
    // before any order work (Twilio may redeliver webhooks).
    if (opts.messageSid) {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: { messageSid: opts.messageSid },
        select: { id: true },
      })
      if (existing) {
        log.info('Duplicate WhatsApp message ignored', { messageSid: opts.messageSid })
        return {
          success: true,
          duplicate: true,
          reply: 'This message was already processed. Your order was received.',
        }
      }
    }

    // Parse message format: "ORDER [table] [items]"
    // Example: "ORDER T5 2x Brochette, 1x Primus"
    const orderMatch = body.match(/ORDER\s+([A-Z0-9]+)\s+([\s\S]+)/i)

    if (!orderMatch) {
      return {
        success: false,
        reply: 'Invalid format. Use: ORDER [table] [items]\nExample: ORDER T5 2x Brochette, 1x Primus'
      }
    }

    const [, tableIdentifier, itemsText] = orderMatch

    // Extract optional post attribution from body
    const bracketPostMatch = body.match(/\[Post:([a-zA-Z0-9_-]+)\]/i)
    const refPostMatch = body.match(/ref_post=([a-zA-Z0-9_-]+)/)
    const refPostId = bracketPostMatch ? bracketPostMatch[1] : (refPostMatch ? refPostMatch[1] : undefined)

    // Support optional order-level notes via "NOTES: <text>" suffix
    const split = itemsText.split(/\bNOTES?\s*:/i)
    const itemsPart = split[0]
    const orderNotes = split[1]?.trim()

    // Find staff member by phone (normalized — Twilio sends +E.164, staff
    // records may store local 0-prefix format)
    const staff = await this.findStaffByPhone(from)

    if (!staff) {
      return {
        success: false,
        reply: 'Unauthorized. Your phone number is not registered as staff.'
      }
    }

    const business = staff.business
    if (!business) {
      return {
        success: false,
        reply: 'No business is linked to your staff account.'
      }
    }
    const businessIdVal = business.id

    // Find table
    const table = await prisma.table.findFirst({
      where: {
        businessId: businessIdVal,
        OR: [
          { number: tableIdentifier },
          { qrCode: { contains: tableIdentifier } }
        ]
      }
    })

    if (!table) {
      return {
        success: false,
        reply: `Table ${tableIdentifier} not found. Check table number and try again.`
      }
    }

    // Parse items
    const items = this.parseOrderItems(itemsPart)

    if (items.length === 0) {
      return {
        success: false,
        reply: 'No valid items found. Format: 2x Item Name, 1x Another Item'
      }
    }

    // Resolve every item deterministically — never silently drop or pick
    // an arbitrary first match.
    const resolved: Array<{ menuItem: any; quantity: number; note?: string; instructionTags?: string[] }> = []
    const problems: string[] = []
    for (const item of items) {
      if (item.quantity < 1 || item.quantity > 50) {
        problems.push(`"${item.name}" has an invalid quantity (${item.quantity}). Use 1–50.`)
        continue
      }
      const r = await this.resolveMenuItem(businessIdVal, item.name)
      if (r.status === 'ok') {
        resolved.push({ menuItem: r.menuItem, quantity: item.quantity, note: item.note, instructionTags: item.instructionTags })
      } else if (r.status === 'ambiguous') {
        problems.push(`"${item.name}" is ambiguous — matches ${r.matches.join(', ')}. Use the exact item name.`)
      } else {
        problems.push(`"${item.name}" not found on the menu.`)
      }
    }

    if (problems.length > 0) {
      return {
        success: false,
        reply: `Order not created — please fix and resend:\n${problems.join('\n')}`
      }
    }

    // Record the inbound message for deduplication BEFORE creating the order.
    // The unique messageSid constraint is the atomic gate: a concurrent
    // redelivery of the same provider message loses the insert race and must
    // not create a second Sale.
    let dedupRecorded = false
    if (opts.messageSid) {
      try {
        await prisma.whatsAppMessage.create({
          data: {
            businessId: businessIdVal,
            userId: staff.id,
            fromNumber: normalizePhone(from.replace('whatsapp:', '')),
            toNumber: whatsappNumber || '',
            message: `ORDER ${tableIdentifier} (${items.length} item(s))`,
            type: 'ORDER',
            status: 'PROCESSED',
            direction: 'INBOUND',
            command: 'ORDER',
            processed: true,
            messageSid: opts.messageSid,
          },
        })
        dedupRecorded = true
      } catch (dupErr: any) {
        if (dupErr?.code === 'P2002') {
          log.info('Concurrent duplicate WhatsApp message', { messageSid: opts.messageSid })
          return {
            success: true,
            duplicate: true,
            reply: 'This message was already processed. Your order was received.',
          }
        }
        log.warn('Failed to record inbound WhatsApp message', { error: String(dupErr) })
      }
    }

    // Create order. If creation fails after the dedup row was written, remove
    // the row so a genuine provider retry can still complete the order.
    let order
    try {
      order = await this.createOrder(businessIdVal, table.id, staff.id, resolved, orderNotes)
    } catch (orderErr) {
      if (dedupRecorded) {
        try {
          await prisma.whatsAppMessage.delete({ where: { messageSid: opts.messageSid } })
        } catch (cleanupErr) {
          log.warn('Failed to release dedup record after order failure', { messageSid: opts.messageSid, error: String(cleanupErr) })
        }
      }
      throw orderErr
    }

    // Post attribution — if order came from a feed CTA
    if (refPostId) {
      try {
        await (prisma as any).postAttribution.create({
          data: {
            postId: refPostId,
            businessId: businessIdVal,
            orderId: order.id,
            channel: 'WHATSAPP',
            attributedAt: new Date()
          }
        })
      } catch (attrErr) {
        log.warn('PostAttribution failed for WhatsApp order', { attrErr })
      }
    }

    // Dispatch to kitchen — same path as QR/public order confirm so WhatsApp
    // orders reach stations and emit real-time events. Non-fatal: the kitchen
    // list polls as a fallback.
    try {
      await KitchenDispatchService.dispatchToKitchen({
        saleId: order.id,
        businessId: order.businessId,
        orderNumber: order.orderNumber || order.id,
        orderSource: 'WHATSAPP',
        tableId: order.tableId || undefined,
        tableNumber: order.table?.number,
        items: order.items.map((item: any) => ({
          menuItemName: item.menuItem.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
      })
    } catch (dispatchError) {
      log.error('Kitchen dispatch failed for WhatsApp order (kitchen will poll)', { orderId: order.id, error: String(dispatchError) })
    }

    // Send confirmation
    const reply = this.formatOrderConfirmation(order, table, resolved)

    return {
      success: true,
      reply,
      orderId: order.id
    }
  }

  /**
   * Resolve a staff user by their WhatsApp phone number.
   * Normalizes the incoming number to E.164 and matches against the common
   * stored variants (E.164, bare digits, local 0-prefix).
   */
  private static async findStaffByPhone(from: string) {
    const normalized = normalizePhone((from || '').replace('whatsapp:', ''))
    const digits = normalized.replace(/\D/g, '')
    const variants = new Set<string>([normalized, digits])
    // Local format variant: 0 + national significant number (strip dial code)
    const dialDigits = digits.replace(/^\d{3}(?=\d{9}$)/, '')
    if (dialDigits !== digits) variants.add(`0${dialDigits}`)

    return prisma.user.findFirst({
      where: {
        phone: { in: [...variants] },
        roles: { hasSome: ['WAITER', 'CASHIER', 'MANAGER', 'OWNER'] }
      },
      include: { business: true }
    })
  }

  /**
   * Parse order items from text
   */
  private static parseOrderItems(text: string): ParsedItem[] {
    const items: ParsedItem[] = []

    // Split by comma or newline
    const parts = text.split(/[\,\n]+/).map(p => p.trim()).filter(Boolean)

    for (const part of parts) {
      // Support optional inline notes in [..] or (..)
      const withQty = part.match(/^(\d+)\s*[x×]?\s*([^\[(]+?)\s*(?:\[(.*?)\]|\((.*?)\))?\s*$/i)
      const noQty = withQty ? null : part.match(/^([^\[(]+?)\s*(?:\[(.*?)\]|\((.*?)\))?\s*$/i)

      let quantity = 1
      let name = ''
      let note: string | undefined
      if (withQty) {
        quantity = parseInt(withQty[1]) || 1
        name = (withQty[2] || '').trim()
        note = (withQty[3] || withQty[4] || '').trim() || undefined
      } else if (noQty) {
        quantity = 1
        name = (noQty[1] || '').trim()
        note = (noQty[2] || noQty[3] || '').trim() || undefined
      } else {
        name = part
      }

      if (!name) continue

      const instructionTags = note
        ? note
            .split(/[;,]+/)
            .map(t => t.trim())
            .filter(Boolean)
            .map(t => t.replace(/\s+/g, '_').toUpperCase())
        : []

      items.push({ quantity, name, note, instructionTags })
    }

    return items
  }

  /**
   * Resolve a requested item name to exactly one menu item for the business.
   * Exact (case-insensitive) match wins; otherwise a unique partial match is
   * accepted; multiple candidates are reported as ambiguous rather than
   * silently choosing the first row.
   */
  private static async resolveMenuItem(
    businessId: string,
    name: string
  ): Promise<
    | { status: 'ok'; menuItem: any }
    | { status: 'ambiguous'; matches: string[] }
    | { status: 'unmatched' }
  > {
    const trimmed = name.trim()
    if (!trimmed) return { status: 'unmatched' }

    // 1. Exact match first
    const exact = await prisma.menuItem.findFirst({
      where: {
        businessId,
        isAvailable: true,
        name: { equals: trimmed, mode: 'insensitive' }
      }
    })
    if (exact) return { status: 'ok', menuItem: exact }

    // 2. Partial matches — accept only if exactly one
    const candidates = await prisma.menuItem.findMany({
      where: {
        businessId,
        isAvailable: true,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { name: { startsWith: trimmed, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, priceCents: true },
      take: 10
    })

    if (candidates.length === 1) {
      const full = await prisma.menuItem.findUnique({ where: { id: candidates[0].id } })
      if (full) return { status: 'ok', menuItem: full }
    }

    if (candidates.length > 1) {
      return { status: 'ambiguous', matches: candidates.map(c => c.name) }
    }

    return { status: 'unmatched' }
  }

  /**
   * Create order in database.
   * Prices are always taken from the MenuItem rows — never from the message.
   */
  private static async createOrder(
    businessId: string,
    tableId: string,
    staffId: string,
    items: Array<{ menuItem: any; quantity: number; note?: string; instructionTags?: string[] }>,
    orderNotes?: string
  ) {
    const totalCents = items.reduce((sum, item) =>
      sum + (item.menuItem.priceCents * item.quantity), 0
    )

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const order = await prisma.sale.create({
      data: {
        orderNumber,
        businessId,
        tableId,
        userId: staffId,
        orderSource: 'WHATSAPP',
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        totalAmountCents: totalCents,
        status: 'PENDING',
        notes: orderNotes,
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            unitPriceCents: item.menuItem.priceCents,
            totalPriceCents: item.menuItem.priceCents * item.quantity,
            instructions: item.note ? { notes: [item.note], source: 'WHATSAPP' } : undefined,
            instructionTags: item.instructionTags || []
          }))
        }
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        business: { select: { currency: true } }
      }
    })

    log.info('WhatsApp order created', { orderId: order.id, businessId, tableId })

    return order
  }

  /**
   * Format order confirmation message
   */
  private static formatOrderConfirmation(order: any, table: any, items: Array<{ menuItem: any; quantity: number }>) {
    const currency = order.business?.currency || 'RWF'
    const itemsList = items.map(item =>
      `${item.quantity}x ${item.menuItem.name} - ${formatCurrency(item.menuItem.priceCents / 100, currency)}`
    ).join('\n')

    return `✅ Order confirmed!\n\n` +
      `📍 Table: ${table.number}\n` +
      `🆔 Order: #${order.orderNumber || order.id.slice(0, 8)}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `💰 Total: ${formatCurrency(order.totalAmountCents / 100, currency)}\n\n` +
      `Order sent to kitchen 🍳`
  }

  /**
   * Send WhatsApp message to staff
   */
  static async sendMessage(to: string, message: string) {
    if (!twilioClient || !whatsappNumber) {
      log.warn('Twilio not configured, skipping WhatsApp message')
      return { success: false, error: 'Twilio not configured' }
    }

    try {
      const fromNumber = (whatsappNumber || '').replace(/^whatsapp:/, '')
      const toWhatsApp = `whatsapp:${(to || '').replace(/^whatsapp:/, '')}`
      const result = await twilioClient.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: toWhatsApp,
        body: message
      })

      log.info('WhatsApp message sent', { to: maskPhone(to), sid: result.sid })
      return { success: true, sid: result.sid }
    } catch (error) {
      log.error('Failed to send WhatsApp message', { error: String(error), to: maskPhone(to) })
      return { success: false, error: String(error) }
    }
  }

  /**
   * Notify staff when order is ready
   */
  static async notifyOrderReady(orderId: string) {
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        table: true,
        items: { include: { menuItem: true } }
      }
    })

    if (!order || !order.user?.phone) {
      log.warn('Cannot notify staff - order or phone not found', { orderId })
      return
    }

    const message = `🔔 Order Ready!\n\n` +
      `📍 Table: ${order.table?.number || 'N/A'}\n` +
      `🆔 Order: #${order.orderNumber || order.id.slice(0, 8)}\n\n` +
      `Items ready to serve:\n` +
      order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join('\n')

    await this.sendMessage(order.user.phone, message)
  }

  /**
   * Get order status for staff query
   */
  static async getOrderStatus(orderId: string) {
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        business: { select: { currency: true } }
      }
    })

    if (!order) {
      return 'Order not found'
    }

    return `📋 Order Status\n\n` +
      `🆔 #${order.orderNumber || order.id.slice(0, 8)}\n` +
      `📍 Table: ${order.table?.number || 'N/A'}\n` +
      `⏱️ Status: ${order.status}\n` +
      `💰 Total: ${formatCurrency(order.totalAmountCents / 100, order.business?.currency || 'RWF')}\n\n` +
      `Items:\n` +
      order.items.map(item => `${item.quantity}x ${item.menuItem.name}`).join('\n')
  }
}
