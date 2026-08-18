import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' })
    }

    const { days = '30' } = req.query
    const daysInt = parseInt(days as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysInt)

    // Fetch feedback logs from ActivityLog where action = 'PAYMENT_FEEDBACK'
    const logs = await prisma.activityLog.findMany({
      where: {
        businessId,
        action: 'PAYMENT_FEEDBACK',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    })

    const feedback = logs.map((log) => {
      let details: any = {}
      try {
        details = JSON.parse(log.details || '{}')
      } catch {
        details = {}
      }

      return {
        id: log.id,
        orderNumber: details.orderNumber || 'UNKNOWN',
        paymentMethod: details.paymentMethod || 'UNKNOWN',
        rating: details.rating || 'positive',
        stars: details.stars ?? null,
        issues: Array.isArray(details.issues) ? details.issues : [],
        comment: details.comment || null,
        createdAt: log.createdAt
      }
    })

    const total = feedback.length
    const positive = feedback.filter(f => f.rating === 'positive').length
    const negative = feedback.filter(f => f.rating === 'negative').length
    const positiveRate = total > 0 ? (positive / total) * 100 : 0

    // Average stars across entries that have stars
    const starEntries = feedback.filter(f => typeof f.stars === 'number' && f.stars! > 0) as Array<{ stars: number }>
    const avgStars = starEntries.length > 0
      ? starEntries.reduce((sum, f) => sum + (f.stars as number), 0) / starEntries.length
      : 0

    // Top issues aggregation
    const issueCounts: Record<string, number> = {}
    feedback.forEach(f => {
      f.issues.forEach((i: string) => {
        issueCounts[i] = (issueCounts[i] || 0) + 1
      })
    })

    const topIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)

    // By payment method breakdown
    const byMethodMap: Record<string, { method: string; total: number; positive: number; negative: number }> = {}
    feedback.forEach(f => {
      const m = f.paymentMethod || 'UNKNOWN'
      if (!byMethodMap[m]) {
        byMethodMap[m] = { method: m, total: 0, positive: 0, negative: 0 }
      }
      byMethodMap[m].total += 1
      if (f.rating === 'positive') byMethodMap[m].positive += 1
      if (f.rating === 'negative') byMethodMap[m].negative += 1
    })

    const byMethod = Object.values(byMethodMap).map(m => ({
      ...m,
      rate: m.total > 0 ? (m.positive / m.total) * 100 : 0
    }))

    return res.status(200).json({
      feedback,
      stats: {
        total,
        positive,
        negative,
        positiveRate,
        avgStars,
        topIssues,
        byMethod
      }
    })

  } catch (error: any) {
    console.error('[Payment Feedback List] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
