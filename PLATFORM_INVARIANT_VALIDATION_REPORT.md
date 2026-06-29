# Platform Invariant Validation Report — Kitchen Consumption Engine Phase 0B

**Objective:** Prove that the additive Kitchen Consumption Engine Phase 0 schema migration changed nothing in existing restaurant operations.

**Important note (evidence-based):** In this working copy, the Phase 0 schema elements claimed for Kitchen Consumption Engine (`Recipe`, `RecipeIngredient`, `InventoryConsumption`, plus `MenuItem.recipeId`, `SaleItem.consumptionState`) are **not present** in `prisma/schema.prisma`, and there is **no** corresponding Prisma migration directory for the Kitchen Consumption Engine in `prisma/migrations/`. Therefore, the specific “Phase 0 migration introduced Recipe/RecipeIngredient/InventoryConsumption” condition is **not satisfied in this repo state**, and Phase 0B cannot certify invariants for a migration that is not present.

---

## Evidence Snapshot

**Timestamp:** 2026-06-28 12:35:10 (local)

**Git HEAD:** `2c7cebb chore(die/block4g): operational verification and hardening`

**Repository state:** Not clean (large number of modified files and untracked documents). This invalidates any attempt to attribute regressions to a single additive schema migration.

---

## Phase 0 Migration Presence Check (Kitchen Consumption Engine)

### Expected schema artifacts (per Kitchen Consumption Phase 0 definition)

- New models: `Recipe`, `RecipeIngredient`, `InventoryConsumption`
- New fields:
  - `MenuItem.recipeId String?`
  - `SaleItem.consumptionState String? @default("PENDING")`
- Enum additions:
  - `TicketEventType.INGREDIENTS_CONSUMED`
  - `TicketEventType.CONSUMPTION_REVERSED`
- New Prisma migration directory (e.g. `prisma/migrations/*kitchen_consumption*`)

### Observed (evidence)

1. `prisma/schema.prisma` contains **no** `Recipe`, `RecipeIngredient`, or `InventoryConsumption` models, and contains **no** `MenuItem.recipeId` or `SaleItem.consumptionState` fields.
2. `prisma/migrations/` contains **no** Kitchen Consumption Engine migration directory.

**Result:** **FAIL** — Kitchen Consumption Engine Phase 0 schema migration is not present in this repo state.

---

## Toolchain / Schema Validation

### Prisma validate

Command:
- `npx prisma validate`

Result:
- ✅ Schema valid.

### Prisma generate

Command:
- `npx prisma generate`

Result:
- ✅ Generated Prisma Client (v5.22.0).
- Duration: 10.27s.

---

## Build Regression

Command:
- `npm run build`

Result:
- ✅ Build succeeded.
- Duration: 253.92s.

Notes (non-blocking warnings observed during build):
- Browserslist database stale warning
- AlertDeliveryService warning about missing delivery channels

---

## Automated Regression Tests

### Unit / Edge test suite (`npm test`)

Command:
- `npm test`

Result:
- 🔴 **FAIL** (test failures present).

Observed failures (non-exhaustive, representative):
- `tests/edge-cases/order-edge-cases.test.ts`
- `tests/edge-cases/seating-conflicts.test.ts`
- `tests/unit/calculations/business-commission.test.ts`

Because this is a non-clean working tree with many unrelated code changes, these failures cannot be attributed to any additive schema migration.

### Integration tests (`npm run test:integration`)

Command:
- `npm run test:integration`

Result:
- 🟡 **BLOCKED BY ENVIRONMENT** — cannot reach configured database server:
  - `Can't reach database server at aws-1-eu-west-1.pooler.supabase.com:5432`

This prevents executing DB-backed regression flows (payments, auth persistence, etc.) in this environment.

---

## Production Capability Validation Matrix (Restaurant-like usage)

**Status legend:** ✅ PASS, 🔴 FAIL, 🟡 BLOCKED, ⚪ NOT EXECUTED

| Capability Area | Required Checks | Status | Evidence / Reason |
|---|---|---:|---|
| Authentication | login/logout/MFA/session/permissions | 🟡 | DB-backed + UI flow; no runnable e2e harness executed; integration DB unavailable |
| Restaurant Ops | create/modify/cancel order; dispatch; station workflow; receipts | 🟡 | Requires running app + DB; not executable with current DB connectivity |
| Inventory | OCR upload/apply; manual updates; adjustments; history | 🟡 | OCR scripts require DB + running app; DB connectivity blocked |
| Kitchen | queue; station updates; expo; ticket events; pusher | 🟡 | Requires app + DB + pusher; not executed |
| Reporting | dashboards + charts + analytics queries | 🟡 | Requires app + DB; not executed |
| OCR (complete flow) | upload→process→review→approve→apply→audit | 🟡 | OCR smoke scripts require DB + app; DB connectivity blocked |
| Multi-tenancy | business/branch/role isolation | 🟡 | Requires DB-backed tests or staging verification; not executed |
| DB integrity | existing tables/relations/indexes unaffected | 🟡 | Cannot be certified against the claimed KCE migration because the KCE schema is not present |
| Performance | build/migration/dashboard/order/inventory timings | 🟡 | Build timed (253.92s). Migration timing not measurable (KCE migration absent). Runtime timings not captured (app not executed). |

---

## Conclusion

This Phase 0B invariant validation **cannot certify** that the Kitchen Consumption Engine additive schema migration preserved 100% platform behavior because:

1. The Kitchen Consumption Engine Phase 0 schema migration artifacts (Recipe/RecipeIngredient/InventoryConsumption and the specified new nullable fields) are **not present** in this repo state.
2. The automated test suite currently contains **failing tests** under the current working tree.
3. DB-backed integration validation is **blocked** by database connectivity to the configured database host.

**Next required condition to re-run Phase 0B properly:** Provide a clean commit/worktree that contains ONLY the Kitchen Consumption Engine Phase 0 schema migration (and no other behavior changes), with a reachable test database (or local ephemeral DB) so that integration and OCR flows can be exercised.
