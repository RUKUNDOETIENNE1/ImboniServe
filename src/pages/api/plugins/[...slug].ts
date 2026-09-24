import type { NextApiRequest, NextApiResponse } from 'next'
import { handlePluginApiRequest, resolveBusinessId } from '@/lib/die/plugins/runtime/plugin-platform'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug
  const slugSegments = Array.isArray(slug) ? slug : typeof slug === 'string' ? [slug] : []
  const pathSegments = ['api', 'plugins', ...slugSegments]

  const outcome = await handlePluginApiRequest({
    method: req.method ?? 'GET',
    pathSegments,
    query: req.query,
    body: req.body,
    businessId: resolveBusinessId(req.query.businessId),
  })

  if (outcome.kind === 'notFound') {
    res.status(404).json({ error: 'Plugin route not found' })
    return
  }

  const { result } = outcome
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value)
    }
  }

  res.status(result.status).json(result.body)
}
