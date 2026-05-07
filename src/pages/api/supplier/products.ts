import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth.middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAuth(req, res)
    if (!session) return
    const user = session.user as any
    const roles: string[] = (user?.roles as string[]) || []
    const isAdmin = roles.includes('ADMIN')
    const supplierIdFromUser: string | undefined = user?.supplierId

    if (req.method === 'GET') {
      const { category, available } = req.query

      if (!isAdmin && !supplierIdFromUser) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const where: any = {}
      if (isAdmin && (req.query.supplierId as string)) {
        where.supplierId = req.query.supplierId
      } else if (supplierIdFromUser) {
        where.supplierId = supplierIdFromUser
      }
      if (category) where.category = category
      if (available !== undefined) where.isAvailable = available === 'true'

      const products = await prisma.supplierProduct.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return res.status(200).json(products)
    }

    if (req.method === 'POST') {
      if (!isAdmin && !supplierIdFromUser) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const { name, description, category, unit, unitPriceCents, minOrderQuantity } = req.body

      const product = await prisma.supplierProduct.create({
        data: {
          supplierId: isAdmin ? (req.body.supplierId as string) : (supplierIdFromUser as string),
          name,
          description,
          category,
          unit,
          unitPriceCents: parseInt(unitPriceCents),
          minOrderQuantity: parseFloat(minOrderQuantity || '1'),
          isAvailable: true,
        },
      })

      return res.status(201).json(product)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Supplier products API error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}
