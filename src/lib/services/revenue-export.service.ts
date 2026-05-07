import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Revenue Operations Export Service
 * Handles CSV and data export for reports
 */

export class RevenueExportService {
  /**
   * Export commissions to CSV
   */
  static async exportCommissionsCSV(params: {
    marketerId?: string
    startDate?: Date
    endDate?: Date
    status?: string
  }): Promise<string> {
    try {
      const where: any = {}

      if (params.marketerId) {
        where.marketerId = params.marketerId
      }

      if (params.startDate || params.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      if (params.status) {
        where.status = params.status
      }

      const commissions = await prisma.marketerCommission.findMany({
        where,
        include: {
          marketer: {
            select: {
              name: true,
              email: true,
              referralCode: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // CSV headers
      const headers = [
        'Commission ID',
        'Marketer Name',
        'Marketer Email',
        'Referral Code',
        'Type',
        'Amount (RWF)',
        'Status',
        'Business ID',
        'Period Month',
        'Created At',
        'Validated At',
        'Paid Out At'
      ]

      // CSV rows
      const rows = commissions.map(c => [
        c.id,
        c.marketer.name,
        c.marketer.email,
        c.marketer.referralCode,
        c.type,
        (c.amountCents / 100).toFixed(2),
        c.status,
        c.businessId || '',
        c.periodMonth?.toString() || '',
        c.createdAt.toISOString(),
        c.validatedAt?.toISOString() || '',
        c.paidOutAt?.toISOString() || ''
      ])

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      logger.info('Commissions exported to CSV', {
        count: commissions.length,
        marketerId: params.marketerId
      })

      return csv
    } catch (error) {
      logger.error('Failed to export commissions CSV', { error })
      throw new Error('Failed to export commissions')
    }
  }

  /**
   * Export payouts to CSV
   */
  static async exportPayoutsCSV(params: {
    marketerId?: string
    startDate?: Date
    endDate?: Date
    status?: string
  }): Promise<string> {
    try {
      const where: any = {}

      if (params.marketerId) {
        where.marketerId = params.marketerId
      }

      if (params.startDate || params.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      if (params.status) {
        where.status = params.status
      }

      const payouts = await prisma.marketerPayout.findMany({
        where,
        include: {
          marketer: {
            select: {
              name: true,
              email: true,
              referralCode: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // CSV headers
      const headers = [
        'Payout ID',
        'Marketer Name',
        'Marketer Email',
        'Referral Code',
        'Amount (RWF)',
        'Currency',
        'Method',
        'Status',
        'Recipient Phone',
        'Recipient Bank',
        'Recipient Account',
        'Requested At',
        'Approved At',
        'Approved By',
        'Rejected At',
        'Rejected By',
        'Rejection Reason',
        'Processed At',
        'Transaction ID'
      ]

      // CSV rows
      const rows = payouts.map(p => [
        p.id,
        p.marketer.name,
        p.marketer.email,
        p.marketer.referralCode,
        (p.amountCents / 100).toFixed(2),
        p.currency,
        p.method,
        p.status,
        p.recipientPhone || '',
        p.recipientBank || '',
        p.recipientAccount || '',
        p.createdAt.toISOString(),
        p.approvedAt?.toISOString() || '',
        p.approvedBy || '',
        p.rejectedAt?.toISOString() || '',
        p.rejectedBy || '',
        p.rejectionReason || '',
        p.processedAt?.toISOString() || '',
        p.transactionId || ''
      ])

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      logger.info('Payouts exported to CSV', {
        count: payouts.length,
        marketerId: params.marketerId
      })

      return csv
    } catch (error) {
      logger.error('Failed to export payouts CSV', { error })
      throw new Error('Failed to export payouts')
    }
  }

  /**
   * Export referred businesses to CSV
   */
  static async exportBusinessesCSV(marketerId: string): Promise<string> {
    try {
      const attributions = await prisma.marketerAttribution.findMany({
        where: { marketerId },
        orderBy: { createdAt: 'desc' }
      })

      const businessIds = attributions.map(a => a.businessId)
      const businesses = await prisma.business.findMany({
        where: { id: { in: businessIds } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          isActive: true,
          createdAt: true
        }
      })

      // Merge data
      const merged = attributions.map(attr => {
        const business = businesses.find(b => b.id === attr.businessId)
        return {
          attribution: attr,
          business
        }
      })

      // CSV headers
      const headers = [
        'Business ID',
        'Business Name',
        'Email',
        'Phone',
        'City',
        'Status',
        'Source',
        'Campaign',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
        'Attributed At',
        'Business Created At'
      ]

      // CSV rows
      const rows = merged.map(m => [
        m.business?.id || '',
        m.business?.name || '',
        m.business?.email || '',
        m.business?.phone || '',
        m.business?.city || '',
        m.business?.isActive ? 'Active' : 'Inactive',
        m.attribution.source || '',
        m.attribution.campaign || '',
        m.attribution.utmSource || '',
        m.attribution.utmMedium || '',
        m.attribution.utmCampaign || '',
        m.attribution.createdAt.toISOString(),
        m.business?.createdAt.toISOString() || ''
      ])

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      logger.info('Businesses exported to CSV', {
        count: merged.length,
        marketerId
      })

      return csv
    } catch (error) {
      logger.error('Failed to export businesses CSV', { error })
      throw new Error('Failed to export businesses')
    }
  }

  /**
   * Export revenue events to CSV (admin only)
   */
  static async exportEventsCSV(params: {
    startDate?: Date
    endDate?: Date
    type?: string
    entityType?: string
  }): Promise<string> {
    try {
      const where: any = {}

      if (params.startDate || params.endDate) {
        where.createdAt = {}
        if (params.startDate) where.createdAt.gte = params.startDate
        if (params.endDate) where.createdAt.lte = params.endDate
      }

      if (params.type) {
        where.type = params.type
      }

      if (params.entityType) {
        where.entityType = params.entityType
      }

      const events = await prisma.revenueEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000 // Limit to prevent memory issues
      })

      // CSV headers
      const headers = [
        'Event ID',
        'Type',
        'Entity Type',
        'Entity ID',
        'Triggered By',
        'Payload',
        'Created At'
      ]

      // CSV rows
      const rows = events.map(e => [
        e.id,
        e.type,
        e.entityType,
        e.entityId,
        e.triggeredBy || '',
        JSON.stringify(e.payload),
        e.createdAt.toISOString()
      ])

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      logger.info('Events exported to CSV', {
        count: events.length
      })

      return csv
    } catch (error) {
      logger.error('Failed to export events CSV', { error })
      throw new Error('Failed to export events')
    }
  }

  /**
   * Export marketers list to CSV (admin only)
   */
  static async exportMarketersCSV(): Promise<string> {
    try {
      const marketers = await prisma.professionalMarketer.findMany({
        include: {
          wallet: true,
          riskProfile: true,
          _count: {
            select: {
              referredBusinesses: true,
              commissions: true,
              payouts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // CSV headers
      const headers = [
        'Marketer ID',
        'Name',
        'Email',
        'Phone',
        'Referral Code',
        'Status',
        'Available Balance (RWF)',
        'Pending Balance (RWF)',
        'Locked Balance (RWF)',
        'Total Earned (RWF)',
        'Total Paid Out (RWF)',
        'Businesses Referred',
        'Commissions Count',
        'Payouts Count',
        'Risk Score',
        'Risk Level',
        'Created At',
        'Onboarded By'
      ]

      // CSV rows
      const rows = marketers.map(m => [
        m.id,
        m.name,
        m.email,
        m.phone,
        m.referralCode,
        m.status,
        ((m.wallet?.availableBalanceCents || 0) / 100).toFixed(2),
        ((m.wallet?.pendingBalanceCents || 0) / 100).toFixed(2),
        ((m.wallet?.lockedBalanceCents || 0) / 100).toFixed(2),
        ((m.wallet?.totalEarnedCents || 0) / 100).toFixed(2),
        ((m.wallet?.totalPaidOutCents || 0) / 100).toFixed(2),
        m._count.referredBusinesses,
        m._count.commissions,
        m._count.payouts,
        m.riskProfile?.riskScore || 0,
        m.riskProfile?.riskLevel || 'LOW',
        m.createdAt.toISOString(),
        m.onboardedBy || ''
      ])

      // Build CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      logger.info('Marketers exported to CSV', {
        count: marketers.length
      })

      return csv
    } catch (error) {
      logger.error('Failed to export marketers CSV', { error })
      throw new Error('Failed to export marketers')
    }
  }

  /**
   * Generate monthly statement data for a marketer
   */
  static async getMonthlyStatement(params: {
    marketerId: string
    year: number
    month: number
  }) {
    try {
      const startDate = new Date(params.year, params.month - 1, 1)
      const endDate = new Date(params.year, params.month, 0, 23, 59, 59)

      const [marketer, commissions, payouts, wallet] = await Promise.all([
        prisma.professionalMarketer.findUnique({
          where: { id: params.marketerId }
        }),
        prisma.marketerCommission.findMany({
          where: {
            marketerId: params.marketerId,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.marketerPayout.findMany({
          where: {
            marketerId: params.marketerId,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.marketerWallet.findUnique({
          where: { marketerId: params.marketerId }
        })
      ])

      if (!marketer) {
        throw new Error('Marketer not found')
      }

      const totalCommissions = commissions.reduce((sum, c) => sum + c.amountCents, 0)
      const totalPayouts = payouts.reduce((sum, p) => sum + p.amountCents, 0)

      return {
        marketer,
        period: {
          year: params.year,
          month: params.month,
          startDate,
          endDate
        },
        summary: {
          totalCommissions,
          totalPayouts,
          commissionsCount: commissions.length,
          payoutsCount: payouts.length,
          netEarnings: totalCommissions - totalPayouts
        },
        commissions,
        payouts,
        wallet
      }
    } catch (error) {
      logger.error('Failed to generate monthly statement', { error })
      throw new Error('Failed to generate monthly statement')
    }
  }
}
