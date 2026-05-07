import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  
  if (!session?.user || !roles.includes('ADMIN')) {
    return res.status(403).json(forbiddenResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find businesses with actions due today
  const actionsDue = await prisma.business.findMany({
    where: {
      nextActionDate: {
        gte: today,
        lt: tomorrow
      },
      nextActionCompleted: false
    },
    include: {
      owner: {
        select: {
          name: true,
          phone: true
        }
      }
    },
    orderBy: {
      nextActionDate: 'asc'
    }
  })

  // Find trials ending in 3 days or less
  const trialsEndingSoon = await prisma.business.findMany({
    where: {
      trialEndDate: {
        lte: new Date(new Date().setDate(new Date().getDate() + 3))
      },
      salesStatus: {
        in: ['Trial Active', 'Trial Ending Soon']
      }
    },
    include: {
      owner: {
        select: {
          name: true,
          phone: true
        }
      }
    },
    orderBy: {
      trialEndDate: 'asc'
    }
  })

  return res.status(200).json(successResponse({
    actionsDue: actionsDue.map(b => ({
      id: b.id,
      name: b.name,
      ownerName: b.owner?.name,
      ownerPhone: b.owner?.phone,
      nextAction: b.nextAction,
      nextActionDate: b.nextActionDate
    })),
    trialsEndingSoon: trialsEndingSoon.map(b => ({
      id: b.id,
      name: b.name,
      ownerName: b.owner?.name,
      ownerPhone: b.owner?.phone,
      trialEndDate: b.trialEndDate,
      daysLeft: b.trialEndDate 
        ? Math.ceil((b.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    }))
  }))
}

export default withErrorHandler(handler)
