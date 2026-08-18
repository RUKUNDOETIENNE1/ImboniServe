# DIE Block 4G Consistency Verification

## Checks Implemented

- Intelligence vs matching
- Matching vs reconciliation
- Reconciliation conflict vs anomaly signal
- Applied state vs unresolved review links

## Output Shape

Returns:

```json
{
  "documentId": "string",
  "issues": [],
  "severity": "LOW | MEDIUM | HIGH | CRITICAL"
}
```

## Evidence

- `system-consistency.service.ts` includes all four rules
- service queries `ScannedDocument`, `DocumentEntityLink`, `ProcurementReconciliation`, `AnomalyAlert`, and timeline rows
- runtime validations for 4E/4F/4G passed after hardening
