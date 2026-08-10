# GR-001A: Timezone Alignment Report

**Mission:** Replace all server-local timezone assumptions with `business.timezone` configuration.
**Status:** COMPLETE

---

## 1. Executive Summary

The GR-001 audit identified 65+ `setHours(0,0,0,0)` calls using the server's local timezone, SQL queries hardcoded to `Africa/Kigali`, and manual UTC+2 offset calculations in cron jobs. GR-001A has remediated all three categories by introducing a canonical `getBusinessDayBoundary()` utility and replacing every hardcoded day-boundary calculation with timezone-aware logic driven by `business.timezone`.

**Files modified:** 25+
**Remaining `setHours(0,0,0,0)` in business logic:** 0
**TypeScript compilation:** PASS

---

## 2. Problem Statement (from GR-001)

| Finding | Severity | Impact |
|---|---|---|
| `setHours(0,0,0,0)` uses server local timezone | HIGH | Day boundaries shift incorrectly when server timezone differs from business timezone |
| SQL `AT TIME ZONE 'Africa/Kigali'` hardcoded | HIGH | Analytics queries return wrong time periods for non-Rwanda businesses |
| Manual `utc + 2 * 3600000` in cron | MEDIUM | Cron jobs fire at wrong times if server timezone changes |

---

## 3. Solution Architecture

### Canonical Utility: `src/lib/utils/timezone.ts`

```
getBusinessDayBoundary(date, timezone?) -> { start: Date, end: Date }
getStartOfDay(date, timezone?)          -> Date
getEndOfDay(date, timezone?)            -> Date
getLocalDateString(date, timezone?)     -> string (YYYY-MM-DD)
```

- Uses `Intl.DateTimeFormat` with `timeZone` option for accurate IANA timezone calculations
- All functions default to `Africa/Kigali` for backward compatibility
- Returns UTC `Date` objects representing the correct instant in time

### Pattern Applied

**Business-specific routes/services:**
```typescript
const business = await prisma.business.findUnique({
  where: { id: businessId },
  select: { timezone: true }
})
const { start: dayStart, end: dayEnd } = getBusinessDayBoundary(date, business?.timezone)
```

**Cross-business admin/cron routes:**
```typescript
const { start: dayStart } = getBusinessDayBoundary(date) // uses default timezone
```

---

## 4. Detailed Change Log

### API Routes (12 files)

| File | Function | Change |
|---|---|---|
| `api/dashboard/stats.ts` | Dashboard stats | Fetch business.timezone, use getBusinessDayBoundary |
| `api/dashboard/sales-chart.ts` | Sales chart | Same pattern |
| `api/kitchen/orders.ts` | Kitchen orders | Restructured to fetch timezone before query |
| `api/waiter/queue.ts` | Waiter queue | Fetch business.timezone |
| `api/payments/monitor/stats.ts` | Payment stats | Fetch business.timezone via user.businessId |
| `api/admin/sales-pipeline/index.ts` | Sales pipeline | Cross-business, default timezone |
| `api/cron/addon-renewals.ts` | Addon renewals | Cross-business cron, default timezone |
| `api/cron/subscription-reminders.ts` | Subscription reminders | Cross-business cron, default timezone |
| `api/die/overview/metrics.ts` | DIE overview | Modified startOfDay helper to accept timezone |
| `api/die/operations/metrics.ts` | DIE operations | Same pattern |
| `api/die/events/stream.ts` | DIE events SSE | Timezone captured in SSE closure |
| `api/reports/close-day.ts` | Close day report | Fetch business.timezone |

### Services (12 files)

| File | Functions Changed |
|---|---|
| `reservation.service.ts` | getBusinessReservations, sendReminders, getAvailableSlots |
| `sales.service.ts` | getDailySales |
| `profit.service.ts` | calculateDailyProfit, calculateWeeklyProfit |
| `insight.service.ts` | Removed getKigaliNow() and startOfDayKigali(); rewrote getPeriodRange |
| `financial-truth.service.ts` | getDailyCostBreakdown |
| `payment-metrics.service.ts` | startOfToday |
| `credits/credit-wallet.service.ts` | Wallet creation, monthly renewal |
| `ai-credit.service.ts` | initializeAICredits |
| `discovery-subscription.service.ts` | getDiscoveryStats |
| `analytics.service.ts` | Parameterized `AT TIME ZONE` SQL |
| `outlet.service.ts` | Outlet daily query |
| `report.service.ts` | Report date range |

### Other Files

| File | Change |
|---|---|
| `lib/cron.ts` | Replaced 3 manual UTC+2 calculations with toLocalHHMM() |
| `lib/die/assistant/context-cache.ts` | getTemporalComparisons accepts timezone |
| `lib/intelligence/integration-helper.ts` | buildTimeRange accepts timezone |
| `utils/datetimeRW.ts` | Added optional timezone parameter |
| `services/notification.service.ts` | WhatsApp daily cap uses timezone-aware boundary |
| `api/station/snapshot.ts` | Fetch business.timezone |
| `api/station/orders.ts` | Fetch business.timezone |
| `api/admin/sales-pipeline/[id].ts` | Cross-business, default timezone |
| `api/admin/sales-pipeline/alerts.ts` | Cross-business, default timezone |

---

## 5. Design Decisions

1. **Backward compatibility:** All function signatures use optional `timezone` parameters with `Africa/Kigali` defaults. Existing callers continue to work without changes.

2. **Cross-business routes use default timezone:** Admin aggregation routes and platform-level cron jobs span multiple businesses in a single query. Per-business timezone would require redesigning the query structure. Default timezone is acceptable for single-region deployment and can be parameterized for multi-region.

3. **`Intl.DateTimeFormat` over manual offsets:** The utility uses the browser/Node.js built-in IANA timezone database rather than manual offset calculations. This handles DST transitions correctly.

4. **insight.service.ts rewrite:** The `getKigaliNow()` and `startOfDayKigali()` functions were removed entirely. `getPeriodRange` was rewritten to accept an optional timezone parameter and use `getBusinessDayBoundary` for day boundaries and `getLocalDateString` for local calendar fields.

---

## 6. Verification Results

- **grep for `setHours(0,0,0,0)` in `src/`:** Only in `src/lib/utils/timezone.ts` (fallback for invalid timezone strings)
- **TypeScript compilation:** All GR-001A changes compile cleanly
- **No logic redesign:** All changes preserve existing query structures and variable names

---

## 7. Remaining Considerations

- **Multi-region cron:** Platform-level cron jobs (reconciliation, subscription reminders, addon renewals) use the default timezone. For multi-region deployment, these should be parameterized per region or run per-business.
- **DST:** The `Intl.DateTimeFormat` approach handles DST automatically. No manual DST logic is needed.
- **Database timestamps:** All timestamps continue to be stored in UTC. Only display and day-boundary calculations use the business timezone.
