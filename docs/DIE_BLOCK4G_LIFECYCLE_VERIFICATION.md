# DIE Block 4G Lifecycle Verification

## Canonical State Machine

Implemented in `DocumentLifecycleState`:

- UPLOADED
- EXTRACTED
- INTELLIGENCE_DONE
- MATCHED
- RECONCILED
- ANALYZED
- REVIEW_REQUIRED
- APPROVED
- APPLIED
- FAILED

## Transition Rules

Allowed transitions enforced in `document-lifecycle.service.ts`:

- UPLOADED -> EXTRACTED
- EXTRACTED -> INTELLIGENCE_DONE
- INTELLIGENCE_DONE -> MATCHED
- MATCHED -> RECONCILED
- RECONCILED -> ANALYZED
- ANALYZED -> REVIEW_REQUIRED | APPROVED
- REVIEW_REQUIRED -> APPROVED | FAILED
- APPROVED -> APPLIED

## Evidence

- Schema includes `ScannedDocument.lifecycleState`
- API routes use the lifecycle helper for approve/reject/apply
- Worker uses canonical transitions after extraction/matching/reconciliation/anomaly
- Validation suite passed: 15/15
- TypeScript compile passed

## Notes

- Legacy `DocumentStatus` is still synchronized for backward compatibility.
- `REVIEW` remains the legacy external status mapping for internal canonical states.
