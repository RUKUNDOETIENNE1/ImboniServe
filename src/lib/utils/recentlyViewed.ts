/**
 * Recently Viewed Suppliers Utility
 * Tracks and manages recently viewed suppliers in localStorage
 */

interface RecentSupplier {
  id: string
  name: string
  city: string
  isVerified: boolean
  viewedAt: number
}

const STORAGE_KEY = 'recently_viewed_suppliers'
const MAX_RECENT = 5

export function addRecentlyViewed(supplier: Omit<RecentSupplier, 'viewedAt'>) {
  try {
    const recent = getRecentlyViewed()
    
    // Remove if already exists
    const filtered = recent.filter(s => s.id !== supplier.id)
    
    // Add to beginning with timestamp
    const updated = [
      { ...supplier, viewedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save recently viewed supplier:', error)
  }
}

export function getRecentlyViewed(): RecentSupplier[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const recent = JSON.parse(stored) as RecentSupplier[]
    
    // Filter out items older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    return recent.filter(s => s.viewedAt > thirtyDaysAgo)
  } catch (error) {
    console.error('Failed to load recently viewed suppliers:', error)
    return []
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear recently viewed suppliers:', error)
  }
}
