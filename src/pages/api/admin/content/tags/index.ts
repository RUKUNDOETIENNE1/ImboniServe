import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { TagService } from '@/lib/content/tag.service'
import { hasEditorialAccess, isAdmin } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  if (req.method === 'GET') {
    const q = req.query.q ? String(req.query.q) : undefined
    const tags = await TagService.listTags(q)
    return res.status(200).json({ tags })
  }

  if (req.method === 'POST') {
    try {
      const tag = await TagService.createTag(req.body || {})
      return res.status(201).json({ tag })
    } catch (err: any) {
      if (err.message.includes('already exists')) return res.status(409).json({ error: err.message })
      return res.status(400).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
