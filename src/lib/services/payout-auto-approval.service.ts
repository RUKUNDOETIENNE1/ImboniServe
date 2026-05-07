import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Payout Auto-Approval Service
 * Decides whether a payout should be auto-approved based on risk and history
 */
export class PayoutAutoApprovalService {
  // Thresholds (can be externalized to config later)
  private static readonly MAX_RISK_SCORE = 24 // 0-24 => LOW
  private static readonly MAX_AMOUNT_CENTS = 5_000_000 // 50,000 RWF
  private static readonly MIN_SUCCESSFUL_PAYOUTS = 5 // trusted track record

  static async shouldAutoApprove(params: {
    marketerId: string
    amountCents: number
  }): Promise<{ approve: boolean; reasons: string[] }> {
    const reasons: string[] = []

    try {
      const [risk, successfulPayouts] = await Promise.all([
        prisma.marketerRiskProfile.findUnique({ where: { marketerId: params.marketerId } }),
        prisma.marketerPayout.count({ where: { marketerId: params.marketerId, status: 'PAID' } })
      ])

      const riskScore = risk?.riskScore ?? 0
      const isLowRisk = riskScore <= this.MAX_RISK_SCORE
      const isSmallAmount = params.amountCents <= this.MAX_AMOUNT_CENTS
      const isTrusted = successfulPayouts >= this.MIN_SUCCESSFUL_PAYOUTS

      if (isLowRisk) reasons.push('low_risk')
      if (isSmallAmount) reasons.push('small_amount')
      if (isTrusted) reasons.push('trusted_marketer')

      // Approve if low risk AND (small amount OR trusted)
      const approve = isLowRisk && (isSmallAmount || isTrusted)

      return { approve, reasons }
    } catch (error) {
      logger.error('Auto-approval evaluation failed', { error, marketerId: params.marketerId })
      return { approve: false, reasons }
    }
  }
}
