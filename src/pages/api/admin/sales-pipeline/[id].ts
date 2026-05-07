import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  
  if (!session?.user || !roles.includes('ADMIN')) {
    return res.status(403).json(forbiddenResponse())
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json(errorResponse('Business ID is required'))
  }

  // GET - Fetch business details with analytics
  if (req.method === 'GET') {
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7))
    const findArgs: any = {
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        address: true,
        city: true,
        district: true,
        country: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        businessType: true,
        salesStatus: true,
        trialStartDate: true,
        trialEndDate: true,
        nextAction: true,
        nextActionDate: true,
        nextActionCompleted: true,
        followUpDay2Done: true,
        followUpDay5Done: true,
        followUpDay10Done: true,
        followUpDay13Done: true,
        salesNotes: true,
        owner: {
          select: { id: true, name: true, email: true, phone: true, lastLoginAt: true, createdAt: true }
        },
        plan: {
          select: { name: true, code: true, priceCents: true }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, action: true, details: true, createdAt: true, actorId: true },
          take: 50
        },
        sales: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true, totalAmountCents: true, createdAt: true, orderSource: true, status: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { sales: true, customers: true, menuItems: true, tables: true } }
      }
    }
    const business: any = await prisma.business.findUnique(findArgs)

    if (!business) {
      return res.status(404).json(errorResponse('Business not found'))
    }

    // Calculate analytics
    const today = new Date()
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    
    const ordersToday = (business.sales as any[]).filter((s) => s.createdAt >= todayStart).length
    const revenueToday = (business.sales as any[])
      .filter((s) => s.createdAt >= todayStart)
      .reduce((sum, sale) => sum + sale.totalAmountCents, 0)

    const ordersThisWeek = (business.sales as any[]).length
    const revenueThisWeek = (business.sales as any[]).reduce((sum, sale) => sum + sale.totalAmountCents, 0)

    const daysLeft = business.trialEndDate 
      ? Math.ceil((business.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    const enrichedBusiness = {
      ...business,
      daysLeft,
      analytics: {
        ordersToday,
        revenueToday,
        ordersThisWeek,
        revenueThisWeek,
        totalOrders: business._count.sales,
        totalCustomers: business._count.customers,
        totalMenuItems: business._count.menuItems,
        totalTables: business._count.tables
      }
    }

    return res.status(200).json(successResponse(enrichedBusiness))
  }

  // PUT - Update business trial/sales info
  if (req.method === 'PUT') {
    const {
      salesStatus,
      trialStartDate,
      trialEndDate,
      nextAction,
      nextActionDate,
      nextActionCompleted,
      followUpDay2Done,
      followUpDay5Done,
      followUpDay10Done,
      followUpDay13Done,
      businessType,
      salesNotes
    } = req.body

    const updateArgs: any = {
      where: { id },
      data: {
        salesStatus,
        trialStartDate: trialStartDate ? new Date(trialStartDate) : undefined,
        trialEndDate: trialEndDate ? new Date(trialEndDate) : undefined,
        nextAction,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
        nextActionCompleted,
        followUpDay2Done,
        followUpDay5Done,
        followUpDay10Done,
        followUpDay13Done,
        businessType,
        salesNotes
      }
    }
    const updated = await prisma.business.update(updateArgs)

    // Log activity
    await prisma.activityLog.create({
      data: {
        businessId: id,
        actorId: (session.user as any).id,
        action: 'Business updated',
        details: `Updated sales status to ${salesStatus || 'unchanged'}`
      }
    })

    return res.status(200).json(successResponse(updated))
  }

  return res.status(405).json(errorResponse('Method not allowed'))
}

export default withErrorHandler(handler)
