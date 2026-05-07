# Seat Selection Feature - Testing Guide

**Server:** http://localhost:3001  
**Status:** ✅ Running

---

## 🧪 Quick Test Scenarios

### Prerequisites
1. Have a business with tables and seats configured
2. Generate table QR code or use existing one
3. Have at least 2 seats configured for a table

---

## Test 1: Basic Seat Selection Flow

**Steps:**
1. Scan table QR code (or navigate to `/order?branchId=X&tableId=Y&signature=Z`)
2. **Expected:** Seat selection modal appears
3. Click on an available seat (green)
4. **Expected:** Modal closes, seat locked for 10 minutes
5. Add items to cart
6. Place order
7. **Expected:** Order created, seat transitions to "occupied"

**Verify:**
- Seat shows as locked/occupied for other users
- Order is linked to the seat in database
- Session token stored in localStorage

---

## Test 2: Seat Conflict (Race Condition)

**Setup:** Open 2 browser windows/tabs

**Steps:**
1. **Window 1:** Scan QR, see seat selection
2. **Window 2:** Scan same QR, see seat selection
3. **Window 1:** Click Seat 1
4. **Window 2:** Click Seat 1 (same seat)
5. **Expected:** Window 2 gets error "This seat is already in use"
6. **Expected:** Seat list refreshes, Seat 1 shows as unavailable

**Verify:**
- Only one user gets the seat
- Second user sees clear error message
- Database has only one SeatSession for that seat

---

## Test 3: Session Persistence (Refresh)

**Steps:**
1. Scan QR, select a seat
2. Add items to cart
3. **Refresh the page** (F5)
4. **Expected:** Seat selection is restored
5. **Expected:** Cart is preserved
6. **Expected:** Lock is extended by 10 minutes

**Verify:**
- `localStorage` has `seat_session_token`
- Lock expiration updated in database
- No need to select seat again

---

## Test 4: Lock Expiration

**Steps:**
1. Scan QR, select a seat
2. **Wait 10+ minutes** (or manually update `lockExpiresAt` in database)
3. Try to place order
4. **Expected:** Error "Your seat reservation has expired"
5. **Expected:** Seat selection modal appears again

**Verify:**
- Expired lock released in database
- Seat becomes available for others
- User can select seat again

---

## Test 5: Skip Seat Selection

**Steps:**
1. Scan QR, see seat selection modal
2. Click "Skip" button
3. **Expected:** Modal closes, no seat selected
4. Add items to cart
5. Place order
6. **Expected:** Order created without seat assignment

**Verify:**
- Order has `seatId = null`
- No SeatSession created
- Order still works normally

---

## Test 6: Multiple Tabs (Same User)

**Steps:**
1. Open Tab 1, scan QR, select Seat 1
2. Open Tab 2, scan same QR
3. **Expected:** Tab 2 detects existing seat session
4. **Expected:** Tab 2 shows Seat 1 as selected (no modal)

**Verify:**
- Both tabs share same `tempId`
- Both tabs use same `sessionToken`
- No duplicate seat locks

---

## Test 7: Occupied Seat (After Order)

**Steps:**
1. User A: Scan QR, select Seat 1, place order
2. **Expected:** Seat 1 state = "occupied"
3. User B: Scan same QR
4. **Expected:** Seat 1 shows as red/unavailable
5. User B: Try to click Seat 1
6. **Expected:** Button disabled, cannot select

**Verify:**
- Occupied seats cannot be selected
- State persists until order completed/closed

---

## 🔍 Database Verification

### Check Seat Session
```sql
SELECT * FROM "SeatSession" 
WHERE "seatId" = 'YOUR_SEAT_ID' 
ORDER BY "createdAt" DESC;
```

**Expected Fields:**
- `state`: "locked" or "occupied"
- `lockExpiresAt`: 10 minutes from `lockedAt`
- `sessionToken`: Unique token
- `lockedByTempId`: Browser fingerprint

### Check Order-Seat Link
```sql
SELECT s.id, s."orderNumber", s."seatId", seat."seatLabel"
FROM "Sale" s
LEFT JOIN "Seat" seat ON s."seatId" = seat.id
WHERE s."tableId" = 'YOUR_TABLE_ID'
ORDER BY s."createdAt" DESC;
```

---

## 🐛 Common Issues & Solutions

### Issue: Seat selection modal doesn't appear
**Check:**
- Table has seats configured (`/dashboard/tables/[id]/seats`)
- Seats are active (`isActive = true`)
- Browser has localStorage enabled

### Issue: "Seat already in use" error immediately
**Check:**
- Previous session not cleaned up
- Run: `UPDATE "SeatSession" SET state = 'released' WHERE state = 'locked' AND "lockExpiresAt" < NOW()`

### Issue: Lock doesn't extend on refresh
**Check:**
- `localStorage` has `seat_session_token`
- Token is valid in database
- Lock hasn't expired

### Issue: Order fails with seat session error
**Check:**
- `sessionToken` is being sent in order payload
- Seat session state is "locked" (not "released" or "occupied")
- Lock hasn't expired

---

## 📊 API Testing (Postman/cURL)

### 1. Get Available Seats
```bash
curl "http://localhost:3001/api/seats/available?tableId=YOUR_TABLE_ID"
```

**Expected Response:**
```json
{
  "seats": [
    {
      "id": "seat_123",
      "seatNumber": 1,
      "seatLabel": "Seat 1",
      "position": null,
      "isAvailable": true,
      "state": "available"
    }
  ]
}
```

### 2. Lock a Seat
```bash
curl -X POST http://localhost:3001/api/seats/lock \
  -H "Content-Type: application/json" \
  -d '{
    "seatId": "seat_123",
    "tempId": "temp-test-123",
    "tableSessionId": "session_456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionToken": "abc123...",
  "lockExpiresAt": "2026-05-04T01:00:00.000Z",
  "seatLabel": "Seat 1",
  "extended": false
}
```

### 3. Validate Session
```bash
curl -X POST http://localhost:3001/api/seats/session/validate \
  -H "Content-Type: application/json" \
  -d '{"sessionToken": "abc123..."}'
```

**Expected Response:**
```json
{
  "valid": true,
  "seatSession": {
    "id": "session_789",
    "seatId": "seat_123",
    "state": "locked",
    "lockExpiresAt": "2026-05-04T01:10:00.000Z",
    "tableId": "table_456",
    "seatLabel": "Seat 1"
  }
}
```

### 4. Test Conflict
```bash
# Lock seat with user 1
curl -X POST http://localhost:3001/api/seats/lock \
  -d '{"seatId":"seat_123","tempId":"user1"}'

# Try to lock same seat with user 2
curl -X POST http://localhost:3001/api/seats/lock \
  -d '{"seatId":"seat_123","tempId":"user2"}'
```

**Expected:** Second request returns 409 Conflict

---

## ✅ Success Criteria

- [ ] Seat selection modal appears on table QR scan
- [ ] Available seats are selectable (green)
- [ ] Occupied seats are disabled (red)
- [ ] Seat lock persists across page refresh
- [ ] Conflict error shown when seat taken
- [ ] Lock expires after 10 minutes
- [ ] Order links to selected seat
- [ ] Skip button works (order without seat)
- [ ] Multiple tabs share same seat session
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## 🚀 Ready for Production?

**Checklist:**
- [ ] All test scenarios pass
- [ ] Load test with 10+ concurrent users
- [ ] Database indexes verified
- [ ] Error handling tested
- [ ] Session persistence tested
- [ ] Backward compatibility verified (existing flows work)
- [ ] Documentation reviewed
- [ ] Monitoring/alerts configured

**If all checked:** ✅ Ready to deploy!

---

**Testing completed on:** _____________  
**Tested by:** _____________  
**Issues found:** _____________  
**Status:** _____________
