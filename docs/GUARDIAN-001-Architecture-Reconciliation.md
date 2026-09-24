# GUARDIAN-001 — Architecture Reconciliation

**Date**: 2026-08-16
**Baseline**: `c5e34e3` (CONTENT-002R complete)

## 1. Current System Architecture

```
                   IMBONISERVE OPERATION
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       ORDERS           KITCHEN          SERVICE
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                    HEART PULSE CORE
                   (event-catalog.ts, publisher.ts)
                   Pusher-based, correlation-tracked
                           ↓
                   OPERATIONAL EVENTS
                   (order.*, item.*, kitchen.*, promise.*)
                           ↓
                    PROMISE ENGINE
                   (evaluator.ts, promise-engine.service.ts)
                   Deterministic state evaluation
                   ON_TRACK → WARNING → CRITICAL → FAILED
                                         ↘ FULFILLED / RECOVERED
                           ↓
                   SERVICE-PROMISE RISK
                   (getActiveRisks API)
                   Consumed by: /dashboard/operations/service-risks
                           ↓
                      [GAP HERE]
                           ↓
                       GUARDIAN ← TO BE BUILT
```

## 2. Existing Systems — Detailed Inventory

### 2.1 Heart Pulse Core

| Aspect | Detail |
|---|---|
| Location | `src/lib/heart-pulse/` |
| Files | `event-catalog.ts`, `publisher.ts`, `index.ts` |
| Transport | Pusher (private channels) |
| Event types | `HeartPulseEventType` enum — order, item, kitchen, promise, payment, settlement events |
| Channel naming | `HeartPulseChannel.business(id)`, `.kitchen(id)`, `.station(id)`, `.order(id)` |
| Correlation | UUID-based `correlationId` per event, batch support |
| Idempotency | Publisher does not deduplicate — consumers must handle |
| Tenant safety | `businessId` in every event envelope |

**Promise Engine events already published:**
- `promise.created`, `promise.warning`, `promise.critical`, `promise.fulfilled`, `promise.recovered`, `promise.failed`

### 2.2 Promise Engine

| Aspect | Detail |
|---|---|
| Location | `src/lib/promise-engine/` |
| Evaluator | `evaluator.ts` — pure function, no side effects, deterministic |
| Service | `promise-engine.service.ts` — orchestrates DB, events, notifications |
| Prisma model | `ServicePromise` — `idempotencyKey @unique`, `businessId`, `saleId`, `state`, timing fields |
| States | `PromiseState` enum: `ON_TRACK`, `WARNING`, `CRITICAL`, `FULFILLED`, `FAILED`, `RECOVERED` |
| Cron | `CronService.schedulePromiseEvaluation()` — every 2 minutes, calls `PromiseEngine.evaluateActivePromises()` |
| Error isolation | One promise failure does not stop others |
| Batch limit | 200 promises per evaluation cycle |
| Auto-fail | 60 minutes elapsed without fulfillment → `FAILED` |
| Interventions | `triggerIntervention()` — WhatsApp on WARNING, WhatsApp+AlertDeliveryService on CRITICAL, AlertDeliveryService on FAILED |
| API | `GET /api/service-risks` (active risks), `GET /api/service-risks/stats` (daily stats) |
| UI | `/dashboard/operations/service-risks` — real-time dashboard, 30s auto-refresh |
| Tests | `tests/unit/promise-engine/evaluator.test.ts`, `tests/reliability/promise-001-integration.test.ts` |

### 2.3 TicketEvent

| Aspect | Detail |
|---|---|
| Location | `src/lib/services/ticket-event.service.ts` |
| Prisma model | `TicketEvent` — append-only, `idempotencyKey`, `sequenceNumber`, `metadata` JSON |
| Event types | `TicketEventType` enum includes `PROMISE_CREATED/WARNING/CRITICAL/FULFILLED/RECOVERED/FAILED` |
| Dedup | P2002 on `idempotencyKey` silently ignored |
| Used by | Promise Engine records events on every state transition |

### 2.4 Service Replay

| Aspect | Detail |
|---|---|
| Location | `src/lib/service-replay/` |
| Files | `types.ts`, `transformer.ts`, `statistics.ts`, `time-utils.ts` |
| Mechanism | Transforms `TicketEvent` records into `ReplayEvent` timeline |
| Promise mapping | `TICKET_EVENT_TYPE_MAP` already maps all `PROMISE_*` events |
| API | `/api/service-replay`, `/api/die/operations/replay` |
| UI | `/dashboard/operations/service-replay` |

### 2.5 Notification Infrastructure

| Service | Location | Mechanism |
|---|---|---|
| `NotificationService` | `src/lib/services/notification.service.ts` | WhatsApp via Twilio API |
| `AlertDeliveryService` | `src/lib/services/alert-delivery.service.ts` | Email (nodemailer) + Slack (webhook) |
| Watchdog system | `src/lib/services/watchdog/` | 8 watchdog services with standardized alert format |

### 2.6 Feature Flags

| Aspect | Detail |
|---|---|
| Location | `src/lib/services/feature-flag.service.ts` |
| Prisma model | `FeatureFlag` (global) + `BusinessFeatureOverride` (per-business) |
| API | `FeatureFlagService.isEnabled(key, businessId?)` |
| Pattern | Global flag + optional business-level override |
| Existing flags | 17 flags defined in `FEATURE_FLAGS` const |

### 2.7 Business Context & Authorization

| Aspect | Detail |
|---|---|
| API auth | `resolveBusinessContext(req, res)` → `{ userId, businessId, roles }` |
| Page auth | `getServerSideProps` with `getServerSession` + role check |
| Roles | `OWNER`, `MANAGER`, `ADMIN`, `SUPERVISOR`, `CHEF`, `KITCHEN_STAFF` (from service-risks page) |
| Tenant isolation | All queries scoped by `businessId` |

### 2.8 Cron Infrastructure

| Aspect | Detail |
|---|---|
| Location | `src/lib/cron.ts` |
| Pattern | `CronService.start()` → `scheduleX()` methods, `setInterval`-based |
| Vercel | Skipped on Vercel (`VERCEL === '1'`), uses `vercel.json` cron config instead |
| Promise Engine | `schedulePromiseEvaluation()` — 2-minute interval |

## 3. Boundary: Where Does Promise Engine Stop and Guardian Begin?

```
PROMISE ENGINE OWNS:
  • ServicePromise lifecycle (creation, evaluation, state transitions)
  • Deterministic timing evaluation (elapsed vs thresholds)
  • Publishing promise state events to Heart Pulse
  • Recording TicketEvents for promise transitions
  • Direct staff notifications (WhatsApp/AlertDeliveryService) on state changes
  • Providing active risk query API

GUARDIAN OWNS:
  • Receiving promise risk signals (WARNING, CRITICAL, FAILED, RECOVERED)
  • Deciding whether a signal is significant enough to act on
  • Gathering operational context (order state, kitchen workload, etc.)
  • Creating and managing Guardian Cases (idempotent, deduplicated)
  • Routing responsibility to the right person
  • Recording interventions as auditable objects
  • Continuing to observe after intervention
  • Verifying outcome (protected, breached, recovered naturally, false positive)
  • Preserving learning signals
  • Publishing Guardian-specific Heart Pulse events
  • Guardian UI (protection state, cases, recommendations, outcomes)

GUARDIAN DOES NOT OWN:
  • Promise state evaluation (that's the evaluator)
  • Promise creation or threshold management
  • Direct WhatsApp/AlertDeliveryService calls (it delegates to existing infra)
  • Service Replay transformation (it extends, not replaces)
  • Service Risks dashboard (separate, coexists)
```

## 4. Reuse / Add / Extend / Untouch Matrix

### A. What Guardian Can Reuse (Directly)

| System | Reuse Point |
|---|---|
| Heart Pulse publisher | `publishHeartPulseEvent()` for Guardian events |
| Heart Pulse event catalog | Pattern for defining new Guardian event types |
| Heart Pulse channels | `HeartPulseChannel.business(id)` for Guardian events |
| `resolveBusinessContext` | API authorization for Guardian routes |
| `FeatureFlagService` | `isEnabled('guardian_v1', businessId)` for SHADOW mode |
| `DashboardLayout` | UI shell for Guardian pages |
| `NotificationService.sendWhatsApp` | Delivery mechanism for Guardian alerts |
| `AlertDeliveryService.deliver` | Escalation channel for Guardian |
| Prisma patterns | `idempotencyKey @unique`, P2002 handling, `businessId` scoping |
| Cron pattern | `CronService.scheduleX()` for Guardian verification loop |
| TicketEvent | Guardian can record events for audit trail |

### B. What Guardian Needs to Add (New)

| Addition | Purpose |
|---|---|
| `GuardianCase` Prisma model | Core case entity with lifecycle |
| `GuardianIntervention` Prisma model | Auditable intervention records |
| `GuardianLearningSignal` Prisma model | Outcome-based learning records |
| `GuardianCaseState` enum | DETECTED, UNDERSTANDING, DECISION, INTERVENTION_PENDING, INTERVENED, VERIFYING, RESOLVED, BREACHED, CLEARED, CANCELLED |
| `GuardianOutcome` enum | PROTECTED_BY_GUARDIAN, RECOVERED_NATURALLY, INTERVENTION_FAILED, BREACHED, FALSE_POSITIVE, UNKNOWN |
| `GuardianCaseType` enum | SERVICE_PROMISE_RISK (v1 only, extensible) |
| `GuardianMode` enum | OFF, SHADOW, ASSIST |
| `GuardianService` | Core service: detect, understand, decide, intervene, verify, learn |
| `GuardianDecisionPolicy` | Deterministic rules for silence vs recommend vs alert vs escalate |
| `GuardianContextGatherer` | Gathers operational context from existing data |
| `GuardianResponsibilityRouter` | Identifies who should be notified |
| Guardian Heart Pulse event types | `guardian.case.opened`, `guardian.case.suppressed`, etc. |
| Guardian API routes | `/api/guardian/cases`, `/api/guardian/cases/[id]`, `/api/guardian/metrics` |
| Guardian UI page | `/dashboard/operations/guardian` |
| `GUARDIAN_V1` feature flag | Controls OFF/SHADOW/ASSIST mode |
| Guardian cron | Verification loop — checks active cases for outcome changes |

### C. What Existing Code Must Be Extended

| System | Extension | How |
|---|---|---|
| Heart Pulse event catalog | Add Guardian event types | Add to `HeartPulseEventType` const + `EventOwnership` + `EventSubscribers` |
| TicketEventType enum | Add Guardian event types | Add `GUARDIAN_CASE_OPENED` etc. to enum |
| Service Replay transformer | Map Guardian TicketEvents | Add entries to `TICKET_EVENT_TYPE_MAP` |
| Service Replay types | Add Guardian replay event types | Add to `ReplayEventType` union |
| CronService | Add Guardian verification schedule | `scheduleGuardianVerification()` |
| FeatureFlagService | Add `GUARDIAN_V1` flag | Add to `FEATURE_FLAGS` const + `INITIAL_FLAGS` |
| DashboardLayout nav | Add Guardian link | Add nav item under OPERATIONS section |

### D. What Must Remain Untouched

| System | Reason |
|---|---|
| `evaluator.ts` | Pure deterministic evaluation — Guardian must not alter promise logic |
| `promise-engine.service.ts` core logic | Promise creation, evaluation, state transitions — Guardian consumes signals, doesn't modify |
| `ServicePromise` Prisma model | Guardian reads but does not modify promise records |
| Service Risks dashboard | Coexists — different purpose (what's happening vs what needs attention) |
| Payment/financial systems | Out of scope per mission requirements |
| Content/editorial platform | Out of scope per mission requirements |
| Business CMS | No changes to existing business management |

## 5. Integration Points — Detailed Boundary Specification

### 5.1 Detection Boundary

```
Input:   PromiseEngine.evaluateActivePromises() → state transitions
         Heart Pulse events: promise.warning, promise.critical, promise.failed, promise.recovered
Output:  Guardian Case created (or suppressed if duplicate/insufficient significance)
Owner:   GuardianService.detect()
Persistence: GuardianCase record
Idempotency: guardian:case:{promiseId}:{signalType} unique key
Error: Malformed signal → reject safely, log, continue
```

### 5.2 Understanding Boundary

```
Input:   GuardianCase + promiseId
Output:  ContextSnapshot (JSON) — order state, elapsed time, kitchen workload, etc.
Owner:   GuardianContextGatherer.gather()
Persistence: GuardianCase.contextSnapshot (JSON field)
Error: Context lookup fails → preserve partial evidence, mark unavailable fields
```

### 5.3 Decision Boundary

```
Input:   GuardianCase + ContextSnapshot
Output:  DecisionLevel (OBSERVE | RECOMMEND | ALERT | ESCALATE) + reasoning
Owner:   GuardianDecisionPolicy.evaluate()
Persistence: GuardianCase.decisionLevel + GuardianCase.decisionReasoning
Error: N/A (deterministic rules, no external dependencies)
```

### 5.4 Responsibility Boundary

```
Input:   GuardianCase + businessId + decision level
Output:  ResponsiblePerson { userId, role, notificationChannel }
Owner:   GuardianResponsibilityRouter.route()
Persistence: GuardianCase.assignedUserId
Error: No eligible person → escalate to business owner, log
```

### 5.5 Intervention Boundary

```
Input:   GuardianCase + decision + responsible person
Output:  GuardianIntervention record + notification dispatched
Owner:   GuardianService.intervene()
Persistence: GuardianIntervention record
Notification: Delegates to NotificationService.sendWhatsApp / AlertDeliveryService.deliver
Error: Notification fails → case remains active, retry policy explicit
```

### 5.6 Verification Boundary

```
Input:   Active GuardianCase + promiseId
Output:  Outcome determination (PROTECTED / BREACHED / RECOVERED_NATURALLY / FALSE_POSITIVE / UNKNOWN)
Owner:   GuardianService.verify()
Persistence: GuardianCase.outcome + GuardianLearningSignal
Trigger: Cron-based (every 2 minutes) + event-driven on promise.recovered/fulfilled/failed
Error: Promise not found → mark case CANCELLED
```

### 5.7 Learning Boundary

```
Input:   Resolved/Breached GuardianCase + full lifecycle
Output:  GuardianLearningSignal record
Owner:   GuardianService.recordLearning()
Persistence: GuardianLearningSignal record
Content: situation → context → decision → intervention → outcome chain
Error: N/A (passive recording)
```

## 6. Where Does Promise Engine Stop and Guardian Begin?

**Promise Engine stops at**: Publishing state transitions and triggering direct notifications. It answers "what is the promise state?" and "has a threshold been crossed?"

**Guardian begins at**: Receiving those signals and deciding whether they require human attention. It answers "does this matter?", "who should know?", "what should they do?", and "did it work?"

The boundary is the **signal** — Promise Engine produces risk signals, Guardian consumes them. Guardian never evaluates promise timing, never modifies promise state, and never duplicates the service-risk API. It sits above, closes the operational loop, and preserves learning.

## 7. Guardian Mode Architecture

```
GUARDIAN_V1 feature flag states:

OFF     → No Guardian processing. Cron skips. API returns empty. UI shows "disabled."
SHADOW  → Guardian evaluates, creates cases, gathers context, makes decisions, records everything.
           NO notifications sent. NO user-facing interruptions. UI visible to engineers/admins only.
ASSIST  → Guardian can send recommendations and alerts via existing notification infrastructure.
           User-facing Guardian UI active. No autonomous operational actions.

Transition: OFF → SHADOW → ASSIST (manual, via feature flag management)
```

## 8. Data Flow Summary

```
1. PromiseEngine.evaluateActivePromises() [existing, unmodified]
2. → State transition (e.g., ON_TRACK → WARNING)
3. → publishHeartPulseEvent('promise.warning') [existing]
4. → TicketEventService.recordEvent('PROMISE_WARNING') [existing]
5. → triggerIntervention() [existing — WhatsApp to staff]

6. → Guardian cron (every 2 min) polls active promises in WARNING/CRITICAL state
7. → GuardianService.detect() — idempotent case creation
8. → GuardianContextGatherer.gather() — context snapshot
9. → GuardianDecisionPolicy.evaluate() — OBSERVE/RECOMMEND/ALERT/ESCALATE
10. → If SHADOW: record only. If ASSIST: GuardianService.intervene()
11. → GuardianResponsibilityRouter.route() — identify person
12. → NotificationService.sendWhatsApp() or AlertDeliveryService.deliver() [existing, reused]
13. → GuardianIntervention record created
14. → Guardian cron continues monitoring case
15. → PromiseEngine evaluates again → state changes to FULFILLED/RECOVERED/FAILED
16. → GuardianService.verify() — determines outcome
17. → GuardianLearningSignal record created
18. → GuardianCase transitions to RESOLVED/BREACHED/CLEARED
19. → publishHeartPulseEvent('guardian.case.resolved') [new event type]
```
