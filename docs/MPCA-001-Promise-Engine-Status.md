# MPCA-001 Promise Engine Status

| Field | Value |
|---|---|
| Audit Date | 2026-08-12 |
| Status | B — IMPLEMENTED / NOT FULLY VERIFIED |
| Committed | NO — exists only in working tree (uncommitted) |
| Part of Release Candidate (4763153) | NO |

## Implementation Summary

### Files (ALL UNCOMMITTED)

| File | Type | Lines | Status |
|---|---|---|---|
| src/lib/promise-engine/evaluator.ts | New | 176 | Untracked |
| src/lib/promise-engine/promise-engine.service.ts | New | 556 | Untracked |
| src/lib/promise-engine/index.ts | New | 3 | Untracked |
| src/pages/api/service-risks/index.ts | New | 33 | Untracked |
| src/pages/api/service-risks/stats.ts | New | 78 | Untracked |
| src/pages/dashboard/operations/service-risks.tsx | New | 290 | Untracked |
| tests/unit/promise-engine/evaluator.test.ts | New | 236 | Untracked |
| prisma/schema.prisma | Modified | +59 | Uncommitted |
| prisma/migrations/.../migration.sql | New | 48 | Untracked |
| src/lib/cron.ts | Modified | +17 | Uncommitted |
| src/lib/heart-pulse/event-catalog.ts | Modified | +37 | Uncommitted |
| src/lib/service-replay/transformer.ts | Modified | +7 | Uncommitted |
| src/lib/service-replay/types.ts | Modified | +15 | Uncommitted |
| src/lib/services/kitchen-dispatch.service.ts | Modified | +7 | Uncommitted |

### Architecture

```
Kitchen Dispatch → PromiseEngine.createOrUpdatePromise()
                         ↓
                    ServicePromise (Prisma)
                         ↓
              Cron (every 2 min) → evaluateActivePromises()
                         ↓
              Evaluator (pure logic) → state transition
                         ↓
              transitionTo() → TicketEvent + Heart Pulse + Interventions
                         ↓
              API: /api/service-risks → Dashboard: /dashboard/operations/service-risks
```

### State Model

```
ON_TRACK → WARNING → CRITICAL → FAILED
              ↘ FULFILLED (from any active state)
              ↘ RECOVERED (from WARNING/CRITICAL when order completes)
```

### Default Thresholds

- Warning: 8 minutes
- Breach: 15 minutes
- Auto-fail: 60 minutes

### Integrations

| Integration | Status | Evidence |
|---|---|---|
| Kitchen Dispatch → Promise creation | CODED, NOT TESTED | kitchen-dispatch.service.ts line 189-194 |
| Cron evaluation | CODED, NOT TESTED | cron.ts schedulePromiseEvaluation() |
| Heart Pulse events | CODED, NOT TESTED | event-catalog.ts 6 PROMISE events |
| Service Replay events | CODED, NOT TESTED | transformer.ts + types.ts |
| WhatsApp notifications | CODED, NOT TESTED | notifyStaff() via NotificationService |
| AlertDeliveryService escalation | CODED, NOT TESTED | triggerIntervention() for CRITICAL/FAILED |
| Service Risks API | CODED, NOT TESTED | /api/service-risks/index.ts + stats.ts |
| Service Risks Dashboard | CODED, NOT TESTED | /dashboard/operations/service-risks.tsx |

## Test Status

| Test Type | Count | Status |
|---|---|---|
| Unit tests (evaluator) | 18 | ALL PASS |
| Integration tests | 0 | NOT WRITTEN |
| Simulation tests | 0 | NOT WRITTEN |
| E2E tests | 0 | NOT WRITTEN |

### Unit Test Coverage

The 18 unit tests cover the pure evaluator logic:
- ON_TRACK state (2 tests)
- WARNING state (3 tests)
- CRITICAL state (3 tests)
- FULFILLED state (3 tests)
- RECOVERED state (1 test)
- Terminal states (3 tests — immutability)
- Edge cases (3 tests — zero thresholds, exact breach, time backwards)

### Missing Verification

The following were listed as "remaining" in the implementation report and have NOT been completed:

1. **Real integration:** Kitchen Dispatch → Promise creation (end-to-end)
2. **Lifecycle:** ON_TRACK → WARNING → CRITICAL → FAILED (with real DB)
3. **Success:** ON_TRACK → FULFILLED (with real DB)
4. **Recovery:** WARNING/CRITICAL → RECOVERED (with real DB)
5. **Cancellation/stale order:** Terminal behavior
6. **Idempotency:** Duplicate dispatch cannot create duplicate promises
7. **Cron:** Repeated evaluation does not duplicate events/escalations
8. **Heart Pulse:** Events actually publish
9. **Service Replay:** Promise events appear in replay/timeline
10. **Notifications:** Critical/failed states trigger intended notifications
11. **Dashboard:** API and UI reflect current state
12. **Failure isolation:** Promise Engine failure does not stop core operations

## Documentation

No Promise Engine documentation exists in docs/. No architecture document, no API document, no state transition diagram.

## Prisma Migration

Migration `20260812123706_add_service_promise_model` exists in working tree but:
- NOT applied to any production database
- NOT applied to the development database (unverified)
- NOT committed to git

## Customer #1 Impact

**NOT a blocker.** The Promise Engine is an enhancement that improves service quality monitoring. Customer #1 can operate without it — kitchen dispatch, ordering, and payments all work independently.

The `.catch()` wrapper in kitchen-dispatch.service.ts ensures Promise Engine failure does not block dispatch.

## Recommended Next Actions

1. Commit the Promise Engine code
2. Apply migration to development database
3. Write integration tests (lifecycle, idempotency, cron, notifications)
4. Write simulation test (end-to-end order → promise → warning → fulfillment)
5. Verify Heart Pulse events publish
6. Verify Service Replay shows promise events
7. Create architecture documentation
8. Run full regression suite to verify no regressions
