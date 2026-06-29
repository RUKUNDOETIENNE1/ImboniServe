# Kitchen Consumption Engine — Deployment Playbook (Exact Sequence)

**Goal:** Deploy the Kitchen Consumption Engine safely across environments with zero ambiguity and instant rollback via flags.

---

## Global Rules

1. **Additive migrations only** (Phase 0 is additive).
2. **Never rely on DB rollback in production.** Rollback is by flags + code deploy.
3. **Consumption activation always:** `off → shadow → enforce`.
4. **Pilot is always allowlisted** (`KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS`).

---

## Environments

- Development (local)
- Staging
- Pilot (production subset)
- Production (full)

---

## Phase 0 Deployment (Schema only)

### Development
1. Pull latest main.
2. Apply Phase 0 schema edits.
3. Run: `npx prisma migrate dev --name kitchen_consumption_phase0`
4. Run: `npm run build`
5. Run: `npm test`

Exit criteria:
- Build + tests pass.

Rollback:
- Revert schema edits locally.

### Staging
1. Deploy Phase 0 migration using: `npx prisma migrate deploy`
2. Deploy the app (no code behavior changes required yet)
3. Run smoke:
   - `npm run build` (CI)
   - `npm test` (CI)

Exit criteria:
- Migration applied.
- Build + tests pass.

Rollback:
- Code-only rollback (previous build). No DB rollback.

### Production
1. Apply Phase 0 migration: `npx prisma migrate deploy`
2. Deploy app unchanged (or the same commit) — Phase 0 does not require flags.

Exit criteria:
- Migration applied.

Rollback:
- Code-only rollback.

---

## Phase 1 Deployment (Core services, flags remain off)

### Development
1. Implement Phase 1 services + tests.
2. Run:
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run build`

### Staging
1. Deploy Phase 1 code.
2. Ensure flags:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=off`
   - `RECIPE_COSTING_ENABLED=false`
   - `CONSUMPTION_WATCHDOGS_ENABLED=false`
3. Run CI gates.

### Production
1. Deploy Phase 1 code.
2. Ensure flags remain off (no runtime behavior change).

Rollback:
- Code-only rollback.

---

## Phase 2 Deployment (Mutation migration, flags remain off)

### Staging
1. Deploy Phase 2 code.
2. Confirm the three bypasses are removed.
3. Run full test suite.

### Production
1. Deploy Phase 2 code.
2. Confirm:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=off`

Rollback:
- Code-only rollback.

---

## Phase 3 Deployment (Consumption activation)

### Staging
1. Deploy Phase 3 code.
2. Set:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow`
3. Run Consumption Gate tests.
4. If all pass, set:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=enforce`

Rollback:
- Set `KITCHEN_CONSUMPTION_ENGINE_MODE=off` immediately.

### Production (Pilot)
1. Deploy Phase 3 code with:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=off`
   - `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=` (empty)
2. Set pilot allowlist:
   - `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS=<pilot-business-id>`
3. Set mode:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=shadow`
4. After observation window, set:
   - `KITCHEN_CONSUMPTION_ENGINE_MODE=enforce`

Rollback:
- Remove pilot business ID from allowlist OR set mode to `off`.

---

## Phase 4 Deployment (Recipe costing)

### Staging
1. Deploy Phase 4 code.
2. Set:
   - `RECIPE_COSTING_ENABLED=true`
   - `OCR_RECIPE_COST_REFRESH_ENABLED=true`
3. Run regression + costing integration tests.

### Production
1. Deploy Phase 4 code.
2. Enable flags for pilot only first (if business-level gating is used), otherwise enable globally after staging success.

Rollback:
- Set `RECIPE_COSTING_ENABLED=false` and/or `OCR_RECIPE_COST_REFRESH_ENABLED=false`.

---

## Phase 5 Deployment (Operational hardening)

### Staging
1. Deploy Phase 5 code.
2. Enable:
   - `CONSUMPTION_WATCHDOGS_ENABLED=true`
3. Validate watchdog alerts are correct (intentional failures detected, no false positives).

### Production
1. Deploy Phase 5 code.
2. Enable watchdogs for pilot period first.

Rollback:
- Set `CONSUMPTION_WATCHDOGS_ENABLED=false`.

---

## Emergency Rollback (single instruction)

If anything goes wrong in production:
1. Set `KITCHEN_CONSUMPTION_ENGINE_MODE=off`
2. Remove all IDs from `KITCHEN_CONSUMPTION_PILOT_BUSINESS_IDS`
3. Redeploy previous stable build if needed

Max acceptable downtime: **0**.
