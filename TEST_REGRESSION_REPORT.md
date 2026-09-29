# TEST_REGRESSION_REPORT

**Date:** 2026-06-30  
**Branch:** release/v1.0.0-rc1  
**Scope:** Regression validation after fixing the TypeScript/IDE error in `tests/services/recipe.service.test.ts`.

---

## Build Status

Command:
```bash
npm run build
```
Result: **PASS**

Notes:
- Next.js build reports: **“Skipping validation of types”** and **“Skipping linting”** (as configured in `next.config.js` for non-CI builds).
- Build produced static generation output (356/356).

---

## TypeScript Status

### Targeted TypeScript check (required for this fix)
Command:
```bash
npx tsc -p tests/services/tsconfig.json --noEmit
```
Result: **PASS**

This confirms the `@/…` imports in `tests/services/recipe.service.test.ts` resolve correctly under an explicit TS project.

---

## Test Status

### Affected test file
Command:
```bash
npx jest tests/services/recipe.service.test.ts --runInBand
```
Result: **PASS** (41/41)

### Full Jest suite
Command:
```bash
npm test
```
Result: **FAIL**

Observed failing suites include (non-exhaustive, from the Jest output):
- `tests/unit/calculations/business-commission.test.ts`
  - Expected commission values (3%, 10%, 0%) are not reflected; result remains 5%.
- `tests/edge-cases/order-edge-cases.test.ts`
  - “Empty order submission” scenario resolves instead of rejecting; other scenarios throw.
- `tests/edge-cases/seating-conflicts.test.ts`
  - Several scenarios throw errors as implemented (e.g., QR mismatch, seat inactive, table not found).

**Important:** The recipe service test fix introduces only a scoped TypeScript config file and does not modify runtime production logic. The above failures appear **unrelated** to the `RecipeService` test stabilization change.

---

## Regression Status (Against this change)

- `RecipeService` test behavior: **No regression detected**
- Build: **No regression detected**
- Full test suite: **Currently failing due to pre-existing or unrelated issues**

---

## Next Action Needed

If the success criteria for RC1 stabilization requires **the entire Jest suite to pass**, the failing suites listed above must be triaged and corrected (test expectations vs current production behavior), which is beyond the scope of the `recipe.service.test.ts` IDE error fix itself.

---

*End of report.*
