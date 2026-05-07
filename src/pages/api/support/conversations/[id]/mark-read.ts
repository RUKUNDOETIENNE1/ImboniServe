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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = session.user as any
  const userId: string = user.id
  const businessId: string | null = user.businessId
  if (!businessId) return res.status(403).json({ error: 'No business associated with user' })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid conversation id' })

  const convo = await prisma.supportConversation.findUnique({
    where: { id },
    select: { businessId: true, createdById: true, assignedToId: true },
  })
  if (!convo || convo.businessId !== businessId) return res.status(404).json({ error: 'Conversation not found' })

  const canAccess = isStaff(user) || convo.createdById === userId || convo.assignedToId === userId
  if (!canAccess) return res.status(403).json({ error: 'Forbidden' })

  try {
    const result = await prisma.supportMessage.updateMany({
      where: {
        conversationId: id,
        readAt: null,
        NOT: { senderUserId: userId },
      },
      data: { readAt: new Date() },
    })
    await triggerEvent(`private-support-${id}`, 'message:read', { conversationId: id })
    return res.status(200).json({ success: true, updated: result.count })
  } catch (err: any) {
    console.error('Mark read error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
