import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { QRGeneratorService } from '@/lib/services/qr-generator.service'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { id: seatId } = req.query
  if (!seatId || typeof seatId !== 'string') {
    return res.status(400).json({ error: 'Seat ID required' })
  }

  if (req.method === 'POST') {
    try {
      const { businessId } = ctx

      const seat = await prisma.seat.findUnique({
        where: { id: seatId },
        include: {
          table: {
            select: { 
              businessId: true,
              id: true
            }
          }
        }
      })

      if (!seat || seat.table.businessId !== businessId) {
        return res.status(404).json({ error: 'Seat not found' })
      }

      if (seat.qrCode) {
        return res.status(400).json({ error: 'QR code already exists for this seat' })
      }

      const qrUrl = QRGeneratorService.generateURL({
        branchId: businessId,
        tableId: seat.table.id,
        seatId: seat.id,
        mode: 'invenue'
      })

      await prisma.seat.update({
        where: { id: seatId },
        data: { qrCode: qrUrl }
      })

      return res.status(200).json({ 
        success: true,
        qrCode: qrUrl
      })
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      return res.status(500).json({ error: 'Failed to generate QR code' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('tables.update')(handler)
