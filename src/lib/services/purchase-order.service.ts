import { prisma } from '@/lib/prisma'
import { getPlatformFee, FeeType } from './platform-fee.service'

const MARKETPLACE_FEE_PERCENT = 7.5 // Fallback default
const VAT_RATE = 18.0 // Fallback default

export interface CreatePurchaseOrderInput {
  businessId: string
  supplierId: string
  items: Array<{
    productName: string
    productId?: string
    quantity: number
    unit: string
    unitPriceCents: number
  }>
  deliveryAddress?: string
  deliveryCity?: string
  deliveryDistrict?: string
  requestedDeliveryDate?: Date
  notes?: string
  createdById: string
}

export class PurchaseOrderService {
  /**
   * Generate unique PO number
   */
  static generatePONumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PO-${timestamp}-${random}`
  }

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(input: CreatePurchaseOrderInput) {
    const poNumber = this.generatePONumber()

    // Fetch business to get tax rate
    const business = await prisma.business.findUnique({
      where: { id: input.businessId },
      select: { taxRate: true }
    })
    const vatRate = business?.taxRate ?? VAT_RATE

    // Calculate totals
    let subtotalCents = 0
    const items = input.items.map((item) => {
      const totalPriceCents = Math.round(item.quantity * item.unitPriceCents)
      subtotalCents += totalPriceCents
      return {
        productName: item.productName,
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceCents: item.unitPriceCents,
        totalPriceCents,
        notes: null,
      }
    })

    const vatCents = Math.round((subtotalCents * vatRate) / 100)
    const totalCents = subtotalCents + vatCents

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        businessId: input.businessId,
        supplierId: input.supplierId,
        status: 'DRAFT',
        subtotalCents,
        vatCents,
        vatRate: vatRate,
        totalCents,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryDistrict: input.deliveryDistrict,
        requestedDeliveryDate: input.requestedDeliveryDate,
        notes: input.notes,
        createdById: input.createdById,
        items: {
          create: items,
        },
        statusHistory: {
          create: {
            status: 'DRAFT',
            changedById: input.createdById,
            changedByName: 'System',
            notes: 'Purchase order created',
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return purchaseOrder
  }

  /**
   * Submit PO to supplier
   */
  static async submitPurchaseOrder(poId: string, userId: string, userName: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'SUBMITTED',
        statusHistory: {
          create: {
            status: 'SUBMITTED',
            changedById: userId,
            changedByName: userName,
            notes: 'Purchase order submitted to supplier',
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return po
  }

  /**
   * Supplier accepts PO
   */
  static async acceptPurchaseOrder(poId: string, userId: string, userName: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'ACCEPTED',
        approvedById: userId,
        approvedAt: new Date(),
        statusHistory: {
          create: {
            status: 'ACCEPTED',
            changedById: userId,
            changedByName: userName,
            notes: 'Purchase order accepted by supplier',
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return po
  }

  /**
   * Supplier rejects PO
   */
  static async rejectPurchaseOrder(
    poId: string,
    userId: string,
    userName: string,
    reason: string
  ) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'REJECTED',
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        statusHistory: {
          create: {
            status: 'REJECTED',
            changedById: userId,
            changedByName: userName,
            notes: `Rejected: ${reason}`,
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return po
  }

  /**
   * Update PO status (PACKED, SHIPPED, DELIVERED)
   */
  static async updatePurchaseOrderStatus(
    poId: string,
    status: string,
    userId: string,
    userName: string,
    notes?: string
  ) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            changedById: userId,
            changedByName: userName,
            notes: notes || `Status updated to ${status}`,
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return po
  }

  /**
   * Get PO by ID
   */
  static async getPurchaseOrderById(poId: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
        supplier: true,
        business: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        goodsReceivedNotes: {
          include: {
            items: true,
          },
        },
      },
    })
  }

  /**
   * Get POs for business
   */
  static async getPurchaseOrdersForBusiness(businessId: string, status?: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        businessId: businessId,
        ...(status && { status }),
      },
      include: {
        items: true,
        supplier: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get POs for supplier
   */
  static async getPurchaseOrdersForSupplier(supplierId: string, status?: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        ...(status && { status }),
      },
      include: {
        items: true,
        business: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Cancel PO
   */
  static async cancelPurchaseOrder(poId: string, userId: string, userName: string, reason: string) {
    const po = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'CANCELLED',
        statusHistory: {
          create: {
            status: 'CANCELLED',
            changedById: userId,
            changedByName: userName,
            notes: `Cancelled: ${reason}`,
          },
        },
      },
      include: {
        items: true,
        supplier: true,
        business: true,
      },
    })

    return po
  }
}
