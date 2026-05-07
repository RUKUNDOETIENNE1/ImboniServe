/**
 * Offline Menu Caching Utility
 * Caches menu data in localStorage for offline access
 */

interface CachedMenu {
  branchId: string;
  branchName: string;
  menu: any[];
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY_PREFIX = 'imboni_menu_cache_';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function cacheMenu(branchId: string, branchName: string, menu: any[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedMenu = {
      branchId,
      branchName,
      menu,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };

    localStorage.setItem(`${CACHE_KEY_PREFIX}${branchId}`, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache menu:', error);
  }
}

export function getCachedMenu(branchId: string): CachedMenu | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${branchId}`);
    if (!cached) return null;

    const parsed: CachedMenu = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${branchId}`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to retrieve cached menu:', error);
    return null;
  }
}

export function clearMenuCache(branchId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    if (branchId) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${branchId}`);
    } else {
      // Clear all menu caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Failed to clear menu cache:', error);
  }
}

/**
 * Retry failed fetch with exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
