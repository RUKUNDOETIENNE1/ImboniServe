import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { getTableSeats } from '@/lib/services/seat-detection.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id: tableId } = req.query
  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({ error: 'Table ID required' })
  }

  if (req.method === 'GET') {
    try {
      const { businessId } = ctx

      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId }
      })

      if (!table) {
        return res.status(404).json({ error: 'Table not found' })
      }

      const seats = await getTableSeats(tableId)
      return res.status(200).json(seats)
    } catch (error) {
      console.error('Failed to fetch seats:', error)
      return res.status(500).json({ error: 'Failed to fetch seats' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('tables.read')(handler)
