# FOUNDER-GPV-001 — Security and Failure Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-SECURITY-FAILURE |
| Date | 2026-08-14 |
| Source | Route guards, API middleware, QR token service, webhook handler, session management |

## Overview

This document maps the security verification journey and the failure/recovery journey. These are separate branches that test boundaries and resilience.

---

## Security Journey

### Principle

The founder should verify security through normal UI behavior using safe test accounts. Do NOT perform dangerous security testing against production. Do NOT manipulate production data.

### Security Verification Steps

| Step | Action | Expected Result | Stop Condition |
|---|---|---|---|
| S-01 | Login as Owner of Business A | Owner sees only Business A data | — |
| S-02 | Try to access Business B's dashboard | Cannot access — business isolation enforced | If Business B data is visible → STOP |
| S-03 | Login as Manager | Manager sees dashboard but cannot access settings management | If Manager can change settings → STOP |
| S-04 | Try to process refund as Manager | Refund option not available (orders.refund = false) | If Manager can refund → STOP |
| S-05 | Login as Waiter | Waiter sees waiter workflow, not kitchen display | If Waiter sees kitchen → STOP |
| S-06 | Try to access kitchen as Waiter | Redirected to /dashboard (role guard) | If Waiter accesses kitchen → STOP |
| S-07 | Login as Kitchen Staff | Kitchen staff sees KDS, not payments | If Kitchen sees payments → STOP |
| S-08 | Try to access transactions as Kitchen | Redirected (payments.read = false) | If Kitchen sees transactions → STOP |
| S-09 | Scan invalid QR (wrong signature) | 401 Unauthorized — "Invalid QR signature" | If invalid QR grants access → STOP |
| S-10 | Scan QR from Business B while on Business A | Cannot access — branchId in HMAC doesn't match | If cross-business QR works → STOP |
| S-11 | Access dashboard without login | Redirected to /login | If dashboard loads without auth → STOP |
| S-12 | Access guest order page without QR params | Error: "Invalid or incomplete QR link" | If menu loads without token → STOP |
| S-13 | Logout | Session destroyed, redirected to /login | If session persists after logout → STOP |
| S-14 | Try to access dashboard after logout | Redirected to /login | If dashboard accessible after logout → STOP |
| S-15 | Wait for session expiry (8 hours) | Session expires, redirected to /login | — (may not be practical to wait) |

### Security Mechanisms Verified

| Mechanism | Implementation | Verification |
|---|---|---|
| Business isolation | `resolveBusinessContext` in API middleware — all queries scoped by businessId | S-01, S-02 |
| Role-based access | `getServerSideProps` guards + `requirePermission` middleware | S-03–S-08 |
| QR security | HMAC signature validation in `validateQRSignature()` | S-09, S-10 |
| Authentication required | NextAuth session check on all dashboard routes | S-11 |
| Guest token required | accessToken validation in `/api/public/order/draft` | S-12 |
| Logout | NextAuth signOut destroys JWT | S-13, S-14 |
| Session expiry | JWT maxAge = 8 hours | S-15 |
| Webhook auth | Basic Auth (INTOUCH_WEBHOOK_USERNAME/PASSWORD) | Payment webhook tests |
| Idempotency | IdempotencyService for orders, PaymentCompletionService for webhooks | Payment duplicate tests |

### Security Boundaries

| Boundary | Enforcement Point |
|---|---|
| Owner → another business | API middleware (resolveBusinessContext) |
| Manager → settings management | Permission middleware (settings.manage = false) |
| Manager → refunds | Permission middleware (orders.refund = false) |
| Waiter → kitchen display | getServerSideProps role guard |
| Waiter → payments | Permission middleware (payments.read = false) |
| Kitchen → payments | Permission middleware (payments.read = false) |
| Kitchen → reports | Permission middleware (reports.view = false) |
| Guest → dashboard | NextAuth session required |
| Guest → order without QR | Token validation in API |
| Invalid QR → menu | HMAC signature validation |

---

## Failure / Recovery Journey

### Principle

The founder should test realistic user-facing failure behavior. Do NOT attempt destructive database failure simulations. Engineering has already performed deep failure testing.

### Failure Scenarios

#### F1: Payment Failure

| Step | Action | Expected Result |
|---|---|---|
| F1-01 | Initiate payment via Tap & Leave | PaymentTransaction created (PENDING) |
| F1-02 | Do NOT approve USSD prompt | Payment remains PENDING |
| F1-03 | InTouch sends failure callback | PaymentTransaction → FAILED |
| F1-04 | Check sale status | Sale remains PENDING (not COMPLETED) |
| F1-05 | Check financial ledger | NO FinancialLedgerEntry created |
| F1-06 | Check dashboard revenue | Revenue NOT increased (sale not completed) |
| F1-07 | Check Z-Report | Sale appears in pendingOrders, not in totalRevenue |

**Expected outcome**: Failed payment does NOT create revenue. Financial truth preserved.

#### F2: Payment Pending (Timeout)

| Step | Action | Expected Result |
|---|---|---|
| F2-01 | Initiate payment via Tap & Leave | PaymentTransaction created (PENDING) |
| F2-02 | Do NOT approve USSD prompt | Payment remains PENDING |
| F2-03 | Wait for timeout | Payment remains PENDING (no auto-success) |
| F2-04 | Do NOT manually mark as successful | No unauthorized manual confirmation |

**Expected outcome**: Pending payment does NOT automatically become successful. No manual override unless authorized.

#### F3: Cancelled Reservation

| Step | Action | Expected Result |
|---|---|---|
| F3-01 | Create and confirm reservation | Reservation CONFIRMED, table RESERVED |
| F3-02 | Cancel reservation | Status → CANCELLED, table → AVAILABLE |
| F3-03 | Verify table released | Table shows AVAILABLE |

**Expected outcome**: Cancellation releases the table. No orphaned reservations.

#### F4: No-Show Reservation

| Step | Action | Expected Result |
|---|---|---|
| F4-01 | Create and confirm reservation with deposit | Reservation CONFIRMED, table RESERVED |
| F4-02 | Mark as no-show | Status → NO_SHOW, table → AVAILABLE, deposit forfeited |

**Expected outcome**: No-show releases table and forfeits deposit.

#### F5: Invalid QR Code

| Step | Action | Expected Result |
|---|---|---|
| F5-01 | Create QR code for Business A | HMAC-signed URL generated |
| F5-02 | Modify signature in URL | Signature no longer valid |
| F5-03 | Scan modified QR | 401 Unauthorized — "Invalid QR signature" |
| F5-04 | Create QR with wrong branchId | 404 — "Business not found" |

**Expected outcome**: Invalid QR codes are rejected. No access without valid signature.

#### F6: Duplicate Webhook

| Step | Action | Expected Result |
|---|---|---|
| F6-01 | Payment succeeds, webhook received | PaymentTransaction → SUCCESS, Sale → COMPLETED, Ledger created |
| F6-02 | Same webhook sent again | Idempotency check prevents double processing |
| F6-03 | Verify no duplicate ledger entry | Only one FinancialLedgerEntry for the payment |

**Expected outcome**: Duplicate webhooks do NOT create duplicate financial effects.

#### F7: Expired Session

| Step | Action | Expected Result |
|---|---|---|
| F7-01 | Login and use dashboard | Session active |
| F7-02 | Wait 8+ hours (or clear session) | Session expires |
| F7-03 | Try to access dashboard | Redirected to /login |

**Expected outcome**: Expired sessions require re-authentication. (May not be practical to wait 8 hours — can test by clearing session cookie.)

#### F8: Kitchen Status Skip

| Step | Action | Expected Result |
|---|---|---|
| F8-01 | Order in kitchen (pending) | Status: pending |
| F8-02 | Try to skip to "ready" directly | Status transitions are sequential — each action moves to next column |

**Expected outcome**: Kitchen status transitions follow the defined sequence (pending → accepted → preparing → almost_ready → ready → served).

### Stop Conditions for Failure/Recovery

| Condition | Action |
|---|---|
| Failed payment creates revenue | STOP — Financial truth violated |
| Duplicate webhook creates duplicate ledger entry | STOP — Idempotency failure |
| Invalid QR grants access | STOP — Security boundary violated |
| Cross-business data visible | STOP — Business isolation failed |
| Unauthorized role access succeeds | STOP — Permission boundary violated |
| Session persists after logout | STOP — Session management failure |

### Notification Failure (Non-Critical)

| Scenario | Expected Behavior |
|---|---| 
| Email OTP not delivered | Login cannot complete — founder cannot proceed with MFA |
| WhatsApp OTP not delivered | Fallback to email OTP (if configured) |
| Pusher not connected | Kitchen falls back to polling (5s interval) |
| Twilio not configured | WhatsApp notifications not sent — non-blocking for core flow |
| Slack not configured | Alert escalation not sent — non-blocking for core flow |

**Note**: Notification failures are non-critical for the core business loop but affect the real-time experience and alert system.
