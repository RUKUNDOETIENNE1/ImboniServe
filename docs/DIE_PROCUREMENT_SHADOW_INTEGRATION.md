# DIE Procurement Shadow Integration

- **Feature flag**: `DIE_SHADOW_PROCUREMENT_ENABLED=false` (default OFF)
- **Scope**: Read-only, non-blocking shadow event observation for procurement lifecycle.
- **No changes**: schema, runtime, business logic, UI, marketplace. Purely additive.

## Event Model (normalized)
- PURCHASE_ORDER_CREATED
- PURCHASE_ORDER_APPROVED
- PURCHASE_ORDER_SENT
- PURCHASE_ORDER_RECEIVED
- PURCHASE_ORDER_CANCELLED
- GOODS_RECEIVED
- PROCUREMENT_DELAY
- PROCUREMENT_EXCEPTION

## Routing
- Governance: ENABLE for PO created/received; ANOMALY_DETECTED for delay/exception.
- Marketplace: usageFrequency=1, activityScore=4, trendDirection=UP, lastUsedAt=event.ts.
- Intelligence: delayRiskScore, procurementRiskScore, procurementEfficiencyScore, governanceRiskScore.
- Observability: codes
  - PROCUREMENT_ORDER_CREATED (INFO)
  - PROCUREMENT_ORDER_RECEIVED (INFO)
  - PROCUREMENT_DELAY_DETECTED (WARN)
  - PROCUREMENT_EXCEPTION (CRITICAL)
  - Source tag: `procurement`.

## Ingestor
- File: `src/lib/die/business-as-plugin/procurement/procurement.shadow.ts`
- Drops to no-op unless feature flag is `true`.
- Uses adapter → `shadowBindings` → unified observability buffer.

## Taps
- Supplier Order Create → PURCHASE_ORDER_CREATED.
- Supplier Status "DELIVERED" → PURCHASE_ORDER_RECEIVED + GOODS_RECEIVED.
- Status REJECTED → PURCHASE_ORDER_CANCELLED + PROCUREMENT_EXCEPTION (reason).
- Delay heuristic (>72h) on progression to READY/OUT_FOR_DELIVERY/PROCESSING → PROCUREMENT_DELAY.

## Rollback
- Set `DIE_SHADOW_PROCUREMENT_ENABLED=false` to disable immediately.
