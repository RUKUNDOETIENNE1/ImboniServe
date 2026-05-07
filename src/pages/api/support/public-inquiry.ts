import type { NextApiRequest, NextApiResponse } from 'next'
import { EmailService } from '@/lib/services/email.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, message, hp } = req.body || {}

    // Honeypot: if filled, silently accept but do nothing
    if (typeof hp === 'string' && hp.trim().length > 0) {
      return res.status(200).json({ success: true, message: 'Inquiry sent successfully' })
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    const supportEmail = process.env.SUPPORT_EMAIL || 'support@imboniserve.com'
    const emailDetail = `
New Public Inquiry from Website

Name: ${name}
Email: ${email}
Message:
${message}

Received at: ${new Date().toLocaleString()}
    `.trim()

    await EmailService.sendSecurityAlert({
      to: supportEmail,
      name: 'Imboni Support Team',
      event: 'New Public Inquiry',
      detail: emailDetail,
    })

    await EmailService.sendSecurityAlert({
      to: email,
      name,
      event: 'We received your message',
      detail: `Hi ${name},\n\nThank you for contacting Imboni Serve! We've received your inquiry and our team will respond within 24 hours.\n\nYour message:\n${message}\n\nBest regards,\nImboni Serve Team`,
    })

    // Auto-convert to support ticket (best-effort)
    let createdTicketId: string | null = null
    try {
      // Prefer explicit env overrides
      const envBusinessId = process.env.SUPPORT_PUBLIC_BUSINESS_ID || null
      const envAssignUserId = process.env.SUPPORT_ASSIGN_USER_ID || null

      let businessId: string | null = envBusinessId
      let createdById: string | null = envAssignUserId

      if (!businessId || !createdById) {
        // Fallback to first active staff (ADMIN or MANAGER)
        const staff = await prisma.user.findFirst({
          where: {
            isActive: true,
            roles: { hasSome: ['ADMIN', 'MANAGER'] as any },
            businessId: { not: null },
          },
          select: { id: true, businessId: true },
        })
        if (staff?.businessId) {
          businessId = businessId || staff.businessId
          createdById = createdById || staff.id
        }
      }

      if (businessId && createdById) {
        const subject = `Public inquiry from ${name} <${email}>`
        const conv = await prisma.supportConversation.create({
          data: {
            businessId,
            createdById,
            subject,
            priority: 'NORMAL',
            status: 'OPEN',
            lastMessageAt: new Date(),
            messages: {
              create: {
                senderType: 'SYSTEM',
                body: `From: ${name} <${email}>\n\n${message}`,
              },
            },
          },
          select: { id: true },
        })
        createdTicketId = conv.id
      }
    } catch (e) {
      // Best-effort only; do not fail the public inquiry if ticket creation fails
      console.error('Public inquiry auto-ticket error:', e)
    }

    return res.status(200).json({ success: true, message: 'Inquiry sent successfully', ticketId: createdTicketId })
  } catch (error: any) {
    console.error('Public inquiry error:', error)
    return res.status(500).json({ error: error.message || 'Failed to send inquiry' })
  }
}
