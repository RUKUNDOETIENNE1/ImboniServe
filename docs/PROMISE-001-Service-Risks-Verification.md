# PROMISE-001 — Service Risks Verification

**Document:** PROMISE-001-Service-Risks-Verification.md
**Phase:** PROMISE-001 — ImboniServe Promise Engine™ Integration, Simulation & Operational Certification
**Date:** 2026-08-13
**Status:** VERIFIED

---

## 1. Purpose

Verify the Service Risks API and dashboard against actual database state, ensuring correct states, elapsed time, breach countdown, business isolation, and no misleading "risk" after fulfillment.

---

## 2. API: GET /api/service-risks

**File:** `src/pages/api/service-risks/index.ts`

Returns active service promise risks (WARNING / CRITICAL) for the authenticated business.

### Response Shape

```json
{
  "risks": [
    {
      "id": "promise-1",
      "saleId": "sale-1",
      "orderNumber": "ORD-001",
      "promiseType": "ORDER_PREPARATION",
      "state": "CRITICAL",
      "elapsedMinutes": 18,
      "warningAfterMinutes": 8,
      "breachAfterMinutes": 15,
      "expectedAt": "2026-08-13T12:15:00.000Z",
      "startedAt": "2026-08-13T12:00:00.000Z"
    }
  ],
  "total": 1,
  "criticalCount": 1,
  "warningCount": 0
}
```

### Verification

- ✅ Only WARNING and CRITICAL promises returned (query filters by `state: { in: ['WARNING', 'CRITICAL'] }`)
- ✅ Business isolation: uses `resolveBusinessContext(req, res)` to extract businessId from session
- ✅ Elapsed time computed from `startedAt` to `now`
- ✅ No terminal promises (FULFILLED, FAILED, RECOVERED) appear as active risks
- ✅ 401 if unauthenticated
- ✅ 405 if not GET

---

## 3. API: GET /api/service-risks/stats

**File:** `src/pages/api/service-risks/stats.ts`

Returns aggregate promise statistics for the authenticated business.

### Response Shape

```json
{
  "active": 3,
  "today": {
    "total": 15,
    "fulfilled": 10,
    "failed": 2,
    "recovered": 1,
    "onTimeRate": 77
  }
}
```

### On-Time Rate Calculation

**Fixed during PROMISE-001:** The on-time rate is now calculated as:

```
onTimeRate = fulfilled / (fulfilled + failed + recovered) * 100
```

Only completed promises are counted. Recovered promises were delivered late (after breach), so they count against the on-time rate. Previously, the calculation used `fulfilled / total` which included active (not-yet-completed) promises, producing misleading rates.

### Verification

- ✅ Active count: promises in ON_TRACK, WARNING, CRITICAL states
- ✅ Today's total: all promises created today
- ✅ Fulfilled: promises with state FULFILLED and fulfilledAt today
- ✅ Failed: promises with state FAILED and failedAt today
- ✅ Recovered: promises with state RECOVERED and recoveredAt today
- ✅ On-time rate: based on completed promises only
- ✅ Business isolation: all counts filtered by businessId
- ✅ Derives truth from actual Promise records, not hardcoded values

---

## 4. Dashboard: /dashboard/operations/service-risks

**File:** `src/pages/dashboard/operations/service-risks.tsx`

### Features

- **Auto-refresh:** Every 30 seconds
- **Role-gated:** OWNER, MANAGER, ADMIN, SUPERVISOR, CHEF, KITCHEN_STAFF
- **Stat cards:** Active Promises, On-Time Rate Today, Fulfilled Today, Failed Today
- **Critical risks section:** Red cards with AlertOctagon icon, shows elapsed time and "Breached Xm ago"
- **Warning risks section:** Amber cards with AlertTriangle icon, shows elapsed time and "Xm to breach"
- **All Clear state:** Green checkmark when no active risks
- **Manual refresh button**

### Risk Card Display

Each risk card shows:
- Order number
- Promise type (human-readable, e.g., "order preparation")
- Elapsed time (large, prominent)
- Breach countdown: "Xm to breach" (warning) or "Breached Xm ago" (critical)
- Warning threshold and breach threshold

### Verification

- ✅ Stat cards reflect actual records from API
- ✅ Warning cards appear when WARNING promises exist
- ✅ Critical cards appear when CRITICAL promises exist
- ✅ Elapsed time is correct (computed from startedAt)
- ✅ Countdown is correct (breachAfterMinutes - elapsedMinutes)
- ✅ Business isolation works (businessId from session)
- ✅ Auto-refresh works (30-second interval)
- ✅ Resolved promises disappear from active risks (terminal states not in query)
- ✅ No misleading "risk" remains after fulfillment

---

## 5. Certification

Service Risks API and dashboard are **VERIFIED**. The API derives its truth from actual Promise records, the dashboard reflects real data, business isolation is enforced, and resolved promises correctly disappear from active risks.
