import type { NextApiRequest, NextApiResponse } from 'next'
import { requireRole } from '@/lib/middleware/auth.middleware'
import { prisma } from '@/lib/prisma'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      type, 
      status, 
      city, 
      search, 
      page = '1',
      limit = '50',
    } = req.query

    const where: any = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (city && city !== 'all') {
      where.city = city
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ]
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.contact.count({ where }),
    ])

    return res.status(200).json({
      contacts,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    })
  } catch (error: any) {
    console.error('Admin contacts API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default requireRole(['ADMIN'])(handler)
