import { prisma } from '@/lib/prisma'
import { getPlatformFee, FeeType } from './platform-fee.service'

const PLATFORM_FEE_PERCENT = 7.5 // Fallback default

export class SupplierPayoutService {
  /**
   * Calculate payout for a supplier for a given period
   */
  static async calculatePayout(supplierId: string, periodStart: Date, periodEnd: Date): Promise<{
    grossAmountCents: number;
    platformFeeCents: number;
    netAmountCents: number;
    documentCount: number;
    documents: any[];
  }> {
    // Get all completed GRNs with documents in the period
    const documents = await prisma.smartDiningSlip.findMany({
      where: {
        domain: 'PROCUREMENT',
        supplierId,
        paymentTime: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        goodsReceivedNote: true,
      },
    })

    let grossAmountCents = 0
    documents.forEach((doc) => {
      grossAmountCents += doc.grandTotalCents
    })

    const feePercent = await getPlatformFee(FeeType.SUPPLIER_PLATFORM_FEE).catch(() => PLATFORM_FEE_PERCENT)
    const platformFeeCents = Math.round((grossAmountCents * feePercent) / 100)
    const netAmountCents = grossAmountCents - platformFeeCents

    return {
      grossAmountCents,
      platformFeeCents,
      netAmountCents,
      documentCount: documents.length,
      documents,
    }
  }

  /**
   * Create a payout request for a supplier
   */
  static async createPayout(supplierId: string, periodStart: Date, periodEnd: Date) {
    const calculation = await this.calculatePayout(supplierId, periodStart, periodEnd)

    if (calculation.grossAmountCents === 0) {
      throw new Error('No invoices found for this period')
    }

    const payout = await prisma.supplierPayout.create({
      data: {
        supplierId,
        periodStart,
        periodEnd,
        grossAmountCents: calculation.grossAmountCents,
        platformFeeCents: calculation.platformFeeCents,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        netAmountCents: calculation.netAmountCents,
        status: 'pending',
      },
      include: {
        supplier: true,
      },
    })

    return payout
  }

  /**
   * Admin: Mark payout as paid
   */
  static async markPayoutPaid(payoutId: string, method: string, reference: string) {
    const payout = await prisma.supplierPayout.findUnique({
      where: { id: payoutId },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status === 'paid') {
      throw new Error('Payout already marked as paid')
    }

    const updatedPayout = await prisma.supplierPayout.update({
      where: { id: payoutId },
      data: {
        status: 'paid',
        method,
        reference,
        paidAt: new Date(),
      },
      include: {
        supplier: true,
      },
    })

    return updatedPayout
  }

  /**
   * Get payouts for a supplier
   */
  static async getPayoutsForSupplier(supplierId: string, status?: string) {
    return prisma.supplierPayout.findMany({
      where: {
        supplierId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get all pending payouts (admin)
   */
  static async getPendingPayouts() {
    return prisma.supplierPayout.findMany({
      where: { status: 'pending' },
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get payout by ID
   */
  static async getPayoutById(payoutId: string) {
    return prisma.supplierPayout.findUnique({
      where: { id: payoutId },
      include: {
        supplier: true,
      },
    })
  }

  /**
   * Get supplier earnings summary
   */
  static async getSupplierEarnings(supplierId: string) {
    const [totalPaid, totalPending, totalGross] = await Promise.all([
      prisma.supplierPayout.aggregate({
        where: {
          supplierId,
          status: 'paid',
        },
        _sum: { netAmountCents: true },
      }),
      prisma.supplierPayout.aggregate({
        where: {
          supplierId,
          status: 'pending',
        },
        _sum: { netAmountCents: true },
      }),
      prisma.smartDiningSlip.aggregate({
        where: {
          domain: 'PROCUREMENT',
          supplierId,
        },
        _sum: { grandTotalCents: true },
      }),
    ])

    return {
      totalPaidCents: totalPaid._sum.netAmountCents || 0,
      totalPendingCents: totalPending._sum.netAmountCents || 0,
      totalGrossCents: totalGross._sum.grandTotalCents || 0,
      platformFeeCents: Math.round(((totalGross._sum.grandTotalCents || 0) * PLATFORM_FEE_PERCENT) / 100),
    }
  }
}
