import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { EditorialService } from '@/lib/content/editorial.service'
import { hasEditorialAccess } from '@/lib/content/auth'
import { isValidProductKey } from '@/config/product-keys'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const article = await EditorialService.getArticle(id)
    if (!article) return res.status(404).json({ error: 'Article not found' })
    return res.status(200).json({ productLinks: article.productLinks || [] })
  }

  if (req.method === 'PUT') {
    const { links } = req.body || {}
    if (!Array.isArray(links)) return res.status(400).json({ error: 'links must be an array' })

    for (const link of links) {
      if (!link.productKey || !isValidProductKey(link.productKey)) {
        return res.status(400).json({ error: `Invalid productKey: ${link.productKey}` })
      }
      if (link.linkType && !['FEATURED', 'MENTIONED', 'COMPARED', 'TUTORIAL'].includes(link.linkType)) {
        return res.status(400).json({ error: `Invalid linkType: ${link.linkType}` })
      }
    }

    try {
      const productLinks = await EditorialService.setProductLinks(id, links)
      return res.status(200).json({ productLinks })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
