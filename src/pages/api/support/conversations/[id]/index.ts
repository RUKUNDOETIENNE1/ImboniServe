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

  const convo = await prisma.supportConversation.findUnique({ where: { id }, include: { createdBy: true, assignedTo: true } })
  if (!convo || convo.businessId !== businessId) return res.status(404).json({ error: 'Conversation not found' })

  const canAccess = isStaff(user) || convo.createdById === userId || convo.assignedToId === userId
  if (!canAccess) return res.status(403).json({ error: 'Forbidden' })

  try {
    if (req.method === 'GET') {
      return res.status(200).json(convo)
    }

    if (req.method === 'PUT') {
      if (!isStaff(user)) return res.status(403).json({ error: 'Staff only' })
      const { status, priority, assignTo } = req.body || {}

      const data: any = {}
      if (status && ['OPEN','PENDING','RESOLVED','CLOSED'].includes(status)) data.status = status
      if (priority && ['LOW','NORMAL','HIGH','URGENT'].includes(priority)) data.priority = priority
      if (assignTo !== undefined) {
        if (assignTo === null) data.assignedToId = null
        else if (assignTo === 'me') data.assignedToId = userId
        else if (typeof assignTo === 'string') data.assignedToId = assignTo
      }
      data.updatedAt = new Date()

      const updated = await prisma.supportConversation.update({ where: { id }, data })
      await triggerEvent(`private-support-inbox-${businessId}`, 'conversation:update', { id, ...data })
      await triggerEvent(`private-support-${id}`, 'conversation:update', { id, ...data })
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Support conversation update API error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
