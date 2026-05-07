import { prisma } from '@/lib/prisma'
import { SmartDiningSlipService } from './smart-dining-slip.service'
import { CostAnomalyService } from './cost-anomaly.service'

export interface CreateGRNInput {
  purchaseOrderId: string
  businessId: string
  supplierId: string
  receivedById: string
  receivedByName: string
  items: Array<{
    poItemId: string
    productName: string
    orderedQuantity: number
    receivedQuantity: number
    unit: string
    unitPriceCents: number
    condition: 'GOOD' | 'DAMAGED' | 'EXPIRED'
    notes?: string
  }>
  notes?: string
  discrepancyNotes?: string
}

export class GoodsReceivedNoteService {
  /**
   * Generate unique GRN number
   */
  static generateGRNNumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `GRN-${timestamp}-${random}`
  }

  /**
   * Create a new GRN and generate unified document (Invoice for supplier, Smart Dining Slip for restaurant)
   */
  static async createGRN(input: CreateGRNInput) {
    const grnNumber = this.generateGRNNumber()

    // Check if all items are fully received
    const allFullyReceived = input.items.every(
      (item) => item.receivedQuantity >= item.orderedQuantity
    )
    const status = allFullyReceived ? 'COMPLETE' : 'PARTIAL'

    // Calculate totals based on received quantities
    const items = input.items.map((item) => ({
      poItemId: item.poItemId,
      productName: item.productName,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      unit: item.unit,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: Math.round(item.receivedQuantity * item.unitPriceCents),
      condition: item.condition,
      notes: item.notes,
    }))

    const grn = await prisma.goodsReceivedNote.create({
      data: {
        grnNumber,
        purchaseOrderId: input.purchaseOrderId,
        businessId: input.businessId,
        supplierId: input.supplierId,
        receivedById: input.receivedById,
        receivedByName: input.receivedByName,
        receivedAt: new Date(),
        status,
        notes: input.notes,
        discrepancyNotes: input.discrepancyNotes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        purchaseOrder: {
          include: {
            items: true,
            supplier: true,
            business: true,
          },
        },
        supplier: true,
      },
    })

    // Evaluate cost anomalies per item (non-blocking) with explainability stored
    try {
      await Promise.all(
        grn.items.map((gi: any) =>
          CostAnomalyService.evaluateAndMaybeAlert({
            businessId: input.businessId,
            supplierId: input.supplierId,
            grnItemId: gi.id,
            productName: gi.productName,
            unit: gi.unit,
            observedUnitPriceCents: gi.unitPriceCents,
          })
        )
      )
    } catch (e) {
      console.error('Cost anomaly evaluation failed:', e)
    }

    // Generate unified document (Smart Dining Slip for restaurant, Invoice for supplier)
    await SmartDiningSlipService.generateProcurementDocument({
      grnId: grn.id,
      purchaseOrderId: input.purchaseOrderId,
      supplierId: input.supplierId,
      buyerBusinessId: input.businessId,
    })

    // Update PO status if fully received
    if (status === 'COMPLETE') {
      await prisma.purchaseOrder.update({
        where: { id: input.purchaseOrderId },
        data: {
          status: 'COMPLETED',
          statusHistory: {
            create: {
              status: 'COMPLETED',
              changedById: input.receivedById,
              changedByName: input.receivedByName,
              notes: 'All items received and GRN completed',
            },
          },
        },
      })
    }

    return grn
  }

  /**
   * Get GRN by ID
   */
  static async getGRNById(grnId: string) {
    return prisma.goodsReceivedNote.findUnique({
      where: { id: grnId },
      include: {
        items: true,
        purchaseOrder: {
          include: {
            items: true,
            supplier: true,
            business: true,
          },
        },
        supplier: true,
        document: true,
      },
    })
  }

  /**
   * Get GRNs for business
   */
  static async getGRNsForBusiness(businessId: string) {
    return prisma.goodsReceivedNote.findMany({
      where: { businessId: businessId },
      include: {
        items: true,
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get GRNs for supplier
   */
  static async getGRNsForSupplier(supplierId: string) {
    return prisma.goodsReceivedNote.findMany({
      where: { supplierId },
      include: {
        items: true,
        purchaseOrder: {
          include: {
            business: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get GRNs for a specific PO
   */
  static async getGRNsForPurchaseOrder(purchaseOrderId: string) {
    return prisma.goodsReceivedNote.findMany({
      where: { purchaseOrderId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
