import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/services/email.service'
import { WhatsAppCloudService } from '@/lib/services/whatsapp-cloud.service'
import { triggerEvent } from '@/lib/pusher-server'

function isStaff(user: any): boolean {
  const roles: string[] = (user?.roles || []) as string[]
  return roles.includes('ADMIN') || roles.includes('MANAGER')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = session.user as any
  const userId: string = user.id
  const businessId: string | null = user.businessId
  if (!businessId) return res.status(403).json({ error: 'No business associated with user' })

  try {
    if (req.method === 'GET') {
      const { status, page = '1', limit = '20', assigned = 'all' } = req.query
      const where: any = { businessId }
      if (status && typeof status === 'string') where.status = status

      if (!isStaff(user)) {
        where.createdById = userId
      } else if (assigned === 'me') {
        where.assignedToId = userId
      }

      const pageNum = Math.max(parseInt(String(page), 10) || 1, 1)
      const take = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100)
      const skip = (pageNum - 1) * take

      const [items, total] = await Promise.all([
        prisma.supportConversation.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.supportConversation.count({ where }),
      ])

      const convIds = items.map((i: any) => i.id)
      const unread = convIds.length
        ? await prisma.supportMessage.groupBy({
            by: ['conversationId'],
            _count: { _all: true },
            where: { conversationId: { in: convIds }, readAt: null, NOT: { senderUserId: userId } },
          })
        : []
      const unreadMap = new Map(unread.map((u: any) => [u.conversationId, u._count._all]))
      const itemsWithCounts = items.map((it: any) => ({ ...it, unreadCount: unreadMap.get(it.id) || 0 }))

      return res.status(200).json({ items: itemsWithCounts, total, page: pageNum, limit: take })
    }

    if (req.method === 'POST') {
      const { subject, message, priority = 'NORMAL' } = req.body || {}
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' })
      }

      const conversation = await prisma.supportConversation.create({
        data: {
          businessId,
          createdById: userId,
          subject: subject || null,
          priority,
          status: 'OPEN',
          lastMessageAt: new Date(),
          messages: {
            create: {
              senderUserId: userId,
              senderType: 'USER',
              body: message,
            },
          },
        },
        include: { createdBy: true },
      })

      // Notify staff (ADMIN + MANAGER) by email and WhatsApp
      const staff = await prisma.user.findMany({
        where: {
          businessId,
          isActive: true,
          roles: { hasSome: ['ADMIN', 'MANAGER'] as any },
        },
        select: { id: true, name: true, email: true, whatsappNumber: true },
      })

      const viewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/support/inbox?conv=${conversation.id}`
      const emailDetail = `New support conversation from ${conversation.createdBy?.name || 'User'}\nSubject: ${subject || 'No subject'}\n${message.slice(0, 240)}\n\nOpen: ${viewUrl}`

      await Promise.all(
        staff.map(async (s: any) => {
          if (s.email) {
            await EmailService.sendSecurityAlert({
              to: s.email,
              name: s.name || 'Team',
              event: 'New Support Ticket',
              detail: emailDetail,
            })
          }
          if (s.whatsappNumber) {
            await WhatsAppCloudService.sendText({ phone: s.whatsappNumber, message: `🆘 New support ticket: ${subject || 'No subject'}\nFrom: ${conversation.createdBy?.name || 'User'}\n${viewUrl}`, businessId })
          }
        })
      )

      await triggerEvent(`private-support-inbox-${businessId}`, 'conversation:new', { id: conversation.id })
      return res.status(201).json(conversation)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Support conversations API error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
