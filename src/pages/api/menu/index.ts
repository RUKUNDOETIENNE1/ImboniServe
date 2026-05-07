import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const items = await prisma.menuItem.findMany({
      where: { businessId: ctx.businessId, isAvailable: true },
      orderBy: { name: 'asc' },
    })
    return res.status(200).json(items)
  } catch (error) {
    console.error('Menu GET error:', error)
    return res.status(500).json({ error: 'Failed to fetch menu items' })
  }
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { name, description, priceCents, costCents, category } = req.body

    if (!name || priceCents === undefined) {
      return res.status(400).json({ error: 'name and priceCents are required' })
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        priceCents: parseInt(priceCents),
        costCents: costCents ? parseInt(costCents) : 0,
        category,
        businessId: ctx.businessId,
        isAvailable: true,
      },
    })
    return res.status(201).json(item)
  } catch (error) {
    console.error('Menu POST error:', error)
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Invalid request',
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requirePermission('inventory.read')(getHandler)(req, res)
  }
  if (req.method === 'POST') {
    return requirePermission('inventory.manage')(postHandler)(req, res)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
