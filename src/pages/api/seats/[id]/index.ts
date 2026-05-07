import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { updateSeatLabel } from '@/lib/services/seat-detection.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id: seatId } = req.query
  if (!seatId || typeof seatId !== 'string') {
    return res.status(400).json({ error: 'Seat ID required' })
  }

  if (req.method === 'PATCH') {
    try {
      const { businessId } = ctx

      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        include: {
          table: {
            select: { businessId: true }
          }
        }
      })

      if (!seat || seat.table.businessId !== businessId) {
        return res.status(404).json({ error: 'Seat not found' })
      }

      const { seatLabel } = req.body
      if (!seatLabel || typeof seatLabel !== 'string') {
        return res.status(400).json({ error: 'Seat label required' })
      }

      await updateSeatLabel(seatId, seatLabel)
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Failed to update seat:', error)
      return res.status(500).json({ error: 'Failed to update seat' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('tables.update')(handler)
