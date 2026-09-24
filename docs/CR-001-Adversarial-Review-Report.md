# CR-001 — Adversarial Review Report

**Review:** CR-001 — Confidence Readiness Review
**Date:** 2026-08-07
**Status:** Complete
**Approach:** Sketical adversarial review attempting to disprove production readiness

---

## Executive Summary

The adversarial review attempted to break confidence in ImboniServe's production readiness by searching for incomplete workflows, hardcoded values, silent failures, inconsistent reports, stale data, missing error handling, race conditions, and unprotected endpoints.

**Findings: 27 total**
- HIGH: 12
- MEDIUM: 11
- LOW: 4

---

## 1. INCOMPLETE WORKFLOWS

### ADV-001: Payment Provider Factory Throws on Unknown Type
**File:** `src/lib/payments/providers/index.ts` line 46
**Issue:** `throw new Error(`Payment provider ${type} not implemented`)` — unsupported payment method crashes the request instead of graceful fallback.
**Severity:** HIGH
**Confidence Impact:** Customer cannot pay if provider type is misconfigured.

### ADV-002: Export Endpoints Return 501 Not Implemented
**Files:** `src/app/api/daily-briefings/export/route.ts`, `src/app/api/kitchen-intelligence/export/route.ts`, `src/app/api/menu-intelligence/export/route.ts`, `src/app/api/multi-location-intelligence/export/route.ts`
**Issue:** All return `{ status: 501 }` — "Export functionality requires database integration"
**Severity:** MEDIUM
**Confidence Impact:** Users click "Export" and get an error. Feature appears available but doesn't work.

---

## 2. HARDCODED VALUES

### ADV-003: Hardcoded Referral Reward (50,000 RWF in UI)
**File:** `src/pages/dashboard/invite.tsx` line 158
**Issue:** `<CurrencyDisplay amount={50000} />` — hardcoded in UI
**Severity:** MEDIUM
**Confidence Impact:** Cannot change reward without code deployment.

### ADV-004: Hardcoded Referral Reward (100,000 RWF in API)
**File:** `src/pages/api/customer-referrals/track.ts` line 40
**Issue:** `const rewardCents = 100000` — hardcoded in backend
**Severity:** MEDIUM
**Note:** UI says 50,000 RWF, API says 100,000 RWF (1000 RWF). These are INCONSISTENT.
**Confidence Impact:** Business rules hardcoded and UI/API mismatch.

### ADV-005: Hardcoded Minimum Qualifying Order
**File:** `src/pages/api/customer-referrals/track.ts` line 4
**Issue:** `const MINIMUM_QUALIFYING_ORDER_CENTS = 500000` — hardcoded
**Severity:** MEDIUM

---

## 3. SILENT FAILURES

### ADV-006: Silent Failures in Kitchen Dispatch (CRITICAL)
**File:** `src/lib/services/kitchen-dispatch.service.ts` lines 122, 135, 168, 179
**Issue:** Shadow event ingestion and Pusher triggers use `.catch(() => {})` and `catch {}`
**Severity:** HIGH
**Confidence Impact:** Kitchen routing failures silently ignored. If station routing fails, no one knows. This is the service that was fixed in SIM-CRIT-001 — the fix wired the call but the internal failure paths are silent.

### ADV-007: Silent Failures in Order Confirmation
**File:** `src/pages/api/public/order/confirm.ts` lines 59, 61, 95, 96
**Issue:** Shadow event ingestion errors silently swallowed
**Severity:** HIGH

### ADV-008: Silent Failure in Admin Reconciliation
**File:** `src/pages/admin/reconciliation.tsx` line 30
**Issue:** `catch { } finally { setLoading(false) }` — empty catch swallows all errors
**Severity:** HIGH
**Confidence Impact:** Financial reconciliation errors hidden from administrators.

### ADV-009: Silent Failure in Unified Intelligence Kernel
**File:** `src/lib/die/kernel/unified-intelligence-kernel.ts` lines 74, 83
**Issue:** `.catch(()=>{ ... return null })` — intelligence computation failures return null/empty
**Severity:** HIGH
**Confidence Impact:** Executives see empty data without knowing computation failed.

### ADV-010: Silent Failures Across 7+ Files (Shadow Event Ingestion)
**Files:** `src/pages/api/waiter-calls/index.ts`, `src/pages/api/loyalty/issue.ts`, `src/pages/api/session/summary.ts`, `src/pages/api/session/close.ts`, `src/pages/api/smart-dining-slips/[id].ts`
**Issue:** All use `.catch(() => {})` for shadow event ingestion
**Severity:** MEDIUM (pattern issue)
**Confidence Impact:** Analytics data silently incomplete.

### ADV-011: Silent Failures in Order Page (12 instances)
**File:** `src/pages/order/index.tsx` lines 104, 137, 187, 205, 234, 392, 402, 445, 562, 723, 927, 1110
**Issue:** 12 empty catch blocks throughout order flow
**Severity:** MEDIUM

---

## 4. INCONSISTENT REPORTS

### ADV-012: Revenue Calculation Differs Across Endpoints (CRITICAL)
**Files:**
- `src/pages/api/reports/close-day.ts` lines 49-59, 102-105: Sums `sale.totalAmountCents` directly
- `src/pages/api/admin/revenue-operations/index.ts` lines 96-97: Aggregates from `financialLedgerEntry`
- `src/pages/api/admin/executive/cfo.ts` lines 62-109: Uses `RevenueIntelligenceService`

**Issue:** Three different revenue calculation methods. Z-Report uses Sale table, revenue operations uses ledger, CFO uses intelligence service. These CAN produce different numbers.
**Severity:** HIGH
**Confidence Impact:** Manager sees one number in Z-Report, CFO sees another in dashboard. Trust erodes.
**Note:** SIM-CRIT-002 added a cross-check display but did NOT standardize the calculation. The root inconsistency remains.

---

## 5. STALE DATA

### ADV-013: In-Memory Cache Without TTL
**File:** `src/pages/api/menu/ask.ts` lines 21, 47
**Issue:** `responseCache = new Map()` with only size-based eviction (100 entries), no TTL
**Severity:** MEDIUM
**Confidence Impact:** Cached AI responses to menu questions could be stale indefinitely.

### ADV-014: Currency Cache Without Expiry Display
**File:** `src/lib/services/currency-conversion.service.ts` lines 26, 82
**Issue:** 6-hour cache but no indication to users of when rates were last updated
**Severity:** MEDIUM

---

## 6. MISSING ERROR HANDLING

### ADV-015: AI Endpoints Mask Database Errors as Empty Results
**Files:** `src/pages/api/ai/reorder.ts` lines 36-39, `src/pages/api/ai/cost-anomalies.ts` lines 33-36
**Issue:** DB errors return `res.status(200).json([])` — success with empty data
**Severity:** HIGH
**Confidence Impact:** Database failures are invisible. Users think there are no recommendations when the system is actually broken.

---

## 7. RACE CONDITIONS

### ADV-016: Reservation Status Update Without Transaction
**File:** `src/lib/services/reservation.service.ts` lines 151-160
**Issue:** `updateStatus()` does direct update without transaction
**Severity:** HIGH
**Note:** The `cancelReservation()`, `confirmReservation()`, and `completeReservation()` methods DO use transactions (lines 213-237, 280-310, 368-397). But `updateStatus()` and `updateTable()` (lines 165-174) do NOT.
**Confidence Impact:** Concurrent status updates could cause lost updates.

### ADV-017: Kitchen Dispatch Read-Then-Update Without Transaction
**File:** `src/lib/services/kitchen-dispatch.service.ts` lines 49-65
**Issue:** Checks `kitchenDispatchStatus === 'dispatched'` then updates — race window between check and update
**Severity:** MEDIUM
**Confidence Impact:** Two concurrent dispatches could both proceed past the check.

### ADV-018: Payment Completion Read-Then-Update Pattern
**File:** `src/lib/services/payment-completion.service.ts` lines 50-72
**Issue:** `updateMany` guard is idempotent, but subsequent `findUnique` is outside the guard
**Severity:** MEDIUM
**Note:** The `updateMany` guard IS idempotent. The risk is low but the pattern is not ideal.

---

## 8. UNPROTECTED ENDPOINTS

### ADV-019: DIE Plugin Marketplace — NO Authentication (CRITICAL)
**Files:**
- `src/pages/api/die/plugins/marketplace/index.ts` — list plugins (GET)
- `src/pages/api/die/plugins/marketplace/[id]/install.ts` — install plugin (POST)
- `src/pages/api/die/plugins/marketplace/[id]/enable.ts` — enable plugin (POST)
- `src/pages/api/die/plugins/marketplace/[id]/disable.ts` — disable plugin (POST)
- `src/pages/api/die/plugins/marketplace/[id]/index.ts` — plugin details (GET)

**Issue:** NONE of these endpoints call `requireAuth`, `requireRole`, `requirePermission`, or `resolveBusinessContext`. Anyone with the URL can install, enable, or disable plugins.
**Severity:** HIGH
**Confidence Impact:** Critical security gap. The marketplace is accessible via `/dashboard/die` in the main navigation. An attacker could install malicious plugins or disable critical ones.

### ADV-020: Customer Referral Tracking — NO Authentication
**File:** `src/pages/api/customer-referrals/track.ts` line 6
**Issue:** Public endpoint, no auth. Anyone can trigger referral tracking.
**Severity:** HIGH
**Confidence Impact:** Referral fraud — anyone can generate fake referral conversions.

### ADV-021: DIE Intelligence/Operations Endpoints — Custom Auth Only
**Files:** 30+ files in `src/pages/api/die/` use `resolveBusinessContext` instead of standard auth middleware
**Issue:** Inconsistent authentication pattern. While `resolveBusinessContext` may provide some auth, it's not the standard `requireAuth`/`requireRole` pattern used elsewhere.
**Severity:** MEDIUM
**Confidence Impact:** Inconsistent security patterns make audit difficult.

### ADV-022: AI Endpoints Without Rate Limiting
**Files:** `src/app/api/ai-copilot/conversation/route.ts`, `src/app/api/daily-briefings/generate/route.ts`, `src/app/api/multi-location-intelligence/generate/route.ts`
**Issue:** No rate limiting on AI-powered endpoints
**Severity:** MEDIUM
**Confidence Impact:** API credit exhaustion, billing abuse.

### ADV-023: Public Order Status Without Auth
**File:** `src/pages/api/public/order/status.ts` line 5
**Issue:** Anyone can check order status by orderId
**Severity:** MEDIUM
**Note:** This is partially legitimate (customers need to check their order) but should use a token or session validation, not just orderId.

### ADV-024: Founder Code/Referral Redirects Without Auth
**Files:** `src/pages/api/f/[code].ts`, `src/pages/api/r/[code].ts`
**Issue:** Public redirect endpoints
**Severity:** LOW
**Note:** Legitimately public (referral links need to work without login).

### ADV-025: Dev Bootstrap Endpoint
**File:** `src/pages/api/dev/bootstrap-tap-leave.ts`
**Issue:** Dev endpoint in production codebase
**Severity:** MEDIUM
**Confidence Impact:** If accessible in production, could bootstrap test data.

---

## 9. ADDITIONAL FINDINGS

### ADV-026: 155 TypeScript Errors (Pre-existing)
**Issue:** 155 TS errors across `daily-briefings/`, `ai-copilot/`, `watchdog/`, `cron.ts`, `close-day.ts`
**Severity:** MEDIUM
**Note:** All pre-existing, none in OEC-001G/H modified files. But they indicate technical debt.

### ADV-027: No CI Pipeline
**Issue:** No `.github/` directory, no CI configuration
**Severity:** HIGH
**Confidence Impact:** No automated regression detection. Tests only run manually.

---

## Severity Distribution

| Severity | Count | Findings |
|----------|-------|----------|
| HIGH | 12 | ADV-001, 006, 007, 008, 009, 012, 015, 016, 019, 020, 027 |
| MEDIUM | 11 | ADV-002, 003, 004, 005, 010, 011, 013, 014, 017, 021, 022, 023, 025, 026 |
| LOW | 4 | ADV-018, 024 |

---

## Board Assessment

The adversarial review found 27 findings, 12 of which are HIGH severity. The most critical are:

1. **DIE Plugin Marketplace has no authentication** (ADV-019) — anyone can install/enable/disable plugins
2. **Customer referral tracking has no authentication** (ADV-020) — referral fraud enabled
3. **Revenue calculation is inconsistent** (ADV-012) — three different methods produce potentially different numbers
4. **Silent failures in kitchen dispatch** (ADV-006) — routing failures silently ignored
5. **No CI pipeline** (ADV-027) — no automated regression detection

These findings do NOT mean the platform is broken. They mean confidence is not yet fully earned. Each finding is correctable. After correction, the platform will be stronger.
