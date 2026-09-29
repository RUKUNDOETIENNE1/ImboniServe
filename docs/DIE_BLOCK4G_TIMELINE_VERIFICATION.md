# DIE Block 4G Timeline Verification

## Timeline Source of Truth

`DocumentEventTimeline` is present and indexed on:

- `scannedDocumentId`
- `stage`

## Verified Behavior

- upload writes an initial timeline event
- lifecycle transitions append timeline entries
- timeline entries carry:
  - stage
  - status
  - metadata
  - timestamp

## Evidence

- Prisma schema includes `DocumentEventTimeline`
- lifecycle helper writes timeline entries transactionally
- upload route writes the initial event
- Block 4G validation passed: 15/15

## Operational Notes

- Timeline writes are performed in the same transaction as lifecycle state updates.
- Timeline rows are the canonical audit trail for lifecycle debugging.
