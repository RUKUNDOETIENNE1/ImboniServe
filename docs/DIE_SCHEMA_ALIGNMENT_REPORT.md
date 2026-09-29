# DIE Schema Alignment Report

## Verdict

Current live database schema aligns with the Prisma schema for the DIE surface area used by Blocks 4A-4G.

## Verified Objects

- `ScannedDocument.lifecycleState`
- `DocumentEventTimeline`
- `DocumentProcessingLog`
- `AnomalyAlert.confidence`
- `CostAnomalyAlert`
- `ProcurementReconciliation`
- `DocumentEntityLink`
- `SupplierAlias`
- `ProductAlias`

## Verified Constraints / Indexes

- `DocumentEventTimeline(scannedDocumentId)`
- `DocumentEventTimeline(stage)`
- `ScannedDocument(businessId, status)`
- `DocumentEntityLink(scannedDocumentId, entityType, entityId)` unique
- `ProcurementReconciliation(fingerprint)` unique
- `CostAnomalyAlert(businessId, status)`
- `CostAnomalyAlert(supplierId, status)`
- `CostAnomalyAlert(businessId, createdAt desc)`

## Evidence

- `npx prisma validate` passes
- Live schema queries confirm the expected columns and indexes exist
- `npx prisma generate` passes

## Notes

- The schema alignment is good enough for runtime operation and Block 5 readiness.
- The historical migration chain still has a replay-from-zero issue unrelated to current live schema alignment.
