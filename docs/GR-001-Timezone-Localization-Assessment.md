# GR-001 — Timezone & Localization Assessment

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

**Risk Level:** CRITICAL for international expansion; LOW for Rwanda operations.

The timezone architecture has the right data model (Business.timezone, SupportedTimezone model) but the service layer extensively uses server-local timezone for day boundaries, which will produce incorrect reports for businesses in different timezones.

---

## 1. Timezone Architecture

### 1.1 Data Model (✅ Good)
```prisma
// prisma/schema.prisma
// Business model line 122
timezone String @default("Africa/Kigali")

// User model line 73
timezone String @default("Africa/Kigali")

// SupportedTimezone model lines 2800-2805
model SupportedTimezone {
  id          String   @id // IANA timezone identifier
  name        String
  utcOffset   String
  countryCode String?
  isActive    Boolean  @default(true)
}
```
The data model supports IANA timezone identifiers per business and per user. A SupportedTimezone model exists for validation.

### 1.2 Day Boundary Calculation (❌ CRITICAL)
65+ occurrences of `setHours(0,0,0,0)` create dates in the server's local timezone:

| File | Lines | Impact |
|------|-------|--------|
| `src/pages/api/reports/close-day.ts` | 18, 261 | Z-Report day boundaries wrong |
| `src/lib/services/reservation.service.ts` | 107, 435, 481 | Reservation queries wrong |
| `src/lib/services/sales.service.ts` | 288 | Sales reports wrong |
| `src/lib/services/profit.service.ts` | 15, 70 | Profit calculations wrong |
| `src/lib/services/financial-truth.service.ts` | 297 | Financial truth wrong |
| `src/lib/intelligence/integration-helper.ts` | 256, 269, 281 | Intelligence data wrong |
| `src/pages/api/dashboard/stats.ts` | 19 | Dashboard stats wrong |
| `src/pages/api/dashboard/sales-chart.ts` | 19 | Sales chart wrong |
| `src/pages/api/kitchen/orders.ts` | 21 | Kitchen orders wrong |
| `src/pages/api/admin/sales-pipeline/index.ts` | 23 | Sales pipeline wrong |
| `src/pages/api/waiter/queue.ts` | 76 | Waiter queue wrong |
| `src/pages/api/payments/monitor/stats.ts` | 30 | Payment stats wrong |
| `src/lib/services/payment-metrics.service.ts` | 9 | Payment metrics wrong |
| `src/lib/services/insight.service.ts` | 16 | Insights wrong |
| `src/lib/services/credits/credit-wallet.service.ts` | 66, 143 | Credit renewal wrong |
| `src/lib/services/ai-credit.service.ts` | 251 | AI credit reset wrong |
| `src/lib/die/assistant/context-cache.ts` | 205 | AI context wrong |
| `src/lib/services/discovery-subscription.service.ts` | 325 | Discovery billing wrong |
| `src/pages/api/cron/addon-renewals.ts` | 33 | Addon renewals wrong |
| `src/pages/api/cron/subscription-reminders.ts` | 42 | Subscription reminders wrong |
| `src/pages/api/die/overview/metrics.ts` | 7 | DIE metrics wrong |
| `src/pages/api/die/operations/metrics.ts` | 7 | DIE operations wrong |
| `src/pages/api/die/events/stream.ts` | 7 | DIE events wrong |

**Root Cause:** `setHours(0,0,0,0)` creates a Date object in the server's local timezone. On Vercel, the server runs in UTC. This means day boundaries are calculated as UTC midnight, not the business's local midnight.

**For Rwanda (UTC+2):** A business day from 6:00 AM to 11:00 PM local time spans UTC 04:00 to 21:00. Using UTC midnight as the day boundary means the Z-Report would include orders from 04:00 UTC (06:00 local) to 23:59 UTC (01:59 local next day) — splitting the business day across two UTC days.

### 1.3 Manual Timezone Offset Calculations (❌ Architecture Risk)
```typescript
// src/lib/cron.ts lines 339-341
const utc = now.getTime() + now.getTimezoneOffset() * 60000
const kigali = new Date(utc + 2 * 3600000) // Hardcoded UTC+2

// src/lib/services/insight.service.ts lines 9-11
function getKigaliNow() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 2 * 3600000) // Hardcoded UTC+2
}
```
Manual offset calculations are error-prone and don't handle daylight saving time. Rwanda doesn't observe DST, but this pattern would break for any country that does.

### 1.4 SQL Queries Hardcoded to Africa/Kigali (❌ Architecture Risk)
```sql
// src/lib/services/analytics.service.ts lines 17, 77
DATE_TRUNC('day', "createdAt" AT TIME ZONE 'Africa/Kigali')::date::text AS day
EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'Africa/Kigali')::int AS hour
```
Analytics queries hardcode Africa/Kigali timezone. For a business in Nairobi (Africa/Nairobi), analytics would be calculated using Kigali time.

### 1.5 Proper Timezone Handling (✅ Exists but Underutilized)
```typescript
// src/lib/utils/timezone.ts
// Properly uses Intl.DateTimeFormat with timezone parameter

// src/lib/cron.ts lines 20-33
function toLocalHHMM(date: Date, timezone: string): string {
  try {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone })
  } catch {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' })
  }
}

// src/lib/service-replay/time-utils.ts
// Properly uses Intl.DateTimeFormat with timezone parameter
```
Proper timezone utilities exist but are not used in the 65+ locations that use `setHours(0,0,0,0)`.

### 1.6 Vercel Cron Jobs (⚠️ Acceptable)
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/addon-renewals", "schedule": "0 2 * * *" },
    { "path": "/api/cron/reconciliation", "schedule": "0 3 * * *" }
  ]
}
```
Vercel cron schedules are in UTC. This is acceptable for platform-level tasks. For business-specific tasks (daily reports), `src/lib/cron.ts` correctly uses business timezone to determine when to send reports.

### 1.7 Hardcoded Timezone in Date Utilities (❌ Architecture Risk)
```typescript
// src/utils/datetimeRW.ts lines 8-18
const options: Intl.DateTimeFormatOptions = {
  timeZone: 'Africa/Kigali', // Hardcoded
}
```
A date utility function hardcodes Africa/Kigali timezone.

---

## 2. Locale & Regional Formatting

### 2.1 i18n Configuration (✅ Good)
```javascript
// next.config.js lines 77-81
i18n: {
  locales: ['en', 'fr', 'rw'],
  defaultLocale: 'en',
  localeDetection: false,
}
```
3 locales supported: English, French, Kinyarwanda.

### 2.2 Translation Files (✅ Good)
- `src/locales/en.json`
- `src/locales/fr.json`
- `src/locales/rw.json`
- `public/locales/en.json` (duplicate)
- `public/locales/fr.json` (duplicate)
- `public/locales/rw.json` (duplicate)

**Issue:** Duplicate locale files between `src/locales` and `public/locales` — should be consolidated.

### 2.3 Date Formatting (⚠️ Mixed)
```typescript
// src/pages/dashboard/close-day.tsx lines 111-114
return new Date(dateStr).toLocaleDateString('en-US', { ... }) // Hardcoded en-US

// src/lib/cron.ts line 30
return date.toLocaleDateString('en-CA', { timeZone: timezone }) // Hardcoded en-CA

// src/utils/datetimeRW.ts lines 7-8
const locale = language === 'rw' ? 'rw-RW' : 'en-RW' // Locale-aware
```
Most date formatting uses hardcoded locales (en-US, en-GB, en-CA) instead of the user's `locale` field from the database.

### 2.4 Number Formatting (⚠️ Mixed)
```typescript
// src/lib/utils/currency.ts lines 176-179
formattedNumber = convertedAmount.toLocaleString('en-US', { ... }) // Hardcoded en-US

// src/pages/admin/affiliates.tsx line 312
(payout.totalAmountCents / 100).toLocaleString() // Browser locale
```
Number formatting uses hardcoded en-US or browser locale, not user's preferred locale.

### 2.5 Menu Translations (✅ Good)
```prisma
// prisma/schema.prisma lines 1738-1750
model MenuItemTranslation {
  id          String   @id @default(cuid())
  menuItemId  String
  locale      String
  name        String
  description String?
}
```
Menu items support multilingual translations.

---

## 3. Address & Contact Architecture

### 3.1 Country Field (✅ Good)
```prisma
// prisma/schema.prisma line 114
country String @default("RW")
```
Country field exists on Business, User, and other models with Rwanda default.

### 3.2 GPS Coordinates (✅ Good)
```prisma
// prisma/schema.prisma lines 115-116
latitude Float?
longitude Float?
```
GPS coordinates supported on Business, User, Branch, and Outlet models.

### 3.3 Location Autocomplete (✅ Global)
```typescript
// src/components/LocationAutocomplete.tsx lines 58-89
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
)
```
Uses OpenStreetMap Nominatim API — global, not Rwanda-specific.

### 3.4 City Field (⚠️ Rwanda Default)
```prisma
// prisma/schema.prisma line 112
city String @default("Kigali")
```
City defaults to "Kigali" but is a free text field with global autocomplete.

### 3.5 District Field (⚠️ Rwanda-Specific)
```prisma
// prisma/schema.prisma line 113
district String?
```
"District" is a Rwanda administrative division. Other countries use states, provinces, counties, etc. The field is optional and free text, so it can be repurposed, but the naming is Rwanda-specific.

### 3.6 No Postal/Zip Code (❌ Missing)
No postalCode or zipCode field exists in the Prisma schema. This prevents postal code-based features for international addresses.

### 3.7 Phone Number Normalization (❌ CRITICAL)
12 duplicate `normalizePhone` functions, all hardcoded to Rwanda +250:

```typescript
// src/lib/services/guest-recognition.service.ts lines 122-128
export function normalizePhone(phone: string): string {
  const p = phone.trim()
  if (p.startsWith('+')) return p
  if (p.startsWith('07')) return `+250${p.slice(1)}` // Rwanda
  if (p.startsWith('2507')) return `+${p}` // Rwanda
  return p.startsWith('0') ? `+250${p.slice(1)}` : `+${p}` // Assumes Rwanda
}
```

**Locations of duplicate normalizePhone:**
1. `src/lib/services/guest-recognition.service.ts`
2. `src/lib/services/notification.service.ts`
3. `src/lib/services/whatsapp-cloud.service.ts`
4. `src/lib/services/otp.service.ts`
5. `src/lib/services/intouch.service.ts`
6. `src/lib/services/mtn-momo.service.ts`
7. `src/pages/api/public/order/draft.ts`
8. `src/pages/api/public/otp/verify.ts`
9. `src/pages/api/public/otp/request.ts`

**Impact:** Any phone number starting with "07" or "0" will be treated as a Rwanda number, even if the business is in Kenya (where numbers start with "07" but use +254).

### 3.8 Phone Number Placeholders (⚠️ Rwanda-Specific)
| File | Line | Placeholder |
|------|------|-------------|
| `src/pages/signup.tsx` | 237 | `+250788123456` |
| `src/pages/store/checkout.tsx` | 197 | `+250 XXX XXX XXX` |
| `src/pages/refer/index.tsx` | 136 | `+250788123456` |
| `src/pages/admin/partnership-applications/new.tsx` | 132 | `e.g., +250788123456` |

---

## 4. Architecture Classification

| Finding | Classification |
|---------|---------------|
| Business.timezone field | Already Global |
| User.timezone field | Already Global |
| SupportedTimezone model | Already Global |
| i18n with 3 locales | Already Global |
| MenuItemTranslation model | Already Global |
| GPS coordinates | Already Global |
| LocationAutocomplete (OpenStreetMap) | Already Global |
| Country field | Already Global |
| Proper timezone utilities (timezone.ts) | Already Global |
| 65+ setHours(0,0,0,0) | Immediate Architecture Risk |
| Manual UTC+2 offset calculations | Immediate Architecture Risk |
| SQL hardcoded to Africa/Kigali | Immediate Architecture Risk |
| Phone normalization hardcoded +250 | Immediate Architecture Risk |
| datetimeRW.ts hardcoded timezone | Rwanda-Specific Assumption |
| City default "Kigali" | Configurable |
| District field naming | Rwanda-Specific Assumption |
| No postal/zip code | Future Evolution |
| Date formatting hardcoded locale | Rwanda-Specific Assumption |
| Duplicate locale files | Future Evolution |

---

## 5. Recommendations

### Immediate Actions (Before International Expansion)
1. Replace all 65+ `setHours(0,0,0,0)` with timezone-aware day boundary calculation using business.timezone
2. Replace manual UTC+2 offset calculations with `Intl.DateTimeFormat` using business.timezone
3. Replace hardcoded `AT TIME ZONE 'Africa/Kigali'` in SQL queries with business timezone parameter
4. Create a single country-aware `normalizePhone` function that uses business.country for default country code
5. Remove 11 duplicate `normalizePhone` functions and use the single canonical implementation
6. Replace hardcoded timezone in `datetimeRW.ts` with business.timezone parameter

### Before International Expansion
7. Add postal/zip code field to Business model
8. Use user's `locale` field for all date/time formatting instead of hardcoded en-US/en-GB
9. Consolidate duplicate locale files (src/locales vs public/locales)
10. Rename "district" to a more generic name (e.g., "region") or make it configurable per country

### Post-Growth Evolution
11. Add a timezone-aware date utility library (luxon or date-fns-tz) to replace manual calculations
12. Implement country-specific address format validation
13. Add province/state field for countries that use them
