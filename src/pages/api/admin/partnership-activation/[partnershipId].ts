import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { PartnershipService } from '@/lib/services/partnership.service'
import { PartnershipAgreementService } from '@/lib/services/partnership-agreement.service'
import { PartnershipCampaignService } from '@/lib/services/partnership-campaign.service'
import { FounderCodeService } from '@/lib/services/founder-code.service'
import { PartnershipNotificationService } from '@/lib/services/partnership-notification.service'
import { PartnershipOperationalQueryService } from '@/lib/services/partnership-operational-query.service'
import { withRateLimit } from '@/lib/middleware/withRateLimit'

const ALLOWED_ROLES = ['ADMIN', 'PARTNERSHIP_MANAGER', 'SALES', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
const MANAGEMENT_ROLES = ['ADMIN', 'PARTNERSHIP_MANAGER']

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.roles?.some((r: string) => ALLOWED_ROLES.includes(r))) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const { partnershipId } = req.query
  if (!partnershipId || typeof partnershipId !== 'string') {
    return res.status(400).json({ error: 'Partnership ID is required' })
  }

  const canManage = user.roles?.some((r: string) => MANAGEMENT_ROLES.includes(r))

  // ─── GET: Load full workspace state ─────────────────────────────
  if (req.method === 'GET') {
    try {
      const partnership = await prisma.partnership.findUnique({
        where: { id: partnershipId },
      })
      if (!partnership) {
        return res.status(404).json({ error: 'Partnership not found' })
      }

      const founderPartner = await prisma.founderPartner.findUnique({
        where: { partnershipId },
      })

      const [
        agreements,
        activeAgreement,
        campaigns,
        codes,
        healthScore,
        riskProfile,
        timeline,
        auditRecords,
        events,
      ] = await Promise.all([
        PartnershipAgreementService.getAmendmentChain(partnershipId),
        PartnershipAgreementService.getActiveAgreement(partnershipId),
        prisma.partnershipCampaign.findMany({
          where: { partnershipId },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.founderCode.findMany({
          where: { partnerId: founderPartner?.id },
          include: {
            campaign: { select: { id: true, name: true } },
            _count: { select: { redemptions: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.partnershipHealthScore.findUnique({
          where: { partnershipId },
        }),
        prisma.partnershipRiskProfile.findUnique({
          where: { partnershipId },
        }),
        PartnershipOperationalQueryService.getPartnershipTimeline(partnershipId, 200),
        prisma.partnershipAuditRecord.findMany({
          where: { partnershipId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        prisma.partnershipEvent.findMany({
          where: { entityId: partnershipId, entityType: 'partnership' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ])

      const checklist = computeChecklist({
        partnership,
        activeAgreement,
        campaigns,
        codes,
        healthScore,
        riskProfile,
      })

      return res.status(200).json({
        partnership,
        founderPartner,
        agreements,
        activeAgreement,
        campaigns,
        codes,
        healthScore,
        riskProfile,
        timeline,
        auditRecords,
        events,
        checklist,
        canManage,
      })
    } catch (error: any) {
      console.error('Activation workspace load error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // ─── PATCH: Perform activation actions ──────────────────────────
  if (req.method === 'PATCH') {
    if (!canManage) {
      return res.status(403).json({ error: 'Only admins and partnership managers can manage activation' })
    }

    try {
      const { action } = req.body
      const userId = user.id

      switch (action) {
        // ─── Partnership Activation ───────────────────────────────
        case 'activatePartnership': {
          const partnership = await PartnershipService.activate(partnershipId, userId)
          return res.status(200).json({ partnership })
        }

        // ─── Agreement Actions ────────────────────────────────────
        case 'sendAgreement': {
          const { agreementId } = req.body
          if (!agreementId) return res.status(400).json({ error: 'Agreement ID is required' })
          const agreement = await PartnershipAgreementService.sendForSignature(agreementId, userId)
          return res.status(200).json({ agreement })
        }
        case 'signAgreement': {
          const { agreementId } = req.body
          if (!agreementId) return res.status(400).json({ error: 'Agreement ID is required' })
          const agreement = await PartnershipAgreementService.sign(agreementId, userId)
          return res.status(200).json({ agreement })
        }
        case 'activateAgreement': {
          const { agreementId } = req.body
          if (!agreementId) return res.status(400).json({ error: 'Agreement ID is required' })
          const agreement = await PartnershipAgreementService.activate(agreementId, userId)
          return res.status(200).json({ agreement })
        }
        case 'amendAgreement': {
          const { agreementId, newTerms } = req.body
          if (!agreementId) return res.status(400).json({ error: 'Agreement ID is required' })
          if (!newTerms) return res.status(400).json({ error: 'New terms are required' })
          const agreement = await PartnershipAgreementService.amend({
            agreementId,
            newTerms,
            amendedBy: userId,
          })
          return res.status(200).json({ agreement })
        }
        case 'createAgreement': {
          const { terms, effectiveAt, expiresAt } = req.body
          const agreement = await PartnershipAgreementService.create({
            partnershipId,
            terms: terms || {
              commissionRatePercent: 10,
              payoutSchedule: 'MONTHLY',
              trialDaysForReferrals: 30,
              exclusivity: false,
              territory: null,
              customClauses: [],
            },
            effectiveAt: effectiveAt ? new Date(effectiveAt) : undefined,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            createdBy: userId,
          })
          return res.status(200).json({ agreement })
        }

        // ─── Campaign Actions ─────────────────────────────────────
        case 'createCampaign': {
          const { name, description, channel, startDate, endDate, targetSignups, targetConversions } = req.body
          if (!name) return res.status(400).json({ error: 'Campaign name is required' })
          const campaign = await PartnershipCampaignService.create({
            partnershipId,
            name,
            description,
            channel,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            targetSignups,
            targetConversions,
            createdBy: userId,
          })
          return res.status(200).json({ campaign })
        }
        case 'launchCampaign': {
          const { campaignId } = req.body
          if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' })
          const campaign = await PartnershipCampaignService.launch(campaignId, userId)
          return res.status(200).json({ campaign })
        }

        // ─── Founder Code Actions ─────────────────────────────────
        case 'generateCode': {
          const founderPartnerId = await getFounderPartnerId(partnershipId)
          if (!founderPartnerId) return res.status(400).json({ error: 'Founder partner not found' })
          const { code, trialDays, campaignId, expiresAt, maxRedemptions, label, notes } = req.body
          if (!code) return res.status(400).json({ error: 'Code is required' })
          const created = await FounderCodeService.createCode({
            code,
            partnerId: founderPartnerId,
            trialDays,
            campaignId,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            maxRedemptions,
            label,
            notes,
            createdBy: userId,
          })
          return res.status(200).json({ code: created })
        }
        case 'updateCodeStatus': {
          const { codeId, status } = req.body
          if (!codeId || !status) return res.status(400).json({ error: 'Code ID and status are required' })
          const updated = await FounderCodeService.updateCodeStatus({
            codeId,
            status,
            updatedBy: userId,
          })
          return res.status(200).json({ code: updated })
        }

        // ─── Notification Actions ─────────────────────────────────
        case 'sendNotification': {
          const { notificationType, recipientEmail } = req.body
          const partnership = await prisma.partnership.findUnique({ where: { id: partnershipId } })
          if (!partnership) return res.status(404).json({ error: 'Partnership not found' })

          const notificationMap: Record<string, { type: any; subject: string; message: string }> = {
            welcome: {
              type: 'PARTNER_ONBOARDED',
              subject: 'Welcome to ImboniServe Founder Partner Program',
              message: `Hello ${partnership.name},\n\nWelcome aboard! Your Founder Partner application has been approved. You can now start referring businesses and earning commissions.\n\nBest regards,\nThe ImboniServe Team`,
            },
            agreementReady: {
              type: 'AGREEMENT_SIGNED',
              subject: 'Your Partnership Agreement is Ready',
              message: `Hello ${partnership.name},\n\nYour partnership agreement is ready for review and signature. Please review it at your earliest convenience.\n\nBest regards,\nThe ImboniServe Team`,
            },
            codesGenerated: {
              type: 'CODE_CREATED',
              subject: 'Your Founder Codes Have Been Generated',
              message: `Hello ${partnership.name},\n\nYour founder referral codes have been generated. You can now share them with businesses to start referring.\n\nBest regards,\nThe ImboniServe Team`,
            },
            campaignReady: {
              type: 'CAMPAIGN_LAUNCHED',
              subject: 'Your Campaign is Ready',
              message: `Hello ${partnership.name},\n\nYour campaign has been set up and is ready to launch. Check your partner dashboard for details.\n\nBest regards,\nThe ImboniServe Team`,
            },
            partnerActivated: {
              type: 'PARTNER_APPROVED',
              subject: 'Your Partnership is Now Active',
              message: `Hello ${partnership.name},\n\nCongratulations! Your partnership is now fully active. You can start recruiting businesses and representing the ImboniServe brand.\n\nBest regards,\nThe ImboniServe Team`,
            },
          }

          const notif = notificationMap[notificationType]
          if (!notif) return res.status(400).json({ error: 'Unknown notification type' })

          await PartnershipNotificationService.dispatch({
            type: notif.type,
            entityType: 'partnership',
            entityId: partnershipId,
            recipientEmail: recipientEmail || partnership.email,
            subject: notif.subject,
            message: notif.message,
          })

          await PartnershipService.logActivity(
            partnershipId,
            'NOTIFICATION_SENT',
            `Notification sent: ${notif.subject}`,
            userId,
            { notificationType },
          )

          return res.status(200).json({ success: true, notificationType })
        }

        // ─── Marketing Kit Assignment ─────────────────────────────
        case 'assignMarketingKit': {
          const { kitItems } = req.body
          if (!kitItems || !Array.isArray(kitItems)) {
            return res.status(400).json({ error: 'Kit items array is required' })
          }
          await PartnershipService.logActivity(
            partnershipId,
            'MARKETING_KIT_ASSIGNED',
            `Marketing kit assigned: ${kitItems.join(', ')}`,
            userId,
            { kitItems },
          )
          await PartnershipService.audit(
            partnershipId,
            'MARKETING_KIT_ASSIGNED',
            userId,
            'none',
            kitItems.join(','),
            { kitItems },
          )
          return res.status(200).json({ success: true, kitItems })
        }

        // ─── Update Partnership Profile ───────────────────────────
        case 'updateProfile': {
          const { organization, region, notes, phone, assignedManager } = req.body
          const updateData: Record<string, unknown> = {}
          if (organization !== undefined) updateData.organization = organization
          if (region !== undefined) updateData.region = region
          if (notes !== undefined) updateData.notes = notes
          if (phone !== undefined) updateData.phone = phone
          if (assignedManager !== undefined) updateData.onboardedBy = assignedManager

          const partnership = await prisma.partnership.update({
            where: { id: partnershipId },
            data: updateData,
          })
          await PartnershipService.logActivity(
            partnershipId,
            'PROFILE_UPDATED',
            'Partnership profile updated',
            userId,
            updateData,
          )
          return res.status(200).json({ partnership })
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` })
      }
    } catch (error: any) {
      console.error('Activation action error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function getFounderPartnerId(partnershipId: string): Promise<string | null> {
  const fp = await prisma.founderPartner.findUnique({ where: { partnershipId } })
  return fp?.id ?? null
}

interface ChecklistInput {
  partnership: any
  activeAgreement: any
  campaigns: any[]
  codes: any[]
  healthScore: any
  riskProfile: any
}

function computeChecklist(input: ChecklistInput) {
  const items = [
    {
      key: 'partnershipApproved',
      label: 'Partnership Approved',
      completed: ['ONBOARDED', 'ACTIVE'].includes(input.partnership?.status),
    },
    {
      key: 'agreementSigned',
      label: 'Agreement Signed',
      completed: ['SIGNED', 'ACTIVE', 'AMENDED'].includes(input.activeAgreement?.status) ||
        input.partnership?.status === 'ACTIVE',
    },
    {
      key: 'partnershipActivated',
      label: 'Partnership Activated',
      completed: input.partnership?.status === 'ACTIVE',
    },
    {
      key: 'healthProfileReady',
      label: 'Health Profile Ready',
      completed: !!input.healthScore,
    },
    {
      key: 'riskProfileReady',
      label: 'Risk Profile Ready',
      completed: !!input.riskProfile,
    },
    {
      key: 'defaultCampaignCreated',
      label: 'Default Campaign Created',
      completed: input.campaigns.length > 0,
    },
    {
      key: 'founderCodesGenerated',
      label: 'Founder Codes Generated',
      completed: input.codes.length > 0,
    },
    {
      key: 'marketingKitAssigned',
      label: 'Marketing Kit Assigned',
      completed: false,
    },
    {
      key: 'welcomeEmailSent',
      label: 'Welcome Email Sent',
      completed: false,
    },
    {
      key: 'partnerOrientationCompleted',
      label: 'Partner Orientation Completed',
      completed: false,
    },
    {
      key: 'readyToLaunch',
      label: 'Ready to Launch',
      completed: false,
    },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const percentage = Math.round((completedCount / (totalCount - 1)) * 100)

  return { items, completedCount, totalCount, percentage }
}

export default withRateLimit(handler, { windowMs: 60000, maxRequests: 100 })
