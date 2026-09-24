import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { FounderPartnerApplicationService } from '@/lib/services/founder-partner-application.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { PartnershipService } from '@/lib/services/partnership.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE'].includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Application ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const application = await FounderPartnerApplicationService.getById(id)
      if (!application) {
        return res.status(404).json({ error: 'Application not found' })
      }

      const timeline = await PartnershipOperationalQueryService.getPartnershipTimeline(
        application.partnershipId,
        200,
      )

      const auditRecords = await prisma.partnershipAuditRecord.findMany({
        where: { partnershipId: application.partnershipId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      const riskProfile = await prisma.partnershipRiskProfile.findUnique({
        where: { partnershipId: application.partnershipId },
      })

      const healthScore = await prisma.partnershipHealthScore.findUnique({
        where: { partnershipId: application.partnershipId },
      })

      const events = await prisma.partnershipEvent.findMany({
        where: { entityId: application.partnershipId, entityType: 'partnership' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return res.status(200).json({
        application,
        timeline,
        auditRecords,
        riskProfile,
        healthScore,
        events,
      })
    } catch (error: any) {
      console.error('Get application error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const canManage = user.roles?.some((r: string) => ['ADMIN', 'PARTNERSHIP_MANAGER'].includes(r))
      if (!canManage) {
        return res.status(403).json({ error: 'Only admins and partnership managers can manage applications' })
      }

      const { action, reviewNotes, reason } = req.body

      switch (action) {
        case 'review': {
          const updated = await FounderPartnerApplicationService.review(id, user.id, reviewNotes)
          return res.status(200).json({ application: updated })
        }
        case 'approve': {
          const result = await FounderPartnerApplicationService.approve(id, user.id, reviewNotes)
          return res.status(200).json({ success: true, onboarding: result })
        }
        case 'reject': {
          if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' })
          }
          await FounderPartnerApplicationService.reject(id, user.id, reason)
          return res.status(200).json({ success: true })
        }
        case 'withdraw': {
          await FounderPartnerApplicationService.withdraw(id, user.id)
          return res.status(200).json({ success: true })
        }
        case 'assign': {
          const { assigneeId } = req.body
          if (!assigneeId) {
            return res.status(400).json({ error: 'Assignee ID is required' })
          }
          const application = await prisma.partnershipApplication.update({
            where: { id },
            data: { reviewedBy: assigneeId },
          })
          await PartnershipService.logActivity(
            application.partnershipId,
            'APPLICATION_ASSIGNED',
            `Application assigned to ${assigneeId}`,
            user.id,
          )
          return res.status(200).json({ application })
        }
        case 'addNote': {
          const { note } = req.body
          if (!note) {
            return res.status(400).json({ error: 'Note content is required' })
          }
          const application = await prisma.partnershipApplication.findUnique({
            where: { id },
            select: { partnershipId: true },
          })
          if (!application) {
            return res.status(404).json({ error: 'Application not found' })
          }
          await PartnershipService.logActivity(
            application.partnershipId,
            'INTERNAL_NOTE_ADDED',
            note,
            user.id,
          )
          return res.status(200).json({ success: true })
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (error: any) {
      console.error('Manage application error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
