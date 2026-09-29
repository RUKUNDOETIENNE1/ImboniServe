# Payment Reliability Report

**Platform:** ImboniServe  
**Restaurant:** Café Imboni, Kigali, Rwanda  
**Sprint:** Operational Readiness Remediation Sprint (ORRS)  
**Date:** July 26, 2026  

---

## 1. IOS Finding

The IOS identified that payment timeouts were too short, causing premature payment failures:
- Tap & Leave (InTouch) polling timeout was set to 5 minutes
- MoMo payment flow polling timeout was set to 5 minutes (60 attempts × 5 seconds)
- IremboPay invoice expiry was set to 15 minutes
- The generic payment watchdog flagged PENDING payments as stuck after only 10 minutes

These short timeouts caused payment failures for customers who needed more time to approve mobile money prompts, particularly during network congestion or when customers were distracted.

**IOS Recommendation:** Increase payment timeout from 15 to 20 minutes and verify across MTN MoMo, IremboPay, InTouch, and manual completion.

---

## 2. Implementation Details

### 2.1 MoMo Payment Flow (Client-Side Polling)

**File:** `src/components/MoMoPaymentFlow.tsx`

| Parameter | Before | After |
|-----------|--------|-------|
| `maxPollingAttempts` | 60 (5 min at 5s intervals) | 240 (20 min at 5s intervals) |
| Customer-facing message | "within 5 minutes" | "within 20 minutes" |

The polling interval remains 5 seconds. The progress bar and remaining time display automatically adjust based on `maxPollingAttempts`.

### 2.2 Tap & Leave Payment (Client-Side)

**File:** `src/components/TapAndLeaveButton.tsx`

| Parameter | Before | After |
|-----------|--------|-------|
| Auto-stop timeout | `5 * 60 * 1000` (5 min) | `20 * 60 * 1000` (20 min) |
| Comment | "Auto-stop after 5 minutes" | "Auto-stop after 20 minutes" |

The polling interval remains 3 seconds. The timeout is implemented via `setTimeout`.

### 2.3 Tap & Leave Reconciler (Server-Side)

**File:** `src/lib/services/tap-leave-finalization.service.ts`

| Parameter | Before | After |
|-----------|--------|-------|
| Reconciler timeout | `5 * 60 * 1000` (5 min) | `20 * 60 * 1000` (20 min) |

The `reconcilePendingPayments()` method now allows 20 minutes before marking a pending InTouch transaction as timed out. This aligns the server-side timeout with the client-side polling duration.

### 2.4 Cron-Based Tap & Leave Reconciler

**File:** `src/lib/cron.ts` — `scheduleTapLeavePaymentReconcile()`

| Parameter | Before | After |
|-----------|--------|-------|
| Reconciler timeout | `5 * 60 * 1000` (5 min) | `20 * 60 * 1000` (20 min) |

The cron job runs every 2 minutes and checks for pending InTouch transactions. Transactions older than 20 minutes are marked as FAILED with timeout flag.

### 2.5 Generic Payment Watchdog

**File:** `src/lib/cron.ts` — `scheduleGenericPaymentWatchdog()`

| Parameter | Before | After |
|-----------|--------|-------|
| PENDING threshold | 10 minutes | 20 minutes |
| PROCESSING threshold | 15 minutes | 25 minutes |

The watchdog now aligns with the 20-minute payment timeout. PENDING payments are only flagged as stuck after 20 minutes (previously 10). PROCESSING threshold increased proportionally to 25 minutes.

### 2.6 IremboPay Invoice Expiry

**File:** `src/lib/services/irembopay.service.ts`

| Parameter | Before | After |
|-----------|--------|-------|
| Invoice `expiryAt` | `Date.now() + 15 * 60 * 1000` (15 min) | `Date.now() + 20 * 60 * 1000` (20 min) |

IremboPay invoices now expire after 20 minutes, giving customers a consistent timeout window across all payment methods.

---

## 3. Payment Method Coverage

| Payment Method | Component | Timeout Before | Timeout After | Status |
|---------------|-----------|---------------|---------------|--------|
| MTN MoMo (via InTouch) | `MoMoPaymentFlow.tsx` | 5 min | 20 min | ✅ Updated |
| Airtel Money (via InTouch) | `MoMoPaymentFlow.tsx` | 5 min | 20 min | ✅ Updated |
| Tap & Leave (InTouch) | `TapAndLeaveButton.tsx` | 5 min | 20 min | ✅ Updated |
| Tap & Leave reconciler | `tap-leave-finalization.service.ts` | 5 min | 20 min | ✅ Updated |
| Tap & Leave cron | `cron.ts` | 5 min | 20 min | ✅ Updated |
| IremboPay | `irembopay.service.ts` | 15 min | 20 min | ✅ Updated |
| Generic watchdog | `cron.ts` | 10 min | 20 min | ✅ Updated |
| Manual completion | N/A | No timeout | No timeout | ✅ Unaffected |

---

## 4. Duplicate Payment Prevention

The existing duplicate payment prevention mechanisms remain unchanged:

- **Transaction ID uniqueness:** Each payment initiation generates a unique `requestTransactionId`
- **Idempotency keys:** Payment ledger entries use unique idempotency keys
- **Status checks:** Before finalization, the system checks current payment status
- **Reconciler idempotency:** The sweeper checks `rawStatus.finalizedAt` before processing

No changes were made to these safeguards.

---

## 5. Orphaned Transaction Prevention

The existing orphaned transaction prevention remains unchanged:

- **Reconciler cron:** Runs every 2 minutes, polls pending InTouch transactions and resolves them
- **Finalization sweeper:** Runs every 1 minute, recovers SUCCESS payments that missed finalization
- **Generic watchdog:** Monitors all providers for stuck PENDING/PROCESSING payments

The watchdog threshold was increased from 10 to 20 minutes to align with the new timeout, preventing false-positive stuck payment alerts.

---

## 6. Reconciliation Integrity

- **No reconciliation inconsistencies:** The timeout change only affects when transactions are marked as FAILED — the reconciliation logic (success → finalize, failure → mark failed, timeout → mark failed) is unchanged
- **No orphaned transactions:** The reconciler continues to poll and resolve pending transactions; the only change is the age threshold for timeout
- **Ledger events:** All timeout-related ledger events still emit with `source: 'tap-leave/reconciler'` and `timeout: true` metadata

---

## 7. Verification

- **No duplicate payments:** Existing idempotency and uniqueness safeguards unchanged ✅
- **No reconciliation inconsistencies:** Reconciliation logic unchanged, only timeout threshold modified ✅
- **No orphaned transactions:** Reconciler and sweeper continue to operate, with aligned thresholds ✅
- **MTN MoMo:** Polling timeout increased to 20 minutes ✅
- **IremboPay:** Invoice expiry increased to 20 minutes ✅
- **InTouch:** Reconciler timeout increased to 20 minutes ✅
- **Manual completion:** Unaffected — no timeout changes needed ✅
- **Customer-facing messaging:** Updated to reflect 20-minute window ✅
- **Watchdog alignment:** PENDING threshold aligned with payment timeout ✅

---

## 8. Impact Assessment

**Positive Impact:**
- Customers have 4× more time to approve MoMo/Tap & Leave payments (5→20 min)
- IremboPay customers have 33% more time (15→20 min)
- Reduced false-positive stuck payment alerts from watchdog
- Consistent 20-minute timeout across all payment methods

**Risk Assessment:**
- Genuinely stuck payments take longer to be marked as failed (20 min vs 5 min)
- Mitigated by: reconciler still polls every 2 minutes; successful payments are resolved immediately regardless of timeout
- Watchdog still alerts on high stuck payment counts after 20-minute threshold

---

*Report generated: July 26, 2026*
