import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OutboxItem {
  id: string
  type: 'SALE' | 'PAYMENT' | 'SLIP' | 'INVENTORY' | 'CONSENT' | 'WAITER_CALL'
  payload: any
  createdAt: number
  retries: number
  lastError?: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}

interface OutboxDB extends DBSchema {
  outbox: {
    key: string
    value: OutboxItem
    indexes: { 'by-status': string; 'by-type': string }
  }
}

class OutboxService {
  private db: IDBPDatabase<OutboxDB> | null = null
  private syncInProgress = false

  async init() {
    if (this.db) return this.db

    this.db = await openDB<OutboxDB>('imboni-outbox', 1, {
      upgrade(db: IDBPDatabase<OutboxDB>) {
        const store = db.createObjectStore('outbox', { keyPath: 'id' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-type', 'type')
      },
    })

    // Register service worker sync (guard for environments without Background Sync or registration)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration: any) => {
          try {
            if (registration && registration.sync && typeof registration.sync.register === 'function') {
              registration.sync.register('sync-outbox').catch(() => {})
            }
          } catch {
            // Background Sync not supported or no registration; skip
          }
        })
        .catch(() => {})
    }

    // Listen for sync messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_OUTBOX') {
          this.syncAll()
        }
      })
    }

    return this.db
  }

  async add(type: OutboxItem['type'], payload: any): Promise<string> {
    await this.init()
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const item: OutboxItem = {
      id,
      type,
      payload,
      createdAt: Date.now(),
      retries: 0,
      status: 'pending',
    }

    await this.db!.put('outbox', item)
    
    // Trigger sync if online
    if (navigator.onLine) {
      this.syncAll()
    }

    return id
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress) return
    this.syncInProgress = true

    try {
      await this.init()
      const pending = await this.db!.getAllFromIndex('outbox', 'by-status', 'pending')
      const failed = await this.db!.getAllFromIndex('outbox', 'by-status', 'failed')
      const toSync = [...pending, ...failed].sort((a, b) => a.createdAt - b.createdAt)

      if (toSync.length === 0) return

      // Use batch sync for efficiency (max 100 items)
      const batchSize = 100
      for (let i = 0; i < toSync.length; i += batchSize) {
        const batch = toSync.slice(i, i + batchSize)
        await this.syncBatch(batch)
      }
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncItem(item: OutboxItem): Promise<void> {
    try {
      // Update status to syncing
      item.status = 'syncing'
      await this.db!.put('outbox', item)

      // Route to appropriate API endpoint
      let endpoint = ''
      let method = 'POST'

      switch (item.type) {
        case 'SALE':
          endpoint = '/api/sales'
          break
        case 'PAYMENT':
          endpoint = '/api/payments'
          break
        case 'SLIP':
          endpoint = '/api/smart-dining-slips'
          break
        case 'INVENTORY':
          endpoint = '/api/inventory/sync'
          break
        case 'CONSENT':
          endpoint = '/api/consent/sync'
          break
        case 'WAITER_CALL':
          endpoint = '/api/waiter-calls'
          break
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
      }

      // Mark as synced and remove from outbox
      await this.db!.delete('outbox', item.id)
    } catch (error) {
      // Mark as failed and increment retries
      item.status = 'failed'
      item.retries += 1
      item.lastError = error instanceof Error ? error.message : 'Unknown error'
      await this.db!.put('outbox', item)

      console.error(`Outbox sync failed for ${item.id}:`, error)
    }
  }

  async getPending(): Promise<OutboxItem[]> {
    await this.init()
    return this.db!.getAllFromIndex('outbox', 'by-status', 'pending')
  }

  async getAll(): Promise<OutboxItem[]> {
    await this.init()
    return this.db!.getAll('outbox')
  }

  async clear(): Promise<void> {
    await this.init()
    await this.db!.clear('outbox')
  }

  private async syncBatch(items: OutboxItem[]): Promise<void> {
    try {
      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            type: item.type,
            payload: item.payload,
            timestamp: item.createdAt,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`Batch sync failed: ${response.status}`)
      }

      const result = await response.json()

      // Remove successful items
      for (const id of result.success) {
        await this.db!.delete('outbox', id)
      }

      // Update failed items
      for (const failed of result.failed) {
        const item = items.find(i => i.id === failed.id)
        if (item) {
          item.status = 'failed'
          item.retries += 1
          item.lastError = failed.error
          await this.db!.put('outbox', item)
        }
      }
    } catch (error) {
      // Mark all items as failed
      for (const item of items) {
        item.status = 'failed'
        item.retries += 1
        item.lastError = error instanceof Error ? error.message : 'Batch sync failed'
        await this.db!.put('outbox', item)
      }
      console.error('Batch sync error:', error)
    }
  }
}

export const outboxService = new OutboxService()
