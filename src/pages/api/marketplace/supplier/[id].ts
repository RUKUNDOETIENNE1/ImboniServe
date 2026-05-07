import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Supplier ID required' })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        marketplaceProducts: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            category: true,
            unit: true,
            unitPriceCents: true,
            isAvailable: true
          }
        }
      }
    })

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    return res.status(200).json({ supplier })
  } catch (error) {
    console.error('Supplier detail API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

export default requirePermission('inventory.read')(handler)
