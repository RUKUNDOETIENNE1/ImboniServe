import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { PlatformMediaService } from '@/lib/content/platform-media.service'
import { hasEditorialAccess, isAdmin } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const media = await PlatformMediaService.getMedia(id)
    if (!media) return res.status(404).json({ error: 'Media not found' })
    return res.status(200).json({ media })
  }

  if (req.method === 'PATCH') {
    try {
      const media = await PlatformMediaService.updateMedia(id, req.body || {})
      return res.status(200).json({ media })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(session)) return res.status(403).json({ error: 'Admin access required' })
    try {
      const result = await PlatformMediaService.deleteMedia(id)
      return res.status(200).json(result)
    } catch (err: any) {
      if (err.message.includes('not found')) return res.status(404).json({ error: err.message })
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
