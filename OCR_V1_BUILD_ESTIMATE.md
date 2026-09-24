# OCR V1 Build Estimate

Date: June 25, 2026
Owner: Principal Product Architect
Status: EXECUTION-READY

---

## Scope Summary
- Restaurant upload UI
- Review screen
- Apply endpoint wrapper (validation layer)
- Unit normalization + validation
- Supplier & product memory (deterministic)

---

## Effort Estimate (Engineering Days)

| Workstream                           | Est. Days |
|--------------------------------------|-----------|
| Unit normalization + validation       | 1.0       |
| Supplier memory (alias + fuzzy)       | 1.0       |
| Product matching (fuzzy + alias)      | 1.0       |
| Apply API wrapper + validations       | 0.5       |
| Upload UI (restaurant-facing)         | 1.0       |
| Review UI (table, edit, modals)       | 1.5       |
| QA + hardening (5 receipts, mobile)   | 1.0       |
| Buffer (integration, polish)          | 0.5       |
|                                       |           |
| **Total**                             | **7.5**   |

Notes:
- Backend OCR/intelligence already exists; no changes needed.
- Team of 2 can deliver in ~4 calendar days.

---

## Dependencies & Risks
- Redis/Workers must be running (DIE workers)
- Inventory catalog must exist for demo/wow
- Real receipts for QA improve confidence

---

## Deliverables
- Two new dashboard routes (upload + review)
- One new API wrapper route
- Two lightweight services (units + supplier memory)
- Documentation and demo script

---

## Go/No-Go Criteria
- E2E: Upload → Review → Apply works on mobile and desktop
- Guardrails block all unit-mismatch corruptions
- Demo completes in < 90 seconds
