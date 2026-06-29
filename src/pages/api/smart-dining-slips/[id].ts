import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { SmartDiningSlipService } from '@/lib/services/smart-dining-slip.service'
import { SlipPDFGeneratorService } from '@/lib/services/slip-pdf-generator.service'
import { NotificationService } from '@/lib/services/notification.service'
import { ingestDiningSlipShadowEvent } from '@/lib/die/business-as-plugin/dining-slips/slips.shadow'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  const user = session.user as any
  const roles: string[] = (user?.roles as string[]) || []
  const isAdmin = roles.includes('ADMIN')

  try {
    if (req.method === 'GET') {
      const slip = await SmartDiningSlipService.getSlipById(id as string)
      
      if (!slip) {
        return res.status(404).json({ error: 'Smart Dining Slip™ not found' })
      }

      if (!isAdmin && user?.businessId && slip.businessId !== user.businessId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      return res.status(200).json({ slip })
    }

    if (req.method === 'POST') {
      const { action, phone } = req.body

      if (action === 'resend') {
        const slip = await SmartDiningSlipService.getSlipById(id as string)
        
        if (!slip) {
          return res.status(404).json({ error: 'Smart Dining Slip™ not found' })
        }

        if (!isAdmin && user?.businessId && slip.businessId !== user.businessId) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        // Simple rate limit: block resends if sent within last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
        if (slip.whatsappSentAt && slip.whatsappSentAt > twoMinutesAgo) {
          return res.status(429).json({ error: 'Please wait before resending the slip via WhatsApp.' })
        }

        const targetPhone = phone || slip.clientPhone
        
        if (!targetPhone) {
          return res.status(400).json({ error: 'Phone number required' })
        }

        const pdfBuffer = await SlipPDFGeneratorService.generatePDFBuffer(
          slip as any,
          slip.templateType
        )

        const result = await NotificationService.sendSmartDiningSlip(
          targetPhone,
          slip.businessName,
          slip.slipNumber,
          slip.businessId,
          (slip as any).clientConsentedWhatsApp,
          pdfBuffer
        )

        if (result.success) {
          await SmartDiningSlipService.markSlipAsSent(slip.id)
        }

        // Shadow: neutral send signal for slip sent
        try {
          await ingestDiningSlipShadowEvent({
            type: 'SLIP_SENT_WHATSAPP',
            businessId: slip.businessId,
            sessionId: (slip as any).sessionId || undefined,
            slipId: slip.id,
          }).catch(() => {})
        } catch {}

        return res.status(200).json({ success: result.success, message: 'Smart Dining Slip™ sent' })
      }

      if (action === 'download') {
        const slip = await SmartDiningSlipService.getSlipById(id as string)
        
        if (!slip) {
          return res.status(404).json({ error: 'Smart Dining Slip™ not found' })
        }

        if (!isAdmin && user?.businessId && slip.businessId !== user.businessId) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        const pdfBuffer = await SlipPDFGeneratorService.generatePDFBuffer(
          slip as any,
          slip.templateType
        )

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="smart-dining-slip-${slip.slipNumber}.pdf"`)
        return res.send(pdfBuffer)
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Smart Dining Slip™ API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
