/**
 * Smart Recommendations API
 * Suggests menu items based on user preferences, safety, and guest history.
 * When customerPhone is provided, recommendations are personalized using
 * GuestRecognitionService intelligence (favorites, preferred categories).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requiresFeature } from '@/lib/middleware/withFeatureCheck';
import { GuestRecognitionService } from '@/lib/services/guest-recognition.service';

interface RecommendationRequest {
  branchId: string;
  excludeItemId?: string;
  userPreferences?: {
    allergies: string[];
    dietaryPreferences: string[];
  };
  customerPhone?: string;
  limit?: number;
}

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, excludeItemId, userPreferences, customerPhone, limit = 3 } = req.body as RecommendationRequest;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Fetch guest intelligence if phone provided (for personalization)
    let guestIntel: Awaited<ReturnType<typeof GuestRecognitionService.recognize>>['intelligence'] = null
    if (customerPhone) {
      try {
        const result = await GuestRecognitionService.recognize(customerPhone, branchId)
        guestIntel = result.intelligence
      } catch {
        // Recognition failure should not block recommendations
      }
    }

    // Fetch all available menu items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessId: branchId,
        isAvailable: true,
        ...(excludeItemId && { id: { not: excludeItemId } }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        category: true,
        ingredients: true,
        allergens: true,
        dietaryTags: true,
        spiceLevel: true,
        portionSize: true,
        prepTimeMinutes: true,
        imageReal: true,
      },
    });

    if (!menuItems.length) {
      return res.status(200).json({ recommendations: [] });
    }

    // Build lookup sets from guest intelligence
    const favoriteItemIds = new Set(guestIntel?.recommendationContext.favoriteItemIds || [])
    const preferredCategories = new Set(guestIntel?.recommendationContext.preferredCategoryNames || [])
    const guestAllergies = guestIntel?.recommendationContext.allergies || []
    const guestDietaryPrefs = guestIntel?.recommendationContext.dietaryPreferences || []

    // Merge guest allergies/dietary prefs with request-level preferences
    const effectiveAllergies = [...new Set([...(userPreferences?.allergies || []), ...guestAllergies])]
    const effectiveDietaryPrefs = [...new Set([...(userPreferences?.dietaryPreferences || []), ...guestDietaryPrefs])]

    // Filter and score items based on user preferences + guest history
    const scoredItems = menuItems.map(item => {
      let score = 0;
      let isSafe = true;

      // Check allergens (highest priority - negative score if unsafe)
      if (effectiveAllergies.length > 0) {
        const hasAllergen = item.allergens.some(allergen =>
          effectiveAllergies.some(userAllergen =>
            allergen.toLowerCase().includes(userAllergen.toLowerCase())
          )
        );
        
        if (hasAllergen) {
          isSafe = false;
          score -= 1000; // Heavily penalize items with allergens
        } else {
          score += 50; // Reward safe items
        }
      }

      // Check dietary preferences (positive score for matches)
      if (effectiveDietaryPrefs.length > 0) {
        const matchingTags = item.dietaryTags.filter(tag =>
          effectiveDietaryPrefs.some(pref =>
            tag.toLowerCase().includes(pref.toLowerCase())
          )
        );
        
        score += matchingTags.length * 30; // Reward dietary matches
        
        // If user has dietary preferences but item has no tags, slight penalty
        if (item.dietaryTags.length === 0) {
          score -= 10;
        }
      }

      // Guest intelligence: favorite items boost
      if (favoriteItemIds.has(item.id)) {
        score += 100 // Strong boost for previously ordered items
      }

      // Guest intelligence: preferred category boost
      if (preferredCategories.has(item.category || '')) {
        score += 40 // Moderate boost for preferred categories
      }

      // Guest intelligence: price proximity to avg order value
      if (guestIntel && guestIntel.recommendationContext.avgOrderValueCents > 0) {
        const avgValue = guestIntel.recommendationContext.avgOrderValueCents
        const priceDiff = Math.abs(item.priceCents - avgValue)
        if (priceDiff < avgValue * 0.3) {
          score += 15 // Items near typical spending range
        }
      }

      // Prefer items with more information (better for transparency)
      if (item.ingredients.length > 0) score += 5;
      if (item.description) score += 5;
      if (item.imageReal) score += 10;
      if (item.prepTimeMinutes) score += 5;

      // Slight preference for mild spice levels if no preference specified
      if (effectiveAllergies.length === 0) {
        if (item.spiceLevel === 'none' || item.spiceLevel === 'mild') {
          score += 5;
        }
      }

      return {
        ...item,
        score,
        isSafe,
      };
    });

    // Sort by score (highest first) and filter to safe items if preferences exist
    let recommendations = scoredItems;
    
    if (effectiveAllergies.length > 0 || effectiveDietaryPrefs.length > 0) {
      // Prioritize safe items
      recommendations = scoredItems.filter(item => item.isSafe);
    }
    
    recommendations.sort((a, b) => b.score - a.score);

    // Return top N recommendations
    const topRecommendations = recommendations.slice(0, limit).map(({ score, isSafe, ...item }) => item);

    return res.status(200).json({ 
      recommendations: topRecommendations,
      personalized: !!guestIntel,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}

// Apply commercial enforcement: AI Menu Recommendations requires Professional plan or higher
export default requiresFeature('hasAIMenuAssistant')(baseHandler)
