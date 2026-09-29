# DIE Block 4G Replay Verification

## Replay Features

- `safeReplayGuard(documentId, options)`
- `replayFromStage(documentId, stage, options)`
- `fullReplay(documentId, options)`

## Safety Measures

- Redis replay lock with in-memory fallback
- APPLIED documents are blocked unless `force` is set
- replay from a checkpoint re-runs downstream stages only
- downstream operations remain idempotent:
  - supplier links
  - product links
  - aliases
  - reconciliation rows
  - anomaly alerts
  - document event timeline rows

## Evidence

- Replay service exists and is referenced in validation
- Redis lock implementation present
- Block 4G validation passed: 15/15
- Block 4C/4D/4E/4F runtime validations passed after hardening
