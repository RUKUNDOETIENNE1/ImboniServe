# AI Credits Admin Guide

## Overview

This guide covers administrative operations for the AI Credits Platform, including granting credits, adjusting feature costs, configuring policies, and monitoring usage.

## Access Requirements

All admin endpoints require:
- Authenticated session
- `PLATFORM_ADMIN` role

## Managing Business Wallets

### View All Wallets

```
GET /api/credits/admin/wallets?page=1&limit=50&search=restaurant
```

Returns a paginated list of all business wallets with:
- Business name, plan code
- Current balance, reserved balance
- Monthly allocation, purchased credits, bonus credits
- Lifetime totals
- Next renewal date

### Grant Credits to a Business

```
POST /api/credits/admin/adjust
{
  "businessId": "biz_123",
  "action": "grant",
  "credits": 100,
  "reason": "Promotional bonus for customer feedback"
}
```

### Revoke Credits

```
POST /api/credits/admin/adjust
{
  "businessId": "biz_123",
  "action": "revoke",
  "credits": 50,
  "reason": "Credits granted in error"
}
```

**Note:** Cannot revoke more than the current balance.

## Managing Feature Costs

### View All Feature Costs

```
GET /api/credits/admin/feature-costs
```

### Create a New Feature Cost

```
POST /api/credits/admin/feature-costs
{
  "featureKey": "new_ai_feature",
  "featureName": "New AI Feature",
  "description": "Description of what it does",
  "creditsCost": 10,
  "category": "generation"
}
```

### Update a Feature Cost

```
PUT /api/credits/admin/feature-costs
{
  "featureKey": "scanner",
  "creditsCost": 25
}
```

Optional fields: `isDynamic`, `minCredits`, `maxCredits`, `isActive`

### Deactivate a Feature

```
PUT /api/credits/admin/feature-costs
{
  "featureKey": "old_feature",
  "creditsCost": 5,
  "isActive": false
}
```

## Managing Credit Packages

Credit packages are managed via the database or the seeding system. To modify:

1. Update the `DEFAULT_PACKAGES` array in `src/lib/services/credits/credit-purchase.service.ts`
2. Run the monthly cron or call `seedDefaultPackages()` manually

Current packages:

| Code | Credits | Bonus | Price (RWF) |
|------|---------|-------|-------------|
| pack_500 | 500 | 0 | 5,000 |
| pack_2000 | 2,000 | 100 | 18,000 |
| pack_5000 | 5,000 | 500 | 40,000 |
| pack_10000 | 10,000 | 1,500 | 75,000 |

## Managing Policies

### View All Policies

```
GET /api/credits/admin/policies
```

### Update a Policy

```
PUT /api/credits/admin/policies
{
  "policyKey": "max_balance",
  "value": "5000"
}
```

### Create a New Policy

```
POST /api/credits/admin/policies
{
  "policyKey": "promo_double_credits",
  "policyName": "Double Credits Promotion",
  "description": "Double all purchased credits during promotion",
  "value": "true",
  "dataType": "boolean",
  "appliesTo": "all"
}
```

## Monitoring & Analytics

### Platform Analytics

```
GET /api/credits/admin/analytics?days=30
```

Returns:
- Total businesses with wallets
- Total credits consumed, purchased, allocated
- Revenue from credit purchases
- Average consumption per business
- Top features by consumption
- Top businesses by consumption
- Daily consumption trend
- Consumption breakdown by plan

### Search Ledger

```
GET /api/credits/admin/ledger?businessId=biz_123&entryType=CONSUMPTION&feature=scanner&page=1
```

Filter by: `businessId`, `entryType`, `feature`, date range

### Investigate Failed Operations

Search for `RESERVATION_RELEASE` entries to find failed AI operations:

```
GET /api/credits/admin/ledger?entryType=RESERVATION_RELEASE
```

The `metadata.reason` field contains the failure reason.

## Monthly Operations

The monthly cron job (`/api/cron/monthly-usage-reset`) automatically:
1. Seeds default feature costs, policies, and packages (idempotent)
2. Renews monthly credit allocations for due wallets
3. Expires stale credit reservations
4. Resets CMS post counters

**Schedule:** 1st of each month at 00:00 UTC

## Troubleshooting

### Business has no wallet
Wallets are created lazily on first access. If a business needs credits before using any AI feature, call:
```typescript
await getOrCreateWallet(businessId);
```

### Credits deducted for failed operation
This should never happen. Check the ledger:
1. Find the `CONSUMPTION` entry
2. Check if there's a corresponding `RESERVATION_RELEASE` entry
3. If both exist, the release happened after the commit (race condition — investigate)

### Stale reservations
Run the expiry function manually:
```typescript
await expireStaleReservations();
```

Or wait for the monthly cron to clean them up.
