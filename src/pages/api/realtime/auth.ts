import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  if (!process.env.PUSHER_APP_ID) return res.status(503).json({ error: 'Pusher not configured' })

  const Pusher = require('pusher')
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER || 'eu',
    useTLS: true,
  })

  const { socket_id, channel_name } = req.body
  const businessId = (session.user as any).businessId || ''
  const roles: string[] = (session.user as any).roles || []
  const userId: string = (session.user as any).id

  const allowedChannelPrefixes = [
    `kitchen-${businessId}`,
    `order-`,
    `private-kitchen-${businessId}`,
    `private-support-inbox-${businessId}`,
  ]

  let isAllowed = allowedChannelPrefixes.some(p => channel_name?.startsWith(p)) || roles.includes('ADMIN')

  if (!isAllowed && typeof channel_name === 'string' && channel_name.startsWith('private-support-')) {
    const convId = channel_name.replace('private-support-', '')
    try {
      const { prisma } = await import('@/lib/prisma')
      const convo = await prisma.supportConversation.findUnique({ where: { id: convId }, select: { businessId: true, createdById: true, assignedToId: true } })
      if (convo && convo.businessId === businessId) {
        isAllowed = roles.includes('MANAGER') || roles.includes('ADMIN') || convo.createdById === userId || convo.assignedToId === userId
      }
    } catch {}
  }

  if (!isAllowed) return res.status(403).json({ error: 'Forbidden' })

  const authResponse = pusher.authorizeChannel(socket_id, channel_name)
  return res.status(200).json(authResponse)
}
