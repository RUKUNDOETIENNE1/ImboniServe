# Returning Guest Recognition — Architecture & Integration Guide

## Overview

The Guest Recognition system automatically identifies returning guests across all ordering channels (QR ordering, waiter POS, remote pre-order), delivers a hospitality-focused welcome experience, personalizes recommendations based on order history, and continuously updates visit statistics, loyalty points, VIP tiers, and customer preferences after every completed order.

## Architecture

### Single Recognition Flow

All guest recognition flows through **one canonical service**: `GuestRecognitionService` (`src/lib/services/guest-recognition.service.ts`). This service wraps the existing `CustomerService` primitives and adds intelligence aggregation, preference learning, and VIP tier calculation.

```
Phone Input → GuestRecognitionService.recognize() → GuestIntelligence → UI + Recommendations
                                        ↓
                            Order Completed → onOrderCompleted()
                                        ↓
                    updateCustomerStats + learnPreferences + recalculateVIPTier
```

### Components

| Component | File | Role |
|-----------|------|------|
| **GuestRecognitionService** | `src/lib/services/guest-recognition.service.ts` | Canonical recognition engine — recognize, register, intelligence aggregation, visit completion, preference learning, VIP tier calc |
| **CustomerService** | `src/lib/services/customer.service.ts` | Existing primitives — `findByPhone()`, `updateCustomerStats()`, `getCustomerHistory()` |
| **Recognition API** | `src/pages/api/guest/recognize.ts` | Public endpoint — POST to recognize/register, GET to recognize only |
| **Staff Intelligence API** | `src/pages/api/guest/staff-intelligence.ts` | Compact endpoint for waiter POS display |
| **WelcomeBackBanner** | `src/components/order/WelcomeBackBanner.tsx` | Customer-facing welcome UI with tier badge, favorites, loyalty points |
| **StaffGuestIntelligence** | `src/components/staff/StaffGuestIntelligence.tsx` | Staff-facing compact guest context with dietary alerts |
| **Recommendations API** | `src/pages/api/menu/recommendations.ts` | Enhanced with `customerPhone` param for history-based personalization |

### Data Model (Existing — No Schema Changes)

The system reuses the existing `Customer` model:

- `visitCount` — incremented after each paid order
- `lastVisit` — updated to order completion timestamp
- `loyaltyPoints` — incremented by `orderAmount / 1000` per order
- `lifetimeSpendCents` — incremented by order amount (used for VIP tier calc)
- `totalSpent` — incremented by order amount
- `vipTier` — auto-calculated: NONE → BRONZE → SILVER → GOLD → PLATINUM
- `preferences` — JSON field, incrementally updated with favorites, categories, dietary observations

### VIP Tier Thresholds

| Tier | Label | Min Visits | Min Lifetime Spend |
|------|-------|-----------|-------------------|
| NONE | Guest | 0 | 0 |
| BRONZE | Bronze Member | 3 | 500 RWF |
| SILVER | Silver Member | 8 | 1,500 RWF |
| GOLD | Gold Member | 15 | 4,000 RWF |
| PLATINUM | Platinum Member | 30 | 10,000 RWF |

## Integration Points

### 1. QR Ordering (`src/pages/order/index.tsx`)

- After phone OTP verification, `WelcomeBackBanner` fetches guest intelligence via `/api/guest/recognize`
- Recommendations API call includes `customerPhone` for personalized scoring
- Order creation via `/api/public/order/draft.ts` upserts customer (existing behavior)

### 2. Waiter POS (`src/pages/dashboard/sales/new.tsx`)

- `StaffGuestIntelligence` component displays when staff enters customer phone
- Shows VIP tier, visit count, favorites, dietary alerts
- `SalesService.createSale()` upserts customer via `GuestRecognitionService.registerOrRecognize()`
- For CASH payments (immediately COMPLETED), `onOrderCompleted()` fires automatically

### 3. Payment Confirmation Flows

Visit completion (`onOrderCompleted`) is wired into **all** payment confirmation paths:

| Flow | File | Trigger |
|------|------|---------|
| Manual payment confirmation | `src/pages/api/orders/[id]/confirm-payment.ts` | Staff marks order as paid |
| IremboPay webhook | `src/pages/api/payments/irembo/webhook.ts` | Webhook receives PAID status |
| MoMo status polling | `src/pages/api/payments/momo/status/[transactionId].ts` | Poll returns SUCCESSFUL |
| Intouch status polling | `src/pages/api/payments/intouch/status/[id].ts` | Poll returns success code |
| CASH sale (immediate) | `src/lib/services/sales.service.ts` | `createSale()` with CASH method |

### 4. Recommendations (`src/pages/api/menu/recommendations.ts`)

- Accepts optional `customerPhone` parameter
- When provided, fetches guest intelligence and applies:
  - **+100 score** for favorite items (previously ordered)
  - **+40 score** for preferred categories
  - **+15 score** for items near average order value
  - Merges guest allergies/dietary prefs with request-level preferences
- Returns `personalized: true/false` flag in response

## API Reference

### POST `/api/guest/recognize`

**Body:**
```json
{
  "phone": "+250788123456",
  "businessId": "clxxx...",
  "name": "John"  // optional — creates customer if not found
}
```

**Response (returning guest):**
```json
{
  "data": {
    "recognized": true,
    "isNew": false,
    "customerId": "clxxx...",
    "intelligence": {
      "isReturning": true,
      "customer": { "id": "...", "name": "John", "visitCount": 5, ... },
      "favorites": [{ "menuItemId": "...", "name": "Brochette", "orderCount": 3 }],
      "preferredCategories": [{ "category": "Grill", "orderCount": 4 }],
      "recentHistory": [{ "id": "...", "orderNumber": "ORD-...", ... }],
      "loyalty": { "pointsBalance": 150, "tier": "BRONZE", "tierLabel": "Bronze Member", ... },
      "recommendationContext": { "favoriteItemIds": [...], ... }
    }
  }
}
```

### GET `/api/guest/staff-intelligence?phone=...&businessId=...`

Returns compact intelligence for staff display:
```json
{
  "data": {
    "isReturning": true,
    "name": "John",
    "visitCount": 5,
    "vipTier": "BRONZE",
    "tierLabel": "Bronze Member",
    "loyaltyPoints": 150,
    "favorites": [{ "name": "Brochette", "orderCount": 3 }],
    "allergies": ["peanuts"],
    "dietaryPreferences": ["vegetarian"],
    "lastVisit": "2024-07-20T..."
  }
}
```

## Preference Learning

After each completed order, `learnPreferencesFromOrder()` incrementally updates the customer's `preferences` JSON:

- **favoriteItems** — top 10 most-ordered items with counts
- **preferredCategories** — category frequency map
- **observedDietaryTags** — dietary tags from ordered items
- **observedAllergens** — allergens present in ordered items
- **typicalOrderHours** — hours of day the customer typically orders
- **orderingMethods** — frequency by order source (QR_IN_VENUE, WAITER_POS, etc.)

## Validation Scenarios

### Scenario 1: New Guest — First QR Order

1. Guest scans QR code, enters phone, completes OTP verification
2. `WelcomeBackBanner` fetches `/api/guest/recognize` → returns `recognized: false`
3. Banner does not display (new guest)
4. Guest places order, pays via MoMo
5. MoMo status polling detects SUCCESS → `onOrderCompleted()` fires
6. `visitCount` → 1, `lastVisit` → now, `loyaltyPoints` → earned, `lifetimeSpendCents` → order amount
7. Preferences JSON updated with first order's items

### Scenario 2: Returning Guest — QR Pre-Order

1. Guest opens pre-order link, enters phone, completes OTP
2. `WelcomeBackBanner` fetches intelligence → `recognized: true, visitCount: 8, vipTier: SILVER`
3. Banner displays: "Welcome back, [name]!" with Silver badge, 8 visits, loyalty points, favorite dishes
4. Recommendations API personalized with `customerPhone` → favorite items boosted
5. Guest places order, pays via IremboPay
6. IremboPay webhook → `onOrderCompleted()` → stats updated, VIP tier rechecked, preferences learned

### Scenario 3: Waiter POS — Staff Recognition

1. Waiter enters customer phone in New Sale page
2. `StaffGuestIntelligence` fetches `/api/guest/staff-intelligence`
3. Displays: name, VIP tier, visit count, regular order, dietary alerts
4. Waiter creates CASH sale → `SalesService.createSale()` upserts customer, fires `onOrderCompleted()`
5. Customer stats, preferences, and VIP tier updated immediately

### Scenario 4: VIP Tier Upgrade

1. Guest completes 15th visit with lifetime spend ≥ 4,000 RWF
2. `onOrderCompleted()` → `updateCustomerStats()` increments visitCount to 15
3. `recalculateVIPTier()` detects BRONZE → GOLD transition
4. `vipTier` updated to `GOLD` in database
5. Next visit: `WelcomeBackBanner` shows Gold badge

### Scenario 5: Preference Learning Over Time

1. Guest orders vegetarian dishes 3 times → `observedDietaryTags` includes "vegetarian"
2. Guest orders from "Grill" category 5 times → `preferredCategories["Grill"] = 5`
3. Recommendations API boosts Grill items by +40 score
4. Guest's favorite item (ordered 4×) gets +100 score in recommendations
5. `typicalOrderHours` tracks [12, 13, 19] → lunch and dinner pattern

## Performance

- **Recognition query**: 4 parallel Prisma queries (customer, favorites, recent orders, categories) — single round trip
- **Visit completion**: 3 sequential operations (stats update, preference learning, VIP recalc) — fire-and-forget safe
- **Recommendations**: 1 additional recognition query when `customerPhone` provided — cached result could be passed from client
- All guest recognition errors are caught and logged — never blocks order creation or payment processing
