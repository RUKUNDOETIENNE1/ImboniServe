/**
 * DiningSessionSlip Service
 * Live order tracking system for Tap & Leave™
 * 
 * This is the "LIVE LEDGER" during dining - NOT the final receipt
 * Final receipts are handled by SmartDiningSlip™ service
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface CreateDiningSessionSlipInput {
  sessionId: string
  businessId: string
  tableId?: string
  taxMode?: 'INCLUSIVE' | 'EXCLUSIVE'
  taxRate?: number
}

export interface AddOrderToSlipInput {
  slipId: string
  saleId: string
  items: Array<{
    saleItemId: string
    itemName: string
    quantity: number
    unitPriceCents: number
    totalPriceCents: number
    notes?: string
    instructionTags?: string[]
  }>
}

export class DiningSessionSlipService {
  /**
   * Create a new dining session slip when QR is scanned
   */
  static async createSlip(input: CreateDiningSessionSlipInput) {
    const slipNumber = `SLIP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const slip = await prisma.diningSessionSlip.create({
      data: {
        slipNumber,
        sessionId: input.sessionId,
        businessId: input.businessId,
        tableId: input.tableId,
        taxMode: input.taxMode || 'EXCLUSIVE',
        taxRate: input.taxRate || 18.0,
        status: 'active',
        sessionStartedAt: new Date(),
      },
      include: {
        session: {
          include: {
            table: true,
          },
        },
        items: true,
      },
    })

    // Log event
    await this.logEvent({
      sessionId: input.sessionId,
      slipId: slip.id,
      businessId: input.businessId,
      eventType: 'session_started',
      eventStatus: 'success',
    })

    return slip
  }

  /**
   * Add order items to the slip and update running totals
   */
  static async addOrderToSlip(input: AddOrderToSlipInput) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: input.slipId },
      include: { items: true },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    if (slip.status !== 'active') {
      throw new Error(`Cannot add items to slip with status: ${slip.status}`)
    }

    // Calculate new totals
    const itemsTotal = input.items.reduce((sum, item) => sum + item.totalPriceCents, 0)
    let newSubtotal: number
    let newVat: number
    let newTotal: number

    if (slip.taxMode === 'INCLUSIVE') {
      // Menu prices include VAT - extract VAT portion
      newTotal = slip.runningTotalCents + itemsTotal
      newVat = Math.round(newTotal * (slip.taxRate / (100 + slip.taxRate)))
      newSubtotal = newTotal - newVat
    } else {
      // EXCLUSIVE - add VAT on top
      newSubtotal = slip.runningSubtotalCents + itemsTotal
      newVat = Math.round(newSubtotal * (slip.taxRate / 100))
      newTotal = newSubtotal + newVat
    }

    // Update slip and add items in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Add items
      await tx.diningSessionSlipItem.createMany({
        data: input.items.map((item) => ({
          slipId: input.slipId,
          saleId: input.saleId,
          saleItemId: item.saleItemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
          notes: item.notes,
          instructionTags: item.instructionTags || [],
          kitchenStatus: 'pending',
        })),
      })

      // Update slip totals
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: input.slipId },
        data: {
          runningSubtotalCents: newSubtotal,
          runningVatCents: newVat,
          runningTotalCents: newTotal,
          lastOrderAt: new Date(),
          orderCount: { increment: 1 },
          itemCount: { increment: input.items.length },
        },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
          },
          session: {
            include: {
              table: true,
            },
          },
        },
      })

      // Update session running total
      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          runningTotalCents: newTotal,
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'order_added',
      eventStatus: 'success',
      orderId: input.saleId,
      metadata: {
        itemCount: input.items.length,
        orderTotal: itemsTotal,
        newRunningTotal: newTotal,
      },
    })

    return updated
  }

  /**
   * Update kitchen status for items
   */
  static async updateKitchenStatus(
    slipItemId: string,
    status: 'pending' | 'accepted' | 'preparing' | 'almost_ready' | 'ready' | 'served'
  ) {
    const now = new Date()
    const updateData: any = { kitchenStatus: status }

    if (status === 'ready') {
      updateData.kitchenReadyAt = now
    }
    if (status === 'served') {
      updateData.servedAt = now
    }

    return await prisma.diningSessionSlipItem.update({
      where: { id: slipItemId },
      data: updateData,
    })
  }

  /**
   * Initiate checkout - freeze the slip
   */
  static async initiateCheckout(slipId: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
      include: { items: true },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    if (slip.status !== 'active') {
      throw new Error(`Cannot checkout slip with status: ${slip.status}`)
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update slip status
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'checkout_initiated',
          checkoutInitiatedAt: new Date(),
        },
        include: {
          items: true,
          session: {
            include: {
              table: true,
            },
          },
        },
      })

      // Update session status
      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          checkoutStatus: 'checkout_initiated',
          checkoutInitiatedAt: new Date(),
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'checkout_initiated',
      eventStatus: 'success',
      metadata: {
        finalAmount: slip.runningTotalCents,
        itemCount: slip.itemCount,
      },
    })

    return updated
  }

  /**
   * Finalize bill - lock the amount
   */
  static async finalizeBill(slipId: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    if (slip.status !== 'checkout_initiated') {
      throw new Error(`Cannot finalize bill for slip with status: ${slip.status}`)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'bill_finalized',
          billFinalizedAt: new Date(),
          finalBillCents: slip.runningTotalCents,
        },
        include: {
          items: true,
          session: {
            include: {
              table: true,
            },
          },
        },
      })

      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          checkoutStatus: 'bill_finalized',
          finalBillCents: slip.runningTotalCents,
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'bill_finalized',
      eventStatus: 'success',
      metadata: {
        finalBillCents: slip.runningTotalCents,
      },
    })

    return updated
  }

  /**
   * Mark payment as triggered
   */
  static async markPaymentTriggered(slipId: string, paymentId: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'payment_triggered',
          paymentTriggeredAt: new Date(),
        },
      })

      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          checkoutStatus: 'payment_triggered',
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'payment_triggered',
      eventStatus: 'success',
      paymentId,
      metadata: {
        amount: slip.finalBillCents || slip.runningTotalCents,
      },
    })

    return updated
  }

  /**
   * Mark payment as confirmed
   */
  static async markPaymentConfirmed(slipId: string, paymentId: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'checkout_completed',
          checkoutCompletedAt: new Date(),
        },
      })

      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          checkoutStatus: 'checkout_completed',
          checkoutCompletedAt: new Date(),
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'payment_confirmed',
      eventStatus: 'success',
      paymentId,
    })

    return updated
  }

  /**
   * Mark payment as failed
   */
  static async markPaymentFailed(slipId: string, paymentId: string, errorMessage: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    // Revert to bill_finalized state
    const updated = await prisma.$transaction(async (tx) => {
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'bill_finalized',
        },
      })

      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          checkoutStatus: 'bill_finalized',
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'payment_failed',
      eventStatus: 'failed',
      paymentId,
      errorMessage,
    })

    return updated
  }

  /**
   * Close the session
   */
  static async closeSession(slipId: string) {
    const slip = await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
    })

    if (!slip) {
      throw new Error('Dining session slip not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSlip = await tx.diningSessionSlip.update({
        where: { id: slipId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      })

      await tx.tableSession.update({
        where: { id: slip.sessionId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      })

      return updatedSlip
    })

    // Log event
    await this.logEvent({
      sessionId: slip.sessionId,
      slipId: slip.id,
      businessId: slip.businessId,
      eventType: 'session_closed',
      eventStatus: 'success',
    })

    return updated
  }

  /**
   * Get slip by ID
   */
  static async getSlipById(slipId: string) {
    return await prisma.diningSessionSlip.findUnique({
      where: { id: slipId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        session: {
          include: {
            table: true,
            participants: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  }

  /**
   * Get slip by session ID
   */
  static async getSlipBySessionId(sessionId: string) {
    return await prisma.diningSessionSlip.findUnique({
      where: { sessionId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        session: {
          include: {
            table: true,
            participants: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  }

  /**
   * Get active slips for a business
   */
  static async getActiveSlips(businessId: string) {
    return await prisma.diningSessionSlip.findMany({
      where: {
        businessId,
        status: {
          in: ['active', 'checkout_initiated', 'bill_finalized', 'payment_triggered'],
        },
      },
      include: {
        items: true,
        session: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        sessionStartedAt: 'desc',
      },
    })
  }

  /**
   * Log checkout event
   */
  private static async logEvent(data: {
    sessionId: string
    slipId?: string
    businessId: string
    eventType: string
    eventStatus: 'success' | 'failed' | 'pending'
    orderId?: string
    paymentId?: string
    userId?: string
    metadata?: any
    errorMessage?: string
  }) {
    await prisma.checkoutEvent.create({
      data: {
        sessionId: data.sessionId,
        slipId: data.slipId,
        businessId: data.businessId,
        eventType: data.eventType,
        eventStatus: data.eventStatus,
        orderId: data.orderId,
        paymentId: data.paymentId,
        userId: data.userId,
        metadata: data.metadata,
        errorMessage: data.errorMessage,
      },
    })
  }
}
