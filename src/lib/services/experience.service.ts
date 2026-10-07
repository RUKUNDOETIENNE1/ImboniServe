import { prisma } from '@/lib/prisma'

/**
 * ExperienceService — one read that supplies everything the
 * Digital Business Experience needs for a real business.
 *
 * Boundary rule: this returns ONLY customer-facing data. No inventory,
 * staff, internal analytics, unpublished items, or customer records.
 */

export interface ExperienceAreaOverride {
  enabled?: boolean
  label?: string
  description?: string
}

export interface ExperienceBusinessContext {
  businessId: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  businessType: string | null
  cuisineTypes: string[]
  priceRange: string | null
  rating: number | null
  phone: string | null
  whatsappNumber: string | null
  // capabilities
  hasMenu: boolean
  menuCategories: string[]
  hasDrinks: boolean
  qrInVenue: boolean
  qrRemote: boolean
  tableCount: number
  /** Public reservation creation does not exist yet — always false; see report. */
  hasPublicReservations: boolean
  /** Owner-configured per-area overrides (label/description/enabled). */
  areaOverrides: Record<string, ExperienceAreaOverride>
}

export type ExperienceLookup =
  | { status: 'published'; context: ExperienceBusinessContext }
  | { status: 'disabled' }
  | { status: 'not_found' }

/** Dashboard-facing state for the owner (authenticated path only). */
export interface ExperienceDashboardState {
  enabled: boolean
  profilePublished: boolean
  slug: string | null
  context: ExperienceBusinessContext | null
}

const DRINKS_PATTERN = /drink|beverage|cocktail|bar|juice|beer|wine|coffee|tea|smoothie/i

const businessSelect = {
  id: true,
  name: true,
  description: true,
  address: true,
  city: true,
  latitude: true,
  longitude: true,
  phone: true,
  whatsappNumber: true,
  businessType: true,
  currency: true,
  enableQRInVenue: true,
  enableQRRemote: true,
  isActive: true,
} as const

function parseAreaOverrides(raw: unknown): Record<string, ExperienceAreaOverride> {
  const areas = (raw as any)?.areas
  if (!areas || typeof areas !== 'object') return {}
  const out: Record<string, ExperienceAreaOverride> = {}
  for (const [key, value] of Object.entries(areas)) {
    if (!value || typeof value !== 'object') continue
    const v = value as any
    const o: ExperienceAreaOverride = {}
    if (typeof v.enabled === 'boolean') o.enabled = v.enabled
    if (typeof v.label === 'string' && v.label.trim()) o.label = v.label.slice(0, 60)
    if (typeof v.description === 'string' && v.description.trim()) {
      o.description = v.description.slice(0, 200)
    }
    out[key] = o
  }
  return out
}

async function buildContext(
  profile: {
    slug: string
    tagline: string | null
    description: string | null
    logoUrl: string | null
    coverImageUrl: string | null
    cuisineTypes: string[]
    priceRange: string | null
    rating: number | null
    experienceConfig: unknown
    business: {
      id: string
      name: string
      description: string | null
      address: string | null
      city: string | null
      latitude: number | null
      longitude: number | null
      phone: string | null
      whatsappNumber: string | null
      businessType: string | null
      enableQRInVenue: boolean
      enableQRRemote: boolean
    }
  },
): Promise<ExperienceBusinessContext> {
  const businessId = profile.business.id

  const [menuItems, tableCount] = await Promise.all([
    prisma.menuItem.findMany({
      where: { businessId, isAvailable: true },
      select: { category: true },
    }),
    prisma.table.count({ where: { businessId } }),
  ])

  const menuCategories = [
    ...new Set(menuItems.map((m) => m.category).filter((c): c is string => Boolean(c))),
  ]

  return {
    businessId,
    slug: profile.slug,
    name: profile.business.name,
    tagline: profile.tagline,
    description: profile.description ?? profile.business.description,
    logoUrl: profile.logoUrl,
    coverImageUrl: profile.coverImageUrl,
    city: profile.business.city,
    address: profile.business.address,
    latitude: profile.business.latitude,
    longitude: profile.business.longitude,
    businessType: profile.business.businessType,
    cuisineTypes: profile.cuisineTypes ?? [],
    priceRange: profile.priceRange,
    rating: profile.rating,
    phone: profile.business.phone,
    whatsappNumber: profile.business.whatsappNumber,
    hasMenu: menuItems.length > 0,
    menuCategories,
    hasDrinks: menuCategories.some((c) => DRINKS_PATTERN.test(c)),
    qrInVenue: profile.business.enableQRInVenue,
    qrRemote: profile.business.enableQRRemote,
    tableCount,
    hasPublicReservations: false,
    areaOverrides: parseAreaOverrides(profile.experienceConfig),
  }
}

export class ExperienceService {
  /**
   * Public lookup by slug. Distinguishes a disabled experience from a
   * missing business so the page can show the right graceful state.
   */
  static async getContextBySlug(slug: string): Promise<ExperienceLookup> {
    const profile = await prisma.businessProfile.findUnique({
      where: { slug },
      include: { business: { select: businessSelect } },
    })

    if (!profile || !profile.isPublished || !profile.business?.isActive) {
      return { status: 'not_found' }
    }
    if (!profile.experienceEnabled) {
      return { status: 'disabled' }
    }

    return { status: 'published', context: await buildContext(profile) }
  }

  /**
   * Authenticated owner/staff lookup — powers the dashboard page and the
   * private preview. Not gated on experienceEnabled so owners can preview
   * before publishing.
   */
  static async getDashboardState(businessId: string): Promise<ExperienceDashboardState> {
    const profile = await prisma.businessProfile.findUnique({
      where: { businessId },
      include: { business: { select: businessSelect } },
    })

    if (!profile || !profile.business?.isActive) {
      return { enabled: false, profilePublished: false, slug: null, context: null }
    }

    return {
      enabled: profile.experienceEnabled,
      profilePublished: profile.isPublished,
      slug: profile.slug,
      context: await buildContext(profile),
    }
  }
}
