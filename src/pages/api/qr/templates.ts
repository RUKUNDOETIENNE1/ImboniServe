import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const templates = await prisma.qrTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, category: true, previewUrl: true }
    })
    return res.status(200).json({ templates })
  } catch (e) {
    console.error('Failed to list QR templates:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
