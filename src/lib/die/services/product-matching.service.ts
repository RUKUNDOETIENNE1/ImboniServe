/**
 * Product Matching Service — Block 4C
 *
 * Matches raw product names from extracted documents to known products:
 * - InventoryItem (business-scoped)
 * - SupplierProduct (supplier-scoped)
 *
 * Uses ProductAlias table for fuzzy matching and learns new aliases over time.
 *
 * Features:
 * - Exact match first (normalized name comparison)
 * - Alias resolution through ProductAlias table
 * - Business-scoped matching for InventoryItem
 * - Supplier-scoped matching for SupplierProduct
 * - AUTO_MATCH vs REVIEW_SUGGESTION based on confidence threshold
 * - Alias learning via upsert-safe operations
 * - Idempotent DocumentEntityLink creation
 */

import { prisma } from '@/lib/prisma'

export type ProductMatchConfidence = 'high' | 'medium' | 'low'

export interface ProductMatchResult {
  productId: string | null
  productName: string | null
  productType: 'INVENTORY_ITEM' | 'SUPPLIER_PRODUCT' | null
  supplierId?: string // If matched to supplier product
  confidence: number // 0.0 - 1.0
  matchType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION' | 'NO_MATCH'
  matchSource: 'exact' | 'alias' | 'fuzzy' | 'none'
  aliasId?: string // If matched via alias
  reason?: string // Explanation for REVIEW_SUGGESTION or NO_MATCH
}

export interface ProductMatchOptions {
  businessId: string
  supplierId?: string // Optional: if known, prefer supplier products
  rawProductName: string
  autoMatchThreshold?: number // Default: 0.85
  reviewSuggestionThreshold?: number // Default: 0.60
  learnNewAliases?: boolean // Default: true
}

// Document entity link creation result
export interface ProductEntityLinkResult {
  linkId: string
  linkType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION'
  created: boolean // true if newly created, false if already existed
}

export class ProductMatchingService {
  private static readonly DEFAULT_AUTO_MATCH_THRESHOLD = 0.85
  private static readonly DEFAULT_REVIEW_THRESHOLD = 0.60

  /**
   * Normalize a product name for matching
   * - Lowercase
   * - Trim whitespace
   * - Remove extra spaces
   * - Remove common unit suffixes (kg, g, l, ml, pcs, etc.)
   */
  static normalizeName(name: string): string {
    if (!name || typeof name !== 'string') return ''

    let s = name.toLowerCase().trim().replace(/\s+/g, ' ')

    // ── Unit tokens ──────────────────────────────────────────────────────────────
    // Multi-char units: safe to match as a token (kgs, litres, ml, cartons …)
    const muPat =
      'kgs?|kilos?|kilograms?|grams?|gr|' +
      'litres?|liters?|milliliters?|millilitres?|' +
      'ml|lt|' +
      'pieces?|packs?|packets?|cartons?|bottles?|cans?|jars?|bags?|sacks?|units?|' +
      'pcs?|pc'

    // Single-char units: only meaningful immediately after a number (avoid stripping
    // the 'l' in "oil" or the 'g' in "sugar").  These are only used in qty+unit patterns.
    const suPat = 'l|g'

    // 1. Strip leading quantity prefix: "10x word", "5 word"
    s = s.replace(/^\d+(\.\d+)?\s*x\s+/i, '').replace(/^\d+(\.\d+)?\s+(?=\D)/i, '')

    // 2. Iteratively peel suffix layers from the right until string stabilises.
    //    Each iteration tries, in priority order:
    //      a. qty + multi-char unit (with or without space): "50 kg", "500ml", "25kg"
    //      b. qty + single-char unit (space required or compact): "50 g", "1 l", "1l"
    //      c. standalone multi-char unit word: "bag", "pcs", "carton"
    //    Order matters: try qty+unit BEFORE standalone unit so we don't orphan numbers.
    let prev = ''
    while (s !== prev) {
      prev = s
      // a) qty+multi-char (spaced or compact)
      s = s.replace(new RegExp(`\\s*\\d+(\\.\\d+)?\\s*(${muPat})\\s*$`, 'i'), '').trim()
      // b) qty+single-char (only after number)
      s = s.replace(new RegExp(`\\s*\\d+(\\.\\d+)?\\s*(${suPat})\\s*$`, 'i'), '').trim()
      // c) standalone multi-char unit at end (no number required)
      s = s.replace(new RegExp(`\\s+(${muPat})\\s*$`, 'i'), '').trim()
    }

    // 3. Collapse any remaining double-spaces
    s = s.replace(/\s+/g, ' ').trim()

    return s
  }

  /**
   * Calculate fuzzy match score between two strings (0.0 - 1.0)
   * Enhanced version with better handling for product names
   */
  private static calculateMatchScore(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (!str1 || !str2) return 0.0

    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // Exact match after normalization
    if (s1 === s2) return 1.0

    // Word-level matching (important for product names)
    const words1 = s1.split(/\s+/)
    const words2 = s2.split(/\s+/)

    // Count matching words
    const matchingWords = words1.filter(w1 =>
      words2.some(w2 => w2 === w1 || w2.includes(w1) || w1.includes(w2))
    ).length

    const wordMatchRatio = matchingWords / Math.max(words1.length, words2.length)

    // Check if one contains the other
    let containmentScore = 0
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = Math.max(s1.length, s2.length)
      const shorter = Math.min(s1.length, s2.length)
      containmentScore = 0.6 + (0.4 * shorter / longer)
    }

    // Character-level similarity (Jaccard-like)
    const set1 = new Set(s1.split(''))
    const set2 = new Set(s2.split(''))
    const intersection = new Set([...set1].filter(c => set2.has(c)))
    const union = new Set([...set1, ...set2])
    const charScore = union.size === 0 ? 0 : intersection.size / union.size

    // Combine scores (weighted)
    const combined = (wordMatchRatio * 0.4) + (containmentScore * 0.35) + (charScore * 0.25)

    return Math.min(1.0, combined)
  }

  /**
   * Find best matching InventoryItem for a business
   */
  static async findInventoryItemMatch(
    businessId: string,
    rawProductName: string,
    autoMatchThreshold = this.DEFAULT_AUTO_MATCH_THRESHOLD,
    reviewSuggestionThreshold = this.DEFAULT_REVIEW_THRESHOLD
  ): Promise<ProductMatchResult> {
    const normalizedInput = this.normalizeName(rawProductName)

    if (!normalizedInput) {
      return {
        productId: null,
        productName: null,
        productType: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: 'Empty product name',
      }
    }

    const p: any = prisma

    // 1. Try exact match
    const exactMatches = await p.inventoryItem.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [
          { name: { equals: normalizedInput, mode: 'insensitive' } },
          { name: { equals: rawProductName.trim(), mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true },
      take: 5,
    })

    if (exactMatches.length > 0) {
      return {
        productId: exactMatches[0].id,
        productName: exactMatches[0].name,
        productType: 'INVENTORY_ITEM',
        confidence: 1.0,
        matchType: 'AUTO_MATCH',
        matchSource: 'exact',
      }
    }

    // 2. Try alias match
    const aliasMatch = await p.productAlias.findFirst({
      where: {
        normalized: normalizedInput,
        inventoryItemId: { not: null },
      },
      include: {
        inventoryItem: {
          select: { id: true, name: true, businessId: true, isActive: true },
        },
      },
    })

    if (aliasMatch?.inventoryItem?.isActive && aliasMatch.inventoryItem.businessId === businessId) {
      return {
        productId: aliasMatch.inventoryItem.id,
        productName: aliasMatch.inventoryItem.name,
        productType: 'INVENTORY_ITEM',
        confidence: 0.95,
        matchType: 'AUTO_MATCH',
        matchSource: 'alias',
        aliasId: aliasMatch.id,
      }
    }

    // 3. Fuzzy match
    const allItems = await p.inventoryItem.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: { id: true, name: true },
    })

    const scored = allItems
      .map((item: { id: string; name: string }) => ({
        ...item,
        normalizedName: this.normalizeName(item.name),
        score: this.calculateMatchScore(normalizedInput, this.normalizeName(item.name)),
      }))
      .filter((item: { score: number }) => item.score >= reviewSuggestionThreshold)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    if (scored.length === 0) {
      return {
        productId: null,
        productName: null,
        productType: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: `No inventory item found matching "${rawProductName}"`,
      }
    }

    const best = scored[0]
    let matchType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION' | 'NO_MATCH'

    if (best.score >= autoMatchThreshold) {
      matchType = 'AUTO_MATCH'
    } else if (best.score >= reviewSuggestionThreshold) {
      matchType = 'REVIEW_SUGGESTION'
    } else {
      matchType = 'NO_MATCH'
    }

    return {
      productId: best.id,
      productName: best.name,
      productType: 'INVENTORY_ITEM',
      confidence: Math.round(best.score * 1000) / 1000,
      matchType,
      matchSource: 'fuzzy',
      reason: matchType === 'NO_MATCH'
        ? `Best match "${best.name}" has low confidence (${(best.score * 100).toFixed(1)}%)`
        : undefined,
    }
  }

  /**
   * Find best matching SupplierProduct for a supplier
   */
  static async findSupplierProductMatch(
    supplierId: string,
    rawProductName: string,
    autoMatchThreshold = this.DEFAULT_AUTO_MATCH_THRESHOLD,
    reviewSuggestionThreshold = this.DEFAULT_REVIEW_THRESHOLD
  ): Promise<ProductMatchResult> {
    const normalizedInput = this.normalizeName(rawProductName)

    if (!normalizedInput) {
      return {
        productId: null,
        productName: null,
        productType: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: 'Empty product name',
      }
    }

    const p: any = prisma

    // 1. Try exact match
    const exactMatches = await p.supplierProduct.findMany({
      where: {
        supplierId,
        isAvailable: true,
        OR: [
          { name: { equals: normalizedInput, mode: 'insensitive' } },
          { name: { equals: rawProductName.trim(), mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, supplierId: true },
      take: 5,
    })

    if (exactMatches.length > 0) {
      return {
        productId: exactMatches[0].id,
        productName: exactMatches[0].name,
        productType: 'SUPPLIER_PRODUCT',
        supplierId: exactMatches[0].supplierId,
        confidence: 1.0,
        matchType: 'AUTO_MATCH',
        matchSource: 'exact',
      }
    }

    // 2. Try alias match
    const aliasMatch = await p.productAlias.findFirst({
      where: {
        normalized: normalizedInput,
        supplierProductId: { not: null },
      },
      include: {
        supplierProduct: {
          select: { id: true, name: true, supplierId: true, isAvailable: true },
        },
      },
    })

    if (aliasMatch?.supplierProduct?.isAvailable && aliasMatch.supplierProduct.supplierId === supplierId) {
      return {
        productId: aliasMatch.supplierProduct.id,
        productName: aliasMatch.supplierProduct.name,
        productType: 'SUPPLIER_PRODUCT',
        supplierId: aliasMatch.supplierProduct.supplierId,
        confidence: 0.95,
        matchType: 'AUTO_MATCH',
        matchSource: 'alias',
        aliasId: aliasMatch.id,
      }
    }

    // 3. Fuzzy match
    const allProducts = await p.supplierProduct.findMany({
      where: {
        supplierId,
        isAvailable: true,
      },
      select: { id: true, name: true, supplierId: true },
    })

    const scored = allProducts
      .map((item: { id: string; name: string; supplierId: string }) => ({
        ...item,
        normalizedName: this.normalizeName(item.name),
        score: this.calculateMatchScore(normalizedInput, this.normalizeName(item.name)),
      }))
      .filter((item: { score: number }) => item.score >= reviewSuggestionThreshold)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    if (scored.length === 0) {
      return {
        productId: null,
        productName: null,
        productType: null,
        confidence: 0,
        matchType: 'NO_MATCH',
        matchSource: 'none',
        reason: `No supplier product found matching "${rawProductName}"`,
      }
    }

    const best = scored[0]
    let matchType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION' | 'NO_MATCH'

    if (best.score >= autoMatchThreshold) {
      matchType = 'AUTO_MATCH'
    } else if (best.score >= reviewSuggestionThreshold) {
      matchType = 'REVIEW_SUGGESTION'
    } else {
      matchType = 'NO_MATCH'
    }

    return {
      productId: best.id,
      productName: best.name,
      productType: 'SUPPLIER_PRODUCT',
      supplierId: best.supplierId,
      confidence: Math.round(best.score * 1000) / 1000,
      matchType,
      matchSource: 'fuzzy',
      reason: matchType === 'NO_MATCH'
        ? `Best match "${best.name}" has low confidence (${(best.score * 100).toFixed(1)}%)`
        : undefined,
    }
  }

  /**
   * Find best product match across both InventoryItem and SupplierProduct
   * If supplierId is provided, prefers SupplierProduct matches
   */
  static async findBestMatch(options: ProductMatchOptions): Promise<ProductMatchResult> {
    const {
      businessId,
      supplierId,
      rawProductName,
      autoMatchThreshold = this.DEFAULT_AUTO_MATCH_THRESHOLD,
      reviewSuggestionThreshold = this.DEFAULT_REVIEW_THRESHOLD,
    } = options

    // If we have a supplierId, try supplier products first
    let supplierResult: ProductMatchResult | null = null
    if (supplierId) {
      supplierResult = await this.findSupplierProductMatch(
        supplierId,
        rawProductName,
        autoMatchThreshold,
        reviewSuggestionThreshold
      )

      // If high confidence match, return immediately
      if (supplierResult.matchType === 'AUTO_MATCH' && supplierResult.confidence >= 0.9) {
        return supplierResult
      }
    }

    // Try inventory items
    const inventoryResult = await this.findInventoryItemMatch(
      businessId,
      rawProductName,
      autoMatchThreshold,
      reviewSuggestionThreshold
    )

    // If high confidence match, return immediately
    if (inventoryResult.matchType === 'AUTO_MATCH' && inventoryResult.confidence >= 0.9) {
      return inventoryResult
    }

    // Compare results and return best
    if (!supplierResult && inventoryResult.matchType === 'NO_MATCH') {
      return inventoryResult
    }

    if (!supplierResult) return inventoryResult

    // If inventory has better match, prefer it
    if (inventoryResult.confidence > supplierResult.confidence) {
      return inventoryResult
    }

    return supplierResult
  }

  /**
   * Learn a new product alias (upsert-safe)
   */
  static async learnAlias(
    rawName: string,
    options: {
      inventoryItemId?: string
      supplierProductId?: string
    }
  ): Promise<{ aliasId: string; created: boolean }> {
    const normalized = this.normalizeName(rawName)

    if (!normalized || normalized.length < 2) {
      throw new Error('Cannot learn alias: name too short or empty after normalization')
    }

    if (!options.inventoryItemId && !options.supplierProductId) {
      throw new Error('Must provide either inventoryItemId or supplierProductId')
    }

    const p: any = prisma

    // Check for existing alias
    const whereClause: any = { normalized }
    if (options.inventoryItemId) {
      whereClause.inventoryItemId = options.inventoryItemId
    }
    if (options.supplierProductId) {
      whereClause.supplierProductId = options.supplierProductId
    }

    const existing = await p.productAlias.findFirst({ where: whereClause })

    if (existing) {
      return { aliasId: existing.id, created: false }
    }

    // Create new alias
    const data: any = {
      alias: rawName.trim(),
      normalized,
    }
    if (options.inventoryItemId) data.inventoryItemId = options.inventoryItemId
    if (options.supplierProductId) data.supplierProductId = options.supplierProductId

    const alias = await p.productAlias.create({ data })

    return { aliasId: alias.id, created: true }
  }

  /**
   * Create DocumentEntityLink for product match (idempotent)
   */
  static async createProductLink(
    scannedDocumentId: string,
    productId: string,
    productType: 'INVENTORY_ITEM' | 'SUPPLIER_PRODUCT',
    confidence: number,
    linkType: 'AUTO_MATCH' | 'REVIEW_SUGGESTION'
  ): Promise<ProductEntityLinkResult> {
    const p: any = prisma

    const entityType = productType === 'INVENTORY_ITEM' ? 'INVENTORY_ITEM' : 'SUPPLIER'

    // Check for existing link
    const existing = await p.documentEntityLink.findFirst({
      where: {
        scannedDocumentId,
        entityType,
        entityId: productId,
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
        entityType,
        entityId: productId,
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
   * Full product resolution pipeline
   * 1. Match product
   * 2. Create entity link
   * 3. Learn alias (if auto-match)
   * 4. Update scanned document item with productId
   */
  static async resolveProduct(
    scannedDocumentItemId: string,
    scannedDocumentId: string,
    rawProductName: string,
    businessId: string,
    supplierId: string | null,
    options?: Partial<ProductMatchOptions>
  ): Promise<{
    match: ProductMatchResult
    link?: ProductEntityLinkResult
    aliasLearned?: boolean
    itemUpdated: boolean
  }> {
    const matchOptions: ProductMatchOptions = {
      businessId,
      supplierId: supplierId ?? undefined,
      rawProductName,
      autoMatchThreshold: options?.autoMatchThreshold ?? this.DEFAULT_AUTO_MATCH_THRESHOLD,
      reviewSuggestionThreshold: options?.reviewSuggestionThreshold ?? this.DEFAULT_REVIEW_THRESHOLD,
      learnNewAliases: options?.learnNewAliases ?? true,
    }

    // 1. Find best match
    const match = await this.findBestMatch(matchOptions)

    // 2. If we have a match, create entity link and update item
    let link: ProductEntityLinkResult | undefined
    let aliasLearned = false
    let itemUpdated = false

    if (match.productId && match.matchType !== 'NO_MATCH') {
      link = await this.createProductLink(
        scannedDocumentId,
        match.productId,
        match.productType!,
        match.confidence,
        match.matchType
      )

      // 3. Learn alias for future matching
      if (match.matchType === 'AUTO_MATCH' && matchOptions.learnNewAliases && match.matchSource !== 'alias') {
        try {
          const aliasOptions: { inventoryItemId?: string; supplierProductId?: string } = {}
          if (match.productType === 'INVENTORY_ITEM') {
            aliasOptions.inventoryItemId = match.productId
          } else {
            aliasOptions.supplierProductId = match.productId
          }

          const aliasResult = await this.learnAlias(rawProductName, aliasOptions)
          aliasLearned = aliasResult.created
        } catch (e) {
          console.warn(`[ProductMatching] Failed to learn alias for "${rawProductName}":`, e)
        }
      }

      // 4. Update scanned document item with product reference
      const p: any = prisma
      const updateData: any = {}

      if (match.productType === 'INVENTORY_ITEM') {
        updateData.productId = match.productId
      } else {
        updateData.supplierProductId = match.productId
      }

      await p.scannedDocumentItem.update({
        where: { id: scannedDocumentItemId },
        data: updateData,
      })

      itemUpdated = true
    }

    return {
      match,
      link,
      aliasLearned,
      itemUpdated,
    }
  }

  /**
   * Resolve all products for a scanned document
   * Iterates through all ScannedDocumentItems and attempts to match each
   */
  static async resolveAllProducts(
    scannedDocumentId: string,
    businessId: string,
    supplierId: string | null,
    options?: Partial<ProductMatchOptions>
  ): Promise<{
    totalItems: number
    matched: number
    suggestions: number
    unmatched: number
    aliasesLearned: number
    results: Array<{
      itemId: string
      lineNo: number
      result: Awaited<ReturnType<typeof this.resolveProduct>>
    }>
  }> {
    const p: any = prisma

    // Get all items for the document
    const items = await p.scannedDocumentItem.findMany({
      where: { scannedDocumentId },
      select: { id: true, lineNo: true, productName: true },
      orderBy: { lineNo: 'asc' },
    })

    let matched = 0
    let suggestions = 0
    let unmatched = 0
    let aliasesLearned = 0
    const results = []

    for (const item of items) {
      try {
        const result = await this.resolveProduct(
          item.id,
          scannedDocumentId,
          item.productName,
          businessId,
          supplierId,
          options
        )

        if (result.match.matchType === 'AUTO_MATCH') matched++
        else if (result.match.matchType === 'REVIEW_SUGGESTION') suggestions++
        else unmatched++

        if (result.aliasLearned) aliasesLearned++

        results.push({ itemId: item.id, lineNo: item.lineNo, result })
      } catch (e) {
        console.error(`[ProductMatching] Failed to resolve item ${item.id}:`, e)
        unmatched++
        results.push({
          itemId: item.id,
          lineNo: item.lineNo,
          result: {
            match: {
              productId: null,
              productName: null,
              productType: null,
              confidence: 0,
              matchType: 'NO_MATCH',
              matchSource: 'none',
              reason: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`,
            },
            itemUpdated: false,
          },
        })
      }
    }

    return {
      totalItems: items.length,
      matched,
      suggestions,
      unmatched,
      aliasesLearned,
      results,
    }
  }

  /**
   * Get product suggestions for a raw name (for UI review)
   */
  static async getSuggestions(
    rawProductName: string,
    businessId: string,
    supplierId?: string,
    limit = 5
  ): Promise<Array<{
    productId: string
    name: string
    type: 'INVENTORY_ITEM' | 'SUPPLIER_PRODUCT'
    supplierName?: string
    confidence: number
  }>> {
    const normalizedInput = this.normalizeName(rawProductName)
    if (!normalizedInput) return []

    const p: any = prisma
    const results = []

    // Inventory items
    const inventoryItems = await p.inventoryItem.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
    })

    const inventoryScored = inventoryItems
      .map((item: { id: string; name: string }) => ({
        productId: item.id,
        name: item.name,
        type: 'INVENTORY_ITEM' as const,
        confidence: Math.round(this.calculateMatchScore(normalizedInput, this.normalizeName(item.name)) * 1000) / 1000,
      }))
      .filter((item: { confidence: number }) => item.confidence > 0.3)

    results.push(...inventoryScored)

    // Supplier products
    if (supplierId) {
      const supplierProducts = await p.supplierProduct.findMany({
        where: { supplierId, isAvailable: true },
        include: { supplier: { select: { name: true } } },
      })

      const productScored = supplierProducts
        .map((item: { id: string; name: string; supplier: { name: string } }) => ({
          productId: item.id,
          name: item.name,
          type: 'SUPPLIER_PRODUCT' as const,
          supplierName: item.supplier.name,
          confidence: Math.round(this.calculateMatchScore(normalizedInput, this.normalizeName(item.name)) * 1000) / 1000,
        }))
        .filter((item: { confidence: number }) => item.confidence > 0.3)

      results.push(...productScored)
    }

    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
  }
}
