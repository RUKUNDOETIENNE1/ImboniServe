/**
 * WhatsApp Order Service
 * Handles staff-assisted ordering via Twilio WhatsApp
 */

import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils/currency'
import { logger } from '@/lib/logger'
import { NotificationService } from './notification.service'
import twilio from 'twilio'

const log = logger.child({ service: 'whatsapp-order' })

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

let twilioClient: any = null
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
}

export class WhatsAppOrderService {
  /**
   * Process incoming WhatsApp message from staff
   */
  static async processIncomingMessage(from: string, body: string, businessId?: string) {
    log.info('Processing WhatsApp message', { from, body })

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
    // Prefer explicit marker in message text, e.g. "[Post:abc123]", otherwise fall back to URL query param ref_post
    const bracketPostMatch = body.match(/\[Post:([a-zA-Z0-9_-]+)\]/i)
    const refPostMatch = body.match(/ref_post=([a-zA-Z0-9_-]+)/)
    const refPostId = bracketPostMatch ? bracketPostMatch[1] : (refPostMatch ? refPostMatch[1] : undefined)

    // Support optional order-level notes via "NOTES: <text>" suffix
    const split = itemsText.split(/\bNOTES?\s*:/i)
    const itemsPart = split[0]
    const orderNotes = split[1]?.trim()

    // Find staff member by phone
    const staff = await prisma.user.findFirst({
      where: {
        phone: from.replace('whatsapp:', ''),
        roles: { hasSome: ['WAITER', 'CASHIER', 'MANAGER', 'OWNER'] }
      },
      include: { business: true }
    })

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

    // Match items to menu
    const menuItems = await this.matchMenuItems(businessIdVal, items)
    
    if (menuItems.length === 0) {
      return {
        success: false,
        reply: 'No menu items matched. Check item names and try again.'
      }
    }

    // Create order
    const order = await this.createOrder(businessIdVal, table.id, staff.id, menuItems as any, orderNotes)

    // Post attribution — if order came from a feed CTA
    if (refPostId) {
      try {
        await (prisma as any).postAttribution.create({
          data: {
            postId: refPostId,
            businessId: businessIdVal,
            orderId: order.id,
            channel: 'WHATSAPP_AI',
            attributedAt: new Date()
          }
        })
      } catch (attrErr) {
        log.warn('PostAttribution failed for WhatsApp order', { attrErr })
      }
    }

    // Send confirmation
    const reply = this.formatOrderConfirmation(order, table, menuItems)

    return {
      success: true,
      reply,
      orderId: order.id
    }
  }

  /**
   * Parse order items from text
   */
  private static parseOrderItems(text: string): Array<{ quantity: number; name: string; note?: string; instructionTags?: string[] }> {
    const items: Array<{ quantity: number; name: string; note?: string; instructionTags?: string[] }> = []

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
   * Match parsed items to menu items
   */
  private static async matchMenuItems(businessId: string, items: Array<{ quantity: number; name: string; note?: string; instructionTags?: string[] }>) {
    const matched: Array<{ menuItem: any; quantity: number; note?: string; instructionTags?: string[] }> = []
    
    for (const item of items) {
      // Fuzzy match menu items
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          businessId,
          isAvailable: true,
          OR: [
            { name: { contains: item.name, mode: 'insensitive' } },
            { name: { startsWith: item.name, mode: 'insensitive' } }
          ]
        }
      })
      
      if (menuItem) {
        matched.push({ menuItem, quantity: item.quantity, note: item.note, instructionTags: item.instructionTags })
      }
    }
    
    return matched
  }

  /**
   * Create order in database
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
        table: true
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

      log.info('WhatsApp message sent', { to, sid: result.sid })
      return { success: true, sid: result.sid }
    } catch (error) {
      log.error('Failed to send WhatsApp message', { error: String(error), to })
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
