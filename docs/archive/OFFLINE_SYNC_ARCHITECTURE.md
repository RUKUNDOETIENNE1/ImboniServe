# Offline Sync Architecture - Imboni Serve

## Overview

Imboni Serve implements a robust offline-first architecture that allows users to continue working even without internet connectivity. Data is stored locally and automatically synced when the connection is restored.

## Architecture Components

### 1. Service Worker (`public/sw.js`)

**Purpose**: Intercepts network requests and serves cached content when offline.

**Key Features**:
- Caches critical app routes on install
- Network-first strategy for API calls
- Cache-first strategy for static assets
- Offline fallback page

**Cached Routes**:
```javascript
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/sales',
  '/dashboard/sales/new',
  '/dashboard/inventory',
  '/dashboard/reports',
  '/dashboard/transactions',
  '/dashboard/settings',
  '/offline.html',
]
```

**Cache Strategy**:
- **API Routes**: Network-first (no cache)
- **Static Assets**: Cache-first with runtime caching
- **Navigation**: Cache with offline fallback

### 2. Outbox Service (`src/lib/services/outbox.service.ts`)

**Purpose**: Queue failed requests for later sync using IndexedDB.

**Database Schema**:
```typescript
interface OutboxItem {
  id: string
  type: 'SALE' | 'PAYMENT' | 'SLIP' | 'INVENTORY' | 'CONSENT'
  payload: any
  createdAt: number
  retries: number
  lastError?: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
}
```

**Key Methods**:
- `add(type, payload)` - Queue an item for sync
- `syncAll()` - Sync all pending items
- `getPending()` - Get pending items count
- `clear()` - Clear synced items

**Sync Triggers**:
1. When app comes back online (`online` event)
2. Background sync API (when supported)
3. Manual sync via UI

### 3. Offline Indicator (`src/components/OfflineIndicator.tsx`)

**Purpose**: Visual feedback for offline status and sync progress.

**Features**:
- Shows offline/online status
- Displays pending sync count
- Shows sync progress
- Auto-hides when online with no pending items

**States**:
- **Online + No Pending**: Hidden
- **Online + Pending**: Blue badge with sync count
- **Offline**: Yellow badge with "Offline Mode"

### 4. Batch Sync API (`src/pages/api/sync/batch.ts`)

**Purpose**: Efficiently sync multiple offline items in a single request.

**Request Format**:
```typescript
POST /api/sync/batch
{
  items: [
    {
      id: "SALE-123",
      type: "SALE",
      payload: { ... },
      timestamp: 1234567890
    },
    ...
  ]
}
```

**Response Format**:
```typescript
{
  success: ["SALE-123", "SALE-124"],
  failed: [
    {
      id: "SALE-125",
      error: "Validation failed"
    }
  ]
}
```

**Limits**:
- Maximum 100 items per batch
- Items processed sequentially
- Failed items returned with error details

## Data Flow

### Online Flow

```
User Action → API Request → Database → Response → UI Update
```

### Offline Flow

```
User Action → Outbox Queue (IndexedDB) → UI Update (optimistic)
                    ↓
          [Connection Restored]
                    ↓
          Outbox Sync → API Request → Database
                    ↓
          Success: Remove from queue
          Failure: Increment retries, keep in queue
```

## Sync Strategies

### 1. Optimistic UI Updates

When offline, the UI updates immediately assuming the operation will succeed:

```typescript
// Add sale to local state
setSales([...sales, newSale])

// Queue for sync
await outboxService.add('SALE', newSale)
```

### 2. Retry Logic

Failed sync attempts are retried with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: After 30 seconds
- **Attempt 3**: After 2 minutes
- **Attempt 4+**: Mark as failed, require manual intervention

### 3. Conflict Resolution

**Strategy**: Last-write-wins (LWW)

- Server timestamp is authoritative
- Client timestamps used for ordering
- No automatic merge of conflicting changes
- User notified of conflicts for manual resolution

## Storage Limits

### IndexedDB (Outbox)
- **Chrome**: ~60% of available disk space
- **Firefox**: ~50% of available disk space
- **Safari**: 1GB limit
- **Recommendation**: Monitor usage, warn at 80% capacity

### Service Worker Cache
- **Chrome**: ~6% of available disk space
- **Firefox**: ~10% of available disk space
- **Safari**: 50MB limit
- **Recommendation**: Cache only critical routes

## Error Handling

### Network Errors

```typescript
try {
  await fetch('/api/sales', { ... })
} catch (error) {
  // Queue for later sync
  await outboxService.add('SALE', data)
  
  // Show user feedback
  toast.info('Saved offline. Will sync when online.')
}
```

### Validation Errors

```typescript
// Validation errors are NOT queued
if (response.status === 400) {
  toast.error('Invalid data. Please check and try again.')
  return
}

// Network errors ARE queued
if (!response.ok) {
  await outboxService.add('SALE', data)
}
```

### Quota Errors

```typescript
try {
  await db.put('outbox', item)
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old synced items
    await outboxService.clear()
    
    // Retry
    await db.put('outbox', item)
  }
}
```

## Security Considerations

### 1. Data Encryption

**Current**: Data stored in plain text in IndexedDB

**Recommendation**: Encrypt sensitive data before storing:
```typescript
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
)
```

### 2. Authentication

- Sync requests require valid session
- Expired sessions trigger re-authentication
- Tokens refreshed automatically

### 3. Data Validation

- All synced data validated server-side
- Client-side validation for UX only
- Malformed data rejected with clear errors

## Monitoring & Debugging

### Metrics to Track

1. **Sync Success Rate**: `successful_syncs / total_sync_attempts`
2. **Average Sync Time**: Time from queue to successful sync
3. **Pending Items**: Number of items waiting to sync
4. **Failed Items**: Items that exceeded retry limit
5. **Storage Usage**: IndexedDB and Cache storage used

### Debug Tools

**Chrome DevTools**:
- Application → IndexedDB → `imboni-outbox`
- Application → Cache Storage → `imboni-serve-v1`
- Network → Offline checkbox

**Console Commands**:
```javascript
// View pending items
const { outboxService } = await import('./lib/services/outbox.service')
const pending = await outboxService.getPending()
console.log(pending)

// Force sync
await outboxService.syncAll()

// Clear all
await outboxService.clear()
```

## Best Practices

### 1. Progressive Enhancement

- App works without JavaScript (basic HTML forms)
- Enhanced with offline capabilities when supported
- Graceful degradation for older browsers

### 2. User Communication

- Clear offline indicator
- Pending sync count visible
- Success/failure notifications
- Manual sync option available

### 3. Testing

- Test with DevTools offline mode
- Test with slow 3G network
- Test with intermittent connectivity
- Test quota exceeded scenarios

### 4. Performance

- Batch sync requests when possible
- Limit cache size to critical routes
- Clean up old data regularly
- Use compression for large payloads

## Future Enhancements

### Phase 1 (Current)
- ✅ Service worker caching
- ✅ IndexedDB outbox
- ✅ Batch sync API
- ✅ Offline indicator

### Phase 2 (Planned)
- [ ] Background Sync API integration
- [ ] Periodic Background Sync
- [ ] Push notifications for sync status
- [ ] Conflict resolution UI

### Phase 3 (Future)
- [ ] Differential sync (only changed data)
- [ ] Compression for large payloads
- [ ] Encrypted local storage
- [ ] Multi-device sync coordination

## Troubleshooting

### Issue: Items not syncing

**Check**:
1. Network connectivity restored?
2. Session still valid?
3. Items in outbox? (`outboxService.getPending()`)
4. Check browser console for errors

### Issue: Quota exceeded

**Solution**:
1. Clear synced items: `outboxService.clear()`
2. Reduce cache size in service worker
3. Increase cleanup frequency

### Issue: Stale data after sync

**Solution**:
1. Invalidate cache after sync
2. Refresh UI with server data
3. Use versioning for cache keys

---

**Last Updated**: February 10, 2026  
**Version**: 2.0.0  
**Maintainer**: Imboni Serve Team
