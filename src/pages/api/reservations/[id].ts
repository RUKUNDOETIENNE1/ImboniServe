import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ReservationService } from '@/lib/services/reservation.service'
import { ingestReservationShadowEvent } from '@/lib/die/business-as-plugin/reservations/reservations.shadow'
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Reservation ID required' })
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res, id, businessId)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, id, businessId)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// Apply commercial enforcement: Reservations require Professional plan or higher
export default requiresFeature('hasReservations')(handler)

import { PaymentTransactionStatus } from '@prisma/client'

async function handlePatch(req: NextApiRequest, res: NextApiResponse, id: string, businessId: string) {
  const { status, depositPaid, tableId } = req.body

  try {
    // Verify reservation belongs to business via service
    const reservations = await ReservationService.getBusinessReservations(businessId, {})
    const existing = reservations.find(r => r.id === id)

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    // Update status if provided
    if (status) {
      await ReservationService.updateStatus(id, status)
    }

    // Update table if provided
    if (tableId !== undefined) {
      await ReservationService.updateTable(id, tableId || null)
    }

    // Update deposit status if provided
    if (depositPaid !== undefined) {
      await ReservationService.updateDepositStatus(
        id,
        depositPaid ? String(PaymentTransactionStatus.SUCCESS) : String(PaymentTransactionStatus.PENDING),
        { depositPaidAt: depositPaid ? new Date() : null }
      )
    }

    // Shadow tap: BOOKING_UPDATED (+ optional CONFIRMED) (feature-flagged, non-blocking)
    ingestReservationShadowEvent({
      type: 'BOOKING_UPDATED',
      businessId,
      reservationId: id,
      partySize: existing.partySize,
    }).catch(() => {})

    if (status === 'CONFIRMED') {
      ingestReservationShadowEvent({
        type: 'CONFIRMED',
        businessId,
        reservationId: id,
        partySize: existing.partySize,
      }).catch(() => {})
    }

    return res.status(200).json({
      reservation: {
        id,
        status: status || existing.status,
        depositPaid: depositPaid !== undefined ? depositPaid : (existing as any).depositStatus === PaymentTransactionStatus.SUCCESS
      }
    })
  } catch (error: any) {
    console.error('Update reservation error:', error)
    return res.status(500).json({ error: 'Failed to update reservation' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string, businessId: string) {
  try {
    // Verify reservation belongs to business via service
    const reservations = await ReservationService.getBusinessReservations(businessId, {})
    const existing = reservations.find(r => r.id === id)

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    await ReservationService.cancelReservation(id, 'Deleted by user')

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Delete reservation error:', error)
    return res.status(500).json({ error: 'Failed to delete reservation' })
  }
}
