/**
 * Supplier Matching Service — Block 4C
 *
 * Matches raw supplier names from extracted documents to known Supplier entities.
 * Uses SupplierAlias table for fuzzy matching and learns new aliases over time.
 *
 * Features:
 * - Exact match first (normalized name comparison)
 * - Alias resolution through SupplierAlias table
 * - Business-scoped results (respects business context)
 * - AUTO_MATCH vs REVIEW_SUGGESTION based on confidence threshold
 * - Alias learning via upsert-safe operations
 * - Idempotent DocumentEntityLink creation
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type MatchConfidence = 'high' | 'medium' | 'low'

export interface SupplierMatchResult {
  supplierId: string | null
  supplierName: string | null
  confidence: number // 0.0 - 1.0
  matchType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION' | 'NO_MATCH'
  matchSource: 'exact' | 'alias' | 'fuzzy' | 'none'
  aliasId?: string // If matched via alias
  reason?: string // Explanation for REVIEW_SUGGESTION or NO_MATCH
}

export interface SupplierMatchOptions {
  businessId: string
  rawSupplierName: string
  autoMatchThreshold?: number // Default: 0.85
  reviewSuggestionThreshold?: number // Default: 0.60
  learnNewAliases?: boolean // Default: true
}

// Document entity link creation result
export interface EntityLinkResult {
  linkId: string
  linkType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION'
  created: boolean // true if newly created, false if already existed
}

export class SupplierMatchingService {
  private static readonly DEFAULT_AUTO_MATCH_THRESHOLD = 0.85
  private static readonly DEFAULT_REVIEW_THRESHOLD = 0.60

  /**
   * Normalize a supplier name for matching
   * - Lowercase
   * - Trim whitespace
   * - Remove extra spaces
   * - Remove common business suffixes (ltd, inc, llc, etc.)
   */
  static normalizeName(name: string): string {
    if (!name || typeof name !== 'string') return ''

    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Collapse multiple spaces

    // Remove common business suffixes (optional, can be configured)
    const suffixes = [
      ' ltd', ' limited', ' inc', ' incorporated', ' llc', ' plc',
      ' corp', ' corporation', ' gmbh', ' sa', ' sarl', ' bv', ' nv',
      ' pty', ' pty ltd', ' co', ' company', ' enterprises', ' enterprise'
    ]

    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length).trim()
        break // Only remove one suffix
      }
    }

    return normalized
  }

  /**
   * Calculate fuzzy match score between two strings (0.0 - 1.0)
   * Uses Jaro-Winkler-like distance with common character counting
   */
  private static calculateMatchScore(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (!str1 || !str2) return 0.0

    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // Exact match after normalization
    if (s1 === s2) return 1.0

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = Math.max(s1.length, s2.length)
      const shorter = Math.min(s1.length, s2.length)
      return 0.7 + (0.3 * shorter / longer) // 0.7 - 1.0 based on length ratio
    }

    // Common character ratio (similar to Jaccard index)
    const set1 = new Set(s1.split(''))
    const set2 = new Set(s2.split(''))

    const intersection = new Set([...set1].filter(c => set2.has(c)))
    const union = new Set([...set1, ...set2])

    if (union.size === 0) return 0.0

    const jaccard = intersection.size / union.size

    // Boost score if strings have similar length
    const lengthRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)

    return jaccard * (0.6 + 0.4 * lengthRatio)
  }

  /**
   * Find the best matching supplier for a raw supplier name
   */
  static async findBestMatch(options: SupplierMatchOptions): Promise<SupplierMatchResult> {
    const {
      businessId,
      rawSupplierName,
      autoMatchThreshold = this.DEFAULT_AUTO_MATCH_THRESHOLD,
      reviewSuggestionThreshold = this.DEFAULT_REVIEW_THRESHOLD,
    } = options

    if (!rawSupplierName || rawSupplierName.trim().length === 0) {
      return {
        supplierId: null,
        supplierName: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: 'Empty supplier name',
      }
    }

    const normalizedInput = this.normalizeName(rawSupplierName)

    if (normalizedInput.length === 0) {
      return {
        supplierId: null,
        supplierName: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: 'Supplier name contains no valid characters',
      }
    }

    const p: any = prisma

    // 1. Try exact match on Supplier name (normalized) — scoped to business
    const exactMatches = await p.supplier.findMany({
      where: {
        OR: [
          // Match normalized name
          { name: { equals: normalizedInput, mode: 'insensitive' } },
          // Match raw name
          { name: { equals: rawSupplierName.trim(), mode: 'insensitive' } },
        ],
        isActive: true,
        businessId,
      },
      select: { id: true, name: true },
      take: 5,
    })

    if (exactMatches.length > 0) {
      const best = exactMatches[0]
      return {
        supplierId: best.id,
        supplierName: best.name,
        confidence: 1.0,
        matchType: 'AUTO_MATCH',
        matchSource: 'exact',
      }
    }

    // 2. Try alias match — scoped to business via supplier relation
    const aliasMatch = await p.supplierAlias.findFirst({
      where: {
        normalized: normalizedInput,
        supplier: { businessId, isActive: true },
      },
      include: {
        supplier: {
          select: { id: true, name: true, isActive: true },
        },
      },
    })

    if (aliasMatch && aliasMatch.supplier?.isActive) {
      return {
        supplierId: aliasMatch.supplier.id,
        supplierName: aliasMatch.supplier.name,
        confidence: 0.95, // High confidence for alias match
        matchType: 'AUTO_MATCH',
        matchSource: 'alias',
        aliasId: aliasMatch.id,
      }
    }

    // 3. Fuzzy match against active suppliers scoped to this business
    const allSuppliers = await p.supplier.findMany({
      where: { isActive: true, businessId },
      select: { id: true, name: true },
    })

    const scored = allSuppliers
      .map((s: { id: string; name: string }) => ({
        ...s,
        normalizedName: this.normalizeName(s.name),
        score: this.calculateMatchScore(normalizedInput, this.normalizeName(s.name)),
      }))
      .filter((s: { score: number }) => s.score >= reviewSuggestionThreshold)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    if (scored.length === 0) {
      return {
        supplierId: null,
        supplierName: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: `No supplier found matching "${rawSupplierName}"`,
      }
    }

    const bestMatch = scored[0]

    // Determine match type based on confidence
    let matchType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION' | 'NO_MATCH'
    if (bestMatch.score >= autoMatchThreshold) {
      matchType = 'AUTO_MATCH'
    } else if (bestMatch.score >= reviewSuggestionThreshold) {
      matchType = 'REVIEW_SUGGESTION'
    } else {
      matchType = 'NO_MATCH'
    }

    return {
      supplierId: bestMatch.id,
      supplierName: bestMatch.name,
      confidence: Math.round(bestMatch.score * 1000) / 1000,
      matchType,
      matchSource: 'fuzzy',
      reason: matchType === 'NO_MATCH'
        ? `Best match "${bestMatch.name}" has low confidence (${(bestMatch.score * 100).toFixed(1)}%)`
        : undefined,
    }
  }

  /**
   * Learn a new supplier alias (upsert-safe)
   * Creates or updates alias mapping for future matches
   */
  static async learnAlias(
    supplierId: string,
    rawName: string,
    matchConfidence: number
  ): Promise<{ aliasId: string; created: boolean }> {
    const normalized = this.normalizeName(rawName)

    if (!normalized || normalized.length < 2) {
      throw new Error('Cannot learn alias: name too short or empty after normalization')
    }

    const p: any = prisma

    // Check if this exact alias already exists
    const existing = await p.supplierAlias.findUnique({
      where: {
        supplierId_normalized: {
          supplierId,
          normalized,
        },
      },
    })

    if (existing) {
      return { aliasId: existing.id, created: false }
    }

    // Create new alias
    const alias = await p.supplierAlias.create({
      data: {
        supplierId,
        alias: rawName.trim(),
        normalized,
      },
    })

    return { aliasId: alias.id, created: true }
  }

  /**
   * Create DocumentEntityLink for supplier match (idempotent)
   * Returns existing link if one already exists
   */
  static async createSupplierLink(
    scannedDocumentId: string,
    supplierId: string,
    confidence: number,
    linkType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION'
  ): Promise<EntityLinkResult> {
    const p: any = prisma

    // Check for existing link (idempotency guard)
    const existing = await p.documentEntityLink.findFirst({
      where: {
        scannedDocumentId,
        entityType: 'SUPPLIER',
        entityId: supplierId,
      },
    })

    if (existing) {
      return {
        linkId: existing.id,
        linkType: existing.linkType as 'AUTO_MATCH' | 'REVIEW_SUGGESTION',
        created: false,
      }
    }

    // Create new link
    const link = await p.documentEntityLink.create({
      data: {
        scannedDocumentId,
        entityType: 'SUPPLIER',
        entityId: supplierId,
        linkType,
        confidence,
      },
    })

    return {
      linkId: link.id,
      linkType,
      created: true,
    }
  }

  /**
   * Full supplier resolution pipeline
   * 1. Match supplier
   * 2. Create entity link
   * 3. Learn alias (if auto-match)
   * 4. Update scanned document supplierId (if auto-match)
   */
  static async resolveSupplier(
    scannedDocumentId: string,
    rawSupplierName: string,
    businessId: string,
    options?: Partial<SupplierMatchOptions>
  ): Promise<{
    match: SupplierMatchResult
    link?: EntityLinkResult
    aliasLearned?: boolean
  }> {
    const matchOptions: SupplierMatchOptions = {
      businessId,
      rawSupplierName,
      autoMatchThreshold: options?.autoMatchThreshold ?? this.DEFAULT_AUTO_MATCH_THRESHOLD,
      reviewSuggestionThreshold: options?.reviewSuggestionThreshold ?? this.DEFAULT_REVIEW_THRESHOLD,
      learnNewAliases: options?.learnNewAliases ?? true,
    }

    // 1. Find best match
    const match = await this.findBestMatch(matchOptions)

    // 2. If we have a match, create entity link
    let link: EntityLinkResult | undefined
    let aliasLearned = false

    if (match.supplierId && match.matchType !== 'NO_MATCH') {
      link = await this.createSupplierLink(
        scannedDocumentId,
        match.supplierId,
        match.confidence,
        match.matchType
      )

      // 3. Learn alias for future matching (only for high confidence auto-matches)
      if (match.matchType === 'AUTO_MATCH' && matchOptions.learnNewAliases && match.matchSource !== 'alias') {
        try {
          const aliasResult = await this.learnAlias(match.supplierId, rawSupplierName, match.confidence)
          aliasLearned = aliasResult.created
        } catch (e) {
          // Alias learning failure should not break the pipeline
          console.warn(`[SupplierMatching] Failed to learn alias for "${rawSupplierName}":`, e)
        }
      }

      // 4. Update scanned document with supplierId (only for AUTO_MATCH)
      if (match.matchType === 'AUTO_MATCH') {
        const p: any = prisma
        await p.scannedDocument.update({
          where: { id: scannedDocumentId },
          data: { supplierId: match.supplierId },
        })
      }
    }

    return {
      match,
      link,
      aliasLearned,
    }
  }

  /**
   * Get all supplier suggestions for a document (for UI review)
   * Returns up to 5 potential matches sorted by confidence
   */
  static async getSuggestions(
    rawSupplierName: string,
    businessId: string,
    limit = 5
  ): Promise<Array<{ supplierId: string; name: string; confidence: number }>> {
    const normalizedInput = this.normalizeName(rawSupplierName)

    if (!normalizedInput) return []

    const p: any = prisma

    const allSuppliers = await p.supplier.findMany({
      where: { isActive: true, businessId },
      select: { id: true, name: true },
    })

    return allSuppliers
      .map((s: { id: string; name: string }) => ({
        supplierId: s.id,
        name: s.name,
        confidence: Math.round(this.calculateMatchScore(normalizedInput, this.normalizeName(s.name)) * 1000) / 1000,
      }))
      .filter((s: { confidence: number }) => s.confidence > 0.3)
      .sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)
      .slice(0, limit)
  }

  /**
   * Bulk resolve suppliers for multiple documents
   * Useful for backfilling or batch processing
   */
  static async bulkResolve(
    items: Array<{
      scannedDocumentId: string
      rawSupplierName: string
      businessId: string
    }>,
    options?: Partial<SupplierMatchOptions>
  ): Promise<Array<{
    scannedDocumentId: string
    result: {
      match: SupplierMatchResult
      link?: EntityLinkResult
      aliasLearned?: boolean
    }
  }>> {
    const results = []

    for (const item of items) {
      try {
        const result = await this.resolveSupplier(
          item.scannedDocumentId,
          item.rawSupplierName,
          item.businessId,
          options
        )
        results.push({ scannedDocumentId: item.scannedDocumentId, result })
      } catch (e) {
        console.error(`[SupplierMatching] Failed to resolve ${item.scannedDocumentId}:`, e)
        results.push({
          scannedDocumentId: item.scannedDocumentId,
          result: {
            match: {
              supplierId: null,
              supplierName: null,
              confidence: 0,
              matchType: 'NO_MATCH' as 'NO_MATCH',
              matchSource: 'none' as 'none',
              reason: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
            },
          },
        })
      }
    }

    return results
  }
}
