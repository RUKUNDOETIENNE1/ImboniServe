/**
 * AI Dish Assistant API
 * Answers questions about menu items
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface AskRequest {
  question: string;
  menuItem: {
    name: string;
    description?: string | null;
    ingredients?: string[];
    allergens?: string[];
    spiceLevel?: string | null;
  };
}

// Simple in-memory cache for responses (session-based)
const responseCache = new Map<string, string>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, menuItem } = req.body as AskRequest;

    if (!question || !menuItem) {
      return res.status(400).json({ error: 'Question and menuItem are required' });
    }

    // Create cache key
    const cacheKey = `${menuItem.name}:${question.toLowerCase().trim()}`;
    
    // Check cache first
    if (responseCache.has(cacheKey)) {
      return res.status(200).json({ answer: responseCache.get(cacheKey) });
    }

    // Generate AI response (simplified rule-based for now)
    const answer = generateAnswer(question, menuItem);
    
    // Cache the response
    responseCache.set(cacheKey, answer);
    
    // Clear old cache entries (keep last 100)
    if (responseCache.size > 100) {
      const firstKey = responseCache.keys().next().value;
      if (firstKey) {
        responseCache.delete(firstKey);
      }
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in AI dish assistant:', error);
    return res.status(500).json({ error: 'Failed to generate answer' });
  }
}

function generateAnswer(question: string, menuItem: AskRequest['menuItem']): string {
  const q = question.toLowerCase();

  // Spice level questions
  if (q.includes('spicy') || q.includes('spice') || q.includes('hot')) {
    const spiceLevel = menuItem.spiceLevel || 'none';
    const spiceResponses: Record<string, string> = {
      none: `${menuItem.name} is not spicy at all. It's mild and suitable for those who prefer no heat.`,
      mild: `${menuItem.name} has a mild spice level. It has a gentle warmth but won't be too hot.`,
      medium: `${menuItem.name} is moderately spicy. It has a noticeable kick but is still enjoyable for most people.`,
      hot: `${menuItem.name} is quite spicy! It's recommended for those who enjoy bold, fiery flavors.`,
    };
    return spiceResponses[spiceLevel] || spiceResponses.none;
  }

  // Ingredient questions
  if (q.includes('ingredient') || q.includes('made of') || q.includes('contain')) {
    if (menuItem.ingredients && menuItem.ingredients.length > 0) {
      return `${menuItem.name} contains: ${menuItem.ingredients.join(', ')}. ${menuItem.description || ''}`;
    }
    return `${menuItem.name} ${menuItem.description || 'is a delicious dish'}. For detailed ingredients, please ask our staff.`;
  }

  // Allergen questions
  if (q.includes('allergen') || q.includes('allergy') || q.includes('allergic')) {
    if (menuItem.allergens && menuItem.allergens.length > 0) {
      return `⚠️ ${menuItem.name} contains these allergens: ${menuItem.allergens.join(', ')}. Please inform our staff if you have any allergies.`;
    }
    return `${menuItem.name} doesn't list specific allergens, but if you have allergies, please inform our staff to ensure your safety.`;
  }

  // Portion/size questions
  if (q.includes('portion') || q.includes('size') || q.includes('big') || q.includes('large') || q.includes('share')) {
    return `${menuItem.name} is designed as a single serving, but portion sizes can vary. If you're very hungry or want to share, consider ordering multiple items or asking our staff about portion sizes.`;
  }

  // Vegetarian/vegan questions
  if (q.includes('vegetarian') || q.includes('vegan') || q.includes('meat')) {
    if (menuItem.ingredients) {
      const hasMeat = menuItem.ingredients.some(i => 
        ['chicken', 'beef', 'pork', 'fish', 'meat'].some(m => i.toLowerCase().includes(m))
      );
      if (hasMeat) {
        return `${menuItem.name} contains meat or animal products. It's not suitable for vegetarians or vegans.`;
      }
      return `Based on the ingredients, ${menuItem.name} appears to be vegetarian-friendly, but please confirm with our staff to be certain.`;
    }
    return `Please ask our staff to confirm if ${menuItem.name} is suitable for vegetarian or vegan diets.`;
  }

  // Recommendation/taste questions
  if (q.includes('recommend') || q.includes('good') || q.includes('taste') || q.includes('flavor')) {
    return `${menuItem.name} is one of our menu items. ${menuItem.description || 'It\'s prepared fresh and many customers enjoy it.'}`;
  }

  // Default response
  return `${menuItem.name} ${menuItem.description || 'is available on our menu'}. ${
    menuItem.ingredients && menuItem.ingredients.length > 0
      ? `It contains: ${menuItem.ingredients.slice(0, 5).join(', ')}.`
      : 'For more details, please ask our staff.'
  }`;
}
