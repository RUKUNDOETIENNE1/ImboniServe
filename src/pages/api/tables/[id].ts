import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx
  const tableId = req.query.id as string

  try {
    if (req.method === 'GET') {
      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
          assignedWaiter: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              seats: true
            }
          }
        }
      })

      if (!table) {
        return res.status(404).json({ error: 'Table not found' })
      }

      return res.status(200).json(table)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { number, capacity, status, assignedWaiterId } = req.body

      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId }
      })

      if (!table) {
        return res.status(404).json({ error: 'Table not found' })
      }

      const updated = await prisma.table.update({
        where: { id: tableId },
        data: {
          ...(number && { number }),
          ...(capacity && { capacity: parseInt(capacity) }),
          ...(status && { status }),
          ...(assignedWaiterId !== undefined && { assignedWaiterId })
        },
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
          assignedWaiter: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return res.status(200).json({ table: updated })
    }

    if (req.method === 'DELETE') {
      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId }
      })

      if (!table) {
        return res.status(404).json({ error: 'Table not found' })
      }

      await prisma.table.delete({
        where: { id: tableId }
      })

      return res.status(200).json({ message: 'Table deleted' })
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (error) {
    console.error('Table update error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('tables.read')(handler)
