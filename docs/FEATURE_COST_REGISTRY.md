# Feature Cost Registry

## Overview

The Feature Cost Registry defines the credit cost for every AI capability. Costs are stored in the database and configurable at runtime — no code changes needed to adjust pricing.

## Database Model

**Model:** `AIFeatureCost` (defined in `prisma/schema.prisma`)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Unique ID |
| `featureKey` | String @unique | Machine-readable feature key |
| `featureName` | String | Human-readable name |
| `description` | String? | What the feature does |
| `creditsCost` | Int | Base credit cost (default: 1) |
| `isDynamic` | Boolean | If true, cost computed at runtime |
| `minCredits` | Int? | Minimum cost for dynamic features |
| `maxCredits` | Int? | Maximum cost for dynamic features |
| `category` | String? | Feature category |
| `isActive` | Boolean | Whether the feature is available |

## Default Feature Costs

| Feature Key | Name | Credits | Category |
|-------------|------|---------|----------|
| `translate_menu` | Translate Menu | 1 | translation |
| `menu_description` | Generate Description | 2 | generation |
| `dish_enhancement` | AI Dish Enhancement | 3 | generation |
| `supplier_recommendation` | Supplier Recommendation | 2 | analysis |
| `inventory_forecast` | Inventory Forecast | 4 | analysis |
| `marketing_campaign` | Marketing Campaign | 15 | generation |
| `site_builder` | Website Builder | 25 | generation |
| `scanner` | Scan Business | 30 | analysis |
| `tagline` | Tagline Generator | 3 | generation |
| `promo` | Promo Text Generator | 3 | generation |
| `insights` | Smart Insights | 2 | analysis |
| `copilot` | AI Copilot Request | 1–5 (dynamic) | assistant |

## Service Interface

**File:** `src/lib/services/credits/feature-cost-registry.service.ts`

### Functions

```typescript
// Get credit cost for a feature
getFeatureCost(featureKey: string): Promise<number>

// Get full feature cost record
getFeatureCostRecord(featureKey: string): Promise<FeatureCost | null>

// Get all active feature costs
getAllFeatureCosts(): Promise<Map<string, FeatureCost>>

// Create a new feature cost (admin)
createFeatureCost(data): Promise<void>

// Update a feature cost (admin)
updateFeatureCost(featureKey, creditsCost, opts?): Promise<void>

// List all feature costs (admin)
listAllFeatureCosts(): Promise<FeatureCost[]>

// Seed defaults (idempotent)
seedDefaultFeatureCosts(): Promise<void>
```

## Caching

Feature costs are cached in-memory for 60 seconds to avoid repeated database queries. The cache is invalidated on any update or create operation.

## Dynamic Costs

For features with variable cost (e.g., AI Copilot with 1–5 credits based on complexity):

- `isDynamic = true`
- `minCredits` and `maxCredits` define the range
- The consumption engine's `executeWithCredits` accepts an `overrideCost` parameter
- The `commitReservation` function accepts an `actualCost` parameter to adjust the final deduction

## Adding a New AI Feature

1. **Register the cost** (admin API or seed):
```typescript
await createFeatureCost({
  featureKey: 'new_ai_feature',
  featureName: 'New AI Feature',
  description: 'Description of the feature',
  creditsCost: 10,
  category: 'generation',
});
```

2. **Use in code**:
```typescript
const { result } = await executeWithCredits(
  businessId,
  'new_ai_feature',
  async () => await performNewAIOperation(),
  { userId }
);
```

No code changes needed to adjust the cost — just update the database record via admin API.
