/**
 * Guest Recognition Service — Canonical Hospitality Intelligence Engine
 *
 * This is the SINGLE entry point for guest recognition across all channels.
 * It wraps the existing CustomerService primitives and adds:
 *   - Guest intelligence aggregation (profile, history, favorites, loyalty)
 *   - Preference learning from order history
 *   - VIP tier auto-calculation
 *   - Recommendation context generation
 *
 * Flow:
 *   Customer phone → recognize() → GuestIntelligence → Recommendations → Order → onOrderCompleted()
 *
 * No duplicate customer or loyalty logic — all writes delegate to CustomerService.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { CustomerService } from '@/lib/services/customer.service'
import { LoyaltyService } from '@/lib/services/loyalty.service'

const log = logger.child({ service: 'guest-recognition' })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuestIntelligence {
  isReturning: boolean
  customer: {
    id: string
    name: string
    phone: string
    visitCount: number
    lastVisit: Date | null
    loyaltyPoints: number
    vipTier: string
    preferences: Record<string, any> | null
    lifetimeSpendCents: number
    totalSpent: number
    createdAt: Date
  }
  favorites: Array<{
    menuItemId: string
    name: string
    orderCount: number
    lastOrdered: Date
  }>
  preferredCategories: Array<{
    category: string
    orderCount: number
  }>
  recentHistory: Array<{
    id: string
    orderNumber: string
    createdAt: Date
    totalAmountCents: number
    itemCount: number
  }>
  loyalty: {
    pointsBalance: number
    tier: string
    tierLabel: string
    nextTierThreshold: number | null
    progressToNextTier: number | null
  }
  recommendationContext: {
    favoriteItemIds: string[]
    preferredCategoryNames: string[]
    allergies: string[]
    dietaryPreferences: string[]
    avgOrderValueCents: number
    typicalOrderHours: number[]
  }
}

export interface RecognitionResult {
  recognized: boolean
  intelligence: GuestIntelligence | null
}

// ---------------------------------------------------------------------------
// VIP Tier Configuration — Canonical Source
// ---------------------------------------------------------------------------
// GuestRecognitionService is the SOLE owner of VIP tier policy.
// These constants are exported for read-only consumption by other modules.
// No other service may define VIP tier thresholds or calculate VIP tiers.

export const VIP_TIER_CONFIG = [
  { tier: 'NONE', label: 'Guest', minVisits: 0, minSpendCents: 0 },
  { tier: 'BRONZE', label: 'Bronze Member', minVisits: 3, minSpendCents: 50000 },
  { tier: 'SILVER', label: 'Silver Member', minVisits: 8, minSpendCents: 150000 },
  { tier: 'GOLD', label: 'Gold Member', minVisits: 15, minSpendCents: 400000 },
  { tier: 'PLATINUM', label: 'Platinum Member', minVisits: 30, minSpendCents: 1000000 },
] as const

export function calculateVIPTier(visitCount: number, lifetimeSpendCents: number): { tier: string; label: string } {
  let result = { tier: 'NONE', label: 'Guest' }
  for (const t of VIP_TIER_CONFIG) {
    if (visitCount >= t.minVisits && lifetimeSpendCents >= t.minSpendCents) {
      result = { tier: t.tier, label: t.label }
    }
  }
  return result
}

function getNextTierThreshold(tier: string): { threshold: number | null; label: string; progress: number | null } {
  const currentIdx = VIP_TIER_CONFIG.findIndex(t => t.tier === tier)
  if (currentIdx === -1 || currentIdx === VIP_TIER_CONFIG.length - 1) {
    return { threshold: null, label: '', progress: null }
  }
  const next = VIP_TIER_CONFIG[currentIdx + 1]
  const current = VIP_TIER_CONFIG[currentIdx]
  const progress = current.minVisits > 0 ? Math.min(1, 1) : 0 // Will be calculated with actual values
  return { threshold: next.minVisits, label: next.label, progress }
}

// ---------------------------------------------------------------------------
// Phone normalization (reused from existing pattern)
// ---------------------------------------------------------------------------

export function normalizePhone(phone: string): string {
  const p = phone.trim()
  if (p.startsWith('+')) return p
  if (p.startsWith('07')) return `+250${p.slice(1)}`
  if (p.startsWith('2507')) return `+${p}`
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}`
}

// ---------------------------------------------------------------------------
// GuestRecognitionService
// ---------------------------------------------------------------------------

export class GuestRecognitionService {
  /**
   * Recognize a guest by phone number.
   * Returns full guest intelligence if found, null if new.
   * This is the canonical recognition entry point for ALL channels.
   */
  static async recognize(
    phone: string,
    businessId: string
  ): Promise<RecognitionResult> {
    const normalized = normalizePhone(phone)

    log.info('Recognizing guest', { businessId, phone: normalized })

    const customer = await CustomerService.findByPhone(normalized, businessId)

    if (!customer) {
      return { recognized: false, intelligence: null }
    }

    const intelligence = await this.buildIntelligence(customer.id, businessId)
    return { recognized: true, intelligence }
  }

  /**
   * Build full guest intelligence from customer record + order history.
   * Single optimized query set — avoids N+1 patterns.
   */
  static async buildIntelligence(
    customerId: string,
    businessId: string
  ): Promise<GuestIntelligence> {
    // Parallel: customer profile, favorites, recent orders, category preferences
    const [customer, favorites, recentOrders, categoryStats] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
      }),
      // Favorite dishes — aggregated from SaleItem
      prisma.saleItem.groupBy({
        by: ['menuItemId'],
        where: {
          sale: {
            customerId,
            businessId,
            isPaid: true,
          },
        },
        _count: { quantity: true },
        _max: { createdAt: true },
        orderBy: { _count: { quantity: 'desc' } },
        take: 5,
      }).then(async (groups) => {
        if (groups.length === 0) return []
        const menuItemIds = groups.map(g => g.menuItemId)
        const items = await prisma.menuItem.findMany({
          where: { id: { in: menuItemIds } },
          select: { id: true, name: true },
        })
        const nameMap = new Map(items.map(i => [i.id, i.name]))
        return groups.map(g => ({
          menuItemId: g.menuItemId,
          name: nameMap.get(g.menuItemId) || 'Unknown',
          orderCount: g._count.quantity,
          lastOrdered: g._max.createdAt || new Date(),
        }))
      }),
      // Recent order history — last 10 paid orders
      prisma.sale.findMany({
        where: {
          customerId,
          businessId,
          isPaid: true,
        },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          totalAmountCents: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).then(orders => orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        totalAmountCents: o.totalAmountCents,
        itemCount: o._count.items,
      }))),
      // Preferred categories — aggregated from SaleItem → MenuItem
      prisma.saleItem.findMany({
        where: {
          sale: {
            customerId,
            businessId,
            isPaid: true,
          },
        },
        select: {
          menuItem: { select: { category: true } },
          quantity: true,
        },
      }).then(items => {
        const catMap = new Map<string, number>()
        for (const item of items) {
          const cat = item.menuItem?.category || 'Uncategorized'
          catMap.set(cat, (catMap.get(cat) || 0) + item.quantity)
        }
        return Array.from(catMap.entries())
          .map(([category, orderCount]) => ({ category, orderCount }))
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 5)
      }),
    ])

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Calculate VIP tier
    const tierInfo = calculateVIPTier(customer.visitCount, customer.lifetimeSpendCents)
    const nextTier = getNextTierThreshold(tierInfo.tier)

    // Calculate avg order value
    const avgOrderValueCents = recentOrders.length > 0
      ? Math.round(recentOrders.reduce((sum, o) => sum + o.totalAmountCents, 0) / recentOrders.length)
      : 0

    // Determine typical order hours from recent history
    const typicalOrderHours = [...new Set(
      recentOrders.map(o => new Date(o.createdAt).getHours())
    )].sort((a, b) => a - b)

    // Extract preferences
    const prefs = customer.preferences as Record<string, any> | null
    const allergies = prefs?.allergies || []
    const dietaryPreferences = prefs?.dietaryPreferences || []

    return {
      isReturning: customer.visitCount > 0,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        visitCount: customer.visitCount,
        lastVisit: customer.lastVisit,
        loyaltyPoints: customer.loyaltyPoints,
        vipTier: customer.vipTier,
        preferences: prefs,
        lifetimeSpendCents: customer.lifetimeSpendCents,
        totalSpent: customer.totalSpent,
        createdAt: customer.createdAt,
      },
      favorites,
      preferredCategories: categoryStats,
      recentHistory: recentOrders,
      loyalty: {
        pointsBalance: customer.loyaltyPoints,
        tier: tierInfo.tier,
        tierLabel: tierInfo.label,
        nextTierThreshold: nextTier.threshold,
        progressToNextTier: nextTier.progress,
      },
      recommendationContext: {
        favoriteItemIds: favorites.map(f => f.menuItemId),
        preferredCategoryNames: categoryStats.map(c => c.category),
        allergies,
        dietaryPreferences,
        avgOrderValueCents,
        typicalOrderHours,
      },
    }
  }

  /**
   * Register a new guest (if phone not found) or return existing.
   * Used by channels that collect phone before order completion.
   */
  static async registerOrRecognize(
    phone: string,
    businessId: string,
    name?: string
  ): Promise<{ customerId: string; isNew: boolean; intelligence: GuestIntelligence }> {
    const normalized = normalizePhone(phone)
    const existing = await CustomerService.findByPhone(normalized, businessId)

    if (existing) {
      const intelligence = await this.buildIntelligence(existing.id, businessId)
      return { customerId: existing.id, isNew: false, intelligence }
    }

    const created = await CustomerService.createCustomer({
      phone: normalized,
      name: name || 'Guest',
      businessId,
    })

    const intelligence = await this.buildIntelligence(created.id, businessId)
    return { customerId: created.id, isNew: true, intelligence }
  }

  /**
   * Called after every completed (paid) order.
   * Delegates to CustomerService.updateVisitStats() + LoyaltyService.earnPoints() + preference learning + VIP recalc.
   *
   * Architectural Invariant:
   *   Loyalty points may only be created or modified through LoyaltyService.
   *   CustomerService.updateVisitStats handles visit/spend stats only.
   */
  static async onOrderCompleted(
    customerId: string,
    orderAmountCents: number,
    saleId: string,
    businessId: string
  ): Promise<void> {
    log.info('Order completed — updating guest stats', { customerId, saleId, orderAmountCents })

    // 1. Update visit stats via CustomerService (visitCount, lifetimeSpendCents, totalSpent, lastVisit)
    await CustomerService.updateVisitStats(customerId, orderAmountCents)

    // 2. Earn loyalty points via LoyaltyService (creates PointsLedger entry + updates Customer.loyaltyPoints)
    try {
      await LoyaltyService.earnPoints({
        customerId,
        businessId,
        saleId,
        amountCents: orderAmountCents,
      })
    } catch (error) {
      log.error('Failed to earn loyalty points', { error: String(error), customerId, saleId })
    }

    // 3. Learn preferences from this order
    await this.learnPreferencesFromOrder(customerId, saleId, businessId)

    // 4. Recalculate VIP tier if needed
    await this.recalculateVIPTier(customerId)

    log.info('Guest stats updated', { customerId, saleId })
  }

  /**
   * Learn customer preferences from a completed order.
   * Updates the preferences JSON field incrementally.
   */
  static async learnPreferencesFromOrder(
    customerId: string,
    saleId: string,
    businessId: string
  ): Promise<void> {
    try {
      // Fetch order items with menu item details
      const saleItems = await prisma.saleItem.findMany({
        where: { saleId },
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              category: true,
              dietaryTags: true,
              allergens: true,
            },
          },
        },
      })

      if (saleItems.length === 0) return

      // Fetch current preferences
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { preferences: true },
      })

      const prefs = (customer?.preferences as Record<string, any>) || {}

      // Track favorite items (top ordered)
      const favoriteItems: Array<{ id: string; name: string; count: number }> = prefs.favoriteItems || []
      const favMap = new Map(favoriteItems.map(f => [f.id, f]))

      // Track preferred categories
      const preferredCategories: Record<string, number> = prefs.preferredCategories || {}

      // Track dietary tags observed
      const observedDietaryTags: string[] = prefs.observedDietaryTags || []

      // Track allergens to avoid (from items ordered)
      const observedAllergens: string[] = prefs.observedAllergens || []

      for (const si of saleItems) {
        const mi = si.menuItem
        if (!mi) continue

        // Update favorite items
        const existing = favMap.get(mi.id)
        if (existing) {
          existing.count += si.quantity
        } else {
          favMap.set(mi.id, { id: mi.id, name: mi.name, count: si.quantity })
        }

        // Update preferred categories
        const cat = mi.category || 'Uncategorized'
        preferredCategories[cat] = (preferredCategories[cat] || 0) + si.quantity

        // Track dietary tags
        if (mi.dietaryTags) {
          for (const tag of mi.dietaryTags) {
            if (!observedDietaryTags.includes(tag)) {
              observedDietaryTags.push(tag)
            }
          }
        }

        // Track allergens
        if (mi.allergens) {
          for (const allergen of mi.allergens) {
            if (!observedAllergens.includes(allergen)) {
              observedAllergens.push(allergen)
            }
          }
        }
      }

      // Sort favorites and keep top 10
      const updatedFavorites = Array.from(favMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Sort preferred categories
      const sortedCategories = Object.entries(preferredCategories)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [k, v]) => { acc[k] = v; return acc }, {} as Record<string, number>)

      // Track order hour
      const orderHour = new Date().getHours()
      const typicalHours: number[] = prefs.typicalOrderHours || []
      if (!typicalHours.includes(orderHour)) {
        typicalHours.push(orderHour)
        typicalHours.sort((a, b) => a - b)
      }

      // Track ordering method
      const orderSource = await prisma.sale.findUnique({
        where: { id: saleId },
        select: { orderSource: true },
      })
      const orderingMethods: Record<string, number> = prefs.orderingMethods || {}
      if (orderSource?.orderSource) {
        const source = orderSource.orderSource as string
        orderingMethods[source] = (orderingMethods[source] || 0) + 1
      }

      // Update preferences
      const updatedPrefs = {
        ...prefs,
        favoriteItems: updatedFavorites,
        preferredCategories: sortedCategories,
        observedDietaryTags,
        observedAllergens,
        typicalOrderHours: typicalHours.slice(-10),
        orderingMethods,
        lastUpdated: new Date().toISOString(),
      }

      await prisma.customer.update({
        where: { id: customerId },
        data: { preferences: updatedPrefs as any },
      })

      log.info('Preferences learned', { customerId, saleId, itemsProcessed: saleItems.length })
    } catch (error) {
      log.error('Preference learning failed', { error: String(error), customerId, saleId })
    }
  }

  /**
   * Recalculate VIP tier based on current visitCount and lifetimeSpendCents.
   * Only updates if tier has changed.
   */
  static async recalculateVIPTier(customerId: string): Promise<void> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { visitCount: true, lifetimeSpendCents: true, vipTier: true },
      })

      if (!customer) return

      const { tier } = calculateVIPTier(customer.visitCount, customer.lifetimeSpendCents)

      if (tier !== customer.vipTier) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { vipTier: tier },
        })

        // Log tier change
        log.info('VIP tier updated', {
          customerId,
          oldTier: customer.vipTier,
          newTier: tier,
          visitCount: customer.visitCount,
          lifetimeSpendCents: customer.lifetimeSpendCents,
        })
      }
    } catch (error) {
      log.error('VIP tier recalculation failed', { error: String(error), customerId })
    }
  }

  /**
   * Get concise staff intelligence for a recognized guest.
   * Designed for waiter POS display — compact and actionable.
   */
  static async getStaffIntelligence(
    phone: string,
    businessId: string
  ): Promise<{
    isReturning: boolean
    name: string
    visitCount: number
    vipTier: string
    tierLabel: string
    loyaltyPoints: number
    favorites: Array<{ name: string; orderCount: number }>
    allergies: string[]
    dietaryPreferences: string[]
    lastVisit: Date | null
  } | null> {
    const result = await this.recognize(phone, businessId)

    if (!result.intelligence) return null

    const intel = result.intelligence
    const prefs = intel.customer.preferences as Record<string, any> | null

    return {
      isReturning: intel.isReturning,
      name: intel.customer.name,
      visitCount: intel.customer.visitCount,
      vipTier: intel.loyalty.tier,
      tierLabel: intel.loyalty.tierLabel,
      loyaltyPoints: intel.loyalty.pointsBalance,
      favorites: intel.favorites.slice(0, 3).map(f => ({ name: f.name, orderCount: f.orderCount })),
      allergies: prefs?.allergies || [],
      dietaryPreferences: prefs?.dietaryPreferences || [],
      lastVisit: intel.customer.lastVisit,
    }
  }
}
