import { prisma } from '@/lib/prisma'
import type { CreateSaleInput, UpdateSaleInput, SalesQueryInput } from '@/lib/validations/sales.schema'
import { calculateConvenienceFee } from '@/lib/pricing/fee-calculator'
import type { PaymentMethod } from '@/lib/pricing/fee-config'
import { SmartDiningSlipService } from './smart-dining-slip.service'

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

    const sale = await prisma.sale.create({
      data: {
        orderNumber,
        businessId: input.businessId,
        userId,
        totalAmountCents,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING',
        paymentReference: input.paymentReference,
        notes: input.notes,
        isPaid: input.paymentMethod === 'CASH',
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
      try {
        await SmartDiningSlipService.generateSlip({
          saleId: sale.id,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          clientConsentedWhatsApp: input.clientConsentedWhatsApp,
          consentCollectedBy: userId,
        })
      } catch (error) {
        console.error('Failed to generate Smart Dining Slip™:', error)
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
    const where: any = { id }
    if (businessId) where.businessId = businessId

    const sale = await prisma.sale.update({
      where,
      data: input,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (input.paymentStatus === 'COMPLETED' && input.isPaid) {
      try {
        await SmartDiningSlipService.generateSlip({
          saleId: sale.id,
          clientPhone: (input as any).clientPhone,
          clientEmail: (input as any).clientEmail,
          clientConsentedWhatsApp: (input as any).clientConsentedWhatsApp,
          consentCollectedBy: (input as any).consentCollectedBy,
        })
      } catch (error) {
        console.error('Failed to generate Smart Dining Slip™:', error)
      }
    }

    return sale
  }

  static async deleteSale(id: string, businessId?: string) {
    const where: any = { id }
    if (businessId) where.businessId = businessId

    return prisma.sale.delete({ where })
  }

  static async getDailySales(businessId: string, date?: Date) {
    const targetDate = date || new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

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
    const totalCost = sales.reduce((sum: number, sale: any) => {
      return (
        sum + (sale.items as any[]).reduce(
          (itemSum: number, item: any) => itemSum + ((item.menuItem.costCents as number) * (item.quantity as number)),
          0,
        )
      )
    }, 0)

    return {
      sales,
      count: sales.length,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
    }
  }
}
