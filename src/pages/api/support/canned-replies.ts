import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

function isStaff(user: any): boolean {
  const roles: string[] = (user?.roles || []) as string[]
  return roles.includes('ADMIN') || roles.includes('MANAGER')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = session.user as any
  const businessId: string | null = user.businessId
  if (!businessId) return res.status(403).json({ error: 'No business associated with user' })

  if (!isStaff(user)) return res.status(403).json({ error: 'Staff only' })

  try {
    if (req.method === 'GET') {
      const items = await prisma.supportCannedReply.findMany({
        where: { businessId, isActive: true },
        orderBy: { title: 'asc' },
      })
      return res.status(200).json({ items })
    }

    if (req.method === 'POST') {
      const { title, body, shortcut } = req.body || {}
      if (!title || !body) return res.status(400).json({ error: 'Title and body required' })

      const reply = await prisma.supportCannedReply.create({
        data: { businessId, title, body, shortcut: shortcut || null },
      })
      return res.status(201).json(reply)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('Canned replies API error:', err)
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
