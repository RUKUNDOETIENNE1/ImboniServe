# DIE Supplier Shadow Integration

- **Feature flag**: `DIE_SHADOW_SUPPLIERS_ENABLED=false` (default OFF)
- **Scope**: Read-only, non-blocking supplier lifecycle signals.
- **No changes**: schema, runtime, business logic, UI, marketplace.

## Event Model (normalized)
- SUPPLIER_CREATED
- SUPPLIER_UPDATED
- SUPPLIER_ORDER_ASSIGNED
- SUPPLIER_DELIVERY_COMPLETED
- SUPPLIER_DELIVERY_DELAYED
- SUPPLIER_DELIVERY_FAILED
- SUPPLIER_PERFORMANCE_ALERT

## Routing
- Governance: ENABLE for normal ops; ANOMALY_DETECTED for delayed/failed/performance alerts.
- Marketplace: supplierUsageFrequency=1, supplierActivityScore≈4, trendDirection=UP, lastUsedAt=event.ts.
- Intelligence: supplierReliability via delayRiskScore, anomalyRate; supplierPerformance via procurementRiskScore surrogate; governanceRiskScore for failures.
- Observability: codes
  - SUPPLIER_ORDER_ASSIGNED (INFO)
  - SUPPLIER_DELIVERY_COMPLETED (INFO)
  - SUPPLIER_DELIVERY_DELAYED (WARN)
  - SUPPLIER_DELIVERY_FAILED (CRITICAL)
  - Source tag: `suppliers`.

## Ingestor
- File: `src/lib/die/business-as-plugin/suppliers/suppliers.shadow.ts`
- No-op unless feature flag is `true`.

## Taps
- Supplier Order Create → SUPPLIER_ORDER_ASSIGNED.
- Supplier Status "DELIVERED" → SUPPLIER_DELIVERY_COMPLETED.
- Status "REJECTED" → SUPPLIER_DELIVERY_FAILED.
- Delay heuristic (>72h) on progression to READY/OUT/PROCESSING → SUPPLIER_DELIVERY_DELAYED.

## Rollback
- Set `DIE_SHADOW_SUPPLIERS_ENABLED=false` to disable immediately.
