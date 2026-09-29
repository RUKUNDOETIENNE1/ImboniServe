# DIE Block 4G Performance Report

## Measured Evidence

From the perf/security preflight:

- DB round-trip latency average: ~215ms
- DB round-trip latency max: 359ms
- DocumentAnomalyService missing-doc handling: 1614ms
- ProcurementReconciliationService missing-doc handling: 325ms

## Index Coverage

Confirmed indexes on:

- `ScannedDocument`
- `AnomalyAlert`
- `ProcurementReconciliation`
- `DocumentEntityLink`
- `SupplierAlias`
- `ProductAlias`
- `DocumentProcessingLog`

## Assessment

- No N+1 regressions observed in the inspected service paths.
- Queue throughput remains bounded by worker concurrency and rate limits.
- DB latency is acceptable for the remote Supabase pooler, but it is not sub-10ms local latency.
