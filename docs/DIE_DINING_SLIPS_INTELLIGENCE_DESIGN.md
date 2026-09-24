# Dining Sessions & Slips — Shadow Mode Intelligence Design

- Domain: Dining Sessions & Slips
- Feature flag: `DIE_SHADOW_DINING_SLIPS_ENABLED=false` (off by default)
- Scope: Additive, read-only, non-blocking shadow event taps; no schema or business logic changes

## Normalized Events
- SESSION_STARTED
- SESSION_UPDATED
- SESSION_CLOSED
- SLIP_CREATED
- SLIP_PAID
- HIGH_VALUE_SESSION
- LONG_DURATION_SESSION
- PAYMENT_EXCEPTION

## Shadow Ingestor
- File: `src/lib/die/business-as-plugin/dining-slips/slips.shadow.ts`
- Checks feature flag; maps shadow inputs to `DiningSlipEvent` and routes via `routeDomainEvent` to
  - Governance
  - Marketplace
  - Intelligence Core
  - Unified Observability Feed

## Adapters & Mappings
- Adapter: `DiningSlipsPluginAdapter`
  - Governance: `ANOMALY_DETECTED` for `SEND_FAILED`, `PAYMENT_EXCEPTION`; `INSTALL` for `SESSION_STARTED`, `SLIP_CREATED`; `ENABLE` otherwise
  - Marketplace: usage signals on each event
  - Intelligence: anomalyRate/governanceRiskScore for exceptions; completionRate on paid; stability and lifecycle scores for value/duration
  - Observability Feed codes: `SESSION_STARTED`, `SESSION_UPDATED`, `SESSION_CLOSED`, `SLIP_CREATED`, `SLIP_PAID`, `HIGH_VALUE_SESSION`, `LONG_DURATION_SESSION`, `PAYMENT_EXCEPTION`, `SLIP_SEND_FAILED`

## Event Taps (Read-only)
- `api/session/initialize.ts`: `SESSION_STARTED`, `SLIP_CREATED`
- `api/session/summary.ts`: `SESSION_UPDATED`, heuristics for `HIGH_VALUE_SESSION` (>= 5,000 RWF), `LONG_DURATION_SESSION` (>= 120 min)
- `api/session/close.ts`: `SESSION_CLOSED`
- `api/checkout/tap-and-leave.ts`: `SLIP_PAID` on success; `PAYMENT_EXCEPTION` on failure
- `api/webhooks/intouch.ts`: webhook resolution for `SLIP_PAID` or `PAYMENT_EXCEPTION`
- `api/smart-dining-slips/[id].ts`: neutral `SLIP_CREATED` signal on resend action

## Cross-Domain Correlations (read-only)
- Payment Exceptions Spike → risk for `dining-slips`, `payments`
- Long Sessions → table turnover risk for `table-management`
- Pair with `reservations`, `kds`, `delivery` signals for peak management

## Future AI Assistant Signals
- Session profitability scorer (items mix, margin, dwell time)
- Table-turnover forecaster and prompts (nudge to settle bill)
- High-value guest detector and loyalty enrichment suggestion
- Payment risk early-warning using failure trend + provider health

## Rollback & Safety
- Single-kill via env var `DIE_SHADOW_DINING_SLIPS_ENABLED` (default off)
- All taps are best-effort, wrapped in try/catch and non-blocking
- No writes beyond existing business operations

## Validation
- `npx tsc --noEmit` OK
- `npx prisma validate` OK
