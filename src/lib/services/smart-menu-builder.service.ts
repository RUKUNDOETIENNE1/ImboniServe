/**
 * Smart Menu Builder Service — Canonical AI Menu Pipeline
 *
 * This is the single canonical service for all AI-powered menu operations:
 *   - Extraction from images (GPT-4 Vision)
 *   - Extraction from PDFs (Puppeteer PDF→PNG → GPT-4 Vision)
 *   - Extraction from file buffers (base64 → GPT-4 Vision)
 *   - Candidate generation (MenuItemCandidate records)
 *   - Candidate review workflow (publish / reject)
 *   - Menu enhancement (descriptions, categorization, dietary/allergen detection)
 *
 * Formerly duplicated logic from MenuAIService has been consolidated here.
 * MenuAIService now delegates to this service for backward compatibility.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import OpenAI from 'openai'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { StorageService } from '@/lib/services/storage.service'

const log = logger.child({ service: 'smart-menu-builder' })

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedMenuItem {
  name: string
  description?: string
  price?: number
  category?: string
  confidence?: number
}

export interface ExtractionResult {
  items: ExtractedMenuItem[]
  usage?: unknown
  model?: string
}

export interface ImportResult {
  imported: unknown[]
  errors: Array<{ item: unknown; error: string }>
  summary: { total: number; successful: number; failed: number }
}

// ---------------------------------------------------------------------------
// PDF → PNG rendering (reuses the proven DIE provider pattern)
// ---------------------------------------------------------------------------

async function renderPdfToPng(pdfBuffer: Buffer): Promise<Buffer> {
  const puppeteer = require('puppeteer')

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'menu-pdf-'))
  const pdfPath = path.join(tmpDir, 'menu.pdf')

  let browser: any
  try {
    await fs.writeFile(pdfPath, pdfBuffer)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 })

    const url = pathToFileURL(pdfPath).href
    await page.goto(url, { waitUntil: 'load' })

    // Give Chromium's PDF renderer a moment to paint.
    await new Promise(resolve => setTimeout(resolve, 750))

    // Force render additional pages by scrolling.
    try {
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      const step = 900
      for (let y = 0; y < scrollHeight; y += step) {
        await page.evaluate((yy: number) => window.scrollTo(0, yy), y)
        await new Promise(resolve => setTimeout(resolve, 120))
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch {
      // ignore scroll errors
    }

    const png = await page.screenshot({ fullPage: true, type: 'png' })
    return Buffer.from(png)
  } finally {
    try {
      if (browser) await browser.close()
    } catch {
      // ignore
    }
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// JSON parsing helper (handles markdown-wrapped responses)
// ---------------------------------------------------------------------------

function parseJsonFromModel(content: string): any {
  const raw = (content || '').trim()
  if (!raw) throw new Error('OpenAI returned empty response')

  try {
    return JSON.parse(raw)
  } catch {
    // Attempt to recover JSON if the model accidentally wrapped it.
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1)
      return JSON.parse(slice)
    }
    const objStart = raw.indexOf('{')
    const objEnd = raw.lastIndexOf('}')
    if (objStart >= 0 && objEnd > objStart) {
      const slice = raw.slice(objStart, objEnd + 1)
      return JSON.parse(slice)
    }
    throw new Error('OpenAI returned non-JSON output')
  }
}

// ---------------------------------------------------------------------------
// Menu extraction system prompt
// ---------------------------------------------------------------------------

const MENU_EXTRACTION_PROMPT = `You are a menu extraction expert. Extract all menu items from the image with their names, descriptions, and prices.
Return a JSON array of items in this format:
[
  {
    "name": "Item Name",
    "description": "Brief description",
    "price": 5000,
    "category": "Category Name",
    "confidence": 0.9
  }
]

Rules:
- Extract prices in RWF (Rwandan Francs). If the price uses a different currency, convert to RWF.
- If price has decimals, convert to cents (multiply by 100).
- Infer category from context (Appetizers, Main Course, Drinks, Desserts, etc.).
- Keep descriptions concise (1-2 sentences). If no description visible, leave empty string.
- Confidence must be 0.0 to 1.0 — how confident you are in the extraction.
- Return ONLY valid JSON, no markdown or explanations.`

// ===========================================================================
// SmartMenuBuilderService
// ===========================================================================

export class SmartMenuBuilderService {
  // -------------------------------------------------------------------------
  // Extraction: from image URL (backward compatible)
  // -------------------------------------------------------------------------

  /**
   * Extract menu from image using GPT-4 Vision (public URL)
   */
  static async extractMenuFromImage(imageUrl: string, businessId: string): Promise<ExtractionResult> {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    log.info('Extracting menu from image URL', { businessId, imageUrl })

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: MENU_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No content returned from OpenAI')

      const items = parseJsonFromModel(content)
      if (!Array.isArray(items)) throw new Error('Invalid response format - expected array')

      log.info('Menu extracted from image URL', { businessId, itemCount: items.length })

      return { items, usage: response.usage, model: response.model }
    } catch (error) {
      log.error('Menu extraction from image URL failed', { error: String(error), businessId })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // Extraction: from image buffer (base64 → GPT-4 Vision)
  // -------------------------------------------------------------------------

  /**
   * Extract menu from an image buffer (direct upload, no public URL needed)
   */
  static async extractMenuFromImageBuffer(
    imageBuffer: Buffer,
    mimeType: string,
    businessId: string
  ): Promise<ExtractionResult> {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    log.info('Extracting menu from image buffer', { businessId, mimeType, sizeBytes: imageBuffer.length })

    try {
      const base64 = imageBuffer.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: MENU_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No content returned from OpenAI')

      const items = parseJsonFromModel(content)
      if (!Array.isArray(items)) throw new Error('Invalid response format - expected array')

      log.info('Menu extracted from image buffer', { businessId, itemCount: items.length })

      return { items, usage: response.usage, model: response.model }
    } catch (error) {
      log.error('Menu extraction from image buffer failed', { error: String(error), businessId })
      throw error
    }
  }

  // -------------------------------------------------------------------------
  // Extraction: from PDF (Puppeteer PDF→PNG → GPT-4 Vision)
  // -------------------------------------------------------------------------

  /**
   * Extract menu from a PDF buffer.
   * Renders the PDF to a PNG screenshot using Puppeteer, then passes the
   * screenshot to GPT-4 Vision for extraction.
   */
  static async extractMenuFromPDFBuffer(
    pdfBuffer: Buffer,
    businessId: string
  ): Promise<ExtractionResult> {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    log.info('Extracting menu from PDF buffer', { businessId, sizeBytes: pdfBuffer.length })

    try {
      // Step 1: Render PDF to PNG using Puppeteer
      const pngBuffer = await renderPdfToPng(pdfBuffer)

      // Step 2: Extract menu from the rendered PNG
      const result = await this.extractMenuFromImageBuffer(pngBuffer, 'image/png', businessId)

      log.info('Menu extracted from PDF', { businessId, itemCount: result.items.length })

      return result
    } catch (error) {
      log.error('Menu extraction from PDF failed', { error: String(error), businessId })
      throw error
    }
  }

  /**
   * Extract menu from a PDF stored at a public URL.
   * Downloads the PDF, renders to PNG, then extracts via GPT-4 Vision.
   */
  static async extractMenuFromPDF(pdfUrl: string, businessId: string): Promise<ExtractionResult> {
    log.info('Extracting menu from PDF URL', { businessId, pdfUrl })

    try {
      // Download the PDF
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)

      return await this.extractMenuFromPDFBuffer(pdfBuffer, businessId)
    } catch (error) {
      log.error('Menu extraction from PDF URL failed', { error: String(error), businessId })
      throw error
    }
  }

  /**
   * Extract menu from a privately stored file (using StorageService).
   * Downloads the private file, determines type, and routes to the appropriate extractor.
   */
  static async extractMenuFromStorage(
    storageKey: string,
    mimeType: string,
    businessId: string
  ): Promise<ExtractionResult> {
    log.info('Extracting menu from storage', { businessId, storageKey, mimeType })

    const fileBuffer = await StorageService.downloadPrivate(storageKey)

    if (mimeType === 'application/pdf') {
      return await this.extractMenuFromPDFBuffer(fileBuffer, businessId)
    }

    // Default: treat as image
    return await this.extractMenuFromImageBuffer(fileBuffer, mimeType, businessId)
  }

  // -------------------------------------------------------------------------
  // Document processing pipeline (from MenuAIService, consolidated)
  // -------------------------------------------------------------------------

  /**
   * Process a MenuSourceDocument: extract items and create candidates.
   * This is the canonical entry point for the upload → extract → candidate pipeline.
   */
  static async processDocument(sourceDocumentId: string): Promise<void> {
    const doc = await prisma.menuSourceDocument.findUnique({
      where: { id: sourceDocumentId },
      include: { business: { select: { id: true, name: true } } },
    })
    if (!doc) throw new Error('Document not found')

    await prisma.menuSourceDocument.update({
      where: { id: sourceDocumentId },
      data: { status: 'PROCESSING' },
    })

    try {
      // Extract items from the stored file
      const extraction = await this.extractMenuFromStorage(
        doc.fileUrl,
        doc.fileType,
        doc.businessId
      )

      // Create candidates from extracted items
      for (const item of extraction.items) {
        await prisma.menuItemCandidate.create({
          data: {
            sourceDocumentId,
            businessId: doc.businessId,
            name: item.name,
            description: item.description || null,
            category: item.category || null,
            priceCents: item.price ? Math.round(item.price) : null,
            confidence: item.confidence || 0.7,
            rawData: item as any,
            status: 'PENDING',
          },
        })
      }

      await prisma.menuSourceDocument.update({
        where: { id: sourceDocumentId },
        data: { status: 'COMPLETED', processedAt: new Date() },
      })

      log.info('Document processed', {
        sourceDocumentId,
        businessId: doc.businessId,
        itemsFound: extraction.items.length,
      })
    } catch (err) {
      await prisma.menuSourceDocument.update({
        where: { id: sourceDocumentId },
        data: { status: 'FAILED' },
      })
      log.error('Document processing failed', {
        sourceDocumentId,
        error: String(err),
      })
      throw err
    }
  }

  // -------------------------------------------------------------------------
  // Candidate review workflow (from MenuAIService, consolidated)
  // -------------------------------------------------------------------------

  /**
   * Publish a candidate to a live MenuItem
   */
  static async publishCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    const candidate = await prisma.menuItemCandidate.findUnique({
      where: { id: candidateId },
    })
    if (!candidate) throw new Error('Candidate not found')
    if (candidate.status !== 'PENDING') throw new Error('Candidate already processed')

    const menuItem = await prisma.menuItem.create({
      data: {
        businessId: candidate.businessId,
        name: candidate.name,
        description: candidate.description,
        category: candidate.category,
        priceCents: candidate.priceCents || 0,
        costCents: 0,
        isAvailable: true,
      },
    })

    await prisma.menuItemCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'PUBLISHED',
        reviewedBy,
        reviewedAt: new Date(),
        publishedItemId: menuItem.id,
      },
    })

    log.info('Candidate published', { candidateId, menuItemId: menuItem.id })
  }

  /**
   * Reject a candidate
   */
  static async rejectCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    await prisma.menuItemCandidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED', reviewedBy, reviewedAt: new Date() },
    })

    log.info('Candidate rejected', { candidateId })
  }

  /**
   * Get candidates by business and status
   */
  static async getCandidates(businessId: string, status = 'PENDING') {
    return prisma.menuItemCandidate.findMany({
      where: { businessId, status },
      include: { sourceDocument: { select: { filename: true, fileType: true } } },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'asc' }],
    })
  }

  // -------------------------------------------------------------------------
  // Direct import (backward compatible — creates MenuItem directly)
  // -------------------------------------------------------------------------

  /**
   * Import extracted items directly to menu (bypasses candidate review).
   * Kept for backward compatibility with /api/menu-builder/import.
   */
  static async importMenuItems(
    businessId: string,
    items: Array<{
      name: string
      description?: string
      price: number
      category?: string
    }>
  ): Promise<ImportResult> {
    log.info('Importing menu items', { businessId, itemCount: items.length })

    const imported = []
    const errors = []

    for (const item of items) {
      try {
        if (!item.name || !item.price) {
          errors.push({ item, error: 'Missing name or price' })
          continue
        }

        const existing = await prisma.menuItem.findFirst({
          where: {
            businessId,
            name: { equals: item.name, mode: 'insensitive' },
          },
        })

        if (existing) {
          errors.push({ item, error: 'Item already exists' })
          continue
        }

        const created = await prisma.menuItem.create({
          data: {
            businessId,
            name: item.name,
            description: item.description || '',
            priceCents: Math.round(item.price),
            costCents: 0,
            category: item.category || 'Uncategorized',
            isAvailable: true,
          },
        })

        imported.push(created)
      } catch (error) {
        errors.push({ item, error: String(error) })
      }
    }

    log.info('Menu import completed', {
      businessId,
      imported: imported.length,
      errors: errors.length,
    })

    return {
      imported,
      errors,
      summary: {
        total: items.length,
        successful: imported.length,
        failed: errors.length,
      },
    }
  }

  // -------------------------------------------------------------------------
  // Menu enhancement (existing capabilities, preserved)
  // -------------------------------------------------------------------------

  /**
   * Enhance menu item with AI-generated description
   */
  static async enhanceItemDescription(itemName: string, existingDescription?: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a food menu copywriter. Write appetizing, concise descriptions (1-2 sentences) for menu items.',
          },
          {
            role: 'user',
            content: existingDescription
              ? `Improve this menu item description:\nItem: ${itemName}\nCurrent: ${existingDescription}`
              : `Write a menu description for: ${itemName}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || existingDescription || ''
    } catch (error) {
      log.error('Description enhancement failed', { error: String(error), itemName })
      return existingDescription || ''
    }
  }

  /**
   * Categorize menu items automatically
   */
  static async categorizeBatch(items: Array<{ name: string; description?: string }>): Promise<Array<{ name: string; category: string }>> {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const itemList = items.map(i => `${i.name}${i.description ? ` - ${i.description}` : ''}`).join('\n')

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Categorize menu items into: Appetizers, Soups & Salads, Main Course, Seafood, Grills, Pasta & Rice, Vegetarian, Desserts, Beverages, Alcoholic Drinks, Coffee & Tea, Breakfast, Snacks.
            Return JSON array: [{"name": "Item Name", "category": "Category"}]`,
          },
          {
            role: 'user',
            content: itemList,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      return parseJsonFromModel(content)
    } catch (error) {
      log.error('Batch categorization failed', { error: String(error) })
      return []
    }
  }

  /**
   * Estimate cost for menu extraction
   */
  static estimateCost(imageCount: number): { estimatedCost: number; currency: string } {
    const costPerImage = 0.01
    return {
      estimatedCost: imageCount * costPerImage,
      currency: 'USD',
    }
  }
}
