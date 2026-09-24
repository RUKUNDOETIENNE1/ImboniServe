# Campaigns / Marketing — Shadow Mode Intelligence Design

- Domain: Campaigns / Marketing
- Feature flag: `DIE_SHADOW_CAMPAIGNS_ENABLED=false` (off by default)
- Scope: Additive, read-only, non-blocking taps; no schema or business logic changes

## Normalized Events
- CAMPAIGN_CREATED
- CAMPAIGN_SCHEDULED
- CAMPAIGN_STARTED
- CAMPAIGN_COMPLETED
- CAMPAIGN_FAILED
- HIGH_CONVERSION_CAMPAIGN
- LOW_CONVERSION_CAMPAIGN

## Shadow Ingestor
- File: `src/lib/die/business-as-plugin/campaigns/campaigns.shadow.ts`
- Checks feature flag; maps to `CampaignEvent` and routes via `routeDomainEvent` to governance, marketplace, intelligence, and unified feed

## Adapters & Mappings
- Adapter: `CampaignsPluginAdapter`
  - Governance: `ANOMALY_DETECTED` on failures; `INSTALL` for created/scheduled; `ENABLE` otherwise
  - Marketplace: usage activity per event
  - Intelligence: completionRate on completed; stability/lifecycle scores for high/low conversion
  - Observability Feed codes: `CAMPAIGN_CREATED`, `CAMPAIGN_SCHEDULED`, `CAMPAIGN_STARTED`, `CAMPAIGN_COMPLETED`, `CAMPAIGN_FAILED`, `HIGH_CONVERSION_CAMPAIGN`, `LOW_CONVERSION_CAMPAIGN`

## Event Taps (Read-only)
- `api/campaigns.ts`:
  - GET: emits observed `CAMPAIGN_SCHEDULED` (top-5) for diagnostics
  - POST: emits `CAMPAIGN_CREATED` and `CAMPAIGN_SCHEDULED` (if applicable)
- `api/campaigns/[id]/send.ts`:
  - emits `CAMPAIGN_STARTED` before send
  - after send: `CAMPAIGN_COMPLETED` or `CAMPAIGN_FAILED`
  - heuristic conversion classification using sent/(sent+failed)

## Cross-Domain Correlations (read-only)
- High-conversion/Completed campaigns + surge in session starts → capacity surge signal (affects `reservations`, `dining-slips`, `kds`)
- Low conversion → marketing ROI risk for `campaigns`

## Future AI Assistant Signals
- Campaign audience optimizer (segment, timing, incentive)
- ROI estimator with lift modeling using pre/post session/booking deltas
- Offer experimentation (multi-armed bandits) with safe-guard rails
- Attribution hints linking campaign exposure to session starts, orders, and slips

## Rollback & Safety
- Single-kill via env var `DIE_SHADOW_CAMPAIGNS_ENABLED` (default off)
- try/catch wrapped, best-effort, no blocking

## Validation
- `npx tsc --noEmit` OK
- `npx prisma validate` OK
