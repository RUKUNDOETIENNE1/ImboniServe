import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'id is required' })

  if (req.method === 'GET') {
    const item = await prisma.disposableEmailDomain.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(item)
  }

  if (req.method === 'PUT') {
    const domain = (req.body?.domain as string || '').trim().toLowerCase()
    if (!domain) return res.status(400).json({ error: 'domain is required' })
    try {
      const updated = await prisma.disposableEmailDomain.update({ where: { id }, data: { domain } })
      return res.status(200).json(updated)
    } catch (e) {
      return res.status(400).json({ error: 'Update failed' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.disposableEmailDomain.delete({ where: { id } })
      return res.status(204).end()
    } catch (e) {
      return res.status(404).json({ error: 'Not found' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
