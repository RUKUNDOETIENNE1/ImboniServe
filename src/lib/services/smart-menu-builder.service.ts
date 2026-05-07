/**
 * Smart Menu Builder Service
 * OCR + AI parsing for image/PDF-to-menu conversion
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import OpenAI from 'openai'

const log = logger.child({ service: 'smart-menu-builder' })

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export class SmartMenuBuilderService {
  /**
   * Extract menu from image using GPT-4 Vision
   */
  static async extractMenuFromImage(imageUrl: string, businessId: string) {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    log.info('Extracting menu from image', { businessId, imageUrl })

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a menu extraction expert. Extract all menu items from the image with their names, descriptions, and prices. 
            Return a JSON array of items in this format:
            [
              {
                "name": "Item Name",
                "description": "Brief description",
                "price": 5000,
                "category": "Category Name"
              }
            ]
            
            Rules:
            - Extract prices in RWF (Rwandan Francs)
            - If price has decimals, convert to cents (multiply by 100)
            - Infer category from context (Appetizers, Main Course, Drinks, Desserts, etc.)
            - Keep descriptions concise (1-2 sentences)
            - If no description visible, leave empty string
            - Return ONLY valid JSON, no markdown or explanations`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content returned from OpenAI')
      }

      // Parse JSON response
      const items = JSON.parse(content)
      
      if (!Array.isArray(items)) {
        throw new Error('Invalid response format - expected array')
      }

      log.info('Menu extracted successfully', { businessId, itemCount: items.length })

      return {
        items,
        usage: response.usage,
        model: response.model
      }
    } catch (error) {
      log.error('Menu extraction failed', { error: String(error), businessId })
      throw error
    }
  }

  /**
   * Extract menu from PDF (convert to images first, then OCR)
   */
  static async extractMenuFromPDF(pdfUrl: string, businessId: string) {
    // Note: PDF extraction requires additional setup (pdf-parse or external service)
    // For now, return placeholder that guides user to convert PDF to images
    
    log.warn('PDF extraction not yet implemented', { businessId, pdfUrl })
    
    return {
      items: [],
      message: 'PDF extraction coming soon. Please convert PDF pages to images and upload them individually.',
      recommendation: 'Use a PDF-to-image converter, then upload each page as an image.'
    }
  }

  /**
   * Import extracted items to menu
   */
  static async importMenuItems(businessId: string, items: Array<{
    name: string
    description?: string
    price: number
    category?: string
  }>) {
    log.info('Importing menu items', { businessId, itemCount: items.length })

    const imported = []
    const errors = []

    for (const item of items) {
      try {
        // Validate item
        if (!item.name || !item.price) {
          errors.push({ item, error: 'Missing name or price' })
          continue
        }

        // Check if item already exists
        const existing = await prisma.menuItem.findFirst({
          where: {
            businessId,
            name: { equals: item.name, mode: 'insensitive' }
          }
        })

        if (existing) {
          errors.push({ item, error: 'Item already exists' })
          continue
        }

        // Create menu item
        const created = await prisma.menuItem.create({
          data: {
            businessId,
            name: item.name,
            description: item.description || '',
            priceCents: Math.round(item.price),
            costCents: 0, // Default cost, can be updated later
            category: item.category || 'Uncategorized',
            isAvailable: true
          }
        })

        imported.push(created)
      } catch (error) {
        errors.push({ item, error: String(error) })
      }
    }

    log.info('Menu import completed', { 
      businessId, 
      imported: imported.length, 
      errors: errors.length 
    })

    return {
      imported,
      errors,
      summary: {
        total: items.length,
        successful: imported.length,
        failed: errors.length
      }
    }
  }

  /**
   * Enhance menu item with AI-generated description
   */
  static async enhanceItemDescription(itemName: string, existingDescription?: string) {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a food menu copywriter. Write appetizing, concise descriptions (1-2 sentences) for menu items.'
          },
          {
            role: 'user',
            content: existingDescription 
              ? `Improve this menu item description:\nItem: ${itemName}\nCurrent: ${existingDescription}`
              : `Write a menu description for: ${itemName}`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
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
  static async categorizeBatch(items: Array<{ name: string; description?: string }>) {
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
            Return JSON array: [{"name": "Item Name", "category": "Category"}]`
          },
          {
            role: 'user',
            content: itemList
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      return JSON.parse(content)
    } catch (error) {
      log.error('Batch categorization failed', { error: String(error) })
      return []
    }
  }

  /**
   * Estimate cost for menu extraction
   */
  static estimateCost(imageCount: number): { estimatedCost: number; currency: string } {
    // GPT-4 Vision pricing: ~$0.01 per image
    const costPerImage = 0.01
    return {
      estimatedCost: imageCount * costPerImage,
      currency: 'USD'
    }
  }
}
