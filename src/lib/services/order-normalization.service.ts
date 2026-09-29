/**
 * Order Normalization Service
 * Handles messy human input (waiters, verbal updates, corrections)
 * Reality Gap Fix: Priority 2
 * 
 * RULE: If unclear → DO NOT break routing, just flag
 */

import { prisma } from '@/lib/prisma'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface NormalizedItem {
  menuItemId: string
  quantity: number
  unitPriceCents: number
  instructions?: any
  confidenceLevel: ConfidenceLevel
  needsConfirmation: boolean
  ambiguityReasons?: string[]
}

export interface NormalizationInput {
  saleId: string
  items: Array<{
    menuItemId?: string
    menuItemName?: string // Fuzzy input
    quantity: number
    instructions?: any
    existingItemId?: string // If modifying
  }>
  source: 'waiter' | 'verbal' | 'correction' | 'system'
}

export interface NormalizationResult {
  normalizedItems: NormalizedItem[]
  warnings: string[]
  requiresConfirmation: boolean
}

export class OrderNormalizationService {
  /**
   * Normalize order input from various sources
   */
  static async normalizeOrder(input: NormalizationInput): Promise<NormalizationResult> {
    const normalizedItems: NormalizedItem[] = []
    const warnings: string[] = []
    let requiresConfirmation = false

    for (const item of input.items) {
      const normalized = await this.normalizeItem(item, input.source)
      normalizedItems.push(normalized)

      if (normalized.needsConfirmation) {
        requiresConfirmation = true
      }

      if (normalized.ambiguityReasons && normalized.ambiguityReasons.length > 0) {
        warnings.push(...normalized.ambiguityReasons)
      }
    }

    return {
      normalizedItems,
      warnings,
      requiresConfirmation,
    }
  }

  /**
   * Normalize single item
   */
  private static async normalizeItem(
    item: NormalizationInput['items'][0],
    source: NormalizationInput['source']
  ): Promise<NormalizedItem> {
    const ambiguityReasons: string[] = []
    let confidenceLevel: ConfidenceLevel = 'high'
    let needsConfirmation = false

    // Resolve menu item
    let menuItemId = item.menuItemId
    let unitPriceCents = 0

    if (!menuItemId && item.menuItemName) {
      // Fuzzy match by name
      const match = await this.fuzzyMatchMenuItem(item.menuItemName)

      if (!match) {
        ambiguityReasons.push(`Menu item "${item.menuItemName}" not found`)
        confidenceLevel = 'low'
        needsConfirmation = true
      } else if (match.confidence < 0.8) {
        ambiguityReasons.push(`Uncertain match: "${item.menuItemName}" → "${match.name}"`)
        confidenceLevel = 'medium'
        needsConfirmation = true
        menuItemId = match.id
        unitPriceCents = match.priceCents
      } else {
        menuItemId = match.id
        unitPriceCents = match.priceCents
      }
    } else if (menuItemId) {
      // Direct ID lookup
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: { priceCents: true },
      })

      if (menuItem) {
        unitPriceCents = menuItem.priceCents
      } else {
        ambiguityReasons.push(`Menu item ID ${menuItemId} not found`)
        confidenceLevel = 'low'
        needsConfirmation = true
      }
    }

    // Validate quantity
    if (item.quantity <= 0) {
      ambiguityReasons.push('Invalid quantity')
      confidenceLevel = 'low'
      needsConfirmation = true
    }

    // Source-based confidence adjustment
    if (source === 'verbal') {
      confidenceLevel = this.lowerConfidence(confidenceLevel)
      ambiguityReasons.push('Verbal input - recommend confirmation')
    }

    if (source === 'correction') {
      ambiguityReasons.push('Correction detected - verify change')
    }

    return {
      menuItemId: menuItemId || '',
      quantity: item.quantity,
      unitPriceCents,
      instructions: item.instructions,
      confidenceLevel,
      needsConfirmation,
      ambiguityReasons: ambiguityReasons.length > 0 ? ambiguityReasons : undefined,
    }
  }

  /**
   * Fuzzy match menu item by name
   */
  private static async fuzzyMatchMenuItem(
    name: string
  ): Promise<{ id: string; name: string; priceCents: number; confidence: number } | null> {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
      },
    })

    if (menuItems.length === 0) return null

    // Simple fuzzy matching (case-insensitive contains)
    const normalizedInput = name.toLowerCase().trim()

    const matches = menuItems
      .map((item) => {
        const normalizedName = item.name.toLowerCase()
        let confidence = 0

        if (normalizedName === normalizedInput) {
          confidence = 1.0 // Exact match
        } else if (normalizedName.includes(normalizedInput)) {
          confidence = 0.9 // Contains
        } else if (normalizedInput.includes(normalizedName)) {
          confidence = 0.8 // Input contains name
        } else {
          // Levenshtein-like simple check
          const commonChars = this.countCommonChars(normalizedName, normalizedInput)
          confidence = commonChars / Math.max(normalizedName.length, normalizedInput.length)
        }

        return {
          ...item,
          confidence,
        }
      })
      .filter((m) => m.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)

    return matches.length > 0 ? matches[0] : null
  }

  /**
   * Count common characters (simple similarity)
   */
  private static countCommonChars(str1: string, str2: string): number {
    const chars1 = str1.split('')
    const chars2 = str2.split('')
    let common = 0

    for (const char of chars1) {
      const index = chars2.indexOf(char)
      if (index !== -1) {
        common++
        chars2.splice(index, 1)
      }
    }

    return common
  }

  /**
   * Lower confidence level
   */
  private static lowerConfidence(current: ConfidenceLevel): ConfidenceLevel {
    if (current === 'high') return 'medium'
    if (current === 'medium') return 'low'
    return 'low'
  }

  /**
   * Detect if input is likely a modification vs new item
   */
  static async detectModificationIntent(
    saleId: string,
    menuItemId: string,
    quantity: number
  ): Promise<{
    isLikelyModification: boolean
    existingItemId?: string
    reason?: string
  }> {
    // Check if same item already exists in order
    const existingItems = await prisma.saleItem.findMany({
      where: {
        saleId,
        menuItemId,
        mutationType: {
          notIn: ['REPLACED', 'CANCELLED'],
        },
      },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (existingItems.length === 0) {
      return { isLikelyModification: false }
    }

    // If same item added within last 5 minutes, likely a modification
    const recentItem = existingItems[0]
    const timeSinceCreation = Date.now() - recentItem.createdAt.getTime()

    if (timeSinceCreation < 5 * 60 * 1000) {
      return {
        isLikelyModification: true,
        existingItemId: recentItem.id,
        reason: 'Same item added recently - possible quantity change',
      }
    }

    return { isLikelyModification: false }
  }

  /**
   * Group related updates (e.g., multiple modifications to same order)
   */
  static groupRelatedUpdates(
    items: Array<{ menuItemId: string; quantity: number; timestamp: Date }>
  ): Array<Array<typeof items[0]>> {
    const groups: Array<Array<typeof items[0]>> = []
    const grouped = new Set<number>()

    for (let i = 0; i < items.length; i++) {
      if (grouped.has(i)) continue

      const group = [items[i]]
      grouped.add(i)

      // Find related items (same menu item, within 30 seconds)
      for (let j = i + 1; j < items.length; j++) {
        if (grouped.has(j)) continue

        const timeDiff = Math.abs(items[j].timestamp.getTime() - items[i].timestamp.getTime())

        if (items[j].menuItemId === items[i].menuItemId && timeDiff < 30000) {
          group.push(items[j])
          grouped.add(j)
        }
      }

      groups.push(group)
    }

    return groups
  }
}
