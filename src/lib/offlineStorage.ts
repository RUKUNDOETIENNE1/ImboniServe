/**
 * @deprecated This module is deprecated in favor of outbox.service.ts (IndexedDB-based).
 * Use outbox.service.ts for all new offline sync implementations.
 * This file is kept for backward compatibility only.
 */

export interface OfflineData {
  id: string
  type: 'SALE' | 'INVENTORY' | 'EXPENSE'
  data: any
  timestamp: string
  synced: boolean
  attempts: number
}

export class OfflineStorage {
  private static readonly PREFIX = 'imboni-offline-'
  private static readonly MAX_ATTEMPTS = 3

  static save(type: string, data: any): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const offlineData: OfflineData = {
      id,
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      attempts: 0
    }

    localStorage.setItem(`${this.PREFIX}${id}`, JSON.stringify(offlineData))
    
    // Also save to pending sync queue
    this.addToSyncQueue(id)
    
    return id
  }

  private static addToSyncQueue(id: string) {
    const queue = this.getSyncQueue()
    if (!queue.includes(id)) {
      queue.push(id)
      localStorage.setItem(`${this.PREFIX}queue`, JSON.stringify(queue))
    }
  }

  private static getSyncQueue(): string[] {
    const queueStr = localStorage.getItem(`${this.PREFIX}queue`)
    return queueStr ? JSON.parse(queueStr) : []
  }

  static getAllPending(): OfflineData[] {
    const pending: OfflineData[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.PREFIX) && !key.endsWith('queue')) {
        const item = localStorage.getItem(key)
        if (item) {
          const data: OfflineData = JSON.parse(item)
          if (!data.synced && data.attempts < this.MAX_ATTEMPTS) {
            pending.push(data)
          }
        }
      }
    }
    
    return pending.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  static markAsSynced(id: string) {
    const key = `${this.PREFIX}${id}`
    const item = localStorage.getItem(key)
    
    if (item) {
      const data: OfflineData = JSON.parse(item)
      data.synced = true
      localStorage.setItem(key, JSON.stringify(data))
      
      // Remove from sync queue
      this.removeFromSyncQueue(id)
    }
  }

  static incrementAttempts(id: string) {
    const key = `${this.PREFIX}${id}`
    const item = localStorage.getItem(key)
    
    if (item) {
      const data: OfflineData = JSON.parse(item)
      data.attempts += 1
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  private static removeFromSyncQueue(id: string) {
    const queue = this.getSyncQueue()
    const newQueue = queue.filter(itemId => itemId !== id)
    localStorage.setItem(`${this.PREFIX}queue`, JSON.stringify(newQueue))
  }

  static clearSynced() {
    const toDelete: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.PREFIX) && !key.endsWith('queue')) {
        const item = localStorage.getItem(key)
        if (item) {
          const data: OfflineData = JSON.parse(item)
          if (data.synced) {
            toDelete.push(key)
          } else if (data.attempts >= this.MAX_ATTEMPTS) {
            // Move failed items to failed storage
            this.moveToFailed(key, data)
            toDelete.push(key)
          }
        }
      }
    }
    
    toDelete.forEach(key => localStorage.removeItem(key))
  }

  private static moveToFailed(key: string, data: OfflineData) {
    const failedKey = key.replace(this.PREFIX, `${this.PREFIX}failed-`)
    localStorage.setItem(failedKey, JSON.stringify(data))
  }

  static isOnline(): boolean {
    return navigator.onLine
  }

  static onOnline(callback: () => void) {
    window.addEventListener('online', callback)
  }

  static onOffline(callback: () => void) {
    window.addEventListener('offline', callback)
  }
}

// Sync manager for automatic syncing when online
export class SyncManager {
  private static syncing = false
  private static readonly SYNC_INTERVAL = 30000 // 30 seconds

  static async start() {
    if (this.syncing) return
    
    this.syncing = true
    
    // Check immediately
    await this.syncIfOnline()
    
    // Set up interval
    setInterval(async () => {
      await this.syncIfOnline()
    }, this.SYNC_INTERVAL)
    
    // Listen for online events
    window.addEventListener('online', async () => {
      await this.syncIfOnline()
    })
  }

  static async syncIfOnline() {
    if (!OfflineStorage.isOnline()) return
    
    const pending = OfflineStorage.getAllPending()
    
    for (const item of pending) {
      try {
        // NOTE: /api/sync endpoint does not exist - this legacy code is deprecated
        // Use outbox.service.ts instead for offline sync
        console.warn('offlineStorage.ts is deprecated. Use outbox.service.ts instead.');
        
        // Mark as failed since this endpoint doesn't exist
        OfflineStorage.incrementAttempts(item.id)
      } catch (error) {
        console.error('Sync failed:', error)
        OfflineStorage.incrementAttempts(item.id)
      }
    }
    
    // Clean up synced items
    OfflineStorage.clearSynced()
  }
}