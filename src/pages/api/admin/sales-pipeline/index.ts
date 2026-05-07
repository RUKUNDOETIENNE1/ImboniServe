import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { normalizeSalesStatus, toSalesStatusToken } from '@/lib/sales-pipeline/status'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  
  if (!session?.user || !roles.includes('ADMIN')) {
    return res.status(403).json(forbiddenResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Fetch all businesses with trial & sales data
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
  const { q, status, page = '1', pageSize = '50' } = req.query as any
  const take = Math.min(parseInt(pageSize as string) || 50, 100)
  const skip = Math.max(((parseInt(page as string) || 1) - 1) * take, 0)

  const where: any = {}
  if (q && String(q).trim().length > 0) {
    const query = String(q).trim()
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query } },
      { city: { contains: query, mode: 'insensitive' } },
      { district: { contains: query, mode: 'insensitive' } },
      { owner: { name: { contains: query, mode: 'insensitive' } } },
      { owner: { email: { contains: query, mode: 'insensitive' } } },
      { owner: { phone: { contains: query } } },
    ]
  }
  if (status && status !== 'all') {
    const pretty = normalizeSalesStatus(String(status))
    const token = toSalesStatusToken(pretty)
    where.salesStatus = { in: [pretty, token] }
  }
  const findArgs: any = {
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      district: true,
      country: true,
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
      isActive: true,
      createdAt: true,
      owner: {
        select: { name: true, email: true, phone: true, lastLoginAt: true }
      },
      plan: {
        select: { name: true, code: true }
      },
      sales: {
        where: { createdAt: { gte: todayStart } },
        select: { id: true, totalAmountCents: true }
      },
      _count: { select: { sales: true } }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  }
  const businesses: any[] = await prisma.business.findMany(findArgs)

  // Calculate derived fields
  const enrichedBusinesses = businesses.map(business => {
    const today = new Date()
    const computedEnd = business.trialEndDate || (business.trialStartDate ? new Date(new Date(business.trialStartDate).getTime() + 14 * 24 * 60 * 60 * 1000) : null)
    const daysLeft = computedEnd 
      ? Math.ceil((computedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null

    const ordersToday = business.sales.length
    const revenueToday = (business.sales as any[]).reduce((sum: number, sale: any) => sum + sale.totalAmountCents, 0)

    // Auto-update status if trial ending soon
    let currentStatus = business.salesStatus
    if (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && currentStatus === 'Trial Active') {
      currentStatus = 'Trial Ending Soon'
    }
    const currentStatusNormalized = normalizeSalesStatus(currentStatus)

    return {
      id: business.id,
      name: business.name,
      ownerName: business.owner?.name || 'N/A',
      ownerEmail: business.owner?.email || '',
      phone: business.phone,
      location: `${business.city}, ${business.country}`,
      city: business.city,
      district: business.district,
      businessType: business.businessType || 'Restaurant',
      salesStatus: currentStatusNormalized,
      trialStartDate: business.trialStartDate,
      trialEndDate: computedEnd,
      daysLeft,
      nextAction: business.nextAction,
      nextActionDate: business.nextActionDate,
      nextActionCompleted: business.nextActionCompleted,
      ordersToday,
      revenueToday,
      totalOrders: business._count.sales,
      planName: business.plan?.name || 'No Plan',
      isActive: business.isActive,
      createdAt: business.createdAt,
      lastLoginAt: business.owner?.lastLoginAt,
      followUpDay2Done: business.followUpDay2Done,
      followUpDay5Done: business.followUpDay5Done,
      followUpDay10Done: business.followUpDay10Done,
      followUpDay13Done: business.followUpDay13Done
    }
  })

  return res.status(200).json(successResponse(enrichedBusinesses))
}

export default withErrorHandler(handler)
