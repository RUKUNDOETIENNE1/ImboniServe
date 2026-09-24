# Restaurant Workflow Survival Report

**Question**: For each real-world workflow, *can the restaurant survive the day with ImboniServe V1 as built today?*

Survival = the workflow completes end-to-end with no engineering intervention and no irreversible data corruption.

---

## Workflow A — A customer scans a QR, orders, pays MoMo, eats, leaves

| Step | Survives? | Why |
|---|---|---|
| Scan QR → load menu | ✅ |
| Build cart, place order draft | ✅ Idempotent at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/public/order/draft.ts" lines="79-93" /> |
| Pay via MoMo (push or InTouch) | ✅ |
| Payment webhook fires kitchen dispatch | ✅ <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/webhook.ts" lines="148-156" /> |
| Items routed to correct station (kitchen/bar) | ✅ |
| KDS shows item, line cook transitions NEW→PREPARING→READY | ✅ |
| Waiter marks DELIVERED | ✅ |
| Customer leaves | ✅ |
| **Inventory reflects the consumption** | ❌ **GAP-1: stock unchanged** |

**Survives?**: Yes, the *customer journey* survives. But the *business books* drift.

---

## Workflow B — A walk-in pays cash at the counter (POS)

| Step | Survives? | Why |
|---|---|---|
| Cashier opens `/dashboard/sales/new` | ✅ |
| Adds items to cart, selects CASH | ✅ |
| Submit → Sale created, marked PAID, COMPLETED <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="31-34" /> | ✅ |
| Kitchen receives the order | ⚠️ **GAP-7**: `SalesService.createSale` does not dispatch. KDS may still see items via station-orders endpoint, but no Pusher push, no station routing assigned. |
| Cashier prints a receipt | ⚠️ **GAP-3**: only `window.print()` → A4 |
| Refund if customer changes mind after paying | ❌ **GAP-6**: cash refund has no API |
| Inventory deduction | ❌ **GAP-1** |

**Survives?**: Functionally yes, operationally degraded. Manager will see the sale in reports but the kitchen may not see the order in real time.

---

## Workflow C — A waiter takes a dine-in order and adds dessert later

| Step | Survives? | Why |
|---|---|---|
| Initial order via `/api/sales` | ⚠️ See Workflow B |
| Pay deposit (or hold for tap-and-leave) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/checkout/tap-and-leave.ts" /> |
| Add dessert via `/api/orders/[id]/add-items` | ✅ Linked add-on Sale created <ref_file file="C:/Dev/ImboniResto/src/pages/api/orders/[id]/add-items.ts" /> |
| Send dessert to bar/pastry station | ✅ via RouteRule |
| Final bill | ✅ |
| **Split bill among 3 guests** | ⚠️ **GAP-10**: `SalePayment` model exists but no flow creates the rows |

**Survives?**: Yes if everyone pays together; degraded for split bills.

---

## Workflow D — A guest sends back a dish ("this is cold")

| Step | Survives? | Why |
|---|---|---|
| Waiter wants to remove just the cold dish | ❌ **GAP-5**: no item-void endpoint |
| Manager cancels the whole sale | ❌ Refused if paid <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="207-209" /> |
| Manager re-creates the order without the dish | ⚠️ Manual, breaks audit trail |

**Survives?**: No — owner will need an out-of-band workflow.

---

## Workflow E — Supplier delivers vegetables; manager intakes via OCR

| Step | Survives? | Why |
|---|---|---|
| Upload JPG/PNG/PDF | ✅ |
| Extraction (image) | ✅ if OpenAI quota OK |
| Extraction (PDF) | ✅ (P0-1 fixed today) |
| Review + edit + match products | ✅ |
| Approve | ✅ |
| Apply → inventory increases with full audit | ✅ |
| Provider quota exhausts mid-day | ⚠️ **GAP-8**: jobs hit DLQ, manager must enter manually |

**Survives?**: Yes for the receiving workflow; this is the strongest workflow in the system.

---

## Workflow F — Kitchen runs out of beef mid-service

| Step | Survives? | Why |
|---|---|---|
| System notices beef stock is low | ❌ **GAP-1**: stock never decreased, so the alert never fires |
| QR customers can still order beef dishes | ❌ **GAP-12**: menu API doesn't check stock |
| Line cook calls manager → manager flips MenuItem.isActive=false | ⚠️ Reactive, customer-facing UI may already have cached menu |
| Manager places urgent reorder via reorder-suggestion | ❌ Suggestion is computed from stale stock |

**Survives?**: No — this is the failure mode owners will complain about most loudly.

---

## Workflow G — End-of-night close

| Step | Survives? | Why |
|---|---|---|
| Generate daily report | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/reports/daily.ts" /> |
| Count physical cash in drawer | ❌ no UI/API |
| Compare cash count vs system cash sales | ❌ no reconciliation flow |
| Lock day so no late edits | ❌ no flag |
| Carry-over of open tables to next day | ⚠️ no force-close |
| Nightly payment-vs-sale reconciliation | ✅ cron at <ref_file file="C:/Dev/ImboniResto/src/pages/api/cron/reconciliation.ts" /> |

**Survives?**: Reports yes, *operational close* no. Owners will use spreadsheets.

---

## Workflow H — Owner reviews finances next morning

| Step | Survives? | Why |
|---|---|---|
| CFO dashboard | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/cfo.tsx" /> |
| Revenue analytics | ✅ |
| Audit logs | ✅ |
| **True COGS / food cost** | ❌ depends on GAP-1; no ingredient consumption recorded |
| Inventory dashboard | ⚠️ Numbers are wrong because of GAP-1 |
| Anomaly detection | ✅ DIE plugin runs |

**Survives?**: Strategic finance survives; *unit economics* does not.

---

## Workflow I — A second restaurant on the same tenant signs up

| Step | Survives? | Why |
|---|---|---|
| New OWNER signs up | ✅ |
| Business auto-created or selected | ✅ <ref_snippet file="C:/Dev/ImboniResto/src/lib/api/business-context.ts" lines="46-76" /> |
| Their data isolated from restaurant #1 | ✅ all sampled routes enforce `businessId` |
| Their staff cannot see restaurant #1's orders | ✅ |
| Their Redis/queue jobs don't interfere | ✅ keyed by `scanJobId`/`scannedDocumentId` |

**Survives?**: Yes — multi-tenant isolation is solid in the sampled paths.

---

## Workflow J — System recovers from a worker crash

| Step | Survives? | Why |
|---|---|---|
| Worker dies mid-extraction | ✅ BullMQ retries (3 attempts, exponential) |
| Job eventually moves to DLQ | ✅ |
| ScanJob marked FAILED (FK constraint respected) | ✅ Fixed today |
| Manager sees failure in dashboard | ✅ DIE operations page <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/die/operations.tsx" /> |
| Replay from DLQ | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/die/operations/failed-jobs.ts" /> |
| Pusher disconnect during service | ✅ Fallback 3-s polling + snapshot sync |

**Survives?**: Yes — reliability layer is well-built.

---

## Survival Scoreboard

| Workflow | Survival | Worst gap |
|---|---|---|
| A — QR customer end-to-end | 🟢 (books drift) | GAP-1 |
| B — Walk-in cash POS | 🟡 | GAP-7 + GAP-3 |
| C — Dine-in + add-on | 🟢 (split bill 🟡) | GAP-10 |
| D — Send-back / item void | 🔴 | GAP-5 |
| E — Supplier OCR intake | 🟢 | GAP-8 (only if no Azure) |
| F — Out-of-stock during service | 🔴 | GAP-1 + GAP-12 |
| G — End-of-night close | 🟠 | GAP-4 |
| H — Next-morning finance review | 🟡 | GAP-1 |
| I — Multi-tenant onboarding | 🟢 | — |
| J — System reliability recovery | 🟢 | — |

→ Final certification in <ref_file file="C:/Dev/ImboniResto/RESTAURANT_V1_PRODUCTION_CERTIFICATION.md" />.
