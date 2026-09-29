import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { SystemConsistencyService } from '@/lib/die/services/system-consistency.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    const limit = Math.min(100, parseInt(req.query.limit as string || '20', 10))

    const reports = await SystemConsistencyService.validateBusinessConsistency(ctx.businessId, limit)

    const summary = {
      documentsChecked: reports.length,
      issuesFound: reports.reduce((sum, r) => sum + r.issues.length, 0),
      bySeverity: {
        LOW: reports.filter(r => r.severity === 'LOW').length,
        MEDIUM: reports.filter(r => r.severity === 'MEDIUM').length,
        HIGH: reports.filter(r => r.severity === 'HIGH').length,
        CRITICAL: reports.filter(r => r.severity === 'CRITICAL').length,
      },
      repairCandidates: reports.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length,
    }

    return res.status(200).json({
      data: {
        summary,
        reports: reports.map(r => ({
          documentId: r.documentId,
          severity: r.severity,
          issueCount: r.issues.length,
          issues: r.issues.slice(0, 3),
        })),
      },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Consistency check failed' })
  }
}
