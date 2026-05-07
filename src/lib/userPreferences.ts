/**
 * User Preferences System
 * Manages dietary preferences and allergies in localStorage
 */

export interface UserPreferences {
  allergies: string[];
  dietaryPreferences: string[];
  hideUnsafeItems: boolean;
  language: 'en' | 'rw' | 'fr';
}

const STORAGE_KEY = 'imboni_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  dietaryPreferences: [],
  hideUnsafeItems: false,
  language: 'en',
};

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

export function clearUserPreferences(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user preferences:', error);
  }
}

// Common allergens list
export const COMMON_ALLERGENS = [
  'nuts',
  'peanuts',
  'dairy',
  'eggs',
  'soy',
  'wheat',
  'gluten',
  'shellfish',
  'fish',
  'sesame',
];

// Common dietary preferences
export const DIETARY_PREFERENCES = [
  'vegan',
  'vegetarian',
  'halal',
  'kosher',
  'gluten-free',
  'dairy-free',
  'low-carb',
  'keto',
];

/**
 * Check if a menu item is safe for user's preferences
 */
export function isMenuItemSafe(
  menuItem: {
    allergens?: string[];
    dietaryTags?: string[];
  },
  preferences: UserPreferences
): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check allergens
  if (menuItem.allergens && preferences.allergies.length > 0) {
    const foundAllergens = menuItem.allergens.filter(allergen =>
      preferences.allergies.some(userAllergen =>
        allergen.toLowerCase().includes(userAllergen.toLowerCase())
      )
    );
    
    if (foundAllergens.length > 0) {
      warnings.push(`Contains: ${foundAllergens.join(', ')}`);
    }
  }
  
  // Check dietary compatibility
  if (menuItem.dietaryTags && preferences.dietaryPreferences.length > 0) {
    const isCompatible = preferences.dietaryPreferences.every(pref => {
      const prefLower = pref.toLowerCase();
      return menuItem.dietaryTags?.some(tag => 
        tag.toLowerCase().includes(prefLower)
      );
    });
    
    if (!isCompatible) {
      warnings.push('May not match your dietary preferences');
    }
  }
  
  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Detect user's preferred language from browser
 */
export function detectUserLanguage(): 'en' | 'rw' | 'fr' {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('rw')) return 'rw';
  if (browserLang.startsWith('fr')) return 'fr';
  return 'en';
}
