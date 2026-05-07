import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { autoGenerateSeats } from '@/lib/services/seat-detection.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id: tableId } = req.query
  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({ error: 'Table ID required' })
  }

  if (req.method === 'POST') {
    try {
      const { businessId } = ctx

      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId }
      })

      if (!table) {
        return res.status(404).json({ error: 'Table not found' })
      }

      const count = await autoGenerateSeats(tableId)
      return res.status(200).json({ 
        success: true, 
        count,
        message: count > 0 ? `Generated ${count} seats` : 'All seats already exist'
      })
    } catch (error) {
      console.error('Failed to generate seats:', error)
      return res.status(500).json({ error: 'Failed to generate seats' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('tables.update')(handler)
