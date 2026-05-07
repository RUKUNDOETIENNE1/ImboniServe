import type { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'
import { prisma } from '@/lib/prisma'
import { FeatureFlagService, FEATURE_FLAGS } from '@/lib/services/feature-flag.service'

type FeedItem = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  mediaIds: string[]
  promoMeta?: any
  business: {
    id: string
    name: string
    city: string | null
    district: string | null
    country: string
    latitude: number | null
    longitude: number | null
  }
  profileSlug?: string | null
  cta: { whatsappUrl: string | null }
  createdAt: Date
  _dist?: number
}

function normPhoneToWa(num?: string | null): string | null {
  if (!num) return null
  let p = num.trim()
  p = p.replace(/^whatsapp:/i, '')
  p = p.replace(/\s+/g, '')
  if (p.startsWith('+')) p = p.slice(1)
  return `https://wa.me/${p}`
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat/2) ** 2 + Math.sin(dLon/2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const d = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * d
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json(errorResponse('Method not allowed'))

  // Gate by global flag
  const feedEnabled = await FeatureFlagService.isEnabled(FEATURE_FLAGS.FEED_V1)
  if (!feedEnabled) return res.status(404).json(errorResponse('Feed is not enabled'))

  const { filter, nearby, trending, cuisine, featured, cursor, lat, lng, radiusKm } = req.query as any
  const now = new Date()

  const where: any = {
    status: 'PUBLISHED',
    OR: [
      { expireAt: null },
      { expireAt: { gt: now } },
    ],
  }

  // Future: cuisine/featured tags via targeting
  if (cuisine) where.targeting = { path: ['cuisines'], array_contains: String(cuisine) }
  if (featured === '1') where.targeting = { ...(where.targeting || {}), path: ['featured'], equals: true }

  const take = 20
  const skip = cursor ? parseInt(String(cursor)) || 0 : 0

  const posts = await (prisma as any).contentPost.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take,
    skip,
    select: {
      id: true,
      businessId: true,
      type: true,
      title: true,
      body: true,
      mediaIds: true,
      promoMeta: true,
      createdAt: true,
      business: { select: { id: true, name: true, city: true, district: true, country: true, latitude: true, longitude: true, whatsappNumber: true, businessProfile: { select: { slug: true } } } },
    }
  })

  let items: FeedItem[] = posts.map((p: any): FeedItem => {
    const wa = normPhoneToWa(p.business?.whatsappNumber)
    return {
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      mediaIds: p.mediaIds,
      promoMeta: p.promoMeta,
      business: {
        id: p.business?.id,
        name: p.business?.name,
        city: p.business?.city,
        district: p.business?.district,
        country: p.business?.country,
        latitude: p.business?.latitude,
        longitude: p.business?.longitude,
      },
      profileSlug: p.business?.businessProfile?.slug || null,
      cta: {
        whatsappUrl: wa ? `${wa}?text=${encodeURIComponent(`Hi! I'm interested in ${p.title || 'your offer'} [Post:${p.id}]`)}` : null,
      },
      createdAt: p.createdAt,
    }
  })

  // Nearby filtering
  const wantNearby = nearby === '1' || filter === 'nearby'
  if (wantNearby && lat && lng) {
    const center = { lat: parseFloat(String(lat)), lng: parseFloat(String(lng)) }
    const r = radiusKm ? parseFloat(String(radiusKm)) : 25
    items = (items as FeedItem[])
      .map((it: FeedItem): FeedItem => {
        const lat2 = typeof it.business.latitude === 'number' ? it.business.latitude : null
        const lng2 = typeof it.business.longitude === 'number' ? it.business.longitude : null
        const dist = lat2 !== null && lng2 !== null ? distanceKm(center, { lat: lat2 as number, lng: lng2 as number }) : Number.MAX_SAFE_INTEGER
        return { ...it, _dist: dist }
      })
      .filter((it: FeedItem) => (it._dist || Number.MAX_SAFE_INTEGER) <= r)
      .sort((a: FeedItem, b: FeedItem) => (a._dist || 0) - (b._dist || 0))
      .map(({ _dist, ...rest }: FeedItem) => rest as FeedItem)
  }

  // Ranking and ordering
  // If filter=trending, sort by recent engagement
  // Else if recommendations flag is on, apply simple score: engagement (48h), recency, proximity (if provided)
  try {
    const recsEnabled = await FeatureFlagService.isEnabled(FEATURE_FLAGS.FEED_RECOMMENDATIONS_V1)
    const postIds = (items as FeedItem[]).map(i => i.id)
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000)

    let engagementMap = new Map<string, number>()
    if (postIds.length > 0) {
      const grouped: Array<{ postId: string; _count: { _all: number } }> = await (prisma as any).postEngagement.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds }, createdAt: { gt: since } },
        _count: { _all: true },
      })
      engagementMap = new Map(grouped.map((g: any) => [g.postId, Number(g?._count?._all || 0)]))
    }

    if (filter === 'trending') {
      const withCnt = (items as FeedItem[]).map((it) => ({ it, c: engagementMap.get(it.id) || 0 }))
      withCnt.sort((a, b) => (b.c - a.c) || (new Date(b.it.createdAt).getTime() - new Date(a.it.createdAt).getTime()))
      items = withCnt.map(x => x.it)
    } else if (recsEnabled) {
      const nowTs = Date.now()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      let maxCnt = 0
      for (const id of engagementMap.keys()) {
        const c = engagementMap.get(id) || 0
        if (c > maxCnt) maxCnt = c
      }

      const haveCenter = !!lat && !!lng
      const r = radiusKm ? parseFloat(String(radiusKm)) : 25

      const withScore = (items as FeedItem[]).map((it) => {
        const c = engagementMap.get(it.id) || 0
        const eng = maxCnt > 0 ? Math.log1p(c) / Math.log1p(maxCnt) : 0
        const rec = (() => {
          const age = nowTs - new Date(it.createdAt).getTime()
          const t = Math.max(0, Math.min(1, age / weekMs))
          return 1 - t
        })()
        let prox = 0
        if (haveCenter && typeof it.business.latitude === 'number' && typeof it.business.longitude === 'number') {
          const dist = distanceKm({ lat: parseFloat(String(lat)), lng: parseFloat(String(lng)) }, { lat: it.business.latitude as number, lng: it.business.longitude as number })
          if (isFinite(dist) && dist <= r) {
            prox = 1 - Math.min(1, dist / r)
          }
        }
        const useProx = haveCenter && prox > 0
        const wE = useProx ? 0.5 : 0.6
        const wR = useProx ? 0.35 : 0.4
        const wP = useProx ? 0.15 : 0.0
        const score = wE * eng + wR * rec + wP * prox
        return { it, score }
      })

      withScore.sort((a, b) => b.score - a.score)
      items = withScore.map(x => x.it)
    }
  } catch (_) {
    // keep default ordering on any failure
  }

  return res.status(200).json(successResponse({ items, nextCursor: skip + items.length }))
}

export default withErrorHandler(handler)
