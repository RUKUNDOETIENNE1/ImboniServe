# Kitchen Consumption Engine — Phase 0 (Schema Migration) Checklist

**Goal:** Apply the already-approved additive schema delta with zero downtime. No business logic.

**Owner:** Implementation lead

**Blocking:** Any failure here blocks Phase 1.

---

## 0. Pre-flight (verifiable)

1. Confirm working directory is repo root: `C:/Dev/ImboniResto`
2. Confirm Prisma schema file exists: `prisma/schema.prisma`
3. Confirm `npm run build` passes BEFORE migration (baseline)

Exit criteria:
- Baseline build passes.

---

## 1. Update `prisma/schema.prisma` (exact deltas)

### 1.1 Add columns to existing models

1. `model MenuItem` (additive)
   - Add: `recipeId String?`
   - Add relation field: `recipe Recipe?` (or equivalent relation name)

2. `model SaleItem` (additive)
   - Add: `consumptionState String? @default("PENDING")`

3. `model InventoryItem` (additive)
   - Add: `costingMethod String @default("WAVG")`

4. `model Business` (additive)
   - Add: `inventoryDefaultCostingMethod String @default("WAVG")`

Exit criteria:
- Schema compiles (`npx prisma validate` succeeds).

### 1.2 Add new models

Add the following models (fields per approved recipe/audit docs):

1. `Recipe`
   - Required fields:
     - `id String @id @default(cuid())`
     - `businessId String`
     - `menuItemId String?`
     - `name String`
     - `yieldQuantity Float`
     - `yieldUnit String`
     - `version Int @default(1)`
     - `isActive Boolean @default(true)`
     - `costCentsCached Int?`
     - `costCalculatedAt DateTime?`
     - `costStale Boolean @default(true)`
     - `notes String?`
     - `createdAt DateTime @default(now())`
     - `updatedAt DateTime @updatedAt`
   - Relations:
     - to `Business`
     - optional to `MenuItem`
     - to `RecipeIngredient[]`

2. `RecipeIngredient`
   - Required fields:
     - `id String @id @default(cuid())`
     - `recipeId String`
     - `inventoryItemId String?`
     - `subRecipeId String?`
     - `quantity Float`
     - `unit String`
     - `yieldFactor Float @default(1.0)`
     - `isOptional Boolean @default(false)`
     - `displayOrder Int @default(0)`
   - Relations:
     - to `Recipe`
     - optional to `InventoryItem`
     - optional self-relation to `Recipe` as sub-recipe

3. `InventoryConsumption`
   - Required fields:
     - `id String @id @default(cuid())`
     - `businessId String`
     - `saleItemId String`
     - `inventoryItemId String`
     - `recipeId String?`
     - `recipeIngredientId String?`
     - `quantityConsumed Float`
     - `unit String`
     - `unitCostAtConsumptionCents Int`
     - `totalCostCents Int`
     - `inventoryUpdateId String? @unique`
     - `state String @default("ACTIVE")`
     - `reversedByConsumptionId String? @unique`
     - `reasonCode String?`
     - `actorUserId String?`
     - `createdAt DateTime @default(now())`
   - Relations:
     - to `Business`
     - to `SaleItem`
     - to `InventoryItem`
     - optional to `Recipe`
     - optional to `RecipeIngredient`
     - optional self-relation for reversal linking

### 1.2.1 Indexes (must be created in schema)

1. `Recipe`
   - `@@index([businessId, menuItemId, isActive])`
   - `@@index([businessId, isActive])`

2. `RecipeIngredient`
   - `@@index([recipeId])`
   - `@@index([inventoryItemId])`
   - `@@index([subRecipeId])`

3. `InventoryConsumption`
   - `@@index([businessId, createdAt])`
   - `@@index([saleItemId])`
   - `@@index([inventoryItemId, createdAt])`
   - `@@index([recipeId])`
   - `@@index([state])`

Exit criteria:
- `npx prisma validate` succeeds.

### 1.3 Update enums

1. `enum TicketEventType`
   - Add:
     - `INGREDIENTS_CONSUMED`
     - `CONSUMPTION_REVERSED`

Exit criteria:
- `npx prisma validate` succeeds.

---

## 2. Format + Validate

1. `npx prisma format`
2. `npx prisma validate`

Exit criteria:
- Both commands succeed with exit code 0.

---

## 3. Create migration

1. `npx prisma migrate dev --name kitchen_consumption_phase0`
2. Confirm a new migration folder exists under `prisma/migrations/`
3. `npx prisma generate`

Exit criteria:
- Migration succeeds.
- Prisma client generation succeeds.

---

## 4. Verification (Schema Migration Gate)

Run:
1. `npm run build`
2. `npm test`

Exit criteria:
- Build success.
- 0 failing tests.

---

## 5. Rollback plan (Phase 0)

- If migration fails locally: revert schema edits and re-run baseline build.
- If migration is applied in staging/production and issues arise:
  - **Do not attempt down-migrations.**
  - Roll back by redeploying the previous application code (new tables/columns are additive and ignored).

Max acceptable downtime: **0**.
