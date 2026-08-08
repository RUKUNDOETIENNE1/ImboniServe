import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CustomerService } from '@/lib/services/customer.service'
import { normalizePhone } from '@/lib/services/guest-recognition.service'

const createSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number().int().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  branchId: z.string().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const rooms = await prisma.room.findMany({
      where: { businessId },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: {
        customer: {
          select: { id: true, name: true, phone: true, vipTier: true, loyaltyPoints: true, visitCount: true },
        },
      },
    })
    return res.status(200).json({ rooms })
  }

  if (req.method === 'POST') {
    const roles: string[] = (session?.user as any)?.roles || []
    if (!roles.some(r => ['OWNER', 'ADMIN', 'MANAGER', 'FRONT_DESK'].includes(r))) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid', issues: parsed.error.issues })

    // Auto-resolve customer from guestPhone for hospitality intelligence linkage
    let customerId: string | undefined
    if (parsed.data.guestPhone) {
      try {
        const normalized = normalizePhone(parsed.data.guestPhone)
        const customer = await CustomerService.findOrCreateByPhone(
          normalized,
          businessId,
          parsed.data.guestName
        )
        customerId = customer.id
      } catch (error) {
        console.error('[Hotel] Failed to resolve customer:', error)
      }
    }

    const room = await prisma.room.create({
      data: {
        ...parsed.data,
        businessId,
        customerId,
        checkInDate: parsed.data.checkInDate ? new Date(parsed.data.checkInDate) : undefined,
        checkOutDate: parsed.data.checkOutDate ? new Date(parsed.data.checkOutDate) : undefined,
      },
    })
    return res.status(201).json({ room })
  }

  return res.status(405).end()
}
