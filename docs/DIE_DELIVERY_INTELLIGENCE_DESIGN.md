# DIE Delivery Intelligence Design (Shadow Mode)

- Feature flag: `DIE_SHADOW_DELIVERY_ENABLED=false` (default OFF)
- Scope: Read-only signals for Delivery Management lifecycle, strictly non-invasive and non-blocking.
- No business logic changes, no schema changes, no UI exposure, no plugin registration.

## Normalized Delivery Events
- DELIVERY_CREATED
- DELIVERY_ASSIGNED
- DELIVERY_ACCEPTED
- DELIVERY_PICKED_UP
- DELIVERY_IN_TRANSIT
- DELIVERY_COMPLETED
- DELIVERY_DELAYED
- DELIVERY_FAILED
- DELIVERY_CANCELLED
- DELIVERY_DRIVER_ALERT

## Routing and Mappings
- Governance: ENABLE for normal lifecycle; ANOMALY_DETECTED for delays/failures/driver alerts.
- Marketplace: usageFrequency=1, activityScore≈4, trendDirection=UP, lastUsedAt=event.ts.
- Intelligence (read-only): deliveryRiskScore, delayRiskScore, completionRate, fulfillmentScore, governanceRiskScore, anomalyRate.
- Observability feed (sourceTag='delivery'):
  - DELIVERY_CREATED (INFO)
  - DELIVERY_ASSIGNED (INFO)
  - DELIVERY_COMPLETED (INFO)
  - DELIVERY_DELAYED (WARN)
  - DELIVERY_FAILED (CRITICAL)

## Ingestor
- File: `src/lib/die/business-as-plugin/delivery/delivery.shadow.ts`
- No-op unless feature flag is `true`.

## Shadow Taps (post-success only)
- `pages/api/orders/[id]/status.ts`: maps known status strings to normalized delivery events (ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, CANCELLED, DRIVER_ALERT).
- `pages/api/public/order/confirm.ts`: emits DELIVERY_CREATED on confirm, DELIVERY_CANCELLED on cancel.

## Cross-Domain Correlations (Read-Only)
- Inventory ↔ Delivery: shortages correlate with delivery delays.
- Procurement ↔ Delivery: procurement delays correlate with delivery delays.
- KDS ↔ Delivery: kitchen backlog correlates with delivery lateness.
- Reservations ↔ Delivery: reservation spikes correlate with delivery delays.

## Future Assistant Signals
- Delivery KPIs: on-time rate, average transit time (heuristic), delay rate, failure rate.
- Recommendations (future): staffing for peaks, route adjustments, SLA tuning, courier allocation.
- Risk predictions (future): demand surge risk windows, at-risk routes, supplier-induced delays.
- Optimization opportunities (future): batching strategies, prep pacing, zone-based courier staging.

## Rollback
- Set `DIE_SHADOW_DELIVERY_ENABLED=false` and restart; all delivery shadow emissions stop.
