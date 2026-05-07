/**
 * Smart Recommendations API
 * Suggests menu items based on user preferences and safety
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface RecommendationRequest {
  branchId: string;
  excludeItemId?: string;
  userPreferences?: {
    allergies: string[];
    dietaryPreferences: string[];
  };
  limit?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, excludeItemId, userPreferences, limit = 3 } = req.body as RecommendationRequest;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
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

    // Filter and score items based on user preferences
    const scoredItems = menuItems.map(item => {
      let score = 0;
      let isSafe = true;

      // Check allergens (highest priority - negative score if unsafe)
      if (userPreferences?.allergies && userPreferences.allergies.length > 0) {
        const hasAllergen = item.allergens.some(allergen =>
          userPreferences.allergies.some(userAllergen =>
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
      if (userPreferences?.dietaryPreferences && userPreferences.dietaryPreferences.length > 0) {
        const matchingTags = item.dietaryTags.filter(tag =>
          userPreferences.dietaryPreferences.some(pref =>
            tag.toLowerCase().includes(pref.toLowerCase())
          )
        );
        
        score += matchingTags.length * 30; // Reward dietary matches
        
        // If user has dietary preferences but item has no tags, slight penalty
        if (item.dietaryTags.length === 0) {
          score -= 10;
        }
      }

      // Prefer items with more information (better for transparency)
      if (item.ingredients.length > 0) score += 5;
      if (item.description) score += 5;
      if (item.imageReal) score += 10;
      if (item.prepTimeMinutes) score += 5;

      // Slight preference for mild spice levels if no preference specified
      if (!userPreferences || userPreferences.allergies.length === 0) {
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
    
    if (userPreferences && (userPreferences.allergies.length > 0 || userPreferences.dietaryPreferences.length > 0)) {
      // Prioritize safe items
      recommendations = scoredItems.filter(item => item.isSafe);
    }
    
    recommendations.sort((a, b) => b.score - a.score);

    // Return top N recommendations
    const topRecommendations = recommendations.slice(0, limit).map(({ score, isSafe, ...item }) => item);

    return res.status(200).json({ recommendations: topRecommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}
