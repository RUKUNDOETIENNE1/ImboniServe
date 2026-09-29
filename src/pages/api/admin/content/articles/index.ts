import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { EditorialService } from '@/lib/content/editorial.service'
import { hasEditorialAccess, getEditorialUser } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const editorialUser = getEditorialUser(session)!

  if (req.method === 'GET') {
    const { status, type, topicId, q, page = '1', pageSize = '20' } = req.query as any
    const data = await EditorialService.listArticles({
      status: status ? String(status) : undefined,
      type: type ? String(type) : undefined,
      topicId: topicId ? String(topicId) : undefined,
      q: q ? String(q) : undefined,
      page: parseInt(String(page)) || 1,
      pageSize: parseInt(String(pageSize)) || 20,
    })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    try {
      const input = req.body || {}
      if (!input.type || !input.title || !input.body) {
        return res.status(400).json({ error: 'type, title, and body are required' })
      }
      const article = await EditorialService.createArticle(editorialUser.id, input)
      return res.status(201).json({ article })
    } catch (err: any) {
      if (err.message.includes('Invalid article type')) {
        return res.status(400).json({ error: err.message })
      }
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
