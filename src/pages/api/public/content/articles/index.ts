import type { NextApiRequest, NextApiResponse } from 'next'
import { EditorialService } from '@/lib/content/editorial.service'
import { getRouteTypes } from '@/lib/content/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { type, types, topicId, tag, page = '1', pageSize = '12' } = req.query as any

  let typeList: string[] | undefined
  if (types) {
    typeList = String(types).split(',')
  } else if (type) {
    typeList = [String(type)]
  }

  const data = await EditorialService.listPublished({
    types: typeList,
    topicId: topicId ? String(topicId) : undefined,
    tag: tag ? String(tag) : undefined,
    page: parseInt(String(page)) || 1,
    pageSize: parseInt(String(pageSize)) || 12,
  })

  return res.status(200).json(data)
}
