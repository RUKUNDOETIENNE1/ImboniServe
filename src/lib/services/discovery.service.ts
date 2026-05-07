import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'discovery' })

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    + '-' + Math.random().toString(36).slice(2, 7)
}

export class DiscoveryService {
  static async getOrCreateProfile(businessId: string) {
    const existing = await prisma.businessProfile.findUnique({ where: { businessId } })
    if (existing) return existing

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, description: true, address: true },
    })

    return prisma.businessProfile.create({
      data: {
        businessId,
        slug: generateSlug(business?.name || businessId),
        description: business?.description,
        isPublished: false,
        cuisineTypes: [],
      },
    })
  }

  static async updateProfile(businessId: string, data: {
    tagline?: string; description?: string; coverImageUrl?: string; logoUrl?: string
    cuisineTypes?: string[]; priceRange?: string; openingHours?: unknown
    isPublished?: boolean; seoTitle?: string; seoDescription?: string
  }) {
    const profile = await this.getOrCreateProfile(businessId)
    return prisma.businessProfile.update({
      where: { id: profile.id },
      data: data as any,
    })
  }

  static async getPublicProfiles(params: {
    page?: number; limit?: number
    cuisineType?: string; priceRange?: string; search?: string
  }) {
    const { page = 1, limit = 20, cuisineType, priceRange, search } = params
    const skip = (page - 1) * limit

    const where: any = { isPublished: true }
    if (cuisineType) where.cuisineTypes = { has: cuisineType }
    if (priceRange) where.priceRange = priceRange
    if (search) where.OR = [
      { business: { name: { contains: search, mode: 'insensitive' } } },
      { tagline: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    const [profiles, total] = await Promise.all([
      prisma.businessProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rating: { sort: 'desc', nulls: 'last' } }, { orderCount: 'desc' }],
        include: { business: { select: { name: true, city: true, address: true, phone: true } } },
      }),
      prisma.businessProfile.count({ where }),
    ])

    return { profiles, total, page, limit, pages: Math.ceil(total / limit) }
  }

  static async getProfileBySlug(slug: string) {
    const profile = await prisma.businessProfile.findUnique({
      where: { slug },
      include: {
        business: {
          select: { id: true, name: true, city: true, address: true, phone: true, menuItems: { where: { isAvailable: true }, take: 20 } },
        },
        reviews: { where: { isPublished: true }, take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!profile) return null
    await prisma.businessProfile.update({ where: { slug }, data: { viewCount: { increment: 1 } } })
    return profile
  }

  static async addReview(params: {
    businessId: string; customerId?: string; saleId?: string
    rating: number; comment?: string
  }) {
    if (params.rating < 1 || params.rating > 5) throw new Error('Rating must be 1-5')
    const profile = await this.getOrCreateProfile(params.businessId)

    const review = await prisma.businessReview.create({
      data: {
        businessId: params.businessId,
        customerId: params.customerId,
        saleId: params.saleId,
        rating: params.rating,
        comment: params.comment,
        profileId: profile.id,
      },
    })

    const allRatings = await prisma.businessReview.aggregate({
      where: { businessId: params.businessId, isPublished: true },
      _avg: { rating: true },
    })
    await prisma.businessProfile.update({
      where: { id: profile.id },
      data: { rating: allRatings._avg.rating || undefined },
    })

    log.info('Review added', { businessId: params.businessId, rating: params.rating })
    return review
  }
}
