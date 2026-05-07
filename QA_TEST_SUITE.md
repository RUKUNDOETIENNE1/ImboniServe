# 🧪 QA Test Suite - ImboniServe Platform

**Version**: 1.0  
**Last Updated**: May 4, 2026

---

## 📋 Test Coverage Overview

| Category | Tests | Priority |
|----------|-------|----------|
| Multilingual | 12 | 🔴 Critical |
| Authentication | 8 | 🔴 Critical |
| Payments | 10 | 🔴 Critical |
| Orders | 15 | 🟡 High |
| Kitchen | 8 | 🟡 High |
| Analytics | 12 | 🟢 Medium |
| Admin | 10 | 🟢 Medium |

**Total Tests**: 75

---

## 🔴 CRITICAL TESTS (Must Pass)

### 1. Multilingual Support (12 tests)

#### Test 1.1: Language Switching
- [ ] Navigate to `/dashboard`
- [ ] Click language switcher
- [ ] Select **Kinyarwanda (RW)**
- [ ] **Verify**: All text changes to Kinyarwanda
- [ ] Select **French (FR)**
- [ ] **Verify**: All text changes to French
- [ ] Select **English (EN)**
- [ ] **Verify**: All text changes to English

#### Test 1.2: Dashboard Pages Translation
Test each page in all 3 languages:

- [ ] `/dashboard/notifications` - Notifications settings
- [ ] `/dashboard/tables` - Table management
- [ ] `/dashboard/orders/unified` - Unified orders
- [ ] `/dashboard/qr-analytics` - QR analytics
- [ ] `/dashboard/analytics/menu-performance` - Menu performance
- [ ] `/dashboard/analytics/peak-hours` - Peak hours
- [ ] `/dashboard/analytics/instruction-insights` - Instructions
- [ ] `/dashboard/analytics/payments` - Payment analytics
- [ ] `/dashboard/feedback/payments` - Payment feedback
- [ ] `/dashboard/security` - Security center
- [ ] `/dashboard/loyalty` - Customer loyalty
- [ ] `/dashboard/profile` - Discovery profile

**For each page**:
- [ ] Switch to RW → All text translated
- [ ] Switch to FR → All text translated
- [ ] Switch to EN → All text in English
- [ ] No console errors
- [ ] No hydration warnings

#### Test 1.3: Persistent Language Selection
- [ ] Set language to Kinyarwanda
- [ ] Refresh page
- [ ] **Verify**: Language remains Kinyarwanda
- [ ] Navigate to different page
- [ ] **Verify**: Language remains Kinyarwanda

#### Test 1.4: Fallback Mechanism
- [ ] Open browser console
- [ ] Check for any missing translation warnings
- [ ] **Verify**: No missing key errors
- [ ] **Verify**: Fallback to English works

---

### 2. Authentication & Security (8 tests)

#### Test 2.1: Login Flow
- [ ] Navigate to `/login`
- [ ] Enter valid phone number
- [ ] **Verify**: OTP sent via email/WhatsApp
- [ ] Enter correct OTP
- [ ] **Verify**: Logged in successfully
- [ ] **Verify**: Redirected to dashboard

#### Test 2.2: Two-Factor Authentication
- [ ] Login with valid credentials
- [ ] **Verify**: 6-digit code sent to email
- [ ] **Verify**: 6-digit code sent to WhatsApp
- [ ] Enter correct code
- [ ] **Verify**: Access granted

#### Test 2.3: Session Management
- [ ] Navigate to `/dashboard/security`
- [ ] **Verify**: Current session shown
- [ ] **Verify**: Session details displayed (token, expiry, created)
- [ ] Login from another device/browser
- [ ] **Verify**: New session appears in list

#### Test 2.4: Session Revocation
- [ ] Have 2+ active sessions
- [ ] Click "Revoke" on non-current session
- [ ] **Verify**: Session removed from list
- [ ] **Verify**: Other device logged out

#### Test 2.5: Security Activity Log
- [ ] Navigate to `/dashboard/security`
- [ ] **Verify**: Recent login events shown
- [ ] **Verify**: Event types displayed correctly
- [ ] **Verify**: IP addresses shown
- [ ] **Verify**: Timestamps accurate

#### Test 2.6: Failed Login Attempts
- [ ] Enter wrong OTP 3 times
- [ ] **Verify**: Brute force detection triggered
- [ ] **Verify**: Event logged in security activity
- [ ] **Verify**: Account not locked (just logged)

#### Test 2.7: Password Security
- [ ] Attempt to use weak password
- [ ] **Verify**: Validation error shown
- [ ] Use strong password (12+ chars, mixed case, numbers, symbols)
- [ ] **Verify**: Password accepted

#### Test 2.8: Logout
- [ ] Click logout button
- [ ] **Verify**: Redirected to login page
- [ ] **Verify**: Session invalidated
- [ ] Try to access `/dashboard` directly
- [ ] **Verify**: Redirected to login

---

### 3. Payment Processing (10 tests)

#### Test 3.1: InTouch Mobile Money Payment
- [ ] Create order with total > 0
- [ ] Select "Mobile Money" payment
- [ ] Enter MTN/Airtel number
- [ ] **Verify**: Payment request sent
- [ ] Complete payment on phone
- [ ] **Verify**: Payment confirmed
- [ ] **Verify**: Order status updated

#### Test 3.2: IremboPay Card Payment (Fallback)
- [ ] Create order
- [ ] Select "Card Payment"
- [ ] Enter card details
- [ ] **Verify**: IremboPay gateway loaded
- [ ] Complete payment
- [ ] **Verify**: Payment confirmed

#### Test 3.3: Payment Webhook Handling
- [ ] Trigger payment webhook (use test mode)
- [ ] **Verify**: Webhook received
- [ ] **Verify**: Payment status updated
- [ ] **Verify**: Order status updated
- [ ] **Verify**: Customer notified

#### Test 3.4: Payment Failure Handling
- [ ] Initiate payment
- [ ] Cancel/fail payment
- [ ] **Verify**: Payment marked as failed
- [ ] **Verify**: Order remains pending
- [ ] **Verify**: User can retry

#### Test 3.5: Payment Analytics
- [ ] Navigate to `/dashboard/analytics/payments`
- [ ] **Verify**: Total revenue displayed
- [ ] **Verify**: Payment method breakdown shown
- [ ] **Verify**: Success rates calculated
- [ ] **Verify**: Charts render correctly

#### Test 3.6: Payment Feedback
- [ ] Complete payment
- [ ] Submit payment feedback
- [ ] Navigate to `/dashboard/feedback/payments`
- [ ] **Verify**: Feedback appears in list
- [ ] **Verify**: Rating displayed correctly

#### Test 3.7: Refund Processing
- [ ] Find completed payment
- [ ] Initiate refund
- [ ] **Verify**: Refund request created
- [ ] **Verify**: Payment status updated
- [ ] **Verify**: Customer notified

#### Test 3.8: Payment Health Indexes
- [ ] Run query: `EXPLAIN ANALYZE SELECT * FROM "PaymentTransaction" WHERE "updatedAt" > NOW() - INTERVAL '1 day'`
- [ ] **Verify**: Index `PaymentTransaction_updatedAt_idx` used
- [ ] **Verify**: Query time < 100ms

#### Test 3.9: Checkout Event Tracking
- [ ] Complete payment flow
- [ ] Check `CheckoutEvent` table
- [ ] **Verify**: Events logged (INITIATED, PENDING, COMPLETED)
- [ ] **Verify**: Timestamps accurate
- [ ] **Verify**: Metadata captured

#### Test 3.10: Payment Gateway Failover
- [ ] Simulate InTouch failure
- [ ] **Verify**: System falls back to IremboPay
- [ ] **Verify**: Payment completes successfully
- [ ] **Verify**: Error logged but not shown to user

---

## 🟡 HIGH PRIORITY TESTS

### 4. Order Management (15 tests)

#### Test 4.1: QR Code Ordering
- [ ] Scan table QR code
- [ ] **Verify**: Menu loads
- [ ] Add items to cart
- [ ] **Verify**: Cart updates
- [ ] Submit order
- [ ] **Verify**: Order created

#### Test 4.2: Seat Selection
- [ ] Scan table QR with multiple seats
- [ ] **Verify**: Seat selection modal appears
- [ ] Select seat
- [ ] **Verify**: Seat locked for session
- [ ] **Verify**: Other users can't select same seat

#### Test 4.3: Kitchen Message Display
- [ ] Place order
- [ ] Kitchen sends message ("Please wait")
- [ ] **Verify**: Message banner appears on order page
- [ ] **Verify**: Message translated to user's language

#### Test 4.4: Order Status Updates
- [ ] Place order
- [ ] Update status to "Preparing"
- [ ] **Verify**: Customer sees update
- [ ] Update to "Ready"
- [ ] **Verify**: Customer notified
- [ ] Update to "Completed"
- [ ] **Verify**: Order marked complete

#### Test 4.5: Special Instructions
- [ ] Add item to cart
- [ ] Add special instruction
- [ ] Submit order
- [ ] **Verify**: Instruction saved
- [ ] Check kitchen display
- [ ] **Verify**: Instruction shown to kitchen

#### Test 4.6: Order Modification
- [ ] Place order
- [ ] Before kitchen accepts, modify order
- [ ] **Verify**: Changes saved
- [ ] After kitchen accepts, try to modify
- [ ] **Verify**: Modification blocked

#### Test 4.7: Order Cancellation
- [ ] Place order
- [ ] Cancel before kitchen accepts
- [ ] **Verify**: Order cancelled
- [ ] **Verify**: Payment refunded (if paid)

#### Test 4.8: Multi-Item Orders
- [ ] Add 10+ different items
- [ ] **Verify**: All items in cart
- [ ] Submit order
- [ ] **Verify**: All items in order
- [ ] **Verify**: Total calculated correctly

#### Test 4.9: Order History
- [ ] Navigate to order history
- [ ] **Verify**: Past orders listed
- [ ] **Verify**: Order details accessible
- [ ] **Verify**: Receipts downloadable

#### Test 4.10: Real-time Order Updates (Pusher)
- [ ] Place order
- [ ] Update from another device/browser
- [ ] **Verify**: Changes appear in real-time
- [ ] **Verify**: No page refresh needed

#### Test 4.11-15: Additional order tests
- [ ] Tip addition
- [ ] Order splitting
- [ ] Group orders
- [ ] Scheduled orders
- [ ] Order export (CSV/PDF)

---

### 5. Kitchen Display System (8 tests)

#### Test 5.1: Order Reception
- [ ] Customer places order
- [ ] **Verify**: Order appears on kitchen display
- [ ] **Verify**: Sound notification plays
- [ ] **Verify**: Order details complete

#### Test 5.2: Order Columns
- [ ] **Verify**: "New" column shows new orders
- [ ] Accept order
- [ ] **Verify**: Moves to "Preparing" column
- [ ] Mark ready
- [ ] **Verify**: Moves to "Ready" column

#### Test 5.3: Kitchen Messages
- [ ] Click "Please wait" button
- [ ] **Verify**: Message sent to customer
- [ ] **Verify**: Customer sees message
- [ ] Try other messages (Item unavailable, Almost ready, Ready)
- [ ] **Verify**: All messages work

#### Test 5.4: Order Timing
- [ ] **Verify**: Order age displayed
- [ ] **Verify**: Old orders highlighted
- [ ] **Verify**: Timer updates in real-time

#### Test 5.5: Multi-Kitchen Support
- [ ] Configure multiple kitchen stations
- [ ] **Verify**: Orders routed correctly
- [ ] **Verify**: Each station sees only their orders

#### Test 5.6-8: Additional kitchen tests
- [ ] Order prioritization
- [ ] Batch order handling
- [ ] Kitchen analytics

---

## 🟢 MEDIUM PRIORITY TESTS

### 6. Analytics & Reporting (12 tests)

#### Test 6.1: Menu Performance
- [ ] Navigate to `/dashboard/analytics/menu-performance`
- [ ] Select date range
- [ ] **Verify**: Top performers shown
- [ ] **Verify**: Bottom performers shown
- [ ] **Verify**: Category breakdown accurate

#### Test 6.2: Peak Hours Analysis
- [ ] Navigate to `/dashboard/analytics/peak-hours`
- [ ] **Verify**: Hourly heatmap displayed
- [ ] **Verify**: Peak hour identified
- [ ] **Verify**: Staffing recommendations shown

#### Test 6.3: QR Analytics
- [ ] Navigate to `/dashboard/qr-analytics`
- [ ] **Verify**: Scan stats displayed
- [ ] **Verify**: Top performing QR codes shown
- [ ] **Verify**: Conversion rates calculated

#### Test 6.4-12: Additional analytics tests
- [ ] Revenue reports
- [ ] Customer insights
- [ ] Inventory analytics
- [ ] Staff performance
- [ ] Feedback analytics
- [ ] Export functionality
- [ ] Date range filtering
- [ ] Real-time updates
- [ ] Chart interactions

---

### 7. Admin Functions (10 tests)

#### Test 7.1: Table Management
- [ ] Create new table
- [ ] **Verify**: Table appears in list
- [ ] Edit table
- [ ] **Verify**: Changes saved
- [ ] Delete table
- [ ] **Verify**: Table removed

#### Test 7.2: Seat Management
- [ ] Navigate to table seats page
- [ ] Auto-generate seats
- [ ] **Verify**: Seats created based on capacity
- [ ] Generate QR for seat
- [ ] **Verify**: QR code created

#### Test 7.3: Menu Management
- [ ] Add menu item
- [ ] **Verify**: Item appears
- [ ] Add translations (RW/FR)
- [ ] **Verify**: Translations saved
- [ ] Update availability
- [ ] **Verify**: Changes reflected

#### Test 7.4: Customer Loyalty
- [ ] Navigate to `/dashboard/loyalty`
- [ ] Look up customer
- [ ] **Verify**: Points balance shown
- [ ] Add points
- [ ] **Verify**: Balance updated
- [ ] Deduct points
- [ ] **Verify**: Transaction logged

#### Test 7.5: Discovery Profile
- [ ] Navigate to `/dashboard/profile`
- [ ] Update profile info
- [ ] Toggle visibility
- [ ] **Verify**: Changes saved
- [ ] View public page
- [ ] **Verify**: Profile displayed correctly

#### Test 7.6-10: Additional admin tests
- [ ] User management
- [ ] Role permissions
- [ ] Notification settings
- [ ] WhatsApp configuration
- [ ] Business settings

---

## ✅ TEST EXECUTION CHECKLIST

### Pre-Testing
- [ ] Deploy to staging environment
- [ ] Verify database migrations applied
- [ ] Verify environment variables set
- [ ] Clear browser cache
- [ ] Prepare test data

### During Testing
- [ ] Document all bugs found
- [ ] Take screenshots of issues
- [ ] Note browser console errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

### Post-Testing
- [ ] Review all test results
- [ ] Prioritize bugs by severity
- [ ] Create bug tickets
- [ ] Retest after fixes
- [ ] Sign off on release

---

## 📊 TEST RESULTS TEMPLATE

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]
Environment: [Staging/Production]

Critical Tests: [X/30] Passed
High Priority: [X/23] Passed
Medium Priority: [X/22] Passed

Overall Pass Rate: [X]%

Bugs Found: [Number]
- Critical: [Number]
- High: [Number]
- Medium: [Number]
- Low: [Number]

Recommendation: [PASS/FAIL/CONDITIONAL PASS]

Notes:
[Additional notes]
```

---

## 🐛 BUG SEVERITY LEVELS

**Critical (P0)**: Blocks deployment
- Payment failures
- Data loss
- Security vulnerabilities
- Complete feature breakdown

**High (P1)**: Should fix before production
- Major feature issues
- Performance problems
- Incorrect calculations
- UX blockers

**Medium (P2)**: Fix in next release
- Minor feature issues
- Cosmetic problems
- Edge cases
- Non-critical errors

**Low (P3)**: Nice to have
- Suggestions
- Enhancements
- Minor cosmetic issues

---

## 📝 AUTOMATED TESTING (Future)

Consider adding:
- [ ] Unit tests (Jest)
- [ ] Integration tests (Playwright)
- [ ] E2E tests (Cypress)
- [ ] Performance tests (Lighthouse)
- [ ] Security tests (OWASP ZAP)

---

**Test Suite Version**: 1.0  
**Last Review**: May 4, 2026  
**Next Review**: After first production deployment
