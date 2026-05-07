import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = session.user as any
  const businessId = user.businessId
  if (!businessId) return res.status(400).json({ error: 'No business' })

  if (req.method === 'POST' && req.query.action === 'track') {
    // Track a video view event
    const { postId, durationWatchedSec } = req.body
    if (!postId) return res.status(400).json({ error: 'postId required' })

    await prisma.postEngagement.create({
      data: {
        postId,
        userId: user.id ?? undefined,
        type: 'VIEW',
        metadata: durationWatchedSec ? { durationWatchedSec } : undefined,
      },
    })
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'GET') {
    const days = parseInt((req.query.days as string) || '30', 10)
    const since = new Date()
    since.setDate(since.getDate() - days)

    // All video posts for this business
    const videoPosts = await prisma.contentPost.findMany({
      where: {
        businessId,
        type: 'SHORT_VIDEO',
      },
      orderBy: { createdAt: 'desc' },
    })

    const postIds = videoPosts.map((p) => p.id)

    if (postIds.length === 0) {
      return res.status(200).json({
        totalViews: 0,
        uniquePosts: 0,
        avgWatchSec: null,
        topVideos: [],
        viewsByDay: [],
      })
    }

    // All VIEW engagements in window
    const engagements = await prisma.postEngagement.findMany({
      where: {
        postId: { in: postIds },
        type: 'VIEW',
        createdAt: { gte: since },
      },
    })

    // Per-post aggregation
    const postMap = new Map(videoPosts.map((p) => [p.id, p]))
    const perPost: Record<string, { views: number; totalWatchSec: number }> = {}
    for (const e of engagements) {
      if (!perPost[e.postId]) perPost[e.postId] = { views: 0, totalWatchSec: 0 }
      perPost[e.postId].views++
      const meta = e.metadata as any
      if (meta?.durationWatchedSec) perPost[e.postId].totalWatchSec += meta.durationWatchedSec
    }

    const topVideos = Object.entries(perPost)
      .map(([postId, stats]) => {
        const post = postMap.get(postId)
        return {
          postId,
          title: post?.title || 'Untitled',
          status: post?.status,
          createdAt: post?.createdAt,
          views: stats.views,
          avgWatchSec: stats.views > 0 ? Math.round(stats.totalWatchSec / stats.views) : 0,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Views by day
    const dayMap: Record<string, number> = {}
    for (const e of engagements) {
      const day = e.createdAt.toISOString().slice(0, 10)
      dayMap[day] = (dayMap[day] || 0) + 1
    }
    const viewsByDay = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalWatchSec = engagements.reduce((s, e) => {
      const meta = e.metadata as any
      return s + (meta?.durationWatchedSec ?? 0)
    }, 0)

    return res.status(200).json({
      totalViews: engagements.length,
      uniquePosts: Object.keys(perPost).length,
      avgWatchSec: engagements.length > 0 ? Math.round(totalWatchSec / engagements.length) : null,
      topVideos,
      viewsByDay,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
