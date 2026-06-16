import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * Public endpoint to lookup table information by ID
 * Used by /t/[id] short URL route
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Table ID is required' })
    }

    // Lookup table and validate it's active
    const table = await prisma.table.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        businessId: true,
        capacity: true,
        status: true,
        business: {
          select: {
            id: true,
            name: true,
            enableQRInVenue: true,
          },
        }
      }
    })

    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }

    if (!table.business.enableQRInVenue) {
      return res.status(403).json({ error: 'QR ordering not enabled for this business' })
    }

    return res.status(200).json({
      id: table.id,
      number: table.number,
      businessId: table.businessId,
      businessName: table.business.name,
      capacity: table.capacity
    })
  } catch (error) {
    console.error('Table lookup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
