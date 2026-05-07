# ImboniServe QR & Seat System - Detailed Technical Specification

**Date:** May 4, 2026  
**Status:** 🔴 CRITICAL REVIEW - PRODUCTION-GRADE REQUIREMENTS  
**Risk Level:** 🔴 **HIGH** (Corrected from initial LOW assessment)

---

## ⚠️ RISK LEVEL CORRECTION

### Initial Assessment: 🟢 LOW - **INCORRECT**

### Corrected Assessment: 🔴 **HIGH RISK**

**Why This Is High Risk:**

1. **Race Conditions = Data Corruption**
   - Two users selecting same seat → double booking
   - Wrong seat assignment → wrong order delivery
   - Financial impact: refunds, customer complaints, reputation damage

2. **Concurrency Challenges**
   - Multiple devices/tabs per user
   - Network latency variations
   - Database transaction isolation levels
   - Lock expiration edge cases

3. **Session Management Complexity**
   - Browser refresh scenarios
   - Device switching mid-session
   - Network disconnections
   - Stale lock cleanup

4. **Production Impact**
   - This is customer-facing, real-time ordering
   - Mistakes = wrong food to wrong seat
   - No room for "it works most of the time"

**Risk Mitigation Strategy:**
- Pessimistic locking with database transactions
- Idempotent operations
- Comprehensive error handling
- Extensive edge case testing
- Rollback mechanisms

---

## 1️⃣ DATABASE DESIGN (SCALABLE ARCHITECTURE)

### ❌ REJECTED: Quick Patch Approach
```prisma
// BAD: Just adding fields to Seat model
model Seat {
  state String?  // ← Not scalable, no audit trail
  lockedBy String?  // ← No relationship integrity
}
```

### ✅ APPROVED: Production-Grade Structure

#### Option A: Separate SeatSession Table (RECOMMENDED)

**Rationale:**
- Clear separation of concerns
- Full audit trail
- Historical tracking
- Better query performance
- Easier to add features (split billing, seat transfers)

```prisma
// Core seat definition (static)
model Seat {
  id         String   @id @default(cuid())
  tableId    String
  seatNumber Int
  seatLabel  String?
  qrCode     String?  @unique
  position   Json?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  table         Table          @relation(fields: [tableId], references: [id], onDelete: Cascade)
  seatSessions  SeatSession[]  // ← Historical sessions
  sales         Sale[]         @relation("SeatSales")
  tips          StaffTip[]     @relation("SeatTips")
  
  @@unique([tableId, seatNumber])
  @@index([tableId])
  @@index([isActive])
}

// Dynamic seat state (session-based)
model SeatSession {
  id                String    @id @default(cuid())
  seatId            String
  tableSessionId    String?   // Link to TableSession
  participantId     String?   // Link to SessionParticipant
  
  // State management
  state             String    @default("locked")  // "locked" | "occupied" | "released"
  
  // Lock tracking
  lockedAt          DateTime  @default(now())
  lockExpiresAt     DateTime  // Calculated: lockedAt + 10 minutes
  lockedByTempId    String    // Browser fingerprint or temp ID
  lockedByDevice    String?   // Device identifier for multi-device handling
  
  // Occupation tracking
  occupiedAt        DateTime?
  releasedAt        DateTime?
  
  // Session persistence
  sessionToken      String    @unique  // For refresh/reconnect
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  seat              Seat                 @relation(fields: [seatId], references: [id], onDelete: Cascade)
  tableSession      TableSession?        @relation(fields: [tableSessionId], references: [id])
  participant       SessionParticipant?  @relation(fields: [participantId], references: [id])
  
  @@index([seatId, state])
  @@index([lockExpiresAt])  // For cleanup queries
  @@index([sessionToken])
  @@index([lockedByTempId])
  @@unique([seatId, state], where: { state: { in: ["locked", "occupied"] } })  // Prevent duplicates
}

// Update SessionParticipant
model SessionParticipant {
  id            String   @id @default(cuid())
  sessionId     String
  tempId        String
  name          String
  createdAt     DateTime @default(now())
  
  seatSessionId String?  @unique  // ← One participant = one seat session
  seatSession   SeatSession?  @relation(fields: [seatSessionId], references: [id])
  
  session       TableSession  @relation(fields: [sessionId], references: [id])
  
  @@unique([sessionId, tempId])
}
```

**Benefits:**
- ✅ Full audit trail (who locked when, how long)
- ✅ Historical data (analytics, debugging)
- ✅ Clean state transitions (locked → occupied → released)
- ✅ Session token for refresh/reconnect
- ✅ Device tracking for multi-device scenarios
- ✅ Unique constraint prevents double-booking at DB level

**Migration Impact:**
- New table: `SeatSession`
- Add field to `SessionParticipant`: `seatSessionId`
- No changes to existing `Seat` table (non-breaking)

---

#### Option B: Enhanced Seat Model (Simpler, Less Scalable)

```prisma
model Seat {
  // ...existing fields
  
  // Current session state
  currentState      String    @default("available")  // "available" | "locked" | "occupied"
  currentSessionId  String?   @unique  // Active SeatSession ID
  
  seatSessions      SeatSession[]  // Historical sessions
}

model SeatSession {
  id                String    @id @default(cuid())
  seatId            String
  state             String    @default("locked")
  lockedAt          DateTime  @default(now())
  lockExpiresAt     DateTime
  lockedByTempId    String
  sessionToken      String    @unique
  participantId     String?   @unique
  
  seat              Seat                 @relation(fields: [seatId], references: [id])
  participant       SessionParticipant?  @relation(fields: [participantId], references: [id])
  
  @@index([seatId, state])
  @@index([lockExpiresAt])
}
```

**Trade-offs:**
- ✅ Simpler queries (current state on Seat)
- ❌ Denormalization (state in two places)
- ❌ Harder to maintain consistency
- ⚠️ Not recommended for production

---

### 🎯 RECOMMENDED: Option A (SeatSession Table)

**Reasoning:**
1. Proper normalization
2. Clear state machine
3. Audit trail included
4. Easier to debug production issues
5. Supports future features (seat transfers, split billing)

---

## 2️⃣ SEAT LOCKING LOGIC (DETAILED STATE MACHINE)

### State Transitions

```
[available] 
    ↓ (user selects seat)
[locked] (10 min timer)
    ↓ (user places order)
[occupied] (until checkout)
    ↓ (user leaves/pays)
[released]
    ↓ (cleanup)
[available]

Edge cases:
[locked] → (10 min expires) → [available]
[locked] → (user closes tab) → [available] (after expiry)
[locked] → (user refreshes) → [locked] (session token preserved)
```

### Detailed Lock Flow

#### Step 1: User Selects Seat

**Trigger:** User clicks seat in selection UI

**Backend Logic:**
```typescript
// POST /api/seats/{seatId}/lock
async function lockSeat(seatId: string, tempId: string, deviceId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if seat has active session
    const activeSeatSession = await tx.seatSession.findFirst({
      where: {
        seatId,
        state: { in: ['locked', 'occupied'] },
        lockExpiresAt: { gt: new Date() }  // Not expired
      }
    })
    
    if (activeSeatSession) {
      // Check if it's the same user (refresh scenario)
      if (activeSeatSession.lockedByTempId === tempId) {
        // Extend lock
        return await tx.seatSession.update({
          where: { id: activeSeatSession.id },
          data: {
            lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),  // +10 min
            updatedAt: new Date()
          }
        })
      }
      
      // Different user - conflict
      throw new ConflictError('This seat is already in use. Please choose another.')
    }
    
    // 2. Clean up expired locks for this seat (lazy cleanup)
    await tx.seatSession.updateMany({
      where: {
        seatId,
        state: 'locked',
        lockExpiresAt: { lt: new Date() }
      },
      data: {
        state: 'released',
        releasedAt: new Date()
      }
    })
    
    // 3. Create new seat session
    const sessionToken = generateSecureToken()  // Crypto-random token
    const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000)  // 10 minutes
    
    const seatSession = await tx.seatSession.create({
      data: {
        seatId,
        state: 'locked',
        lockedAt: new Date(),
        lockExpiresAt,
        lockedByTempId: tempId,
        lockedByDevice: deviceId,
        sessionToken
      }
    })
    
    return { seatSession, sessionToken }
  }, {
    isolationLevel: 'Serializable',  // ← CRITICAL: Prevents race conditions
    timeout: 5000  // 5 second timeout
  })
}
```

**Key Points:**
- ✅ Atomic transaction (all-or-nothing)
- ✅ Serializable isolation (strictest level)
- ✅ Lazy cleanup of expired locks
- ✅ Same-user detection (refresh handling)
- ✅ Session token for persistence
- ✅ Device tracking

---

#### Step 2: Lock Expiry

**Triggers:**
1. 10 minutes pass without order
2. User closes tab/browser
3. Network disconnect

**Cleanup Strategy: Hybrid (Lazy + Scheduled)**

**Lazy Cleanup (On-Demand):**
```typescript
// Runs on every seat availability check
async function getAvailableSeats(tableId: string) {
  // 1. Mark expired locks as released
  await prisma.seatSession.updateMany({
    where: {
      seat: { tableId },
      state: 'locked',
      lockExpiresAt: { lt: new Date() }
    },
    data: {
      state: 'released',
      releasedAt: new Date()
    }
  })
  
  // 2. Fetch available seats
  return await prisma.seat.findMany({
    where: {
      tableId,
      isActive: true,
      seatSessions: {
        none: {
          state: { in: ['locked', 'occupied'] },
          lockExpiresAt: { gt: new Date() }
        }
      }
    }
  })
}
```

**Scheduled Cleanup (Cron Job):**
```typescript
// Runs every 5 minutes via cron or worker
async function cleanupExpiredLocks() {
  const result = await prisma.seatSession.updateMany({
    where: {
      state: 'locked',
      lockExpiresAt: { lt: new Date() }
    },
    data: {
      state: 'released',
      releasedAt: new Date()
    }
  })
  
  console.log(`Released ${result.count} expired seat locks`)
}
```

**Why Hybrid?**
- Lazy: Ensures real-time accuracy when users check availability
- Scheduled: Prevents database bloat, maintains clean state
- Redundancy: If one fails, the other catches it

---

#### Step 3: User Places Order

**Trigger:** Order submission

**Backend Logic:**
```typescript
// POST /api/orders/create
async function createOrder(orderData, sessionToken: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find and validate seat session
    const seatSession = await tx.seatSession.findUnique({
      where: { sessionToken },
      include: { seat: true }
    })
    
    if (!seatSession) {
      throw new Error('Invalid session token')
    }
    
    if (seatSession.state !== 'locked') {
      throw new Error('Seat session is not in locked state')
    }
    
    if (seatSession.lockExpiresAt < new Date()) {
      throw new Error('Your seat reservation has expired. Please select a seat again.')
    }
    
    // 2. Create order
    const order = await tx.sale.create({
      data: {
        ...orderData,
        seatId: seatSession.seatId,
        tableSessionId: seatSession.tableSessionId
      }
    })
    
    // 3. Transition seat session to occupied
    await tx.seatSession.update({
      where: { id: seatSession.id },
      data: {
        state: 'occupied',
        occupiedAt: new Date(),
        lockExpiresAt: null  // No longer expires
      }
    })
    
    return order
  })
}
```

**Key Points:**
- ✅ Validates session token
- ✅ Checks lock hasn't expired
- ✅ Atomic state transition (locked → occupied)
- ✅ Links order to seat

---

## 3️⃣ RACE CONDITION HANDLING (PRODUCTION-GRADE)

### Scenario 1: Two Users Click Same Seat Simultaneously

**Timeline:**
```
T=0ms:  User A clicks Seat 1
T=5ms:  User B clicks Seat 1
T=10ms: User A's request reaches server
T=12ms: User B's request reaches server
```

**Without Proper Handling:**
```
❌ Both requests see seat as available
❌ Both create SeatSession records
❌ Database has 2 active sessions for 1 seat
❌ Both users think they have the seat
```

**With Serializable Transaction:**
```typescript
// User A's transaction starts
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

// User A checks seat availability
SELECT * FROM SeatSession WHERE seatId = 'seat1' AND state IN ('locked', 'occupied');
// Result: Empty (seat available)

// User B's transaction starts (blocked by User A's lock)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
// ⏳ Waiting for User A to commit...

// User A creates seat session
INSERT INTO SeatSession (...);
COMMIT;  // ✅ User A succeeds

// User B's transaction now executes
SELECT * FROM SeatSession WHERE seatId = 'seat1' AND state IN ('locked', 'occupied');
// Result: User A's session (seat taken)
// ❌ User B gets ConflictError
ROLLBACK;
```

**Result:**
- ✅ User A gets the seat
- ✅ User B gets clear error message
- ✅ No data corruption
- ✅ Database consistency maintained

---

### Scenario 2: Network Latency Variations

**Problem:** User A has slow connection, User B has fast connection

**Solution: Database-Level Locking**
```typescript
// Prisma transaction with row-level locking
const seatSession = await tx.seatSession.findFirst({
  where: { seatId },
  // This acquires a row lock - other transactions wait
})
```

**PostgreSQL Behavior:**
- First transaction acquires lock
- Second transaction waits (up to timeout)
- Lock released on commit/rollback
- No race condition possible

---

### Scenario 3: Distributed System (Multiple Servers)

**Problem:** Load balancer sends requests to different servers

**Solution: Database as Single Source of Truth**
```typescript
// ❌ BAD: In-memory cache
const seatCache = new Map()  // Different on each server!

// ✅ GOOD: Database with transactions
await prisma.$transaction(...)  // Atomic across all servers
```

**Additional Safeguards:**
- Use database-level unique constraints
- Implement idempotency keys
- Add request deduplication

---

## 4️⃣ SESSION PERSISTENCE (REFRESH/RECONNECT)

### Session Token Strategy

**Token Generation:**
```typescript
import crypto from 'crypto'

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
  // Example: "xK7j9mP2nQ4vR8sT1wY5zL3cF6hN0bV9"
}
```

**Token Storage:**
```typescript
// Client-side (browser)
localStorage.setItem('seat_session_token', token)
localStorage.setItem('seat_session_expires', lockExpiresAt.toISOString())

// Server-side (database)
SeatSession.sessionToken (unique, indexed)
```

---

### Refresh Scenarios

#### Scenario A: User Refreshes Page (Before Order)

**Flow:**
```typescript
// 1. Page loads, check for existing token
const token = localStorage.getItem('seat_session_token')
const expires = localStorage.getItem('seat_session_expires')

if (token && new Date(expires) > new Date()) {
  // 2. Validate token with server
  const response = await fetch('/api/seats/session/validate', {
    method: 'POST',
    body: JSON.stringify({ sessionToken: token })
  })
  
  if (response.ok) {
    const { seatSession } = await response.json()
    // ✅ Restore seat selection
    // ✅ Extend lock expiration
    // ✅ Continue to menu
  } else {
    // ❌ Token invalid/expired
    // Show seat selection again
    localStorage.removeItem('seat_session_token')
  }
}
```

**Backend Validation:**
```typescript
// POST /api/seats/session/validate
async function validateSeatSession(sessionToken: string) {
  const seatSession = await prisma.seatSession.findUnique({
    where: { sessionToken },
    include: { seat: true }
  })
  
  if (!seatSession) {
    return { valid: false, reason: 'Session not found' }
  }
  
  if (seatSession.state === 'released') {
    return { valid: false, reason: 'Session released' }
  }
  
  if (seatSession.state === 'locked' && seatSession.lockExpiresAt < new Date()) {
    // Auto-release expired lock
    await prisma.seatSession.update({
      where: { id: seatSession.id },
      data: { state: 'released', releasedAt: new Date() }
    })
    return { valid: false, reason: 'Lock expired' }
  }
  
  // Extend lock
  if (seatSession.state === 'locked') {
    await prisma.seatSession.update({
      where: { id: seatSession.id },
      data: { lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    })
  }
  
  return { valid: true, seatSession }
}
```

---

#### Scenario B: User Refreshes After Order

**Flow:**
```typescript
// Order placed → seat state = 'occupied'
// Token still valid, but seat is now occupied (not locked)

const { valid, seatSession } = await validateSeatSession(token)

if (valid && seatSession.state === 'occupied') {
  // ✅ User has ordered, show order status
  // ✅ Keep seat assignment
  // ✅ Allow adding more items to order
}
```

---

#### Scenario C: User Switches Devices

**Problem:** Token in localStorage on Device A, user opens on Device B

**Solution: Device Fingerprinting + Conflict Detection**

```typescript
// Lock seat with device ID
await lockSeat(seatId, tempId, deviceId)

// On Device B, same tempId but different deviceId
const existingSession = await prisma.seatSession.findFirst({
  where: {
    lockedByTempId: tempId,
    state: { in: ['locked', 'occupied'] }
  }
})

if (existingSession && existingSession.lockedByDevice !== deviceId) {
  // Show modal: "You have an active session on another device"
  // Options:
  // 1. "Continue on this device" (transfer session)
  // 2. "Cancel" (keep original device)
}
```

**Device Transfer:**
```typescript
// Transfer session to new device
await prisma.seatSession.update({
  where: { id: existingSession.id },
  data: {
    lockedByDevice: newDeviceId,
    sessionToken: newToken  // Generate new token for security
  }
})

// Invalidate old token (security)
localStorage.setItem('seat_session_token', newToken)
```

---

### Session Tracking Methods

**1. TempId (Browser Fingerprint)**
```typescript
function generateTempId(): string {
  const stored = localStorage.getItem('user_temp_id')
  if (stored) return stored
  
  const tempId = `temp-${Date.now()}-${crypto.randomUUID()}`
  localStorage.setItem('user_temp_id', tempId)
  return tempId
}
```

**2. Device ID (Hardware Fingerprint)**
```typescript
async function getDeviceId(): Promise<string> {
  const fingerprint = await import('@fingerprintjs/fingerprintjs')
  const fp = await fingerprint.load()
  const result = await fp.get()
  return result.visitorId
}
```

**3. Session Token (Secure Random)**
- Generated server-side
- Stored in localStorage
- Validated on every request
- Rotated on device transfer

---

## 5️⃣ EDGE CASES (COMPREHENSIVE)

### Edge Case 1: User Leaves Before Ordering

**Scenario:** User locks seat, browses menu, then closes tab without ordering

**Handling:**
```typescript
// Lock expires after 10 minutes
// Lazy cleanup releases seat
// Next user can select it

// Optional: Beacon API for immediate cleanup
window.addEventListener('beforeunload', () => {
  const token = localStorage.getItem('seat_session_token')
  if (token) {
    navigator.sendBeacon('/api/seats/session/release', JSON.stringify({ token }))
  }
})
```

**Trade-off:**
- Beacon API not guaranteed (browser may ignore)
- Rely on 10-minute timeout as primary mechanism
- Lazy cleanup ensures seat becomes available

---

### Edge Case 2: Multiple Tabs/Windows

**Scenario:** User opens QR link in 2 tabs simultaneously

**Detection:**
```typescript
// Tab 1 locks seat, gets token
localStorage.setItem('seat_session_token', token1)

// Tab 2 tries to lock same seat
// Same tempId detected → extend existing lock instead of creating new one

if (activeSeatSession.lockedByTempId === tempId) {
  // Same user, different tab
  // Return existing session token
  return { seatSession: activeSeatSession, sessionToken: activeSeatSession.sessionToken }
}
```

**Synchronization:**
```typescript
// Use storage event to sync tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'seat_session_token') {
    // Another tab updated the token
    // Reload seat selection state
    reloadSeatSelection()
  }
})
```

**UX:**
- Show warning: "You have this seat selected in another tab"
- Allow user to continue in current tab
- Sync state across tabs via localStorage events

---

### Edge Case 3: Expired Lock UX

**Scenario:** User locks seat, browses menu for 15 minutes, tries to order

**Detection:**
```typescript
// On order submission
if (seatSession.lockExpiresAt < new Date()) {
  throw new LockExpiredError('Your seat reservation has expired')
}
```

**UX Flow:**
```typescript
// Frontend catches error
catch (error) {
  if (error.code === 'LOCK_EXPIRED') {
    showModal({
      title: 'Seat Reservation Expired',
      message: 'Your seat was released due to inactivity. Please select a seat again.',
      actions: [
        { label: 'Select Seat', onClick: () => showSeatSelection() },
        { label: 'Continue Without Seat', onClick: () => proceedWithoutSeat() }
      ]
    })
  }
}
```

**Prevention:**
```typescript
// Show countdown timer in UI
const [timeLeft, setTimeLeft] = useState(10 * 60)  // 10 minutes

useEffect(() => {
  const interval = setInterval(() => {
    const expires = new Date(localStorage.getItem('seat_session_expires'))
    const now = new Date()
    const secondsLeft = Math.floor((expires - now) / 1000)
    
    setTimeLeft(secondsLeft)
    
    if (secondsLeft <= 60) {
      // Show warning at 1 minute
      showWarning('Your seat reservation expires in 1 minute')
    }
    
    if (secondsLeft <= 0) {
      // Auto-redirect to seat selection
      showSeatSelection()
    }
  }, 1000)
  
  return () => clearInterval(interval)
}, [])
```

---

### Edge Case 4: Network Disconnect During Lock

**Scenario:** User selects seat, request sent, network drops before response

**Handling:**
```typescript
// Client-side retry with idempotency
async function lockSeatWithRetry(seatId: string, tempId: string) {
  const idempotencyKey = `lock-${seatId}-${tempId}-${Date.now()}`
  
  try {
    const response = await fetch('/api/seats/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ seatId, tempId })
    })
    
    if (!response.ok) throw new Error('Lock failed')
    return await response.json()
  } catch (error) {
    // Retry once after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if lock succeeded despite network error
    const validation = await fetch('/api/seats/session/validate', {
      method: 'POST',
      body: JSON.stringify({ tempId, seatId })
    })
    
    if (validation.ok) {
      // Lock succeeded, network error was on response
      return await validation.json()
    }
    
    throw error
  }
}
```

**Server-side Idempotency:**
```typescript
// Store idempotency keys in Redis or database
const idempotencyCache = new Map<string, any>()

async function lockSeatIdempotent(seatId: string, tempId: string, idempotencyKey: string) {
  // Check if this request was already processed
  const cached = idempotencyCache.get(idempotencyKey)
  if (cached) {
    return cached  // Return same result
  }
  
  const result = await lockSeat(seatId, tempId)
  
  // Cache result for 5 minutes
  idempotencyCache.set(idempotencyKey, result)
  setTimeout(() => idempotencyCache.delete(idempotencyKey), 5 * 60 * 1000)
  
  return result
}
```

---

### Edge Case 5: Seat Becomes Unavailable Mid-Selection

**Scenario:** User viewing seat selection, another user locks seat, first user clicks it

**Handling:**
```typescript
// Real-time availability updates (optional)
useEffect(() => {
  const eventSource = new EventSource(`/api/seats/availability/stream?tableId=${tableId}`)
  
  eventSource.onmessage = (event) => {
    const { seatId, state } = JSON.parse(event.data)
    updateSeatState(seatId, state)
  }
  
  return () => eventSource.close()
}, [tableId])

// Fallback: Optimistic UI with server validation
async function handleSeatClick(seatId: string) {
  // Optimistically show as selected
  setSelectedSeat(seatId)
  
  try {
    await lockSeat(seatId)
    // Success
  } catch (error) {
    if (error.code === 'SEAT_TAKEN') {
      // Revert optimistic update
      setSelectedSeat(null)
      showError('This seat was just taken. Please choose another.')
      // Refresh availability
      refreshSeats()
    }
  }
}
```

---

### Edge Case 6: User Orders, Then Refreshes

**Scenario:** Order placed (seat occupied), user refreshes page

**Handling:**
```typescript
// Validate session token
const { valid, seatSession } = await validateSeatSession(token)

if (valid && seatSession.state === 'occupied') {
  // Find existing order
  const order = await prisma.sale.findFirst({
    where: {
      seatId: seatSession.seatId,
      tableSessionId: seatSession.tableSessionId,
      status: { in: ['pending', 'preparing', 'ready'] }
    }
  })
  
  if (order) {
    // Show order status page
    router.push(`/order/status?orderId=${order.id}`)
  } else {
    // Order completed, show menu (allow additional orders)
    router.push('/order')
  }
}
```

---

## 6️⃣ CONCURRENCY CONTROL (TECHNICAL DEEP DIVE)

### Database Transaction Isolation Levels

**Comparison:**

| Level | Prevents Dirty Read | Prevents Non-Repeatable Read | Prevents Phantom Read | Performance |
|-------|---------------------|------------------------------|----------------------|-------------|
| Read Uncommitted | ❌ | ❌ | ❌ | Fastest |
| Read Committed | ✅ | ❌ | ❌ | Fast |
| Repeatable Read | ✅ | ✅ | ❌ | Medium |
| Serializable | ✅ | ✅ | ✅ | Slowest |

**Our Choice: Serializable**

**Why?**
- Prevents all race conditions
- Guarantees consistency
- Performance impact acceptable (seat locking is infrequent)

**Implementation:**
```typescript
await prisma.$transaction(async (tx) => {
  // All queries here are serializable
}, {
  isolationLevel: 'Serializable',
  timeout: 5000
})
```

---

### Optimistic vs Pessimistic Locking

**Optimistic Locking (Version-Based):**
```typescript
// ❌ NOT suitable for seat locking
model SeatSession {
  version Int @default(0)
}

// Update with version check
await prisma.seatSession.update({
  where: { id, version: currentVersion },
  data: { state: 'locked', version: currentVersion + 1 }
})
// If version mismatch → conflict
```

**Problem:** Two users can both read version=0, both try to update, one fails
**Result:** User gets error after thinking they had the seat (bad UX)

---

**Pessimistic Locking (Row-Level Lock):**
```typescript
// ✅ RECOMMENDED for seat locking
await prisma.$transaction(async (tx) => {
  // This acquires a row lock immediately
  const seat = await tx.seatSession.findUnique({
    where: { seatId }
  })
  
  // Other transactions wait here
  // No conflict possible
}, { isolationLevel: 'Serializable' })
```

**Benefit:** Conflict prevented upfront, no failed updates

---

### Deadlock Prevention

**Scenario:** User A locks Seat 1, User B locks Seat 2, both try to update TableSession

**Prevention Strategy:**
```typescript
// Always acquire locks in consistent order
// 1. Lock seat (by seatId)
// 2. Lock table session (by tableSessionId)
// 3. Lock participant (by participantId)

// Never reverse the order
```

**Timeout Handling:**
```typescript
try {
  await prisma.$transaction(async (tx) => {
    // ...
  }, { timeout: 5000 })  // 5 second timeout
} catch (error) {
  if (error.code === 'P2028') {  // Transaction timeout
    throw new Error('Seat is currently being selected by another user. Please try again.')
  }
}
```

---

## 7️⃣ PRODUCTION CHECKLIST

### Before Launch

- [ ] **Load Testing**
  - Simulate 100 concurrent users selecting seats
  - Verify no race conditions
  - Check database connection pool limits

- [ ] **Monitoring**
  - Set up alerts for lock timeouts
  - Track seat lock duration metrics
  - Monitor transaction failure rates

- [ ] **Error Handling**
  - All errors have user-friendly messages
  - Errors logged with context (seatId, tempId, timestamp)
  - Sentry/error tracking configured

- [ ] **Database Indexes**
  - Index on `SeatSession.lockExpiresAt` (cleanup queries)
  - Index on `SeatSession.sessionToken` (validation queries)
  - Index on `SeatSession.seatId, state` (availability queries)

- [ ] **Backup/Rollback Plan**
  - Database migration rollback script
  - Feature flag to disable seat selection
  - Fallback to table-only mode

- [ ] **Documentation**
  - API documentation for all endpoints
  - State machine diagram
  - Troubleshooting guide for support team

---

## 8️⃣ FINAL RECOMMENDATION

### ✅ PROCEED WITH IMPLEMENTATION - WITH CAUTION

**Conditions:**
1. Use **SeatSession table** (Option A)
2. Implement **Serializable transactions**
3. Add **comprehensive error handling**
4. Include **session token persistence**
5. Implement **hybrid cleanup** (lazy + scheduled)
6. Add **monitoring and alerts**
7. Conduct **thorough testing** (unit + integration + load)
8. Deploy with **feature flag** (gradual rollout)

**Timeline Adjustment:**
- Initial estimate: 2-3 days ❌
- **Revised estimate: 5-7 days** ✅
  - Day 1-2: Database design + migration
  - Day 3-4: Backend APIs + transaction logic
  - Day 5: Frontend UI + session handling
  - Day 6: Edge case handling + error flows
  - Day 7: Testing + monitoring setup

**Risk Level: 🔴 HIGH → 🟡 MEDIUM (with proper implementation)**

---

## 📞 QUESTIONS ANSWERED

1. **Risk Level:** 🔴 HIGH (corrected from LOW)
2. **Database Design:** New `SeatSession` table (production-grade)
3. **Seat Locking:** Detailed state machine with 10-min expiry
4. **Conflict Handling:** Serializable transactions + row-level locking
5. **Session Persistence:** Session token + localStorage + device fingerprinting
6. **Edge Cases:** 6 scenarios covered with solutions

**Status:** 🟢 Ready for approval with corrected risk assessment

