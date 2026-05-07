import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const user = session?.user as any
  const { id } = req.query

  if (!session?.user || !user?.businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' })
  }

  try {
    // Verify the item belongs to the user's business
    const item = await prisma.menuItem.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    })
    if (!item || item.businessId !== user.businessId) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    if (req.method === 'PATCH') {
      const { name, description, priceCents, costCents, category, isAvailable, isSpecial } = req.body || {}

      const data: any = {}
      if (typeof name === 'string') data.name = name
      if (typeof description === 'string') data.description = description
      if (category != null) data.category = String(category)
      if (priceCents != null) data.priceCents = Number(priceCents)
      if (costCents != null) data.costCents = Number(costCents)
      if (typeof isAvailable === 'boolean') data.isAvailable = isAvailable
      if (typeof isSpecial === 'boolean') data.isSpecial = isSpecial

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const updated = await prisma.menuItem.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          category: true,
          isAvailable: true,
          isSpecial: true,
        },
      })

      return res.status(200).json(updated)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Menu item update error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
