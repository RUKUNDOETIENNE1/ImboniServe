import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api/response-helpers'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId

  if (!session?.user || !businessId) {
    return res.status(401).json(unauthorizedResponse())
  }

  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  const { period = '30' } = req.query
  const days = parseInt(period as string) || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Fetch all sale items with instructions from the period
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        businessId,
        createdAt: { gte: startDate }
      },
      OR: [
        { instructionTags: { isEmpty: false } }
      ]
    },
    include: {
      menuItem: {
        select: { name: true, category: true }
      },
      sale: {
        select: { orderSource: true, createdAt: true }
      }
    }
  })

  // Aggregate instruction tags
  const tagCounts: Record<string, number> = {}
  const tagsByCategory: Record<string, Record<string, number>> = {}
  const tagsBySource: Record<string, Record<string, number>> = {}
  const itemsWithInstructions: Record<string, number> = {}

  for (const item of saleItems) {
    const tags = Array.isArray(item.instructionTags) ? item.instructionTags : []
    const category = item.menuItem.category || 'Uncategorized'
    const source = item.sale.orderSource

    // Count tags globally
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1

      // By category
      if (!tagsByCategory[category]) tagsByCategory[category] = {}
      tagsByCategory[category][tag] = (tagsByCategory[category][tag] || 0) + 1

      // By source
      if (!tagsBySource[source]) tagsBySource[source] = {}
      tagsBySource[source][tag] = (tagsBySource[source][tag] || 0) + 1
    }

    // Track which items get instructions most
    if (tags.length > 0 || item.instructions) {
      itemsWithInstructions[item.menuItem.name] = (itemsWithInstructions[item.menuItem.name] || 0) + 1
    }
  }

  // Sort and format results
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }))

  const topItemsWithInstructions = Object.entries(itemsWithInstructions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([item, count]) => ({ item, count }))

  const categoryBreakdown = Object.entries(tagsByCategory).map(([category, tags]) => ({
    category,
    topTags: Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
  }))

  const sourceBreakdown = Object.entries(tagsBySource).map(([source, tags]) => ({
    source,
    topTags: Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
  }))

  // Calculate totals
  const totalOrdersWithInstructions = new Set(
    saleItems.map(item => item.saleId)
  ).size

  const totalOrders = await prisma.sale.count({
    where: {
      businessId,
      createdAt: { gte: startDate }
    }
  })

  return res.status(200).json(successResponse({
    period: days,
    totalOrders,
    totalOrdersWithInstructions,
    instructionRate: totalOrders > 0 ? (totalOrdersWithInstructions / totalOrders * 100).toFixed(1) : '0',
    topTags,
    topItemsWithInstructions,
    categoryBreakdown,
    sourceBreakdown
  }))
}

export default withErrorHandler(handler)
