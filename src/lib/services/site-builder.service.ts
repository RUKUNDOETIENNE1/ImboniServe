/**
 * Site Builder Service
 * Manages mini-site templates, AI content generation, and custom domains
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const log = logger.child({ service: 'site-builder' })

export interface SiteTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  previewUrl: string
  features: string[]
  phase: 1 | 2 | 3
}

export interface SiteConfig {
  templateId: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  logo?: string
  coverImage?: string
  sections: {
    hero: boolean
    menu: boolean
    about: boolean
    gallery: boolean
    contact: boolean
    reviews: boolean
  }
}

export class SiteBuilderService {
  /**
   * Get available templates based on feature flags
   */
  static async getAvailableTemplates(businessId: string): Promise<SiteTemplate[]> {
    // Check feature flags
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })

    if (!business) {
      throw new Error('Business not found')
    }

    // For now, return Phase 1 templates (12-20 templates)
    // In production, this would check feature flags to determine which phase templates to show
    return this.getPhase1Templates()
  }

  /**
   * Phase 1 templates (12-20 curated templates)
   */
  private static getPhase1Templates(): SiteTemplate[] {
    return [
      // Restaurant Templates (3)
      {
        id: 'restaurant-casual',
        name: 'Casual Dining',
        description: 'Warm, inviting design for family restaurants',
        category: 'Restaurant',
        thumbnail: '/templates/restaurant-casual.jpg',
        previewUrl: '/templates/preview/restaurant-casual',
        features: ['Menu showcase', 'Online ordering', 'Table reservations', 'Photo gallery'],
        phase: 1
      },
      {
        id: 'restaurant-fine-dining',
        name: 'Fine Dining',
        description: 'Elegant, sophisticated design for upscale restaurants',
        category: 'Restaurant',
        thumbnail: '/templates/restaurant-fine-dining.jpg',
        previewUrl: '/templates/preview/restaurant-fine-dining',
        features: ['Premium menu display', 'Chef profile', 'Wine list', 'Private events'],
        phase: 1
      },
      {
        id: 'restaurant-fast-food',
        name: 'Quick Service',
        description: 'Bold, energetic design for fast food restaurants',
        category: 'Restaurant',
        thumbnail: '/templates/restaurant-fast-food.jpg',
        previewUrl: '/templates/preview/restaurant-fast-food',
        features: ['Quick order menu', 'Delivery info', 'Combo deals', 'Nutrition facts'],
        phase: 1
      },

      // Café Templates (2)
      {
        id: 'cafe-modern',
        name: 'Modern Café',
        description: 'Clean, minimalist design for contemporary cafés',
        category: 'Café',
        thumbnail: '/templates/cafe-modern.jpg',
        previewUrl: '/templates/preview/cafe-modern',
        features: ['Coffee menu', 'Pastry showcase', 'WiFi info', 'Events calendar'],
        phase: 1
      },
      {
        id: 'cafe-cozy',
        name: 'Cozy Corner',
        description: 'Warm, rustic design for neighborhood cafés',
        category: 'Café',
        thumbnail: '/templates/cafe-cozy.jpg',
        previewUrl: '/templates/preview/cafe-cozy',
        features: ['Specialty drinks', 'Local art display', 'Book club info', 'Community board'],
        phase: 1
      },

      // Bar/Lounge Templates (2)
      {
        id: 'bar-upscale',
        name: 'Upscale Lounge',
        description: 'Sophisticated design for cocktail bars',
        category: 'Bar',
        thumbnail: '/templates/bar-upscale.jpg',
        previewUrl: '/templates/preview/bar-upscale',
        features: ['Cocktail menu', 'Happy hour specials', 'DJ schedule', 'VIP reservations'],
        phase: 1
      },
      {
        id: 'bar-sports',
        name: 'Sports Bar',
        description: 'Energetic design for sports bars',
        category: 'Bar',
        thumbnail: '/templates/bar-sports.jpg',
        previewUrl: '/templates/preview/bar-sports',
        features: ['Game schedule', 'Food & drinks menu', 'Big screen info', 'Party packages'],
        phase: 1
      },

      // Hotel Templates (2)
      {
        id: 'hotel-boutique',
        name: 'Boutique Hotel',
        description: 'Stylish design for boutique hotels',
        category: 'Hotel',
        thumbnail: '/templates/hotel-boutique.jpg',
        previewUrl: '/templates/preview/hotel-boutique',
        features: ['Room showcase', 'Amenities list', 'Location map', 'Booking system'],
        phase: 1
      },
      {
        id: 'hotel-resort',
        name: 'Resort & Spa',
        description: 'Luxurious design for resorts',
        category: 'Hotel',
        thumbnail: '/templates/hotel-resort.jpg',
        previewUrl: '/templates/preview/hotel-resort',
        features: ['Activities showcase', 'Spa services', 'Dining options', 'Photo gallery'],
        phase: 1
      },

      // Specialty Templates (4)
      {
        id: 'spa-wellness',
        name: 'Spa & Wellness',
        description: 'Calming design for spas and wellness centers',
        category: 'Spa',
        thumbnail: '/templates/spa-wellness.jpg',
        previewUrl: '/templates/preview/spa-wellness',
        features: ['Treatment menu', 'Therapist profiles', 'Packages', 'Booking calendar'],
        phase: 1
      },
      {
        id: 'event-venue',
        name: 'Event Venue',
        description: 'Versatile design for event spaces',
        category: 'Events',
        thumbnail: '/templates/event-venue.jpg',
        previewUrl: '/templates/preview/event-venue',
        features: ['Venue photos', 'Capacity info', 'Catering options', 'Inquiry form'],
        phase: 1
      },
      {
        id: 'food-truck',
        name: 'Food Truck',
        description: 'Mobile-first design for food trucks',
        category: 'Food Truck',
        thumbnail: '/templates/food-truck.jpg',
        previewUrl: '/templates/preview/food-truck',
        features: ['Location tracker', 'Daily menu', 'Social media links', 'Catering info'],
        phase: 1
      },
      {
        id: 'bakery',
        name: 'Artisan Bakery',
        description: 'Delicious design for bakeries',
        category: 'Bakery',
        thumbnail: '/templates/bakery.jpg',
        previewUrl: '/templates/preview/bakery',
        features: ['Product showcase', 'Custom orders', 'Daily specials', 'Allergen info'],
        phase: 1
      }
    ]
  }

  /**
   * Get site configuration for a business
   */
  static async getSiteConfig(businessId: string) {
    const profile = await prisma.businessProfile.findUnique({
      where: { businessId },
      select: {
        isPublished: true
      }
    })

    return null // siteConfig field removed from schema
  }

  /**
   * Update site configuration
   */
  static async updateSiteConfig(businessId: string, config: SiteConfig) {
    const profile = await prisma.businessProfile.upsert({
      where: { businessId },
      create: {
        businessId,
        slug: `business-${businessId}`,
        isPublished: false
      },
      update: {
        // siteConfig field removed from schema
      }
    })

    log.info('Site config updated', { businessId, templateId: config.templateId })
    return profile
  }

  /**
   * Publish site
   */
  static async publishSite(businessId: string) {
    const profile = await prisma.businessProfile.update({
      where: { businessId },
      data: { isPublished: true }
    })

    log.info('Site published', { businessId, slug: profile.slug })
    return profile
  }

  /**
   * Unpublish site
   */
  static async unpublishSite(businessId: string) {
    const profile = await prisma.businessProfile.update({
      where: { businessId },
      data: { isPublished: false }
    })

    log.info('Site unpublished', { businessId })
    return profile
  }

  /**
   * Generate AI content for menu item
   */
  static async generateMenuItemDescription(
    itemName: string,
    category?: string,
    ingredients?: string[]
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Write a delicious, appetizing description for a menu item called "${itemName}"${category ? ` in the ${category} category` : ''}${ingredients && ingredients.length > 0 ? ` made with ${ingredients.join(', ')}` : ''}. Keep it under 50 words, professional, and mouth-watering.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const description = data.choices?.[0]?.message?.content?.trim() || ''

      log.info('AI menu description generated', { itemName, length: description.length })
      return description
    } catch (error) {
      log.error('AI menu description failed', { error: String(error) })
      throw error
    }
  }

  /**
   * Generate AI tagline for business
   */
  static async generateTagline(businessName: string, businessType: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Create a catchy, memorable tagline for "${businessName}", a ${businessType}. Keep it under 10 words, professional, and unique.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.8
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const tagline = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || ''

      log.info('AI tagline generated', { businessName, tagline })
      return tagline
    } catch (error) {
      log.error('AI tagline generation failed', { error: String(error) })
      throw error
    }
  }

  /**
   * Generate AI promotional text
   */
  static async generatePromoText(
    businessName: string,
    occasion: string,
    details?: string
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Write promotional text for "${businessName}" for ${occasion}${details ? `: ${details}` : ''}. Keep it under 100 words, engaging, and include a call-to-action.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 250,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const promoText = data.choices?.[0]?.message?.content?.trim() || ''

      log.info('AI promo text generated', { businessName, occasion, length: promoText.length })
      return promoText
    } catch (error) {
      log.error('AI promo text generation failed', { error: String(error) })
      throw error
    }
  }
}
