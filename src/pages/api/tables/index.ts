import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { hasPermission } from '@/lib/permissions/staff'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Resolve or provision a business for the user so tables can be created/listed
  const userEmail = session.user?.email as string | undefined
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const dbUser = await prisma.user.findUnique({ where: { email: userEmail }, include: { business: true } })
  if (!dbUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  let businessId: string | null = dbUser.business?.id ?? (dbUser as any).businessId ?? null
  if (!businessId) {
    // Try to link to an owned business, otherwise create a minimal one
    const owned = await prisma.business.findFirst({ where: { ownerId: dbUser.id }, select: { id: true } })
    if (owned) {
      businessId = owned.id
      if (!(dbUser as any).businessId) {
        await prisma.user.update({ where: { id: dbUser.id }, data: { businessId } })
      }
    } else {
      const created = await prisma.business.create({
        data: {
          name: dbUser.name || 'My Business',
          phone: (dbUser as any).phone || '0780000000',
          ownerId: dbUser.id,
        },
        select: { id: true },
      })
      await prisma.user.update({ where: { id: dbUser.id }, data: { businessId: created.id } })
      businessId = created.id
    }
  }

  try {
    if (req.method === 'GET') {
      const tables = await prisma.table.findMany({
        where: { businessId: businessId! },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
          assignedWaiter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { number: 'asc' },
      })

      return res.status(200).json({ tables })
    }

    if (req.method === 'POST') {
      const isOwner = ((session.user as any)?.roles || []).includes('OWNER')
      const perms = (req as any).userPermissions
      if (!isOwner && (!perms || !hasPermission(perms, 'tables.create'))) {
        return res.status(403).json({ error: 'Insufficient permissions', code: 'PERMISSION_DENIED' })
      }

      const { number, capacity, status } = req.body

      if (!number || capacity === undefined || capacity === null) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const existingTable = await prisma.table.findFirst({
        where: { businessId: businessId!, number: String(number) },
      })

      if (existingTable) {
        return res.status(400).json({ error: 'Table number already exists' })
      }

      const newTable = await prisma.table.create({
        data: {
          number: String(number),
          capacity: typeof capacity === 'string' ? parseInt(capacity, 10) : Number(capacity),
          status: status || 'AVAILABLE',
          businessId: businessId!,
        },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
        },
      })

      return res.status(201).json({ table: newTable })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Tables API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('tables.read')(handler)
