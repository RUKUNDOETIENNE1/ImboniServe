# Credit Policy Engine

## Overview

The Credit Policy Engine provides data-driven, configurable rules for credit management. Policies are stored in the database and can be updated at runtime without code changes.

## Database Model

**Model:** `AICreditPolicy` (defined in `prisma/schema.prisma`)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Unique ID |
| `policyKey` | String @unique | Machine-readable policy key |
| `policyName` | String | Human-readable name |
| `description` | String? | What the policy controls |
| `value` | String | Policy value (parsed by service layer) |
| `dataType` | String | 'string', 'int', 'boolean', 'json' |
| `appliesTo` | String | 'all' or 'plan:CODE' for plan-specific |
| `isActive` | Boolean | Whether the policy is active |

## Default Policies

| Policy Key | Name | Default | Type | Applies To |
|------------|------|---------|------|------------|
| `max_balance` | Maximum Wallet Balance | 0 (unlimited) | int | all |
| `credit_expiry_days` | Credit Expiry (Days) | 0 (never) | int | all |
| `reservation_timeout_seconds` | Reservation Timeout | 300 (5 min) | int | all |
| `low_credit_threshold` | Low Credit Warning | 20% | int | all |
| `free_trial_credits` | Free Trial Credits | 10 | int | plan:FREE |
| `enterprise_custom_allocation` | Enterprise Allocation | 0 | int | plan:ENTERPRISE |
| `bonus_campaign_active` | Bonus Campaign Active | false | boolean | all |
| `feature_restrictions` | Feature Restrictions | {} | json | all |

## Plan-Specific Policies

Policies can be scoped to specific plans using the `appliesTo` field:

- `appliesTo: 'all'` — applies to all businesses
- `appliesTo: 'plan:FREE'` — applies only to businesses on the FREE plan
- `appliesTo: 'plan:ENTERPRISE'` — applies only to ENTERPRISE plan

When resolving a policy value, the engine checks plan-specific first, then falls back to `all`.

## Service Interface

**File:** `src/lib/services/credits/credit-policy.service.ts`

### Functions

```typescript
// Get policy value (checks plan-specific first, then 'all')
getPolicyValue(policyKey, planCode?): Promise<string | null>

// Typed getters
getPolicyInt(policyKey, planCode?): Promise<number>
getPolicyBool(policyKey, planCode?): Promise<boolean>
getPolicyJson(policyKey, planCode?): Promise<any>

// Feature access control
isFeatureAllowed(featureKey, planCode): Promise<boolean>

// Admin functions
updatePolicy(policyKey, value, opts?): Promise<void>
createPolicy(data): Promise<void>
listAllPolicies(): Promise<CreditPolicy[]>

// Seed defaults (idempotent)
seedDefaultPolicies(): Promise<void>
```

## Feature Restrictions

The `feature_restrictions` policy is a JSON map that controls which plans can access which features:

```json
{
  "scanner": ["PROFESSIONAL", "BUSINESS", "PREMIUM", "ENTERPRISE"],
  "site_builder": ["BUSINESS", "PREMIUM", "ENTERPRISE"]
}
```

- Empty map `{}` = all features available to all plans
- Feature not in map = available to all plans
- Feature in map with plan list = only those plans can access

## Caching

Policies are cached in-memory for 60 seconds. Cache is invalidated on any update or create.

## Use Cases

### Low Credit Warning

```typescript
const threshold = await getPolicyInt('low_credit_threshold', planCode);
const wallet = await getOrCreateWallet(businessId);
const isLowCredit = wallet.balance < (wallet.monthlyAllocation * threshold / 100);
```

### Feature Gating

```typescript
const allowed = await isFeatureAllowed('scanner', userPlanCode);
if (!allowed) {
  return res.status(403).json({ error: 'Feature not available on your plan' });
}
```

### Max Balance Enforcement

```typescript
const maxBalance = await getPolicyInt('max_balance', planCode);
if (maxBalance > 0 && wallet.balance >= maxBalance) {
  // Don't grant more credits — cap at max
}
```
