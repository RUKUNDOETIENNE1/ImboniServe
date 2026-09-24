# DIE Block 4G Repair Verification

## Repair Engine

`SystemRepairService` provides:

- `detectStuckDocuments()`
- `repairDocument(documentId)`
- `scheduledRepairJob()`

## Behavior

- detects stale documents older than the configured threshold
- derives the last safe checkpoint from lifecycle, reconciliation, entity links, and timeline
- replays from the safe checkpoint
- logs repair start/completion to `DocumentProcessingLog`
- limits repair batches to 100 documents

## Evidence

- Repair service exists in source
- Worker startup schedules the repair loop
- Validation suite passed: 15/15
