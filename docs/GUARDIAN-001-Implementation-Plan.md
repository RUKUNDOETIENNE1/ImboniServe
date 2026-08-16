# GUARDIAN-001 — Implementation Plan

**Date**: 2026-08-16
**Baseline**: `c5e34e3`

## Implementation Phases

### Phase 1: Prisma Schema & Migration (G4)

**Models to add:**
- `GuardianCase` — core case entity
- `GuardianIntervention` — auditable intervention records
- `GuardianLearningSignal` — outcome-based learning records

**Enums to add:**
- `GuardianCaseState` — DETECTED, UNDERSTANDING, DECISION, INTERVENTION_PENDING, INTERVENED, VERIFYING, RESOLVED, BREACHED, CLEARED, CANCELLED
- `GuardianOutcome` — PROTECTED_BY_GUARDIAN, RECOVERED_NATURALLY, INTERVENTION_FAILED, BREACHED, FALSE_POSITIVE, UNKNOWN
- `GuardianCaseType` — SERVICE_PROMISE_RISK (extensible)
- `GuardianDecisionLevel` — OBSERVE, RECOMMEND, ALERT, ESCALATE
- `GuardianMode` — OFF, SHADOW, ASSIST

**Existing enums to extend:**
- `TicketEventType` — add GUARDIAN_CASE_OPENED, GUARDIAN_CASE_SUPPRESSED, GUARDIAN_RECOMMENDATION_CREATED, GUARDIAN_NOTIFICATION_SENT, GUARDIAN_ACKNOWLEDGED, GUARDIAN_ESCALATED, GUARDIAN_INTERVENTION_RECORDED, GUARDIAN_RECOVERY_DETECTED, GUARDIAN_BREACH_DETECTED, GUARDIAN_CASE_RESOLVED

**Existing models to extend:**
- `FeatureFlag` INITIAL_FLAGS — add `guardian_v1` flag (default: OFF)

**Migration**: Single additive migration — no breaking changes to existing tables.

### Phase 2: Guardian Service Layer (G5)

**Files to create:**
- `src/lib/guardian/guardian.service.ts` — main orchestrator
- `src/lib/guardian/decision-policy.ts` — deterministic decision rules
- `src/lib/guardian/context-gatherer.ts` — operational context assembly
- `src/lib/guardian/responsibility-router.ts` — person identification
- `src/lib/guardian/types.ts` — shared interfaces
- `src/lib/guardian/index.ts` — barrel export

**GuardianService methods:**
- `detect(businessId, promiseId, signalType)` — idempotent case creation
- `understand(caseId)` — gather context
- `decide(caseId)` — apply decision policy
- `intervene(caseId)` — create intervention + dispatch notification
- `verify(caseId)` — check promise state, determine outcome
- `recordLearning(caseId)` — preserve learning signal
- `processSignal(businessId, promiseId, signalType)` — full pipeline (detect→understand→decide→intervene)
- `verifyActiveCases(businessId?)` — cron-called verification sweep

### Phase 3: Heart Pulse Integration (G6)

**Files to modify:**
- `src/lib/heart-pulse/event-catalog.ts` — add Guardian event types, payloads, ownership, subscribers
- No new publisher — reuse `publishHeartPulseEvent()`

**New event types:**
- `guardian.case.opened`, `guardian.case.suppressed`, `guardian.recommendation.created`, `guardian.notification.sent`, `guardian.acknowledged`, `guardian.escalated`, `guardian.intervention.recorded`, `guardian.recovery.detected`, `guardian.breach.detected`, `guardian.case.resolved`

### Phase 4: Promise Engine Integration (G7)

**Approach**: Polling-based (not event subscription) for v1 simplicity and safety.

**Rationale**: Heart Pulse uses Pusher (real-time websocket), which requires a persistent client connection. Guardian runs server-side via cron. Polling `ServicePromise` records in WARNING/CRITICAL state is simpler, idempotent, and doesn't require Pusher client infrastructure.

**Integration point**: Guardian cron queries `ServicePromise` where `state IN (WARNING, CRITICAL)` and `businessId` matches, then calls `GuardianService.processSignal()` for each.

**Future**: Could add Pusher webhook subscription for real-time detection.

### Phase 5: Notification Integration (G8)

**Reuse**: `NotificationService.sendWhatsApp()` for staff alerts, `AlertDeliveryService.deliver()` for escalation.

**Dedup**: Guardian tracks last notified timestamp per case. Decision policy suppresses duplicate notifications within a configurable window (default: 15 minutes).

**No new notification framework.** Guardian calls existing services with Guardian-formatted messages.

### Phase 6: API Routes (G9)

**Files to create:**
- `src/pages/api/guardian/cases/index.ts` — GET (list cases), POST (manual trigger)
- `src/pages/api/guardian/cases/[id].ts` — GET (case detail), PATCH (acknowledge/intervene)
- `src/pages/api/guardian/cases/[id]/interventions.ts` — POST (record intervention)
- `src/pages/api/guardian/metrics.ts` — GET (aggregate metrics)

**Authorization**: `resolveBusinessContext()` + businessId scoping on every query.

### Phase 7: Guardian UI (G10)

**File to create:**
- `src/pages/dashboard/operations/guardian.tsx` — main Guardian page

**Sections:**
1. Protection State Summary (active cases, protected promises, breached today)
2. Active Cases (cards with risk level, context, recommendation, assigned person)
3. Case Detail (expanded view with full lifecycle, interventions, outcome)
4. Resolved History (recent resolved/breached cases with outcome classification)

**Responsive**: Tailwind classes from day one (grid-cols-1 md:grid-cols-2 lg:grid-cols-3, flex-wrap, overflow-x-auto, responsive padding).

**DashboardLayout**: Reuse existing layout. Add nav item under OPERATIONS section.

### Phase 8: SHADOW Mode (G11)

**Mechanism**: `FeatureFlagService.isEnabled('guardian_v1', businessId)` returns:
- `false` → OFF (no processing)
- Read `BusinessFeatureOverride.enabled` → if true, check `GuardianMode` stored in override metadata or env var

**SHADOW behavior**: Guardian processes signals, creates cases, gathers context, makes decisions, records everything. `GuardianService.intervene()` is skipped — no notifications sent. UI visible only to ADMIN/OWNER roles.

**ASSIST behavior**: Full pipeline including notifications. UI visible to all authorized roles.

### Phase 9: Cron Integration

**File to modify:**
- `src/lib/cron.ts` — add `scheduleGuardianEvaluation()` (every 2 min, aligned with Promise Engine cron) and `scheduleGuardianVerification()` (every 3 min)

**Vercel**: Add cron entries to `vercel.json` if needed.

### Phase 10: Tests (G14)

**Files to create:**
- `tests/unit/guardian/decision-policy.test.ts` — deterministic decision rules
- `tests/unit/guardian/context-gatherer.test.ts` — context assembly
- `tests/unit/guardian/responsibility-router.test.ts` — routing logic
- `tests/integration/guardian-lifecycle.test.ts` — full case lifecycle
- `tests/integration/guardian-idempotency.test.ts` — duplicate signal handling
- `tests/integration/guardian-promise-integration.test.ts` — Promise Engine signal consumption
- `tests/security/guardian-tenant-isolation.test.ts` — cross-business rejection
- `tests/performance/guardian-workload.test.ts` — 10/50/100/500 case performance

### Phase 11: Golden-Path Simulation (G15)

**File to create:**
- `tests/simulation/guardian-golden-path.test.ts` — Orders A through I

### Phase 12: Responsive Verification (G16)

- Code-level Tailwind class verification
- Responsive regression test in `tests/guardian/responsive-classes.test.ts`

### Phase 13: Quality Gates (G17)

- Prisma validate
- Typecheck
- Full test suite
- Production build

### Phase 14: Documentation (G18)

12 deliverable documents (see mission spec section 43).

### Phase 15: Git Discipline (G19)

Single commit, push, verify HEAD.

## File Creation Order

1. Prisma schema additions + migration
2. Guardian types + service layer
3. Heart Pulse event catalog extension
4. Feature flag addition
5. API routes
6. UI page
7. Cron integration
8. Tests
9. Simulation
10. Documentation
11. Quality gates
12. Commit + push
