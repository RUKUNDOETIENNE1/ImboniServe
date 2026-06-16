/**
 * Vendor Settlement Service
 * Foundation for tracking vendor balances, commissions, and future payouts.
 * Designed to support marketplace supplier settlements.
 */

import { prisma } from '@/lib/prisma'

export interface VendorBalance {
  vendorId: string
  vendorName: string
  totalSalesCents: number
  totalCommissionCents: number
  netBalanceCents: number
  pendingPayoutCents: number
  lastSettlementAt?: Date
}

export class VendorSettlementService {
  /**
   * Calculate vendor balance from marketplace orders
   */
  static async getVendorBalance(vendorId: string): Promise<VendorBalance> {
    const vendor = await prisma.supplier.findUnique({ where: { id: vendorId }, select: { name: true } })
    if (!vendor) throw new Error('Vendor not found')

    // Get all completed orders containing this vendor's products
    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        items: { some: { product: { supplierId: vendorId } } },
      },
      include: {
        items: { where: { product: { supplierId: vendorId } }, include: { product: true } },
        commissionInvoices: { where: { sellerId: vendorId } },
      },
    })

    let totalSalesCents = 0
    let totalCommissionCents = 0

    for (const order of orders) {
      const vendorItemsTotal = order.items.reduce((sum, item) => sum + item.totalPriceCents, 0)
      totalSalesCents += vendorItemsTotal

      const commissions = order.commissionInvoices.filter(c => c.sellerId === vendorId)
      const commissionTotal = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)
      totalCommissionCents += Math.round(commissionTotal * 100)
    }

    const netBalanceCents = totalSalesCents - totalCommissionCents

    return {
      vendorId,
      vendorName: vendor.name,
      totalSalesCents,
      totalCommissionCents,
      netBalanceCents,
      pendingPayoutCents: netBalanceCents,
      lastSettlementAt: undefined,
    }
  }

  /**
   * Get all vendor balances
   */
  static async getAllVendorBalances(): Promise<VendorBalance[]> {
    const vendors = await prisma.supplier.findMany({ where: { isActive: true }, select: { id: true } })
    const balances = await Promise.all(vendors.map(v => this.getVendorBalance(v.id)))
    return balances.filter(b => b.totalSalesCents > 0)
  }

  /**
   * Placeholder: Mark payout as processed (future implementation)
   */
  static async recordPayout(vendorId: string, amountCents: number, reference: string): Promise<void> {
    // TODO: Create Payout model and record settlement
    console.log(`[VendorSettlement] Payout recorded: ${vendorId}, ${amountCents}, ${reference}`)
  }
}
