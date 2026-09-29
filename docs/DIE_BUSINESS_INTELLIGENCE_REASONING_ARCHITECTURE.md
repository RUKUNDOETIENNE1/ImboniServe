# DIE Business Intelligence Reasoning Architecture (Read-only)

- Feature flag: `DIE_BUSINESS_INTELLIGENCE_ENABLED=false` (default OFF)
- Purpose: Transform raw cross-domain shadow-mode signals into structured, read-only Business Insight Objects. No actions, no mutations, no UI exposure, no registration changes.

## Data Sources
- Unified Observability Feed (shadow buffer)
- Correlation Engine report (hotspots, inefficiencies, risk signals, candidates)
- Governance Engine (lifecycle states, recent audit events)
- Marketplace/Intelligence signals (indirectly via feed and governance)

## Module
- `src/lib/die/business-intelligence/reasoning-engine.ts`
  - Exports `businessReasoning.generateInsights()`
  - 60s in-memory cache
  - Returns `BusinessInsight[]`

### Business Insight Object
- `type`: categorical insight (see list below)
- `severity`: INFO | WARN | CRITICAL
- `confidence`: 0..1
- `contributingSignals`: array of `{ code, count, sampleTimestamp }`
- `explanation`: short natural-language rationale
- `affectedDomains`: e.g. `["kds","delivery"]`
- `generatedAt`: ISO timestamp

### Supported Insight Types
- DEMAND_SURGE_DETECTED
- REVENUE_RISK_DETECTED
- KITCHEN_BOTTLENECK_IDENTIFIED
- SUPPLY_CHAIN_DEGRADATION
- CAMPAIGN_EFFECTIVENESS_DROP
- CUSTOMER_CHURN_RISK
- OPERATIONAL_CONGESTION
- TABLE_TURNOVER_INEFFICIENCY

### Heuristics (Read-only)
- Demand surge: high counts of `RESERVATION_CREATED | SESSION_STARTED | DELIVERY_ACTIVATED | DELIVERY_CONFIRMED`
- Revenue risk: `PAYMENT_EXCEPTION | DELIVERY_FAILED | SUPPLIER_DELIVERY_FAILED`
- Kitchen bottleneck: co-occurrence of `KDS_BACKLOG_ALERT` and `DELIVERY_DELAYED`
- Supply chain degradation: `PROCUREMENT_DELAY_DETECTED | SUPPLIER_DELIVERY_DELAYED | SUPPLIER_DELIVERY_FAILED`
- Campaign effectiveness drop: presence/volume of `LOW_CONVERSION_CAMPAIGN`
- Churn risk: low `LOYALTY_REDEMPTION` with low `SESSION_STARTED/RESERVATION_CREATED`
- Operational congestion: `WAITER_CALL_CREATED + KDS_BACKLOG_ALERT + LONG_DURATION_SESSION`
- Table turnover inefficiency: `LONG_DURATION_SESSION` ratio vs `SESSION_STARTED`

Correlation report risk signals boost confidence when matching insight semantics.

## API Endpoint (Read-only)
- `GET /api/die/intelligence/insights`
- Returns `{ insights: BusinessInsight[] }`
- Feature-flag gated; returns empty when disabled.

## Non-Functional
- Non-blocking, read-only, no schema changes, no plugin/UI exposure.
- Safe rollback via feature flag.

## Sample Mappings (Signals → Insight)
- `KDS_BACKLOG_ALERT + DELIVERY_DELAYED` → `KITCHEN_BOTTLENECK_IDENTIFIED`
- `LOW_CONVERSION_CAMPAIGN` → `CAMPAIGN_EFFECTIVENESS_DROP`
- `PAYMENT_EXCEPTION` (+ delivery/supplier failures) → `REVENUE_RISK_DETECTED`
- `LONG_DURATION_SESSION / SESSION_STARTED >= 0.3` → `TABLE_TURNOVER_INEFFICIENCY`

## False-Positive Risk
- Moderate: Heuristics depend on recent-window counts without seasonal baselines.
- Mitigations: widen window, add trend baselines, incorporate business hours/calendar context.

## Next Phase (AI Assistant Readiness)
- Add baseline/trend models per domain (seasonality, peak windows).
- Expand finance-driven ROI signals from `FinancialLedgerEntry` (strictly read-only) for robust revenue insights.
- Introduce insight deduplication/suppression windows and thresholds by business size.
- Prepare explanation templates and playbooks (still non-actionable) for Assistant prompts.
