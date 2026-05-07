import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })
  try {
    const rows: any[] = await prisma.$queryRaw`SELECT "id", "name", "category", "svgTemplate" FROM "QrTemplate" WHERE "id" = ${id} LIMIT 1`
    const tpl = rows[0]
    if (!tpl) return res.status(404).json({ error: 'Template not found' })
    return res.status(200).json({ template: tpl })
  } catch (e) {
    console.error('Failed to read QR template:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
