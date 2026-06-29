# OCR V1 Risk Assessment

Date: June 25, 2026
Owner: CTO
Status: READY FOR PILOT WITH GUARDS

---

## Risk Matrix

| Failure Mode          | Severity | Probability | Mitigation                                  | Residual |
|-----------------------|----------|-------------|----------------------------------------------|----------|
| Bad OCR (provider error) | Medium   | Low         | Multi-provider fallback, retries, DLQ alerts | Low      |
| Wrong quantities      | High     | Medium      | Bounds check, outlier warning, human review  | Medium   |
| Duplicate invoices    | Medium   | Low         | SHA-256 dedup + idempotent apply             | Low      |
| Supplier mismatch     | Low      | Medium      | Supplier memory + confirmation thresholds    | Low      |
| Incorrect stock levels| Critical | Medium-High | Unit normalization + strict unit validation  | Low-Med  |
| Partial apply         | High     | Low         | DB transaction around all updates            | Low      |

---

## Guardrails (V1 Must-Haves)

1) Unit Normalization & Validation (CRITICAL)
- Normalize aliases (kgs→kg, litre→l, pieces→pcs)
- Block apply if extracted unit ≠ inventory unit after normalization

2) Quantity Bounds (CRITICAL)
- Server-side: 0 < qty < 10,000; warn if > 1,000

3) Idempotent Apply (CRITICAL)
- Reject apply if document already APPLIED

4) Human-in-the-Loop (CRITICAL)
- No auto-apply even for 100% confidence

5) Full Audit Trail (CRITICAL)
- InventoryUpdate per change; DocumentEventTimeline update

---

## Monitoring
- Metrics: extraction_success_rate, auto_match_rate, unit_mismatch_rate, outlier_rate, apply_success_rate
- Alerts (email/Slack): extraction_failure_rate>20%, unit_mismatch_rate>30%

---

## Rollback
- Pause upload UI
- Identify applied docs in period
- Reverse InventoryUpdate deltas
- Mark affected docs REJECTED

---

## Conclusion
- With the above guardrails, OCR V1 risk is ACCEPTABLE for a 5-restaurant pilot.
