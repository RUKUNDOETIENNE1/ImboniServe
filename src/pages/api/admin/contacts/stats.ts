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
    const [
      totalContacts,
      activeContacts,
      contactsByType,
      contactsByCity,
      totalBusinesses,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: 'ACTIVE' } }),
      prisma.contact.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.contact.groupBy({
        by: ['city'],
        _count: true,
        where: {
          city: { not: null },
        },
        orderBy: {
          _count: {
            city: 'desc',
          },
        },
        take: 10,
      }),
      prisma.contact.groupBy({
        by: ['businessId'],
        _count: true,
      }).then(results => results.length),
    ])

    const contactsByTypeMap = contactsByType.reduce((acc: any, item: any) => {
      acc[item.type] = item._count
      return acc
    }, {})

    const topCities = contactsByCity.map((item: any) => ({
      city: item.city,
      count: item._count,
    }))

    return res.status(200).json({
      totalContacts,
      activeContacts,
      contactsByType: contactsByTypeMap,
      topCities,
      totalBusinesses,
    })
  } catch (error: any) {
    console.error('Admin contacts stats error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export default requireRole(['ADMIN'])(handler)
