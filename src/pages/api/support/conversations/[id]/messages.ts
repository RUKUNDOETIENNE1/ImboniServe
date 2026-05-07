import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
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

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid conversation id' })

  const convo = await prisma.supportConversation.findUnique({ where: { id }, select: { businessId: true, createdById: true, assignedToId: true } })
  if (!convo || convo.businessId !== businessId) return res.status(404).json({ error: 'Conversation not found' })

  const canAccess = isStaff(user) || convo.createdById === userId || convo.assignedToId === userId
  if (!canAccess) return res.status(403).json({ error: 'Forbidden' })

  try {
    if (req.method === 'GET') {
      const items = await prisma.supportMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
      })
      return res.status(200).json({ items })
    }

    if (req.method === 'POST') {
      const { body, attachmentUrl, attachmentMimeType, attachmentSizeBytes } = req.body || {}
      if ((!body || typeof body !== 'string') && !attachmentUrl) {
        return res.status(400).json({ error: 'Message body or attachment required' })
      }

      const msg = await prisma.supportMessage.create({
        data: {
          conversationId: id,
          senderUserId: userId,
          senderType: isStaff(user) ? 'STAFF' : 'USER',
          body: body || '',
          attachmentUrl: attachmentUrl || null,
          attachmentMimeType: attachmentMimeType || null,
          attachmentSizeBytes: attachmentSizeBytes || null,
        },
      })

      await prisma.supportConversation.update({ where: { id }, data: { lastMessageAt: new Date(), updatedAt: new Date() } })

      await triggerEvent(`private-support-${id}`, 'message:new', msg)

      return res.status(201).json(msg)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Support messages API error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
