import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { lat, lon, radius = 10, limit = 20 } = req.query

    const latitude = lat ? parseFloat(lat as string) : null
    const longitude = lon ? parseFloat(lon as string) : null
    const radiusKm = parseFloat(radius as string)
    const maxResults = parseInt(limit as string)

    const profiles = await prisma.businessProfile.findMany({
      where: {
        isPublished: true,
        business: {
          isActive: true,
          ...(latitude && longitude && {
            latitude: { not: null },
            longitude: { not: null }
          })
        }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            address: true,
            latitude: true,
            longitude: true,
            phone: true,
            enableQRInVenue: true,
            enableQRRemote: true
          }
        },
        reviews: {
          where: { isPublished: true },
          select: { rating: true },
          take: 50
        }
      },
      take: 100
    })

    let results = profiles.map(profile => {
      const distance = (latitude && longitude && profile.business.latitude && profile.business.longitude)
        ? calculateDistance(latitude, longitude, profile.business.latitude, profile.business.longitude)
        : null

      const avgRating = profile.reviews.length > 0
        ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / profile.reviews.length
        : null

      return {
        id: profile.business.id,
        slug: profile.slug,
        name: profile.business.name,
        tagline: profile.tagline,
        description: profile.description,
        city: profile.business.city,
        district: profile.business.district,
        address: profile.business.address,
        cuisineTypes: profile.cuisineTypes,
        priceRange: profile.priceRange,
        rating: avgRating,
        reviewCount: profile.reviews.length,
        distance,
        qrOrderingEnabled: profile.business.enableQRInVenue || profile.business.enableQRRemote,
        coverImageUrl: profile.coverImageUrl,
        logoUrl: profile.logoUrl
      }
    })

    if (latitude && longitude) {
      results = results
        .filter(r => r.distance !== null && r.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    results = results.slice(0, maxResults)

    return res.status(200).json({
      businesses: results,
      count: results.length,
      radius: radiusKm,
      center: latitude && longitude ? { lat: latitude, lon: longitude } : null
    })
  } catch (error) {
    console.error('Discovery nearby error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
