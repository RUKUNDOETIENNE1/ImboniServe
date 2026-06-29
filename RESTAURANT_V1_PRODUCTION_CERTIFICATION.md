# ImboniServe V1 — Restaurant Production Certification

**Auditor**: Senior Hospitality Operations Director · Restaurant Operations Consultant · Restaurant Owner (20+ years) · Enterprise SaaS Production Auditor · Restaurant Systems Reliability Engineer · Hospitality Product Acceptance Tester · Enterprise Product Validation Board

**Inputs**:
- <ref_file file="C:/Dev/ImboniResto/RESTAURANT_BUSINESS_DAY_VALIDATION.md" />
- <ref_file file="C:/Dev/ImboniResto/RESTAURANT_OPERATIONAL_GAPS.md" />
- <ref_file file="C:/Dev/ImboniResto/RESTAURANT_WORKFLOW_SURVIVAL_REPORT.md" />

**Method**: Evidence-only. Only what currently exists in `C:/Dev/ImboniResto`. No imagined features.

---

## Final Questions — Direct Answers

### 1. Can ONE restaurant successfully operate for ONE complete business day?

# 🟡 CONDITIONAL — YES, but with manual workarounds

The restaurant *can* take orders, serve food, take payments, and produce reports on day 1. However it must operate with the following manual workarounds:

| Workaround needed | Because of |
|---|---|
| Manager manually 86s items as kitchen calls stock-outs | GAP-1, GAP-12 |
| No automated kitchen ticket printing — use tablets at stations | GAP-3 |
| No item-level void — use sale-level void before payment, otherwise comp via discount | GAP-5 |
| Cash refunds handled outside the system | GAP-6 |
| End-of-day cash count tracked in a spreadsheet | GAP-4 |
| Daily ingredient consumption manually entered to keep inventory honest | GAP-1 |

**Evidence the happy paths work**:
- QR ordering → payment → kitchen dispatch → KDS → delivery (Workflow A) — works end-to-end.
- Supplier OCR receipt → review → apply → inventory increase with full audit (Workflow E) — works end-to-end.
- Multi-tenant isolation (Workflow I) — verified across 100+ routes using `resolveBusinessContext`.
- Reliability recovery (Workflow J) — DLQ + Pusher fallback + watchdogs all wired.

**Verdict**: A motivated owner with one tablet at the front counter and one at the kitchen pass can run for one day.

---

### 2. Can FIVE restaurants operate simultaneously?

# 🟡 CONDITIONAL — YES technically, NO operationally

**Technical capacity**: Yes.
- Multi-tenant isolation is strong (Stage 9, Workflow I).
- Background worker is BullMQ + Redis, capacity-controlled per queue.
- Pusher real-time scales horizontally.
- No global locks observed in sales / inventory paths.

**Operational capacity**: No.
- Every one of the 5 restaurants will hit GAP-1 (inventory drift) within day 2.
- Every one will hit GAP-4 (no close-of-day) every night.
- Every one will hit GAP-5 (no item void) within the first week.
- Support burden = 5× the gap count above. A small team will be overwhelmed.

**Verdict**: The system can *host* five restaurants. A *human support team* cannot keep five restaurants happy without fixing GAP-1 first.

---

### 3. Can ONE restaurant operate for THIRTY consecutive days?

# 🔴 NO

This is the answer most strongly forced by the evidence:

- GAP-1 (no inventory deduction) compounds **daily**. After 30 days the inventory module records a stock level that bears zero relationship to physical reality.
- GAP-2 (mock Recipe page) misleads any owner who tries to calculate food cost weekly.
- GAP-4 (no close-of-day) means there is no shift handover discipline; over 30 days, accountability for cash discrepancies disappears.
- GAP-7 (cash POS doesn't dispatch) means some unknown fraction of cash sales never made it to the kitchen dispatcher — discoverable only by manual comparison.

A restaurant *can* limp through 30 days using spreadsheets in parallel. It cannot operate *using ImboniServe as its system of record* for 30 days without the books going sideways.

---

### 4. Is ImboniServe V1 now a complete Restaurant Operating System?

# 🟡 CONDITIONAL — NO, not yet complete; YES, a complete *front-of-house* + *receiving* OS

What it IS, today, with evidence:
- A complete **front-of-house ordering system** — QR, table sessions, participants, real-time kitchen, multiple stations, bar (Stages 4, 5, 6).
- A complete **payment acceptance system** for Cash + MTN/Airtel/InTouch MoMo + IremboPay (Stage 7).
- A complete **supplier-receipt intake & audit system** — OCR V1 with validation, preview, audit trail, DLQ resilience (Stage 2).
- A complete **management reporting layer** — daily/weekly/monthly reports, CFO/CEO dashboards, audit logs, watchdog crons (Stage 9).
- A solid **reliability platform** — Pusher with polling fallback, BullMQ retries, DLQ, watchdog observability.

What it is NOT yet, with evidence:
- A **back-of-house consumption system** — no recipe model, no auto-deduction (GAP-1, GAP-2).
- A **shift & cash management system** — no opening float, no close-of-day, no Z-report, no cash drawer (GAP-4, Stage 1, Stage 10).
- A **hardware-integrated POS** — no chit printer, no receipt printer driver on web (GAP-3).
- A **complete refunds & voids system** — only one rail refundable, no item void (GAP-5, GAP-6).

---

## Production Certification Matrix

| Capability | Status | Confidence |
|---|---|---|
| User authentication & roles | 🟢 Production Ready | High |
| Multi-tenant business isolation | 🟢 Production Ready | High |
| QR customer ordering | 🟢 Production Ready | High |
| Kitchen dispatch (digital-paid path) | 🟢 Production Ready | High |
| Bar & multi-station routing | 🟢 Production Ready | High |
| Real-time KDS | 🟢 Production Ready | High |
| Payments — Cash | 🟢 Production Ready | High |
| Payments — MTN/Airtel MoMo | 🟢 Production Ready | Medium (GAP-9 idempotency) |
| Payments — IremboPay | 🟢 Production Ready | High |
| OCR supplier intake (after today's P0 work) | 🟢 Production Ready | High (with OpenAI quota or Azure DI) |
| Inventory CRUD + manual updates | 🟢 Production Ready | High |
| Manager dashboards & reports | 🟢 Production Ready | High |
| Reliability layer (Pusher/Redis/DLQ/watchdogs) | 🟢 Production Ready | High |
| **Inventory consumption on sale** | 🔴 Pilot Blocker | High — missing entirely |
| **Recipe management** | 🔴 Pilot Blocker (UI mockup) | High — schema absent |
| Receipt/kitchen printer | 🟠 Operational Risk | High |
| Close-of-day / cash reconciliation | 🟠 Operational Risk | High |
| Item-level void | 🟠 Operational Risk | High |
| Refunds across all rails | 🟠 Operational Risk | High |
| Cash POS → kitchen dispatch | 🟠 Operational Risk | Medium (needs verification) |
| Split payments | 🟡 Minor | High |
| Business-day boundary | 🟡 Minor | High |

---

## The One Question

> "If I invite a real restaurant owner tomorrow, can I confidently say:
> 'Run your restaurant using ImboniServe.'
> without worrying that operations will collapse?"

# Honest answer: **NO, not for a full restaurant — yes for a controlled pilot**.

**Why NO for an unconditional "run your restaurant"**:

I cannot, in good conscience, tell a working restaurant owner to trust ImboniServe V1 as their **system of record for inventory** today. The single piece of evidence that makes that "no" certain is in <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="8-76" /> — selling a plate of food does not reduce stock. By the end of week one, the owner's inventory dashboard will be lying to them. By the end of week two, they will not trust any number on the screen.

The mocked Recipe Management page <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="44-74" /> makes this worse: it gives the impression that food cost is being tracked when no schema exists to track it.

**Why YES for a controlled pilot, with these explicit guardrails**:

I *can* invite a real restaurant tomorrow under these terms:

1. **Disclose GAP-1 and GAP-2 explicitly** — tell the owner "inventory consumption is not yet automated; you will reconcile stock manually at the end of each shift". Hide the Recipe page behind a feature flag (`hasRecipeManagement`) which I see already exists at <ref_snippet file="C:/Dev/ImboniResto/src/lib/plan-entitlements.ts" lines="16-16" /> — leave it OFF.
2. **Provide a daily reconciliation template** — a spreadsheet/CSV for opening count, deliveries (auto from OCR), expected closing, actual closing, variance. Plug into the existing `InventoryUpdate` ADJUSTMENT type until automatic consumption ships.
3. **Pilot the strong workflows** — QR ordering, OCR receipt intake, payments, reports. These are genuinely good and ready.
4. **Pilot with one restaurant first, not five** — operational support load is too high for five until GAP-1 is fixed.
5. **Provide tablets at each station** instead of waiting for printer integration.
6. **Use sale-level cancellation discipline** — instruct staff to confirm orders before paying so item-voids are rare.
7. **Set up Azure Document Intelligence** as primary OCR provider, OpenAI as fallback, to neutralize GAP-8.

Under those guardrails I would say to the owner:

> *"For the next four weeks, run your **front of house** and **supplier receiving** on ImboniServe — these are production ready. Keep your **back of house consumption tracking and shift reconciliation** on your existing process. We will graduate you to the full system once we ship recipe-driven inventory consumption."*

That is an honest, evidence-based offer I can defend.

---

## Recommended Pilot Decision

| Decision | Recommendation |
|---|---|
| Single-restaurant controlled pilot, supervised, 1–4 weeks | ✅ **Proceed** |
| Single-restaurant unsupervised use as full system of record | ❌ **Hold** |
| Five-restaurant simultaneous pilot | ❌ **Hold** until GAP-1, GAP-2, GAP-4 closed |
| Public/marketing claim of "Restaurant Operating System" | ❌ **Hold** — current scope is "Restaurant Front-of-House + Supplier Intake Platform" |
| Continue investment in OCR V1 / DIE platform | ✅ **Proceed** — this is the strongest part of the system |

---

## Sign-off

ImboniServe V1, as it exists in `C:/Dev/ImboniResto` on 2026-06-26:

- ✅ Is a **production-ready front-of-house ordering platform with supplier OCR**.
- ❌ Is **not yet a production-ready full Restaurant Operating System** because it does not consume inventory on sale and has no end-of-day reconciliation.
- 🟡 Is **certifiable for controlled pilot use** under the guardrails above.

**Strongest area**: OCR V1 supplier intake (work completed today) + multi-tenant reliability layer.
**Weakest area**: Inventory consumption + day-close ritual.

→ Recommended next P0 (out of scope for this audit, listed for the next sprint contract): build `Recipe` + `RecipeIngredient` Prisma models and a `consumeIngredientsForSale(saleId)` service hook called from the same dispatch point that sets `kitchenReleasedAt`. Close GAP-1 and GAP-2 in one move.

— Audit complete.
