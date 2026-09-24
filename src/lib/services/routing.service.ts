/**
 * Routing Service
 * Item-to-station routing resolution
 * Phase 1: Operational Coordination
 */

import { prisma } from '@/lib/prisma'

export interface RouteResolutionInput {
  businessId: string
  menuItemId: string
  category?: string
}

export interface RouteResolutionResult {
  stationId: string | null
  stationName: string | null
  stationCode: string | null
  routeSource: 'ITEM_RULE' | 'CATEGORY_RULE' | 'DEFAULT_KITCHEN' | 'NO_STATION'
}

export class RoutingService {
  /**
   * Resolve which station should handle a menu item
   * Priority: item-specific rule > category rule > default kitchen > null
   */
  static async resolveStation(input: RouteResolutionInput): Promise<RouteResolutionResult> {
    const { businessId, menuItemId, category } = input

    // 1. Check for item-specific route rule (highest priority)
    const itemRule = await prisma.routeRule.findFirst({
      where: {
        businessId,
        menuItemId,
        isActive: true,
      },
      include: {
        station: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
      orderBy: { priority: 'desc' },
    })

    if (itemRule?.station?.isActive) {
      return {
        stationId: itemRule.station.id,
        stationName: itemRule.station.name,
        stationCode: itemRule.station.code,
        routeSource: 'ITEM_RULE',
      }
    }

    // 2. Check for category-level route rule
    if (category) {
      const categoryRule = await prisma.routeRule.findFirst({
        where: {
          businessId,
          category,
          menuItemId: null, // Category rules have null menuItemId
          isActive: true,
        },
        include: {
          station: {
            select: { id: true, name: true, code: true, isActive: true },
          },
        },
        orderBy: { priority: 'desc' },
      })

      if (categoryRule?.station?.isActive) {
        return {
          stationId: categoryRule.station.id,
          stationName: categoryRule.station.name,
          stationCode: categoryRule.station.code,
          routeSource: 'CATEGORY_RULE',
        }
      }
    }

    // 3. Fallback to default KITCHEN station if it exists
    const defaultKitchen = await prisma.station.findFirst({
      where: {
        businessId,
        code: 'KITCHEN',
        isActive: true,
      },
      select: { id: true, name: true, code: true },
    })

    if (defaultKitchen) {
      return {
        stationId: defaultKitchen.id,
        stationName: defaultKitchen.name,
        stationCode: defaultKitchen.code,
        routeSource: 'DEFAULT_KITCHEN',
      }
    }

    // 4. No station configured - graceful fallback
    return {
      stationId: null,
      stationName: null,
      stationCode: null,
      routeSource: 'NO_STATION',
    }
  }

  /**
   * Batch resolve stations for multiple items
   */
  static async resolveStations(
    businessId: string,
    items: Array<{ menuItemId: string; category?: string }>
  ): Promise<Map<string, RouteResolutionResult>> {
    const results = new Map<string, RouteResolutionResult>()

    for (const item of items) {
      const result = await this.resolveStation({
        businessId,
        menuItemId: item.menuItemId,
        category: item.category,
      })
      results.set(item.menuItemId, result)
    }

    return results
  }

  /**
   * Get all active stations for a business
   */
  static async getBusinessStations(businessId: string) {
    return await prisma.station.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
    })
  }

  /**
   * Get all route rules for a business
   */
  static async getBusinessRouteRules(businessId: string) {
    return await prisma.routeRule.findMany({
      where: {
        businessId,
        isActive: true,
      },
      include: {
        station: {
          select: { id: true, name: true, code: true },
        },
        menuItem: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Create or update a route rule
   */
  static async upsertRouteRule(input: {
    businessId: string
    stationId: string
    menuItemId?: string
    category?: string
    priority?: number
  }) {
    const { businessId, stationId, menuItemId, category, priority = 0 } = input

    // Validation: must have either menuItemId or category
    if (!menuItemId && !category) {
      throw new Error('Route rule must specify either menuItemId or category')
    }

    // Check if rule already exists
    const existing = await prisma.routeRule.findFirst({
      where: {
        businessId,
        menuItemId: menuItemId || null,
        category: category || null,
      },
    })

    if (existing) {
      // Update existing rule
      return await prisma.routeRule.update({
        where: { id: existing.id },
        data: {
          stationId,
          priority,
          isActive: true,
        },
      })
    }

    // Create new rule
    return await prisma.routeRule.create({
      data: {
        businessId,
        stationId,
        menuItemId: menuItemId || null,
        category: category || null,
        priority,
        isActive: true,
      },
    })
  }

  /**
   * Initialize default stations for a business
   * Called during business setup or on-demand
   */
  static async initializeDefaultStations(businessId: string) {
    const existing = await prisma.station.count({
      where: { businessId },
    })

    // Only initialize if no stations exist
    if (existing > 0) {
      return { message: 'Stations already exist', count: existing }
    }

    const defaultStations = [
      { name: 'Kitchen', code: 'KITCHEN', type: 'KITCHEN' as const, displayOrder: 1 },
      { name: 'Bar', code: 'BAR', type: 'BAR' as const, displayOrder: 2 },
    ]

    const created = await prisma.$transaction(
      defaultStations.map((station) =>
        prisma.station.create({
          data: {
            businessId,
            name: station.name,
            code: station.code,
            type: station.type,
            displayOrder: station.displayOrder,
            isActive: true,
          },
        })
      )
    )

    return { message: 'Default stations created', stations: created }
  }
}
