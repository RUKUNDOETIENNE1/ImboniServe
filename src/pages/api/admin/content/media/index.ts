import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { PlatformMediaService } from '@/lib/content/platform-media.service'
import { hasEditorialAccess, getEditorialUser } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  if (req.method === 'GET') {
    const { type, q, page = '1', pageSize = '24' } = req.query as any
    const data = await PlatformMediaService.listMedia({
      type: type ? String(type) : undefined,
      q: q ? String(q) : undefined,
      page: parseInt(String(page)) || 1,
      pageSize: parseInt(String(pageSize)) || 24,
    })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
