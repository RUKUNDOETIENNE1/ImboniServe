# Kitchen Consumption Engine — Implementation Execution Contract

**Purpose (non-negotiable):** Freeze the Kitchen Consumption Engine implementation into executable phases with unambiguous order, gates, rollback, feature flags, and measurable completion criteria.

**This is the construction manual.** After approval, implementation begins immediately. No further architecture documents are to be produced unless implementation discovers a true blocker.

---

## Scope

In scope (exactly):
- Phase 0: Schema Migration (additive; zero-downtime)
- Phase 1: Core Services
  - `RecipeService`
  - `InventoryLedgerService`
  - `ConsumptionEngineService`
  - `SaleItemStatusService`
- Phase 2: Mutation Migration (remove the three critical bypasses)
- Phase 3: Consumption Activation (NEW → PREPARING → consume)
- Phase 4: Recipe Costing (backend only)
- Phase 5: Operational Hardening (watchdogs + validation)

Out of scope (explicit):
- Any schema redesign beyond the already-approved delta
- Any new services beyond the four listed above
- Any UI expansion
- Any new product scope

---

## Authoritative References (do not reinterpret)

- Architecture blueprint: <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md" />
- Enforcement plan (bypass list + ownership + guardrails): <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_ENGINE_ENFORCEMENT_PLAN.md" />
- Consumption lifecycle rules: <ref_file file="C:/Dev/ImboniResto/INVENTORY_CONSUMPTION_MODEL.md" />
- Audit lineage contract: <ref_file file="C:/Dev/ImboniResto/CONSUMPTION_AUDIT_ARCHITECTURE.md" />
- Recipe schema + rules: <ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" />
- Cost model: <ref_file file="C:/Dev/ImboniResto/FOOD_COST_ARCHITECTURE.md" />

---

## Global Invariants (must remain true after every phase)

1. **Single deduction rule:** Inventory is deducted only at `SaleItem.itemStatus: NEW → PREPARING`.
2. **Atomicity:** Consumption + `SaleItem.consumptionState` flip + `SaleItem.itemStatus` flip + audit writes occur atomically (single DB transaction).
3. **Append-only:** `InventoryUpdate`, `TicketEvent`, and `InventoryConsumption` are append-only (reversals are new rows).
4. **Idempotent:** Duplicate triggers do not double-deduct.
5. **No bypass:** No direct Prisma mutation of `SaleItem.itemStatus` remains in endpoints after Phase 2.

---

## Feature Flags (required)

These flags exist to guarantee safe rollout and instant rollback without database rollback.

| Flag | Type | Allowed values | Default | Activation point | Rollback behavior |
|------|------|----------------|---------|------------------|-------------------|
| `KITCHEN_CONSUMPTION_ENGINE_MODE` | env | `off` \| `shadow` \| `enforce` | `off` | Phase 3 (after Mutation Gate passes) | Set to `off` to disable all consumption writes immediately |
| `RECIPE_COSTING_ENABLED` | env | `true` \| `false` | `false` | Phase 4 | Set `false` to stop cost recompute / stale refresh behavior |
| `CONSUMPTION_WATCHDOGS_ENABLED` | env | `true` \| `false` | `false` | Phase 5 | Set `false` to disable watchdog execution (no schema rollback needed) |
| `OCR_RECIPE_COST_REFRESH_ENABLED` | env | `true` \| `false` | `false` | Phase 4 (after costing tests pass) | Set `false` to stop OCR-driven stale propagation |
| `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` | env | comma-separated IDs | empty | Phase 3 pilot | Empty list = engine disabled for all businesses (even if mode=`enforce`) |

**Hard rule:** Production rollout uses `off → shadow → enforce` in that order.

---

# Implementation Phases (Frozen)

## Phase 0 — Schema Migration (additive, zero-downtime)

**Goal:** Introduce the approved schema delta only. No business logic.

### Phase 0 Schema Changes (exact)

#### New tables
1. `Recipe`
2. `RecipeIngredient`
3. `InventoryConsumption`

#### Existing tables: additive columns
- `MenuItem.recipeId String?` (nullable)
- `SaleItem.consumptionState String? @default("PENDING")`
- `InventoryItem.costingMethod String @default("WAVG")`
- `Business.inventoryDefaultCostingMethod String @default("WAVG")`

#### New / changed enums
- `TicketEventType`: add
  - `INGREDIENTS_CONSUMED`
  - `CONSUMPTION_REVERSED`

### Zero-downtime requirements
- All new columns are **nullable** or have safe **defaults**.
- No existing columns are dropped or renamed.
- New tables are additive only.

### Rollback strategy (Phase 0)
- **DB rollback:** Not required and not used in production (additive migration).
- **App rollback:** Always safe because no code depends on new tables/columns in Phase 0.
- **Data cleanup:** None required.
- **Max acceptable downtime:** 0.

### Phase 0 Definition of Done
- Migration applied successfully on a clean DB and on a representative staging snapshot.
- `npm run build` succeeds.
- `npm test` succeeds.

**Phase 0 checklist:** <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_PHASE0_CHECKLIST.md" />

---

## Phase 1 — Core Services

**Goal:** Implement the four approved services with unit + integration tests. No endpoint migrations yet.

### 1.1 RecipeService

**Responsibilities (only):**
- Create recipe versions (new `Recipe` rows, old versions deactivated)
- Create/update `RecipeIngredient` lines
- Validate units using `UnitNormalizationService`
- Enforce versioning rule: never edit in place once referenced by `InventoryConsumption`

**Dependencies (allowed):**
- Prisma
- `UnitNormalizationService`

**Unit tests (required):**
- publish creates new version and deactivates old
- invalid units are rejected
- cycle detection for sub-recipes (bounded depth per approved rules)

**Integration tests (required):**
- publish recipe + ingredients persists correctly and is queryable by menuItemId

**Definition of Done:**
- All required unit + integration tests exist and pass (100% pass)
- Recipe versioning invariants enforced in code

### 1.2 InventoryLedgerService

**Responsibilities (only):**
- Apply inventory stock mutations inside a provided Prisma transaction client
- Enforce negative-stock prevention
- Write the paired `InventoryUpdate` row

**Dependencies (allowed):**
- Prisma (transaction client)

**Unit tests (required):**
- ADD/REMOVE/WASTE/ADJUSTMENT update stock correctly
- negative stock is rejected
- produces an `InventoryUpdate` row with required metadata

**Integration tests (required):**
- concurrent REMOVE operations cannot drive stock negative (one must fail)

**Definition of Done:**
- Service operates only via provided `tx` (no nested transactions)
- Tests pass (100% pass)

### 1.3 ConsumptionEngineService

**Responsibilities (only):**
- Resolve recipe for a `SaleItem` via `MenuItem.recipeId`
- Expand ingredients (including sub-recipes per approved recursion bound)
- Compute normalized quantities
- Compute cost-at-consumption using `InventoryItem.unitCostCents` (WAVG V1)
- Write `InventoryConsumption` rows (one per ingredient)
- Use `InventoryLedgerService` for stock mutation + `InventoryUpdate`

**Dependencies (allowed):**
- Prisma (tx)
- `RecipeService` (read-only recipe resolution)
- `InventoryLedgerService`
- `UnitNormalizationService`

**Unit tests (required):**
- consumes correct quantities for a simple recipe
- skips consumption when `MenuItem.recipeId` is null (explicit result = SKIPPED)
- reversal creates compensating consumption rows and links reversals correctly

**Integration tests (required):**
- end-to-end consume writes: InventoryUpdate + InventoryConsumption + stock change

**Definition of Done:**
- Idempotency-safe at data layer using `SaleItem.consumptionState` guard
- Tests pass (100% pass)

### 1.4 SaleItemStatusService

**Responsibilities (only):**
- Own all `SaleItem.itemStatus` transitions used by kitchen execution
- Validate transition via `StateMachineService`
- On `NEW → PREPARING`:
  - call `ConsumptionEngineService` inside the same tx
  - write `TicketEventType.INGREDIENTS_CONSUMED`
- On `PREPARING/READY → CANCELED`:
  - call reversal inside the same tx
  - write `TicketEventType.CONSUMPTION_REVERSED`

**Dependencies (allowed):**
- Prisma (tx)
- `StateMachineService`
- `IdempotencyService` (endpoint-level; service receives idempotencyKey as input)
- `TicketEventService` (append-only; may require a tx-aware write helper for atomicity)
- `ConsumptionEngineService`

**Unit tests (required):**
- valid transition calls consumption
- invalid transition is rejected
- idempotent repeated transition does not double-consume

**Integration tests (required):**
- full transition NEW→PREPARING performs all writes atomically

**Definition of Done:**
- No direct Prisma writes to `SaleItem.itemStatus` are required outside this service
- Tests pass (100% pass)

### Phase 1 Rollback strategy
- Rollback is code-only: revert deployment (flags remain `off`).
- No data cleanup required (services unused until Phase 2/3).
- Max acceptable downtime: 0.

### Phase 1 Definition of Done
- All four services implemented
- `npm run build` passes
- `npm run test:unit` + `npm run test:integration` pass (100% pass)

---

## Phase 2 — Mutation Migration (remove bypasses)

**Goal:** Replace every bypass identified in the Enforcement Plan:
- `/api/station/update-item-status`
- `/api/kitchen/update-status`
- `OrderMutationService.cancelItem`

### Required changes (exact)
1. `src/pages/api/station/update-item-status.ts`
   - Replace direct `prisma.saleItem.update` with `SaleItemStatusService.transition(...)`
2. `src/pages/api/kitchen/update-status.ts`
   - Remove `tx.saleItem.updateMany` for `itemStatus`
   - Iterate items and call `SaleItemStatusService.transitionTx(...)`
3. `src/lib/services/order-mutation.service.ts` (`cancelItem`)
   - Replace direct `prisma.saleItem.update` to `CANCELED` with `SaleItemStatusService.transition(...)`

### Non-negotiable acceptance condition
- After Phase 2, the only code allowed to mutate `SaleItem.itemStatus` is `SaleItemStatusService`.

### Phase 2 Rollback strategy
- Rollback is code-only: redeploy previous version (consumption mode remains `off`).
- No data cleanup required.
- Max acceptable downtime: 0.

### Phase 2 Definition of Done
- The three bypasses are removed
- Static scan confirms no direct status mutations remain in routes
- `npm test` passes (100% pass)

---

## Phase 3 — Consumption Activation

**Goal:** Activate the consumption chain for `NEW → PREPARING`.

### Activation sequence (must follow)
1. Deploy code with engine present, flags set:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=off`
2. Enable `shadow` in staging:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow`
3. Run Consumption Gate tests (must pass)
4. Pilot in production:
   - Set `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS` to the pilot business
   - Set `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow` for 24h observation
5. Enforce in pilot:
   - Switch to `KITCHEN_CONSUMPTION_ENGINE_MODE=enforce`
6. Expand pilot IDs gradually.

### Shadow vs Enforce behavior (fixed)
- `off`: no consumption calculation, no writes.
- `shadow`: calculate expected consumption; **no inventory writes** and **no InventoryConsumption writes**.
- `enforce`: perform full atomic consumption and all audit writes.

### Plugin events (required in Phase 3)

1. Add two entries to `DIE_PLUGIN_EVENTS`:
   - `INGREDIENTS_CONSUMED`
   - `CONSUMPTION_REVERSED`
2. In `enforce` mode, emit the corresponding plugin event **after the DB transaction commits**.
   - Emission is best-effort and retry-safe.
   - Emission must never be inside the DB transaction.

**Definition of Done (Phase 3 plugin events):**
- In `enforce`, successful consume emits `INGREDIENTS_CONSUMED` once.
- In `enforce`, successful reversal emits `CONSUMPTION_REVERSED` once.

### Phase 3 Rollback strategy
- Immediate rollback: set `KITCHEN_CONSUMPTION_ENGINE_MODE=off` (no deploy required).
- If code regression: redeploy previous version.
- Data cleanup: none (append-only).
- Max acceptable downtime: 0.

### Phase 3 Definition of Done
- In `enforce`, NEW→PREPARING writes:
  - at least 1 `InventoryUpdate` per ingredient
  - 1 `InventoryConsumption` per ingredient
  - 1 `TicketEventType.INGREDIENTS_CONSUMED`
- Duplicate start taps do not double-deduct.

---

## Phase 4 — Recipe Costing (backend only)

**Goal:** Enable deterministic costing and cost refresh flows without UI expansion.

### Required capabilities (exact)
- Recipe versioning is enforced (`Recipe.version`, old versions remain)
- `Recipe.costCentsCached` and `MenuItem.costCents` are computed on publish
- Cost stale propagation from OCR:
  - when OCR apply updates `InventoryItem.unitCostCents`, recipes containing that inventory item are marked `Recipe.costStale=true`
  - when `RECIPE_COSTING_ENABLED=true` and `OCR_RECIPE_COST_REFRESH_ENABLED=true`, the refresh job recomputes stale recipes

### Phase 4 Rollback strategy
- Set `RECIPE_COSTING_ENABLED=false` (no deploy required).
- No data cleanup required.
- Max acceptable downtime: 0.

### Phase 4 Definition of Done
- Cost recomputation logic has integration coverage
- OCR apply triggers staleness marking (behind flag)
- `npm run build` + `npm test` pass (100% pass)

---

## Phase 5 — Operational Hardening

**Goal:** Add watchdogs and validations that detect every defined failure scenario.

### Watchdogs (must exist)
- Missing consumption detection
- Duplicate consumption detection
- Inventory drift detection
- Cancellation reversal validation

### Execution control
- Watchdogs run only when `CONSUMPTION_WATCHDOGS_ENABLED=true`.

### Phase 5 Rollback strategy
- Set `CONSUMPTION_WATCHDOGS_ENABLED=false`.
- Max acceptable downtime: 0.

### Phase 5 Definition of Done
- Every intentional failure scenario is detected by watchdog tests (100% pass)

---

# Test Gates (mandatory)

All gates are **blocking**. No phase advancement unless the gate passes.

## Gate A — Schema Migration Gate (after Phase 0)

Required commands:
- `npm run build`
- `npm test`

Exit criteria:
- 0 failing tests
- 0 TypeScript build errors
- Prisma migration applied and tracked

Blocking failures:
- Any migration failure
- Any test failure
- Any build failure

## Gate B — Service Gate (after Phase 1)

Required commands:
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`

Exit criteria:
- 0 failing tests
- Service DoD satisfied for all 4 services

## Gate C — Mutation Gate (after Phase 2)

Required validations:
- `npm test`
- Static scan proves:
  - no `saleItem.updateMany` mutating `itemStatus`
  - no route performs direct `prisma.saleItem.update({ data: { itemStatus: ... }})`

Exit criteria:
- 0 failing tests
- bypass removal complete

## Gate D — Consumption Gate (after Phase 3)

Required validations:
- Run integration tests covering:
  - NEW→PREPARING consume (success)
  - NEW→PREPARING consume (insufficient stock)
  - idempotent duplicate start tap
  - PREPARING→CANCELED reversal

Exit criteria:
- 0 failing tests
- in enforce mode, all expected writes are present

## Gate E — Regression Gate (after Phase 4)

Required validations:
- `npm test`
- costing integration tests

Exit criteria:
- 0 failing tests

## Gate F — Pilot Gate (after Phase 5)

Required validations (pilot business only):
- watchdogs enabled and produce 0 alerts under normal operation for a full pilot window
- intentional failure scenarios are detected within 5 minutes

Exit criteria:
- no false-positive watchdog alerts
- all detection tests pass

---

# Deployment Order (exact)

Use the deployment playbook (authoritative): <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_DEPLOYMENT_PLAYBOOK.md" />

Hard rules:
1. Schema (Phase 0) ships before any code that requires it.
2. Phase 3 ships with mode=`off`, then `shadow`, then `enforce`.
3. Rollback is always possible by flags (no DB rollback).

---

# Final GO Checklist (verifiable, line-by-line)

1. Phase 0 migration applied in staging via `prisma migrate deploy` (success)
2. `npm run build` passes on staging commit (success)
3. `npm test` passes on staging commit (success)
4. Phase 1 services merged and Service Gate passes (success)
5. Phase 2 bypass removals merged and Mutation Gate passes (success)
6. Phase 3 deployed to staging with mode=`shadow` (success)
7. Consumption Gate passes in staging (success)
8. Production deploy with mode=`off` (success)
9. Pilot business allowlisted; production mode=`shadow` for pilot (success)
10. Switch pilot to mode=`enforce` (success)
11. Watchdogs enabled only after Phase 5 DoD (success)

---

## Final Decision

(Decision is provided by the implementation lead after approving this contract.)
