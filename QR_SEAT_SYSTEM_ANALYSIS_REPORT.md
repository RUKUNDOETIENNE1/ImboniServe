# ImboniServe QR & Seat System - Comprehensive Analysis Report

**Date:** May 4, 2026  
**Status:** ⚠️ ANALYSIS COMPLETE - AWAITING APPROVAL BEFORE IMPLEMENTATION

---

## 📊 EXECUTIVE SUMMARY

The current ImboniServe system has **partial seat infrastructure** in place but operates primarily as a **table-level QR system**. The requested hybrid table + seat selection system requires **moderate enhancements** rather than a complete rebuild.

**Current State:** 🟡 Partially Implemented (60%)  
**Risk Level:** 🟢 LOW (existing infrastructure can be preserved)  
**Effort Required:** 🟡 MODERATE (2-3 days development)

---

## 1️⃣ CURRENT SYSTEM ANALYSIS

### 1.1 QR Code Generation (✅ FULLY IMPLEMENTED)

**Location:** `src/lib/services/qr-generator.service.ts`

**Current Capabilities:**
```typescript
class QRGeneratorService {
  // ✅ Supports table-level QR
  generateURL({ branchId, tableId, seatId, mode })
  
  // ✅ Supports seat-level QR (optional)
  generateTableQRCodes(businessId, tableIds)
  generateSeatQRCodes(businessId, tableId, seatCount)
}
```

**QR URL Format:**
```
https://imboni.rw/order?branchId={id}&tableId={id}&seatId={id}&version=1&signature={hmac}
```

**✅ What Works:**
- HMAC signature verification for security
- Supports `branchId`, `tableId`, `seatId` parameters
- Multiple modes: `invenue`, `preorder`, `pickup`
- QR code image generation (PNG, Buffer, Data URL)

**⚠️ Current Limitation:**
- Seat QR codes are **optional** and **pre-generated per seat**
- No dynamic seat selection UI after table scan
- Each seat requires a separate physical QR print

---

### 1.2 Database Schema (✅ WELL STRUCTURED)

**Table Model** (`schema.prisma:722-745`):
```prisma
model Table {
  id               String   @id @default(cuid())
  number           String
  capacity         Int      @default(4)
  status           String   @default("AVAILABLE")
  businessId       String
  qrCode           String?  @unique  // ✅ Table-level QR
  
  seats            Seat[]
  tableSessions    TableSession[]
  // ...
}
```

**Seat Model** (`schema.prisma:1465-1483`):
```prisma
model Seat {
  id         String   @id @default(cuid())
  tableId    String
  seatNumber Int
  seatLabel  String?  // "Seat A", "Window Seat", etc.
  qrCode     String?  @unique  // ✅ Optional seat-level QR
  qrDesign   Json?    // QR customization
  position   Json?    // {x, y, edge: "left"|"right"|"top"|"bottom"}
  isActive   Boolean  @default(true)
  
  sales      Sale[]   @relation("SeatSales")
  tips       StaffTip[] @relation("SeatTips")
  table      Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)
  
  @@unique([tableId, seatNumber])
}
```

**TableSession Model** (`schema.prisma:748-771`):
```prisma
model TableSession {
  id           String   @id @default(cuid())
  tableId      String
  businessId   String
  status       String   @default("active")  // "active" | "closed"
  
  // ✅ Tap & Leave™ checkout support
  checkoutMode         String    @default("standard")
  checkoutStatus       String    @default("active")
  runningTotalCents    Int       @default(0)
  
  participants   SessionParticipant[]  // ✅ Multi-user support
  orders         Sale[]
  // ...
}
```

**SessionParticipant Model** (referenced in join.ts):
```prisma
model SessionParticipant {
  id         String   @id @default(cuid())
  sessionId  String
  tempId     String   // Unique temp identifier
  name       String   // "Guest 1", "John", etc.
  
  @@unique([sessionId, tempId])
}
```

**✅ What's Good:**
- Seat model exists with all necessary fields
- Table sessions support multiple participants
- Seat-level sales and tips tracking ready
- Cascade delete protection

**⚠️ Missing Fields:**
- No `seatId` foreign key in `SessionParticipant` (seat assignment)
- No seat state tracking (`available`, `locked`, `occupied`)
- No seat lock expiration timestamp

---

### 1.3 Menu Access Flow (✅ IMPLEMENTED)

**Entry Point:** `src/pages/order/index.tsx`

**Current Flow:**
1. User scans QR code → redirected to `/order?branchId=X&tableId=Y&signature=Z`
2. Frontend validates QR signature via `/api/public/order/token`
3. System auto-joins table session via `joinTableSession(tableId, branchId)`
4. Menu loads from `/api/public/menu?branchId=X`
5. User adds items to cart
6. Order submitted with `sessionId` and `participantId`

**Session Join Logic** (`src/pages/api/session/join.ts:16-138`):
```typescript
// ✅ Current behavior:
// - Finds or creates active TableSession for table
// - Creates SessionParticipant with tempId
// - Auto-closes stale sessions (>6 hours)
// - Enforces ONE active session per table
```

**✅ What Works:**
- Automatic session creation/join
- Multi-participant support (group ordering)
- Participant naming ("Guest 1", "Guest 2", or custom)
- Session validation and cleanup

**❌ What's Missing:**
- No seat selection prompt after QR scan
- No seat availability check
- No seat locking mechanism
- Participants not assigned to specific seats

---

### 1.4 Seat Management UI (✅ ADMIN ONLY)

**Location:** `src/pages/dashboard/tables/[id]/seats.tsx`

**Current Features:**
- ✅ Auto-generate seats based on table capacity
- ✅ Edit seat labels ("Seat A", "Window Seat")
- ✅ Generate individual QR codes per seat
- ✅ Activate/deactivate seats
- ✅ View seat usage stats (orders, tips)
- ✅ Position tracking (edge placement)

**⚠️ Limitation:**
- Admin-only interface (not customer-facing)
- Requires printing separate QR per seat
- No dynamic seat selection for customers

---

### 1.5 Seat QR Service (✅ IMPLEMENTED BUT UNDERUTILIZED)

**Location:** `src/lib/services/seat-qr.service.ts`

**Current Capabilities:**
```typescript
// ✅ Generate seat-specific QR codes
generateSeatQR(seatId, design?)

// ✅ Bulk generation for table
generateTableSeatQRs(tableId, design?)

// ✅ Check if seat has QR
checkSeatQR(seatId)

// ✅ Print-ready QR data
getSeatQRForPrinting(seatId)
```

**QR URL Generated:**
```
https://imboni.rw/order/table/{tableId}/seat/{seatId}
```

**⚠️ Current Issue:**
- Service exists but requires **pre-generation** of QR codes
- No dynamic seat selection after table scan
- URL format differs from main QR generator (`/order/table/X/seat/Y` vs `/order?seatId=Y`)

---

## 2️⃣ GAP ANALYSIS

### ❌ Missing Features vs Requirements

| Requirement | Current Status | Gap |
|------------|---------------|-----|
| **1 QR per table** | ✅ Implemented | None |
| **Seat selection UI after scan** | ❌ Not implemented | **CRITICAL** |
| **Seat state management** | ❌ Not implemented | **CRITICAL** |
| **Seat locking (5-10 min)** | ❌ Not implemented | **HIGH** |
| **Conflict handling** | ❌ Not implemented | **HIGH** |
| **Real-time seat availability** | ❌ Not implemented | **MEDIUM** |
| **Seat assignment to participant** | ❌ Not implemented | **HIGH** |
| **"Empowered by ImboniServe" branding** | ⚠️ Partial (QR design field exists) | **LOW** |

---

### 🔍 Detailed Gap Breakdown

#### Gap 1: No Seat Selection UI (CRITICAL)
**Current:** User scans table QR → immediately sees menu  
**Required:** User scans table QR → **seat selection screen** → menu

**Missing Components:**
- Frontend: Seat selection modal/page
- API: `/api/tables/{tableId}/seats/available` endpoint
- Logic: Fetch available seats for table

---

#### Gap 2: No Seat State Management (CRITICAL)
**Current:** Seats have `isActive` boolean only  
**Required:** Seats need real-time state: `available`, `locked`, `occupied`

**Missing Database Fields:**
```prisma
// Need to add to Seat model:
state           String    @default("available")  // "available" | "locked" | "occupied"
lockedAt        DateTime?
lockedBy        String?   // tempId or participantId
lockExpiresAt   DateTime?
```

---

#### Gap 3: No Seat Locking Logic (HIGH)
**Current:** No temporary reservation mechanism  
**Required:** 5-10 minute lock when seat selected

**Missing Components:**
- API: `/api/seats/{seatId}/lock` endpoint
- Logic: Lock seat with expiration
- Cron/Worker: Auto-release expired locks
- Validation: Prevent double-booking

---

#### Gap 4: No Conflict Handling (HIGH)
**Current:** No server-side validation  
**Required:** Reject second user if seat already locked/occupied

**Missing Logic:**
```typescript
// Need atomic seat locking:
const seat = await prisma.seat.findUnique({ where: { id: seatId } })
if (seat.state !== 'available') {
  throw new Error('This seat is already in use. Please choose another.')
}
await prisma.seat.update({
  where: { id: seatId },
  data: { state: 'locked', lockedAt: new Date(), lockedBy: tempId }
})
```

---

#### Gap 5: No Seat-Participant Link (HIGH)
**Current:** `SessionParticipant` has no `seatId` field  
**Required:** Track which participant is at which seat

**Missing Schema:**
```prisma
model SessionParticipant {
  // ...existing fields
  seatId     String?  // ← ADD THIS
  seat       Seat?    @relation(fields: [seatId], references: [id])
}
```

---

## 3️⃣ RISK ASSESSMENT

### 🟢 LOW RISK AREAS

1. **QR Code Generation**
   - Existing service is robust
   - No breaking changes needed
   - Can continue supporting both table and seat QR

2. **Database Schema**
   - Well-structured foundation
   - Additive changes only (no destructive migrations)
   - Existing data preserved

3. **Session Management**
   - Current logic is solid
   - Just needs seat assignment extension

---

### 🟡 MEDIUM RISK AREAS

1. **Menu Access Flow**
   - **Risk:** Adding seat selection step could confuse users
   - **Mitigation:** Make seat selection optional (skip button)
   - **Impact:** Minimal if UX is clear

2. **Performance**
   - **Risk:** Real-time seat availability checks could slow down
   - **Mitigation:** Add database indexes, use caching
   - **Impact:** Low with proper optimization

3. **Lock Expiration**
   - **Risk:** Expired locks need cleanup (cron job or lazy cleanup)
   - **Mitigation:** Implement lazy cleanup on seat fetch
   - **Impact:** Minimal if cleanup is efficient

---

### 🔴 HIGH RISK AREAS

1. **Race Conditions**
   - **Risk:** Two users selecting same seat simultaneously
   - **Mitigation:** Use database transactions with row-level locking
   - **Impact:** HIGH if not handled properly
   - **Solution:**
     ```typescript
     await prisma.$transaction(async (tx) => {
       const seat = await tx.seat.findUnique({
         where: { id: seatId },
         // ← Row-level lock
       })
       if (seat.state !== 'available') throw new Error('Seat taken')
       await tx.seat.update({ where: { id: seatId }, data: { state: 'locked' } })
     })
     ```

2. **Backward Compatibility**
   - **Risk:** Existing table QR codes without seat selection
   - **Mitigation:** Make seat selection optional (default to no seat)
   - **Impact:** MEDIUM if not handled gracefully

---

## 4️⃣ DEPENDENCIES

### External Dependencies
- ✅ Prisma ORM (already in use)
- ✅ Next.js API routes (already in use)
- ✅ QRCode library (already installed)
- ⚠️ Real-time updates (optional): Pusher or WebSockets

### Internal Dependencies
- ✅ `qr-generator.service.ts` - No changes needed
- ⚠️ `seat-qr.service.ts` - Minor updates for state checks
- ⚠️ `sessionManager.ts` - Add seat assignment logic
- ⚠️ Database schema - Add seat state fields

### Breaking Changes
- ❌ **NONE** - All changes are additive
- ✅ Existing table QR codes continue to work
- ✅ Existing sessions remain valid
- ✅ Seat QR codes (if already printed) continue to work

---

## 5️⃣ IMPLEMENTATION PLAN

### Phase 1: Database Schema Updates (1-2 hours)

**Step 1.1:** Add seat state fields
```prisma
model Seat {
  // ...existing fields
  state           String    @default("available")  // "available" | "locked" | "occupied"
  lockedAt        DateTime?
  lockedBy        String?   // tempId or participantId
  lockExpiresAt   DateTime?
}
```

**Step 1.2:** Add seat assignment to participants
```prisma
model SessionParticipant {
  // ...existing fields
  seatId     String?
  seat       Seat?    @relation(fields: [seatId], references: [id])
}
```

**Step 1.3:** Run migration
```bash
npx prisma db push
```

---

### Phase 2: Backend API Endpoints (4-6 hours)

**Step 2.1:** Create `/api/tables/{tableId}/seats/available`
- Fetch all seats for table
- Filter by `state: 'available'` OR expired locks
- Return seat list with labels and positions

**Step 2.2:** Create `/api/seats/{seatId}/lock`
- Validate seat is available
- Apply atomic lock with expiration (5-10 min)
- Return success or conflict error

**Step 2.3:** Create `/api/seats/{seatId}/occupy`
- Convert lock to occupied state
- Link seat to participant
- Called when order is placed

**Step 2.4:** Create `/api/seats/{seatId}/release`
- Release seat (manual or auto-cleanup)
- Reset state to available

**Step 2.5:** Update `/api/session/join`
- Accept optional `seatId` parameter
- Validate seat availability
- Assign seat to participant

---

### Phase 3: Frontend Seat Selection UI (6-8 hours)

**Step 3.1:** Create `SeatSelectionModal.tsx`
```tsx
interface SeatSelectionModalProps {
  tableId: string
  onSeatSelected: (seatId: string | null) => void
}

// Features:
// - Grid layout of seats
// - Color coding: green (available), red (occupied), yellow (locked)
// - Disable occupied/locked seats
// - "Skip" button (no seat assignment)
// - Mobile-friendly touch targets
```

**Step 3.2:** Update `/pages/order/index.tsx`
- Show seat selection modal after QR scan
- Lock seat when selected
- Proceed to menu after selection
- Handle lock expiration (show warning)

**Step 3.3:** Add seat info to order confirmation
- Display selected seat in cart
- Show seat in order summary

---

### Phase 4: Conflict Handling & Validation (2-3 hours)

**Step 4.1:** Implement server-side validation
- Use Prisma transactions for atomic operations
- Return clear error messages
- Log conflicts for analytics

**Step 4.2:** Add client-side error handling
- Show "Seat already taken" modal
- Auto-refresh seat availability
- Suggest alternative seats

**Step 4.3:** Implement lock expiration cleanup
- Lazy cleanup on seat fetch (check `lockExpiresAt`)
- Optional: Cron job for bulk cleanup

---

### Phase 5: Testing & QA (4-6 hours)

**Step 5.1:** Unit tests
- Seat locking logic
- Lock expiration
- Conflict detection

**Step 5.2:** Integration tests
- Full flow: scan → select → order
- Race condition simulation
- Lock timeout scenarios

**Step 5.3:** Manual testing
- Mobile device testing
- Multiple users on same table
- Network latency simulation

---

### Phase 6: Optional Enhancements (Future)

**Not in scope for initial implementation:**
- ❌ Seat-level analytics
- ❌ Split billing per seat
- ❌ "Join seat" (shared session)
- ❌ Waiter call per seat
- ❌ Real-time seat updates (WebSocket)

**Can be added later without breaking changes**

---

## 6️⃣ COMPARISON: CURRENT vs REQUIRED

### Current System (Table-Level Only)

```
User Flow:
1. Scan table QR
2. Auto-join table session
3. See menu immediately
4. Order placed (no seat tracking)

Limitations:
- No seat assignment
- No seat availability tracking
- Requires separate QR per seat (if needed)
```

### Required System (Hybrid Table + Seat)

```
User Flow:
1. Scan table QR
2. See seat selection screen
   - Available seats (green)
   - Occupied seats (red, disabled)
3. Select seat → 5-10 min lock applied
4. See menu
5. Place order → seat becomes occupied
6. Leave → seat becomes available

Benefits:
- 1 QR per table (cost savings)
- Seat-level tracking
- Conflict prevention
- Better analytics
```

---

## 7️⃣ EFFORT ESTIMATION

| Phase | Effort | Priority |
|-------|--------|----------|
| Database schema updates | 1-2 hours | **CRITICAL** |
| Backend API endpoints | 4-6 hours | **CRITICAL** |
| Frontend seat selection UI | 6-8 hours | **CRITICAL** |
| Conflict handling | 2-3 hours | **HIGH** |
| Testing & QA | 4-6 hours | **HIGH** |
| Documentation | 2 hours | **MEDIUM** |
| **TOTAL** | **19-27 hours** | **~2-3 days** |

---

## 8️⃣ RECOMMENDED APPROACH

### ✅ Preserve Existing Functionality

1. **Keep table-level QR working**
   - Users can still scan and order without seat selection
   - Seat selection is **optional** (skip button)

2. **Backward compatibility**
   - Existing sessions continue to work
   - No breaking changes to API

3. **Gradual rollout**
   - Enable seat selection per business (feature flag)
   - Test with pilot businesses first

---

### 🎯 Implementation Strategy

**Option A: Mandatory Seat Selection** (Strict)
- All users must select a seat
- No "skip" option
- Best for fine dining, high-end restaurants

**Option B: Optional Seat Selection** (Flexible) ⭐ **RECOMMENDED**
- Show seat selection modal
- Allow "Skip" or "No Preference"
- Best for casual dining, mixed scenarios

**Option C: Smart Detection** (Hybrid)
- If table has seats configured → show selection
- If table has no seats → skip directly to menu
- Best for businesses with mixed table types

---

## 9️⃣ BRANDING ENHANCEMENT

### "Empowered by ImboniServe" Toggle

**Current State:**
- `qrDesign` JSON field exists in Seat model
- Not utilized in QR generation

**Required:**
```typescript
interface QRDesign {
  backgroundColor?: string
  foregroundColor?: string
  logoUrl?: string
  showBranding?: boolean  // ← ADD THIS
  brandingText?: string   // ← "Empowered by ImboniServe"
}
```

**Implementation:**
- Add branding toggle in QR builder UI
- Render branding text below QR code
- Make it optional (default: off)

**Effort:** 1-2 hours

---

## 🔟 FINAL RECOMMENDATIONS

### ✅ APPROVE FOR IMPLEMENTATION

**Reasons:**
1. Low risk (no breaking changes)
2. Solid foundation already exists
3. Clear implementation path
4. Reasonable effort (2-3 days)
5. High business value

### 📋 Pre-Implementation Checklist

Before coding:
- [ ] Confirm seat selection should be optional vs mandatory
- [ ] Decide on lock duration (5 min or 10 min)
- [ ] Choose cleanup strategy (lazy vs cron)
- [ ] Confirm branding requirements
- [ ] Approve database schema changes
- [ ] Review UI mockups (if available)

### 🚀 Next Steps

1. **Get approval** on this analysis report
2. **Clarify requirements** (optional vs mandatory seat selection)
3. **Create UI mockups** for seat selection screen
4. **Begin Phase 1** (database schema updates)
5. **Implement incrementally** (test after each phase)

---

## 📞 QUESTIONS FOR STAKEHOLDERS

1. **Seat Selection Behavior:**
   - Should seat selection be mandatory or optional?
   - What happens if user skips seat selection?

2. **Lock Duration:**
   - Prefer 5 minutes or 10 minutes?
   - Should it be configurable per business?

3. **Conflict Handling:**
   - Show error modal or auto-suggest next available seat?

4. **Branding:**
   - Exact text for branding? ("Empowered by ImboniServe" or "Powered by ImboniServe"?)
   - Logo placement (below QR or integrated)?

5. **Rollout:**
   - Pilot with specific businesses first?
   - Feature flag to enable/disable per business?

---

**Report Status:** ✅ COMPLETE - AWAITING APPROVAL  
**Next Action:** Review and approve before implementation begins  
**Estimated Timeline:** 2-3 days development + 1 day testing = **3-4 days total**
