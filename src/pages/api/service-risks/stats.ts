/**
 * Service Promise Stats API
 * Returns aggregate promise statistics for a business.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [active, todayTotal, todayFulfilled, todayFailed, todayRecovered] = await Promise.all([
      prisma.servicePromise.count({
        where: {
          businessId: ctx.businessId,
          state: { in: ['ON_TRACK', 'WARNING', 'CRITICAL'] },
        },
      }),
      prisma.servicePromise.count({
        where: {
          businessId: ctx.businessId,
          createdAt: { gte: today },
        },
      }),
      prisma.servicePromise.count({
        where: {
          businessId: ctx.businessId,
          state: 'FULFILLED',
          fulfilledAt: { gte: today },
        },
      }),
      prisma.servicePromise.count({
        where: {
          businessId: ctx.businessId,
          state: 'FAILED',
          failedAt: { gte: today },
        },
      }),
      prisma.servicePromise.count({
        where: {
          businessId: ctx.businessId,
          state: 'RECOVERED',
          recoveredAt: { gte: today },
        },
      }),
    ])

    // On-time rate = fulfilled / (fulfilled + failed + recovered) — only completed promises
    // recovered promises were delivered late (after breach), so they count against on-time
    const completedToday = todayFulfilled + todayFailed + todayRecovered
    const onTimeRate = completedToday > 0
      ? Math.round((todayFulfilled / completedToday) * 100)
      : 100

    return res.status(200).json({
      active,
      today: {
        total: todayTotal,
        fulfilled: todayFulfilled,
        failed: todayFailed,
        recovered: todayRecovered,
        onTimeRate,
      },
    })
  } catch (error: any) {
    console.error('[Promise Stats API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch promise stats' })
  }
}

export default handler
