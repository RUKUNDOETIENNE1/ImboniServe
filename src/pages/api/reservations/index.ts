import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ingestReservationShadowEvent } from '@/lib/die/business-as-plugin/reservations/reservations.shadow'
import { PaymentTransactionStatus } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  if (req.method === 'GET') {
    return handleGet(req, res, businessId)
  } else if (req.method === 'POST') {
    return handlePost(req, res, businessId)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, businessId: string) {
  const { status = 'all' } = req.query

  try {
    const where: any = { businessId }
    
    if (status !== 'all') {
      where.status = status
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { reservationDate: 'desc' },
      include: {
        table: {
          select: { number: true }
        }
      }
    })

    const formatted = reservations.map(r => ({
      id: r.id,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail,
      date: r.reservationDate.toISOString(),
      time: r.reservationTime,
      partySize: r.partySize,
      tableNumber: r.table?.number,
      depositAmount: r.depositCents ? r.depositCents / 100 : 0,
      depositPaid: r.depositStatus === PaymentTransactionStatus.SUCCESS,
      status: r.status,
      specialRequests: r.specialRequests,
      createdAt: r.createdAt.toISOString()
    }))

    return res.status(200).json({ reservations: formatted })
  } catch (error: any) {
    console.error('Fetch reservations error:', error)
    return res.status(500).json({ error: 'Failed to fetch reservations' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, businessId: string) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    date,
    time,
    partySize,
    depositAmount,
    specialRequests
  } = req.body

  if (!customerName || !customerPhone || !date || !time || !partySize) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        businessId,
        customerName,
        customerPhone,
        customerEmail,
        reservationDate: new Date(date),
        reservationTime: time,
        reservedAt: new Date(`${date}T${time}`),
        confirmationCode: `RES-${Date.now()}`,
        partySize,
        depositCents: depositAmount ? depositAmount * 100 : 0,
        depositStatus: depositAmount > 0 ? 'PENDING' : null,
        status: 'PENDING',
        specialRequests
      }
    })

    // Shadow tap: BOOKING_CREATED (feature-flagged, non-blocking)
    ingestReservationShadowEvent({
      type: 'BOOKING_CREATED',
      businessId,
      reservationId: reservation.id,
      partySize: reservation.partySize,
      scheduledAtIso: new Date(`${date}T${time}`).toISOString(),
    }).catch(() => {})

    return res.status(201).json({
      reservation: {
        id: reservation.id,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        customerEmail: reservation.customerEmail,
        date: reservation.reservationDate.toISOString(),
        time: reservation.reservationTime,
        partySize: reservation.partySize,
        depositAmount: reservation.depositCents ? reservation.depositCents / 100 : 0,
        depositPaid: reservation.depositStatus === PaymentTransactionStatus.SUCCESS,
        status: reservation.status,
        specialRequests: reservation.specialRequests
      }
    })
  } catch (error: any) {
    console.error('Create reservation error:', error)
    return res.status(500).json({ error: 'Failed to create reservation' })
  }
}
