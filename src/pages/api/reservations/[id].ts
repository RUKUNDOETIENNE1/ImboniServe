import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

async function handlePatch(req: NextApiRequest, res: NextApiResponse, id: string, businessId: string) {
  const { status, depositPaid, tableId } = req.body

  try {
    // Verify reservation belongs to business
    const existing = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (depositPaid !== undefined) {
      updateData.depositStatus = depositPaid ? 'PAID' : 'PENDING'
      if (depositPaid) {
        updateData.depositPaidAt = new Date()
      }
    }
    if (tableId) updateData.tableId = tableId

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData
    })

    return res.status(200).json({
      reservation: {
        id: reservation.id,
        status: reservation.status,
        depositPaid: reservation.depositStatus === 'PAID'
      }
    })
  } catch (error: any) {
    console.error('Update reservation error:', error)
    return res.status(500).json({ error: 'Failed to update reservation' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string, businessId: string) {
  try {
    // Verify reservation belongs to business
    const existing = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    await prisma.reservation.delete({
      where: { id }
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Delete reservation error:', error)
    return res.status(500).json({ error: 'Failed to delete reservation' })
  }
}
