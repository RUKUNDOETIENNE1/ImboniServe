# GUARDIAN-001 — Test Certification Report

## Test Suite Summary

| Suite | File | Tests | Status |
|---|---|---|---|
| Service Layer | `tests/reliability/guardian-001-service.test.ts` | 22 | ✅ PASS |
| Golden-Path Simulation | `tests/reliability/guardian-002-simulation.test.ts` | 19 | ✅ PASS |
| Responsive Design | `tests/reliability/guardian-003-responsive.test.ts` | 28 | ✅ PASS |
| **Total** | | **69** | **✅ ALL PASS** |

## Quality Gates

| Gate | Command | Result |
|---|---|---|
| Prisma Validate | `npx prisma validate` | ✅ Valid |
| TypeScript | `npx tsc --noEmit` | ✅ 0 errors |
| Jest (Guardian) | `npx jest tests/reliability/guardian-` | ✅ 69/69 pass |

## Coverage by Category

### Decision Policy (11 tests)
- CRITICAL state: breach, approaching breach, items count, baseline ✅
- WARNING state: just entered, prolonged ✅
- FAILED state: escalation ✅
- RECOVERED state: learning only ✅
- ON_TRACK state: observe ✅
- Edge cases: zero threshold, unknown state ✅

### Idempotency (3 tests)
- Duplicate signal suppression (same idempotency key) ✅
- New case creation for new signals ✅
- Separate cases for different promises ✅

### Mode Resolution (3 tests)
- OFF when feature flag disabled ✅
- SHADOW when enabled, no override ✅
- ASSIST when override enabled ✅

### Business Isolation (5 tests)
- Signal evaluation scoped to businessId ✅
- Case verification scoped to businessId ✅
- Metrics scoped to businessId ✅
- All-business query when no businessId ✅
- State filtering excludes terminal states ✅

### Metrics (1 test)
- Structured metrics return (active, total, protected, breached, recovered, interventions) ✅

### Responsibility Routing (2 tests)
- Finds staff with priority roles ✅
- Returns null when no staff available ✅

### Golden-Path Scenarios (9 tests — Orders A–I)
- **Order A**: On-track — no Guardian action ✅
- **Order B**: Warning entered — observe ✅
- **Order C**: Warning prolonged — recommend ✅
- **Order D**: Critical — alert staff ✅
- **Order E**: Critical approaching breach — escalate ✅
- **Order F**: Breached — escalate + learning ✅
- **Order G**: Recovered — learning only ✅
- **Order H**: Failed — escalate for post-mortem ✅
- **Order I**: Duplicate signal — idempotency suppression ✅

### Batch Performance (2 tests)
- Signal evaluation capped at GUARDIAN_BATCH_LIMIT (200) ✅
- Case verification capped at GUARDIAN_BATCH_LIMIT (200) ✅

### Responsive Design (28 tests)
- Container & layout: responsive padding, max-width, flex direction ✅
- Metrics grid: 2/4/6 column breakpoints, gap, padding, text size ✅
- Case list: divide-y, hover, flex-wrap, line-clamp ✅
- Case detail modal: responsive positioning, border radius, scroll, sticky header ✅
- Mode badge: ASSIST/SHADOW/OFF styling ✅
- Loading & empty states ✅
- Refresh button: disabled state, spin animation ✅
- No horizontal overflow: no fixed widths, min-w-0 ✅

## Certification

All Guardian system tests pass. The implementation is certified for SHADOW mode deployment. ASSIST mode should be enabled per-business after SHADOW mode validation confirms correct detection and decision behavior.
