import { prisma } from '@/lib/prisma'
import { ReferralService } from './referral.service'
import { NotificationService } from './notification.service'
import { SlipPDFGeneratorService } from './slip-pdf-generator.service'
import { BusinessInviteService } from './business-invite.service'

export interface GenerateSlipInput {
  saleId: string
  clientPhone?: string
  clientEmail?: string
  clientConsentedWhatsApp?: boolean
  consentCollectedBy?: string
}

export interface GenerateProcurementDocumentInput {
  grnId: string
  purchaseOrderId: string
  supplierId: string
  buyerBusinessId: string
}

export class SmartDiningSlipService {
  static async generateSlip(input: GenerateSlipInput) {
    const sale = await prisma.sale.findUnique({
      where: { id: input.saleId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            district: true,
            taxMode: true,
            taxRate: true
          }
        },
        user: true,
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!sale) {
      throw new Error('Sale not found')
    }

    const existingSlip = await prisma.smartDiningSlip.findUnique({
      where: { saleId: input.saleId },
    })

    if (existingSlip) {
      return existingSlip
    }

    const slipNumber = `SDS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    const lineItems = sale.items.map((item: any) => {
      const costCents = item.menuItem.costCents * item.quantity
      const marginCents = item.totalPriceCents - costCents
      const marginPercent = item.totalPriceCents > 0 ? (marginCents / item.totalPriceCents) * 100 : 0

      return {
        itemName: item.menuItem.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalPriceCents: item.totalPriceCents,
        costCents,
        marginCents,
        marginPercent,
      }
    })

    // Calculate totals based on tax mode
    const itemsTotalCents = sale.items.reduce((sum: number, item: any) => sum + item.totalPriceCents, 0)
    let subtotalCents: number
    let vatCents: number
    let grandTotalCents: number
    
    if (sale.business.taxMode === 'INCLUSIVE') {
      // Prices already include VAT - extract VAT portion
      grandTotalCents = itemsTotalCents
      vatCents = Math.round(grandTotalCents * (sale.business.taxRate / (100 + sale.business.taxRate)))
      subtotalCents = grandTotalCents - vatCents
    } else {
      // EXCLUSIVE - add VAT on top
      subtotalCents = itemsTotalCents
      vatCents = Math.round(subtotalCents * (sale.business.taxRate / 100))
      grandTotalCents = subtotalCents + vatCents
    }

    const template = await prisma.slipTemplate.findUnique({
      where: { businessId: sale.businessId },
    })

    let referralLink = null
    if (input.clientPhone) {
      try {
        referralLink = await ReferralService.generateReferralLink(
          input.clientPhone,
          undefined,
          input.clientEmail,
          sale.businessId
        )
      } catch (error) {
        console.error('Failed to generate referral link:', error)
      }
    }

    const slip = await prisma.smartDiningSlip.create({
      data: {
        slipNumber,
        saleId: sale.id,
        businessId: sale.businessId,
        businessName: sale.business.name,
        businessLogo: null,
        branch: sale.business.district || null,
        subtotalCents,
        vatCents,
        vatRate: sale.business.taxRate,
        grandTotalCents,
        taxMode: sale.business.taxMode,
        orderStartTime: sale.createdAt,
        paymentTime: new Date(),
        tableNumber: sale.table?.number || null,
        servedBy: sale.user.name,
        servedByUserId: sale.userId,
        templateType: template?.templateType || 'MINIMAL',
        clientPhone: input.clientPhone || null,
        clientEmail: input.clientEmail || null,
        clientConsentedWhatsApp: input.clientConsentedWhatsApp || false,
        consentCollectedBy: input.consentCollectedBy || null,
        consentCollectedAt: input.clientConsentedWhatsApp ? new Date() : null,
        referralLinkId: referralLink?.id || null,
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        lineItems: true,
        referralLink: true,
      },
    })

    // Trigger invite qualification check after each slip created
    try {
      await BusinessInviteService.processQualification(sale.businessId)
    } catch (e) {
      console.error('[Invite] processQualification error:', e)
    }

    // Attempt auto-send via WhatsApp if client provided phone and consented
    try {
      if (slip.clientPhone) {
        const pdfBuffer = await SlipPDFGeneratorService.generatePDFBuffer(slip as any, slip.templateType)
        const sendResult = await NotificationService.sendSmartDiningSlip(
          slip.clientPhone,
          slip.businessName,
          slip.slipNumber,
          slip.businessId,
          (slip as any).clientConsentedWhatsApp || false,
          pdfBuffer
        )
        if (sendResult.success) {
          await this.markSlipAsSent(slip.id)
        }
      }
    } catch (err) {
      console.error('Auto-send Smart Dining Slip™ failed:', err)
    }

    return slip
  }

  static async getSlipBySaleId(saleId: string) {
    return prisma.smartDiningSlip.findUnique({
      where: { saleId },
      include: {
        lineItems: true,
        editHistory: true,
      },
    })
  }

  static async getSlipById(slipId: string) {
    return prisma.smartDiningSlip.findUnique({
      where: { id: slipId },
      include: {
        lineItems: true,
        referralLink: {
          select: {
            id: true,
            code: true,
          },
        },
        sale: {
          include: {
            business: true,
            user: true,
            table: true,
          },
        },
      },
    })
  }

  static async markSlipAsSent(slipId: string) {
    return prisma.smartDiningSlip.update({
      where: { id: slipId },
      data: {
        sentViaWhatsApp: true,
        whatsappSentAt: new Date(),
      },
    })
  }

  static async logSlipEdit(
    slipId: string,
    editedBy: string,
    editedByUserId: string,
    editType: string,
    fieldChanged?: string,
    oldValue?: string,
    newValue?: string,
    reason?: string
  ) {
    return prisma.slipEditHistory.create({
      data: {
        slipId,
        editedBy,
        editedByUserId,
        editType,
        fieldChanged,
        oldValue,
        newValue,
        reason,
      },
    })
  }

  static async getRestaurantSlips(businessId: string, limit = 50, offset = 0) {
    const [slips, total] = await Promise.all([
      prisma.smartDiningSlip.findMany({
        where: { businessId: businessId },
        include: {
          lineItems: true,
          sale: {
            select: {
              orderNumber: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.smartDiningSlip.count({ where: { businessId: businessId } }),
    ])

    return { slips, total }
  }

  /**
   * Generate unified document for procurement (GRN-based)
   * Creates a single document that is:
   * - "Invoice" for supplier view
   * - "Smart Dining Slip" for restaurant view
   */
  static async generateProcurementDocument(input: GenerateProcurementDocumentInput) {
    const grn = await prisma.goodsReceivedNote.findUnique({
      where: { id: input.grnId },
      include: {
        items: true,
        purchaseOrder: {
          include: {
            items: true,
            business: true,
            supplier: true,
          },
        },
        supplier: true,
      },
    })

    if (!grn) {
      throw new Error('GRN not found')
    }

    const existingDoc = await prisma.smartDiningSlip.findUnique({
      where: { goodsReceivedNoteId: input.grnId },
    })

    if (existingDoc) {
      return existingDoc
    }

    const slipNumber = `SDS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Calculate totals from GRN items (received quantities)
    let subtotalCents = 0
    const lineItems = grn.items.map((item: any) => {
      subtotalCents += item.totalPriceCents
      return {
        itemName: item.productName,
        quantity: Math.round(item.receivedQuantity),
        unitPriceCents: item.unitPriceCents,
        totalPriceCents: item.totalPriceCents,
        costCents: item.unitPriceCents, // For procurement, unit price is the cost
        marginCents: 0,
        marginPercent: 0,
      }
    })

    // For procurement documents, use buyer business tax settings
    const buyerBusiness = await prisma.business.findUnique({
      where: { id: input.buyerBusinessId },
      select: { taxMode: true, taxRate: true }
    })
    
    const taxRate = buyerBusiness?.taxRate || 18.0
    const taxMode = buyerBusiness?.taxMode || 'EXCLUSIVE'
    
    let vatCents: number
    let grandTotalCents: number
    
    if (taxMode === 'INCLUSIVE') {
      grandTotalCents = subtotalCents
      vatCents = Math.round(grandTotalCents * (taxRate / (100 + taxRate)))
      subtotalCents = grandTotalCents - vatCents
    } else {
      vatCents = Math.round(subtotalCents * (taxRate / 100))
      grandTotalCents = subtotalCents + vatCents
    }

    const document = await prisma.smartDiningSlip.create({
      data: {
        slipNumber,
        domain: 'PROCUREMENT',
        purchaseOrderId: input.purchaseOrderId,
        goodsReceivedNoteId: input.grnId,
        supplierId: input.supplierId,
        buyerBusinessId: input.buyerBusinessId,
        businessId: input.supplierId, // For supplier context
        businessName: grn.supplier.name,
        businessLogo: null,
        branch: grn.supplier.city || null,
        subtotalCents,
        vatCents,
        vatRate: taxRate,
        grandTotalCents,
        taxMode: taxMode,
        orderStartTime: grn.purchaseOrder.createdAt,
        paymentTime: grn.receivedAt,
        tableNumber: null,
        servedBy: grn.receivedByName,
        servedByUserId: grn.receivedById,
        templateType: 'MINIMAL',
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        lineItems: true,
      },
    })

    return document
  }

  static async setRestaurantTemplate(businessId: string, templateType: string) {
    return prisma.slipTemplate.upsert({
      where: { businessId: businessId },
      create: {
        businessId: businessId,
        templateType,
      },
      update: {
        templateType,
      },
    })
  }

  static async getRestaurantTemplate(businessId: string) {
    return prisma.slipTemplate.findUnique({
      where: { businessId: businessId },
    })
  }
}
