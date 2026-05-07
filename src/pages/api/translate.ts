import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Simple translation API
 * Uses basic dictionary for common food terms
 * Falls back to original text if no translation available
 * 
 * For production: integrate Google Translate API or similar
 */

const translations: Record<string, Record<string, string>> = {
  // Common food terms - English to French
  fr: {
    'Beef': 'Bœuf',
    'Chicken': 'Poulet',
    'Fish': 'Poisson',
    'Rice': 'Riz',
    'Beans': 'Haricots',
    'Vegetables': 'Légumes',
    'Salad': 'Salade',
    'Soup': 'Soupe',
    'Grilled': 'Grillé',
    'Fried': 'Frit',
    'Boiled': 'Bouilli',
    'Steamed': 'Vapeur',
    'Spicy': 'Épicé',
    'Mild': 'Doux',
    'Hot': 'Chaud',
    'Cold': 'Froid',
    'Breakfast': 'Petit-déjeuner',
    'Lunch': 'Déjeuner',
    'Dinner': 'Dîner',
    'Appetizer': 'Entrée',
    'Main Course': 'Plat principal',
    'Dessert': 'Dessert',
    'Drink': 'Boisson',
    'Beer': 'Bière',
    'Wine': 'Vin',
    'Juice': 'Jus',
    'Water': 'Eau',
    'Coffee': 'Café',
    'Tea': 'Thé',
    'Burger': 'Hamburger',
    'Pizza': 'Pizza',
    'Pasta': 'Pâtes',
    'Sandwich': 'Sandwich',
    'Brochette': 'Brochette',
    'Steak': 'Steak',
    'Chips': 'Frites',
    'Sauce': 'Sauce'
  },
  // Common food terms - English to Kinyarwanda
  rw: {
    'Beef': 'Inyama y\'inka',
    'Chicken': 'Inkoko',
    'Fish': 'Ifi',
    'Rice': 'Umuceri',
    'Beans': 'Ibishyimbo',
    'Vegetables': 'Imboga',
    'Salad': 'Saladi',
    'Soup': 'Isupure',
    'Grilled': 'Yakozwe ku muriro',
    'Fried': 'Yakanije',
    'Boiled': 'Yatewe',
    'Steamed': 'Yakozwe ku mwuka',
    'Spicy': 'Birakaze',
    'Mild': 'Biroroshye',
    'Hot': 'Bishyushye',
    'Cold': 'Bikonje',
    'Breakfast': 'Ifunguro rya mu gitondo',
    'Lunch': 'Ifunguro rya mu manywa',
    'Dinner': 'Ifunguro rya nimugoroba',
    'Appetizer': 'Igitangiriro',
    'Main Course': 'Ifunguro nyamukuru',
    'Dessert': 'Ibyokurya byiza',
    'Drink': 'Ikinyobwa',
    'Beer': 'Inzoga',
    'Wine': 'Divayi',
    'Juice': 'Umutobe',
    'Water': 'Amazi',
    'Coffee': 'Ikawa',
    'Tea': 'Icyayi',
    'Burger': 'Burger',
    'Pizza': 'Pizza',
    'Pasta': 'Pasta',
    'Sandwich': 'Sandwich',
    'Brochette': 'Brochette',
    'Steak': 'Steak',
    'Chips': 'Chips',
    'Sauce': 'Isosi'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, targetLang } = req.body

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang required' })
  }

  // If target language is English or not supported, return original
  if (targetLang === 'en' || !['fr', 'rw'].includes(targetLang)) {
    return res.status(200).json({ translated: text })
  }

  try {
    // Simple word-by-word translation using dictionary
    const words = text.split(' ')
    const translatedWords = words.map((word: string) => {
      // Check if word exists in dictionary (case-insensitive)
      const dictEntry = Object.keys(translations[targetLang]).find(
        key => key.toLowerCase() === word.toLowerCase()
      )
      
      if (dictEntry) {
        return translations[targetLang][dictEntry]
      }
      
      // Return original word if no translation found
      return word
    })

    const translated = translatedWords.join(' ')

    return res.status(200).json({ translated })
  } catch (error: any) {
    console.error('Translation error:', error)
    // Fallback to original text on error
    return res.status(200).json({ translated: text })
  }
}
