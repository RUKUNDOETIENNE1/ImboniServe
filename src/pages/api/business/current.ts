import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (session.user as any).id as string | undefined
    const userEmail = session.user.email as string | undefined

    // Prefer lookup by stable ID, fallback to email if needed
    let user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, include: { business: true } })
      : null
    if (!user && userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail }, include: { business: true } })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // If user is not linked to a business, try to find an owned one or create a default
    let business = user.business
    if (!business) {
      const owned = await prisma.business.findFirst({ where: { ownerId: user.id } })
      if (owned) {
        // Link user to the owned business for consistency
        if (!user.businessId) {
          await prisma.user.update({ where: { id: user.id }, data: { businessId: owned.id } })
        }
        business = owned
      } else {
        // Create a minimal business profile so the dashboard can function
        const created = await prisma.business.create({
          data: {
            name: user.name || 'My Business',
            phone: user.phone || '0780000000',
            ownerId: user.id,
          },
        })
        await prisma.user.update({ where: { id: user.id }, data: { businessId: created.id } })
        business = created
      }
    }

    return res.status(200).json({
      id: business.id,
      name: business.name,
      phone: business.phone || null,
      address: business.address || null,
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
