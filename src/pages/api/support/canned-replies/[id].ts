import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
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

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  const existing = await prisma.supportCannedReply.findUnique({ where: { id } })
  if (!existing || existing.businessId !== businessId) return res.status(404).json({ error: 'Not found' })

  try {
    if (req.method === 'PUT') {
      const { title, body, shortcut, isActive } = req.body || {}
      const data: any = {}
      if (typeof title === 'string') data.title = title
      if (typeof body === 'string') data.body = body
      if (typeof shortcut === 'string' || shortcut === null) data.shortcut = shortcut
      if (typeof isActive === 'boolean') data.isActive = isActive
      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No fields to update' })

      const updated = await prisma.supportCannedReply.update({ where: { id }, data })
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const updated = await prisma.supportCannedReply.update({ where: { id }, data: { isActive: false } })
      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal server error' })
  }
}
