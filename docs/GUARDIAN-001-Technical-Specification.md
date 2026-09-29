# GUARDIAN-001 — Technical Specification

## Overview

The Guardian is an intelligent service promise protection layer that sits atop the Promise Engine. It monitors promise risk signals, gathers operational context, makes escalation decisions, routes responsibility to available staff, dispatches interventions via existing notification infrastructure, verifies outcomes, and records learning signals for continuous improvement.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Promise     │────▶│ Guardian     │────▶│ Decision        │
│ Engine      │     │ Service      │     │ Policy          │
│ (cron tick) │     │ (detect)     │     │ (evaluate)      │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐     ┌─────────────────┐
                    │ Context      │────▶│ Responsibility  │
                    │ Gatherer     │     │ Router          │
                    └──────────────┘     └────────┬────────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ Intervention │
                                          │ (WhatsApp,   │
                                          │  Alert,      │
                                          │  HeartPulse) │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ Verification │
                                          │ + Learning   │
                                          └──────────────┘
```

## Data Models

### GuardianCase
- `id`: UUID, primary key
- `businessId`: FK to Business
- `promiseId`: FK to ServicePromise
- `saleId`: FK to Sale
- `caseType`: GuardianCaseType enum (RISK_ESCALATION, BREACH_PREVENTION, RECOVERY, POST_MORTEM)
- `state`: GuardianCaseState enum (DETECTED → UNDERSTANDING → DECISION → INTERVENTION_PENDING → INTERVENED → VERIFYING → RESOLVED | BREACHED | CLEARED | CANCELLED)
- `outcome`: GuardianOutcome enum (PROTECTED_BY_GUARDIAN, RECOVERED_NATURALLY, BREACHED, INTERVENTION_FAILED, FALSE_POSITIVE, UNKNOWN)
- `triggerSignal`: string (e.g., "WARNING", "CRITICAL")
- `triggerState`: string
- `triggerElapsedMinutes`: int
- `decisionLevel`: GuardianDecisionLevel enum (OBSERVE, RECOMMEND, ALERT, ESCALATE)
- `decisionReasoning`: text
- `assignedUserId`: FK to User (nullable)
- `assignedRole`: string (nullable)
- `interventionCount`: int (default 0)
- `lastNotificationChannel`: string (nullable)
- `lastNotificationAt`: datetime (nullable)
- `contextSnapshot`: JSON
- `detectedAt`: datetime
- `resolvedAt`: datetime (nullable)
- `idempotencyKey`: string, unique

### GuardianIntervention
- `id`: UUID, primary key
- `caseId`: FK to GuardianCase
- `interventionType`: string (WHATSAPP, ALERT, HEART_PULSE)
- `channel`: string
- `recipient`: string (nullable)
- `result`: string (DELIVERED, FAILED, SUPPRESSED)
- `dispatchedAt`: datetime
- `idempotencyKey`: string, unique

### GuardianLearningSignal
- `id`: UUID, primary key
- `caseId`: FK to GuardianCase (1:1)
- `businessId`: FK to Business
- `caseType`: GuardianCaseType
- `outcome`: GuardianOutcome
- `decisionLevel`: GuardianDecisionLevel
- `interventionCount`: int
- `elapsedMinutesFromSignal`: int
- `contextSummary`: JSON
- `lessonsLearned`: text
- `recordedAt`: datetime

## Decision Policy

| Promise State | Elapsed Ratio | Decision Level | Should Intervene |
|---|---|---|---|
| ON_TRACK | any | OBSERVE | no |
| WARNING | < 1.5x warning threshold | OBSERVE | no |
| WARNING | >= 1.5x warning threshold | RECOMMEND | yes |
| CRITICAL | < 90% breach threshold, < 5 items | ALERT | yes |
| CRITICAL | < 90% breach threshold, >= 5 items | ALERT | yes |
| CRITICAL | >= 90% breach threshold | ESCALATE | yes |
| CRITICAL | >= 100% breach threshold | ESCALATE | yes |
| FAILED | any | ESCALATE | yes |
| RECOVERED | any | OBSERVE | no |

## Modes

| Mode | Behavior |
|---|---|
| OFF | Feature flag disabled — Guardian does not run |
| SHADOW | Feature flag enabled, no override — Guardian detects and logs but does not dispatch interventions |
| ASSIST | Feature flag enabled + override — Guardian dispatches interventions via WhatsApp/Alert/HeartPulse |

## Integration Points

### Cron (In-Process)
- `CronService.scheduleGuardianEvaluation()` — runs every 2 minutes, offset 30s from Promise Engine tick
- Calls `GuardianService.evaluateActiveSignals()` then `GuardianService.verifyActiveCases()`

### Cron (Vercel)
- `GET /api/cron/guardian` — Vercel cron, `*/2 * * * *`
- Protected by `CRON_SECRET` bearer auth

### API Routes
- `GET /api/guardian` — active cases + metrics + mode
- `GET /api/guardian/[caseId]` — case detail with interventions
- `POST /api/guardian/[caseId]/acknowledge` — acknowledge case
- `GET /api/guardian/metrics` — aggregate metrics

### Heart Pulse Events
- `guardian.case.opened`
- `guardian.intervention.dispatched`
- `guardian.case.acknowledged`
- `guardian.case.resolved`
- `guardian.breach.detected`
- `guardian.learning.recorded`

### Notification Services
- `NotificationService.sendWhatsApp(phone, message)` — staff WhatsApp alerts
- `AlertDeliveryService.deliver(alert)` — email + Slack escalation
- `TicketEventService.recordEvent()` — append-only audit trail

## Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Guardian models + enums |
| `src/lib/guardian/guardian.service.ts` | Main service: detect, intervene, verify, learn, metrics |
| `src/lib/guardian/decision-policy.ts` | Decision evaluation logic |
| `src/lib/guardian/context-gatherer.ts` | Operational context snapshot |
| `src/lib/guardian/responsibility-router.ts` | Staff routing by role priority |
| `src/lib/guardian/types.ts` | Type definitions |
| `src/lib/guardian/index.ts` | Barrel export |
| `src/lib/cron.ts` | Cron integration |
| `src/pages/api/cron/guardian.ts` | Vercel cron endpoint |
| `src/pages/api/guardian/index.ts` | Cases + metrics API |
| `src/pages/api/guardian/[caseId].ts` | Case detail API |
| `src/pages/api/guardian/[caseId]/acknowledge.ts` | Acknowledge API |
| `src/pages/api/guardian/metrics.ts` | Metrics API |
| `src/pages/dashboard/operations/guardian.tsx` | Dashboard UI |
| `src/components/DashboardLayout.tsx` | Navigation entry |
| `src/lib/heart-pulse/event-catalog.ts` | Event catalog entries |
| `src/lib/services/feature-flag.service.ts` | guardian_v1 flag |
| `vercel.json` | Vercel cron schedule |
