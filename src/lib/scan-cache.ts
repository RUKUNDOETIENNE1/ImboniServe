/**
 * Response Caching System for Business Scans
 * 
 * Caches scan results based on menu hash to avoid redundant AI calls
 * when menu hasn't changed significantly.
 */

import { createHash } from 'crypto';

interface CachedScan {
  menuHash: string;
  result: any;
  cachedAt: Date;
  expiresAt: Date;
}

const CACHE_DURATION_HOURS = 24; // Cache valid for 24 hours
const cache = new Map<string, CachedScan>();

/**
 * Generates a hash from menu data to detect changes
 * @param menuData - Object containing menu metrics
 * @returns MD5 hash string
 */
export function generateMenuHash(menuData: {
  total_items: number;
  categories_count: number;
  items_with_images: number;
  items_without_images: number;
  items_with_descriptions: number;
  items_without_descriptions: number;
}): string {
  const dataString = JSON.stringify(menuData);
  return createHash('md5').update(dataString).digest('hex');
}

/**
 * Checks if a cached scan exists and is still valid
 * @param menuHash - Hash of current menu data
 * @returns Cached result or null if not found/expired
 */
export function getCachedScan(menuHash: string): any | null {
  const cached = cache.get(menuHash);
  
  if (!cached) {
    return null;
  }
  
  const now = new Date();
  if (now > cached.expiresAt) {
    // Cache expired, remove it
    cache.delete(menuHash);
    return null;
  }
  
  return cached.result;
}

/**
 * Stores a scan result in cache
 * @param menuHash - Hash of menu data
 * @param result - Scan result to cache
 */
export function setCachedScan(menuHash: string, result: any): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000);
  
  cache.set(menuHash, {
    menuHash,
    result,
    cachedAt: now,
    expiresAt,
  });
}

/**
 * Clears all cached scans (useful for testing or cleanup)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Gets cache statistics for monitoring
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ menuHash: string; cachedAt: Date; expiresAt: Date }>;
} {
  const entries = Array.from(cache.values()).map(entry => ({
    menuHash: entry.menuHash,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
  }));
  
  return {
    size: cache.size,
    entries,
  };
}

/**
 * Cleanup expired cache entries (run periodically)
 */
export function cleanupExpiredCache(): number {
  const now = new Date();
  let removed = 0;
  
  for (const [hash, cached] of cache.entries()) {
    if (now > cached.expiresAt) {
      cache.delete(hash);
      removed++;
    }
  }
  
  return removed;
}
