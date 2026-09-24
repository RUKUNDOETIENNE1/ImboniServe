import { prisma } from '@/lib/prisma'
import type { CreateSaleInput, UpdateSaleInput, SalesQueryInput, CancelSaleInput } from '@/lib/validations/sales.schema'
import { calculateConvenienceFee } from '@/lib/pricing/fee-calculator'
import type { PaymentMethod } from '@/lib/pricing/fee-config'
import { PaymentCompletionService } from './payment-completion.service'
import { FinancialTruthService, CostSource } from './financial-truth.service'
import { GuestRecognitionService } from './guest-recognition.service'
import { getBusinessDayBoundary } from '@/lib/utils/timezone'

export class SalesService {
  static async createSale(userId: string, input: CreateSaleInput) {
    let totalAmountCents = input.items.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0)
    const subtotalRWF = Math.round(totalAmountCents / 100)

    const feeCalc = calculateConvenienceFee(
      subtotalRWF,
      input.paymentMethod as unknown as PaymentMethod,
      true,
      0
    )

    const convenienceFeeCents = feeCalc.feeApplied ? feeCalc.convenienceFee * 100 : 0
    totalAmountCents = totalAmountCents + convenienceFeeCents
    
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Upsert customer if phone provided
    let customerId: string | undefined
    if (input.clientPhone) {
      try {
        const result = await GuestRecognitionService.registerOrRecognize(
          input.clientPhone,
          input.businessId,
        )
        customerId = result.customerId
      } catch (error) {
        console.error('Failed to upsert customer for sale:', error)
      }
    }

    const sale = await prisma.sale.create({
      data: {
        orderNumber,
        businessId: input.businessId,
        userId,
        customerId: customerId || null,
        customerPhone: input.clientPhone || null,
        totalAmountCents,
        paymentMethod: input.paymentMethod,
        // GPV-D010 FIX: Don't pre-set COMPLETED for CASH — let PaymentCompletionService
        // handle the full atomic transition (status, paymentStatus, isPaid, ledger entry).
        // Pre-setting paymentStatus='COMPLETED' causes the idempotent guard in
        // PaymentCompletionService to skip, which means no ledger entry is created.
        paymentStatus: 'PENDING',
        paymentReference: input.paymentReference,
        notes: input.notes,
        isPaid: false,
        items: {
          create: input.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.unitPriceCents * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    })

    if (input.paymentMethod === 'CASH') {
      // Route through canonical PaymentCompletionService for all post-payment side effects
      // GPV-D010 FIX: PaymentCompletionService now handles the full atomic transition
      // including status='COMPLETED', ledger entry creation, and all side effects.
      try {
        await PaymentCompletionService.onPaymentSuccess(
          '', // CASH has no payment transaction — service will create ledger from sale data
          sale.id,
          {
            clientPhone: input.clientPhone,
            clientEmail: input.clientEmail,
            clientConsentedWhatsApp: input.clientConsentedWhatsApp,
            consentCollectedBy: userId,
            source: 'cash-sale',
          }
        )
      } catch (error) {
        console.error('Failed to process payment completion for CASH sale:', error)
      }
    }

    return sale
  }

  static async getSales(query: SalesQueryInput) {
    const where: any = {}

    if (query.businessId) where.businessId = query.businessId
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              roles: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.sale.count({ where }),
    ])

    return { sales, total }
  }

  static async getSaleById(id: string, businessId?: string) {
    const where: any = { id }
    if (businessId) where.businessId = businessId

    return prisma.sale.findFirst({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            roles: true,
          },
        },
      },
    })
  }

  static async updateSale(id: string, input: UpdateSaleInput, businessId?: string) {
    // Validate business ownership if required
    if (businessId) {
      const existing = await prisma.sale.findUnique({
        where: { id },
        select: { businessId: true }
      })
      
      if (!existing) {
        throw new Error('Sale not found')
      }
      
      if (existing.businessId !== businessId) {
        throw new Error('Forbidden: Sale does not belong to this business')
      }
    }

    // GPV-D010 FIX: If the update is marking the sale as COMPLETED, don't set
    // paymentStatus/isPaid in the update — let PaymentCompletionService handle
    // the full atomic transition (status, paymentStatus, isPaid, ledger entry).
    // Otherwise the idempotent guard in PaymentCompletionService skips, and no
    // ledger entry is created.
    const isCompletingPayment = input.paymentStatus === 'COMPLETED' && input.isPaid
    const updateData = { ...input }
    if (isCompletingPayment) {
      delete updateData.paymentStatus
      delete updateData.isPaid
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (isCompletingPayment) {
      // Route through canonical PaymentCompletionService
      // GPV-D010 FIX: Pass the sale's paymentTransactionId so the ledger entry
      // is created with the correct transaction reference.
      try {
        await PaymentCompletionService.onPaymentSuccess(
          sale.paymentTransactionId || '',
          sale.id,
          { source: 'sale-update' }
        )
      } catch (error) {
        console.error('Failed to process payment completion on sale update:', error)
      }
    }

    return sale
  }

  static async cancelSale(id: string, input: CancelSaleInput, businessId?: string) {
    // Validate business ownership and payment status
    const existing = await prisma.sale.findUnique({
      where: { id },
      select: { 
        businessId: true, 
        paymentStatus: true, 
        isPaid: true,
        status: true 
      }
    })
    
    if (!existing) {
      throw new Error('Sale not found')
    }
    
    if (businessId && existing.businessId !== businessId) {
      throw new Error('Forbidden: Sale does not belong to this business')
    }
    
    // Block cancellation of paid orders without refund
    if (existing.isPaid || existing.paymentStatus === 'COMPLETED' || existing.paymentStatus === 'PAID') {
      throw new Error('Cannot cancel paid orders. Process refund first.')
    }
    
    // Prevent double-cancellation
    if (existing.status === 'CANCELLED') {
      throw new Error('Order is already cancelled')
    }
    
    // Update sale to cancelled status
    const cancelledSale = await prisma.sale.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        notes: existing.status === 'ACTIVE' 
          ? `CANCELLED: ${input.reason}` 
          : `${existing.status} | CANCELLED: ${input.reason}`
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })
    
    return cancelledSale
  }

  static async deleteSale(id: string, businessId?: string) {
    // Validate business ownership if required
    if (businessId) {
      const existing = await prisma.sale.findUnique({
        where: { id },
        select: { businessId: true, paymentStatus: true, isPaid: true }
      })
      
      if (!existing) {
        throw new Error('Sale not found')
      }
      
      if (existing.businessId !== businessId) {
        throw new Error('Forbidden: Sale does not belong to this business')
      }
      
      // Block deletion of paid orders (safety guard)
      if (existing.isPaid || existing.paymentStatus === 'COMPLETED' || existing.paymentStatus === 'PAID') {
        throw new Error('Cannot delete paid orders. Use cancellation with refund instead.')
      }
    }

    return prisma.sale.delete({ where: { id } })
  }

  /**
   * Get daily sales with actual consumption costs where available.
   * Falls back to estimated costs for historical data without consumption records.
   */
  static async getDailySales(businessId: string, date?: Date) {
    const targetDate = date || new Date()
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true }
    })
    const { start: startOfDay, end: endOfDay } = getBusinessDayBoundary(
      targetDate,
      business?.timezone
    )

    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.totalAmountCents as number), 0)

    // Get actual + estimated cost from FinancialTruthService
    const costData = await FinancialTruthService.getCombinedPeriodCost(
      businessId,
      startOfDay,
      endOfDay
    )

    const totalCost = costData.totalCostCents

    return {
      sales,
      count: sales.length,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      // Financial truth metadata
      costSource: costData.source,
      actualCostCents: costData.actualCostCents,
      estimatedCostCents: costData.estimatedCostCents,
      actualCostPercentage: costData.actualPercentage,
    }
  }
}
