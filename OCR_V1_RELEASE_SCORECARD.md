# OCR V1 Release Scorecard

**Date**: 2026-06-25  
**Evaluator**: Deployment Readiness Gatekeeper  
**Target**: Restaurant Pilot (5 restaurants)

---

## Scoring Legend

| Score | Meaning |
|-------|---------|
| 0-39 | **NOT READY** — Critical gaps; cannot ship |
| 40-69 | **READY WITH CONDITIONS** — Gaps exist but can be mitigated; ship with explicit risk acceptance |
| 70-100 | **READY** — Meets production standards; ship with confidence |

---

## 1. PDF Readiness

**Weight**: 20%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| JPG/PNG extraction | Working (OpenAI + Azure DI) | Working | 100 |
| PDF extraction (Azure DI) | Working if configured | Working | 80 |
| PDF extraction (OpenAI fallback) | Stubbed (returns empty) | Working | 0 |
| Multi-page PDF support | Azure DI only | At least one provider | 50 |
| Provider fallback chain | Implemented | Implemented | 100 |

**Subscore**: **66/100**

**Assessment**: PDF extraction works **only if Azure DI is configured**. OpenAI fallback for PDF is not implemented. This is a conditional pass.

**Remediation Required**:
- Confirm Azure DI is configured in pilot environment, OR
- Implement OpenAI PDF handling (rasterize → image extraction)

---

## 2. Inventory Safety

**Weight**: 30%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| Unit normalization service | Not implemented | Implemented | 0 |
| Unit validation (strict match) | Not implemented | Implemented | 0 |
| Quantity bounds (0 < qty < 10,000) | Not implemented | Implemented | 0 |
| Quantity outlier warning (> 1,000) | Not implemented | Implemented | 0 |
| Atomic transaction on apply | Implemented (DIE apply) | Implemented | 100 |
| InventoryUpdate audit records | Not created by DIE apply | Created per line | 0 |
| Idempotent apply (APPLIED guard) | Implemented | Implemented | 100 |

**Subscore**: **29/100**

**Assessment**: **NOT READY**. The inventory safety layer is the highest-risk gap. Current DIE apply does not enforce validations or create audit records.

**Remediation Required**:
- Implement unit normalization service
- Implement receipt apply wrapper with validations
- Create InventoryUpdate records on apply

---

## 3. Auditability

**Weight**: 15%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| DocumentEventTimeline on upload | Implemented | Implemented | 100 |
| DocumentEventTimeline on extraction | Implemented | Implemented | 100 |
| DocumentEventTimeline on intelligence | Implemented | Implemented | 100 |
| DocumentEventTimeline on apply | Implemented | Implemented | 100 |
| DocumentProcessingLog per stage | Implemented | Implemented | 100 |
| InventoryUpdate per applied line | Not implemented | Implemented | 0 |
| Audit records queryable | Implemented | Implemented | 100 |

**Subscore**: **86/100**

**Assessment**: Document-level audit trail is complete. Inventory-level audit (InventoryUpdate) is missing from the apply path.

**Remediation Required**:
- Create InventoryUpdate records on receipt apply

---

## 4. User Trust

**Weight**: 15%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| Document preview in review | Placeholder only | Actual image/PDF | 0 |
| Side-by-side layout | Implemented (placeholder) | Implemented (real preview) | 50 |
| Zoom/rotate controls | Implemented (no effect) | Working | 50 |
| Line item editing | Not implemented | Implemented | 0 |
| Product dropdown selection | Not implemented | Implemented | 0 |
| Confirmation modal before apply | Implemented | Implemented | 100 |
| Success feedback | Implemented | Implemented | 100 |
| Low-confidence warning | Not implemented | Implemented | 0 |

**Subscore**: **38/100**

**Assessment**: **NOT READY**. The review experience lacks real document preview and editing capabilities. Users cannot verify extraction against the original document.

**Remediation Required**:
- Implement document preview API
- Implement restaurant-facing review UI with editing
- Add low-confidence warning banner

---

## 5. Worker Reliability

**Weight**: 10%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| Redis connection | Requires REDIS_URL | Requires REDIS_URL | 100 |
| BullMQ queues configured | Implemented | Implemented | 100 |
| Retry logic (3 attempts) | Implemented | Implemented | 100 |
| Exponential backoff | Implemented | Implemented | 100 |
| DLQ for failed jobs | Implemented | Implemented | 100 |
| DLQ alerts | Implemented | Implemented | 100 |
| Graceful shutdown | Implemented | Implemented | 100 |
| Concurrency limits | Implemented | Implemented | 100 |

**Subscore**: **100/100**

**Assessment**: **READY**. Worker infrastructure is production-ready. Requires Redis to be provisioned.

**Remediation Required**:
- Confirm Redis is provisioned in pilot environment

---

## 6. Production Readiness

**Weight**: 10%

| Criterion | Current State | Target State | Score |
|-----------|---------------|--------------|-------|
| Environment variables documented | Partial | Complete | 70 |
| Error handling in upload | Implemented | Implemented | 100 |
| Error handling in extraction | Implemented | Implemented | 100 |
| Error handling in apply | Partial (no validation errors) | Complete | 50 |
| Logging | Implemented | Implemented | 100 |
| Rate limiting | Implemented | Implemented | 100 |
| Business scoping | Implemented | Implemented | 100 |
| Authentication | Implemented | Implemented | 100 |

**Subscore**: **90/100**

**Assessment**: **READY**. Production infrastructure is solid. Minor gaps in error handling for validation failures.

**Remediation Required**:
- Implement validation error responses in apply wrapper

---

## Overall Release Readiness

| Category | Weight | Score | Weighted Score |
|----------|--------|-------|----------------|
| PDF Readiness | 20% | 66 | 13.2 |
| Inventory Safety | 30% | 29 | 8.7 |
| Auditability | 15% | 86 | 12.9 |
| User Trust | 15% | 38 | 5.7 |
| Worker Reliability | 10% | 100 | 10.0 |
| Production Readiness | 10% | 90 | 9.0 |
| **TOTAL** | **100%** | — | **59.5** |

---

## Release Verdict

### Score: **59.5 / 100**

### Status: **READY WITH CONDITIONS**

---

## Conditions for Release

OCR V1 may be released to the first 5 restaurant pilot customers **if and only if**:

1. **P0-1 PDF Extraction**: Azure DI is confirmed working in production, OR OpenAI PDF handling is implemented.

2. **P0-2 Inventory Safety**: Unit normalization service and receipt apply wrapper are implemented with:
   - Unit validation (strict match after normalization)
   - Quantity bounds enforcement
   - InventoryUpdate audit records

3. **P0-3 Receipt Preview**: Document preview API is implemented and review UI displays actual receipt.

4. **P0-4 Redis**: Redis is provisioned and workers are running.

5. **Acceptance Tests**: All 11 acceptance tests pass.

6. **Demo Validation**: Demo script completes successfully in under 90 seconds.

---

## Risk Acceptance

If releasing with score < 70, the following risks must be explicitly accepted:

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF extraction fails | Restaurants cannot process PDF invoices | Ensure Azure DI is configured; have manual fallback process |
| Unit mismatch corrupts inventory | Operational data integrity compromised | Implement validation before pilot; manual review of first 10 receipts |
| No audit trail for inventory changes | Compliance and debugging issues | Implement InventoryUpdate before pilot |
| Users cannot verify extraction | Low trust, low adoption | Implement preview before pilot |

---

## Post-Remediation Projection

If all P0 blockers are resolved:

| Category | Current Score | Projected Score |
|----------|---------------|-----------------|
| PDF Readiness | 66 | 90 |
| Inventory Safety | 29 | 95 |
| Auditability | 86 | 100 |
| User Trust | 38 | 85 |
| Worker Reliability | 100 | 100 |
| Production Readiness | 90 | 95 |
| **Weighted Total** | **59.5** | **93.5** |

**Projected Status**: **READY**

---

## Scorecard Sign-Off

| Role | Approved | Date | Notes |
|------|----------|------|-------|
| Chief Product Officer | | | |
| Principal Systems Engineer | | | |
| Deployment Readiness Gatekeeper | | | |

---

**END OF SCORECARD**
