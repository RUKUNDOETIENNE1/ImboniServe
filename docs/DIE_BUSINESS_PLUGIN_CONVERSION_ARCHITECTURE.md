# DIE Business Domain → Plugin Conversion Architecture v1.0

## Objective
Provide a reusable, incremental system to convert core business modules into first-class DIE plugins, without breaking existing behavior.

## Principles
- Additive only — no rewrites, no schema changes, no runtime behavior changes
- Read-only intelligence hooks — no autonomous actions
- Governance, Marketplace, Intelligence, and Observability integrations are standardized
- Business isolation and performance guarantees preserved

## Architecture

### Conversion Framework (Code)
- Base adapter and contracts under `src/lib/die/business-as-plugin/conversion/`
  - `types.ts`: DomainEvent, adapter meta, mappings to governance/marketplace/intelligence/feed
  - `adapter.base.ts`: BaseDomainPluginAdapter (builds minimal DIEPlugin object)
  - `plugin-template.ts`: Helper to build a plugin from any adapter
  - `contracts.ts`: Integration contracts (governance, marketplace, intelligence, observability)

### Domain-Specific Adapters
- Each domain provides an adapter implementing the conversion contracts, e.g.:
  - `reservations/` (reference-only sample)
  - `kds/`, `inventory/`, `loyalty/`, `delivery/`, `events/`, `room-service/` (to be added)

### Integration Surfaces (Read-Only)
- Governance Engine: lifecycle and anomaly signals
- Marketplace Intelligence: adoption, usage, stability metrics
- Intelligence Core: plugin-level intelligence participation
- Unified Observability Layer: normalized feed items
- Control Plane: appears in summaries and ecosystem health once registered

## Contracts
- Governance: `recordLifecycle({ eventType, metadata })`
- Marketplace: `recordUsage({ usageFrequency, lastUsedAt, trendDirection, activityScore })`
- Intelligence: `recordMetrics({ stabilityScore, anomalyRate, governanceRiskScore, lifecycleConsistencyScore })`
- Observability: `emitFeed({ code, message, severity, data })`

## Sample (Reservations) — Reference Only
- Files:
  - `reservations.contract.ts`: Event types (BOOKING_CREATED/UPDATED/CANCELLED, CAPACITY_ALERT)
  - `reservations.adapter.ts`: Maps events to governance/marketplace/intelligence/feed
  - `reservations.plugin.sample.ts`: Builds a plugin object (not registered)

## Safety
- Adapters do NOT modify existing services or schemas
- Registration and event binding occur later, behind feature flags
- Rollback = disable adapter registration; original services remain intact

