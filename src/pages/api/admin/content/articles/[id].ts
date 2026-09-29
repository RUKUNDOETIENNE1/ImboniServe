import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { EditorialService } from '@/lib/content/editorial.service'
import { hasEditorialAccess, getEditorialUser, isAdmin } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const { id } = req.query as { id: string }
  const editorialUser = getEditorialUser(session)!

  if (req.method === 'GET') {
    const article = await EditorialService.getArticle(id)
    if (!article) return res.status(404).json({ error: 'Article not found' })
    return res.status(200).json({ article })
  }

  if (req.method === 'PATCH') {
    try {
      const input = req.body || {}
      const article = await EditorialService.updateArticle(id, input, editorialUser.id)
      return res.status(200).json({ article })
    } catch (err: any) {
      const msg = err.message
      if (msg.includes('not found')) return res.status(404).json({ error: msg })
      if (msg.includes('Cannot edit') || msg.includes('Cannot change slug'))
        return res.status(400).json({ error: msg })
      if (msg.includes('already exists')) return res.status(409).json({ error: msg })
      return res.status(500).json({ error: msg })
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(session)) return res.status(403).json({ error: 'Admin access required for deletion' })
    try {
      const result = await EditorialService.deleteArticle(id)
      return res.status(200).json(result)
    } catch (err: any) {
      const msg = err.message
      if (msg.includes('not found')) return res.status(404).json({ error: msg })
      if (msg.includes('Cannot delete')) return res.status(400).json({ error: msg })
      return res.status(500).json({ error: msg })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
