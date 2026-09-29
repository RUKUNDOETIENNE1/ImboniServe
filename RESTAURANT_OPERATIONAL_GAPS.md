# Restaurant Operational Gaps

**Source**: <ref_file file="C:/Dev/ImboniResto/RESTAURANT_BUSINESS_DAY_VALIDATION.md" />  
**Method**: Each gap classified by who notices, operational impact, customer impact, support burden, business risk.

---

## 🔴 Pilot Blocker — GAP-1: No automatic inventory deduction on sale

**Severity**: Pilot Blocker  
**Evidence**:  
- <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="8-76" /> — `createSale` never touches `InventoryItem.currentStock`.
- No reference anywhere in `src/` deducts stock on a sale completion or status change.
- No `Recipe`, `MenuItemIngredient`, or `ProductRecipe` model exists in `prisma/schema.prisma`.
- <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="44-74" /> contains hardcoded `Ingredient[]` and `Recipe[]` arrays — this is a UI mockup, not a feature.

**Who notices**: Manager on day 2 ("the system says I still have 50 kg of beef even though we sold 80 plates yesterday").

| Dimension | Impact |
|---|---|
| Operational | Inventory dashboard is *non-actionable* once service starts. Reorder suggestions <ref_file file="C:/Dev/ImboniResto/src/lib/services/reorder-autopilot.service.ts" /> read stale stock and will under-suggest. |
| Customer | None directly, but indirectly: items "available" online may be out of stock in reality. |
| Support | High — every restaurant on the pilot will report "inventory is wrong" within the first week. |
| Business risk | High. Without ingredient-level deduction there is no COGS, no real food cost %, no shrinkage detection. The CFO dashboard reads from financial ledger only, not from inventory consumption. |

**What it would take to fix (out of scope here, listed for completeness)**:
- `Recipe` + `RecipeIngredient` Prisma models linking `MenuItem` ↔ `InventoryItem` with qty + unit.
- A `consumeIngredients(saleId)` hook called from `SalesService.createSale` (after-payment for cash) and from `KitchenDispatchService.dispatchToKitchen` (after-payment for digital).
- An UNDO path tied to sale cancellation that creates `InventoryUpdate` REMOVE-reverse rows.

---

## 🔴 Pilot Blocker — GAP-2: Recipe Management is mock UI only

**Severity**: Pilot Blocker (companion to GAP-1)  
**Evidence**: <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="37-74" /> — fully client-side hardcoded data, no API, no Prisma model.

**Why this matters separately**: A restaurateur who opens the Recipe page sees a working-looking interface and assumes the system tracks ingredient cost. It does not. This is a *credibility risk* on top of GAP-1.

**Operational impact**: Owners will calculate food cost using the mock UI numbers (e.g. "Grilled Chicken: 70% margin") and price their menu accordingly. They will be wrong.

**Recommended action before any pilot**: Mark the Recipe page with a "Coming soon — for planning only" banner, or hide it behind a feature flag, until the schema is built.

---

## 🟠 Operational Risk — GAP-3: No printer integration on web

**Severity**: Operational Risk  
**Evidence**:  
- <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/printer.service.ts" lines="133-145" /> — `printViaBluetooth` and `scanForPrinters` both throw with the message *"only available in mobile app"*.
- Receipt printing falls back to `window.print()` <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/receipt-generator.service.ts" lines="152-155" /> — i.e. browser print dialog → desktop printer → A4 paper.
- No kitchen ticket printer integration at all. KDS is screen-only.

**Who notices**: Every cashier and every line cook on day 1.

| Dimension | Impact |
|---|---|
| Operational | Cashier must keep a laptop/tablet attached to a USB printer, manually click "print" each time. No automatic chit at the kitchen — line cooks must look at a screen. |
| Customer | Receives an A4 receipt (or none) instead of a thermal slip. Looks unprofessional. |
| Support | Medium — owners will ask "how do I connect my Epson?". The answer today is "you can't, on web". |
| Business risk | Medium. Many small Rwandan restaurants operate without tablets at every station; they expect chit printers. |

---

## 🟠 Operational Risk — GAP-4: No closing-of-day / cash reconciliation workflow

**Severity**: Operational Risk  
**Evidence**: Search of `src/` for `closeOfDay`, `endOfDay` (as workflow not date-range), `shiftClose`, `cashDrawer`, `drawerClose`, `Z-report` — **all NOT FOUND** as endpoints/services. Only date-range constants in <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="266-273" /> and similar.

**Who notices**: Manager at midnight, and the owner the next morning.

| Dimension | Impact |
|---|---|
| Operational | No way to declare "the day is closed, freeze the books". No way to count physical cash and reconcile vs system. No shift-handover. |
| Customer | None directly. |
| Support | Medium — every owner asks "where do I do my Z-report?". Answer: "There isn't one yet; export the daily report." |
| Business risk | High for cash-heavy restaurants. Cash leakage cannot be detected without a daily count. |

---

## 🟠 Operational Risk — GAP-5: No item-level void / 86

**Severity**: Operational Risk  
**Evidence**: `SaleItem.mutationType` enum at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="3953-3958" /> includes `CANCELLED`, and `ItemStatus.CANCELED` exists, **but no API surfaces them**. The only voiding API is sale-level <ref_file file="C:/Dev/ImboniResto/src/pages/api/sales/[id]/cancel.ts" /> and it refuses paid orders.

**Who notices**: Waiter when "send back the soup" happens.

| Dimension | Impact |
|---|---|
| Operational | Either void the whole sale (impossible once paid) or live with the bad line. |
| Customer | Forced to pay for an item they didn't accept. |
| Support | Medium — every restaurant hits this within the first week. |
| Business risk | Medium — guest complaints, refund disputes. |

---

## 🟠 Operational Risk — GAP-6: Refunds only on InTouch rail

**Severity**: Operational Risk  
**Evidence**: <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/refunds.ts" lines="67-72" /> hard-codes gateway check to INTOUCH; <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/refunds.ts" lines="74-79" /> requires `payerPhone`.

| Dimension | Impact |
|---|---|
| Operational | A customer who paid by card (IremboPay) or cash must be refunded manually outside the system. |
| Customer | Slower refund experience. |
| Support | Medium. |
| Business risk | Low for now (cash-dominant); medium as card adoption grows. |

---

## 🟠 Operational Risk — GAP-7: Cash POS sale does not dispatch to kitchen

**Severity**: Operational Risk  
**Evidence**: <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="8-76" /> creates the Sale and SaleItems. It does **not** call `KitchenDispatchService`. Dispatch happens only inside payment webhooks (e.g. <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/webhook.ts" lines="148-156" />) and `confirm-payment.ts`. Cash sales auto-set `paymentStatus=COMPLETED` but never trigger dispatch.

| Dimension | Impact |
|---|---|
| Operational | If a waiter takes a cash-paying walk-in, the kitchen never receives a ticket via the dispatcher channel. The KDS will still surface the items via polling because items exist with `itemStatus=NEW`, but routing (`stationId`) is not assigned by the dispatcher. |
| Customer | Delayed food. |
| Support | Reported as "ticket didn't print" (it didn't even route). |
| Business risk | Medium — affects only cash POS path. QR + digital paths are fine. |

---

## 🟠 Operational Risk — GAP-8: OCR V1 hard-depends on OpenAI quota

**Severity**: Operational Risk  
**Evidence**: Today's tests hit `429 You exceeded your current quota` repeatedly. Azure Document Intelligence is supported as a fallback in <ref_file file="C:/Dev/ImboniResto/src/lib/die/provider/index.ts" /> but requires env config (`AZURE_DI_ENDPOINT`, `AZURE_DI_KEY`).

| Dimension | Impact |
|---|---|
| Operational | When quota exhausts, supplier receipts move to DLQ and must be entered manually. |
| Customer | None. |
| Support | High during quota outage. |
| Business risk | Medium — single-vendor dependency; mitigated only if Azure DI is configured. |

---

## 🟡 Minor — GAP-9: MTN MoMo callback lacks idempotency guard

**Evidence**: <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/mtn-momo/callback.ts" lines="21-46" /> updates the transaction unconditionally. By contrast IremboPay webhook uses `updateMany { where: { status: { not: 'SUCCESS' } } }` at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/webhook.ts" lines="83-93" />.

**Risk**: Replayed callbacks could double-log billing events.

---

## 🟡 Minor — GAP-10: Split payments modelled but not wired

**Evidence**: `SalePayment` + `SplitPaymentWhatsAppTrigger` models exist <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="2283-2320" /> and a service file exists, but no POS endpoint creates `SalePayment` rows. Restaurants doing table-split bills will need to handle outside the system.

---

## 🟡 Minor — GAP-11: No business-day boundary

**Evidence**: Date queries assume midnight UTC <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="266-273" />. A late-night bar sale at 00:30 lands on the next calendar day.

**Risk**: Reports won't match how the owner thinks about "yesterday".

---

## 🟡 Minor — GAP-12: Menu availability is not stock-aware

**Evidence**: <ref_file file="C:/Dev/ImboniResto/src/pages/api/menu/index.ts" /> filters by `isActive` only. There is no link from `InventoryItem.currentStock` to `MenuItem.isAvailable`.

**Risk**: QR customers can order items the kitchen is out of.

---

## Summary Matrix

| ID | Class | Area | Owner notices | Customer notices | Support burden |
|---|---|---|---|---|---|
| GAP-1 | 🔴 | Inventory deduction | Day 2 | Indirectly | High |
| GAP-2 | 🔴 | Recipe is mock | First time they open the page | None | High (credibility) |
| GAP-3 | 🟠 | No printer | Day 1 | Yes (no slip) | Medium |
| GAP-4 | 🟠 | No close-of-day | Day 1 | None | Medium |
| GAP-5 | 🟠 | No item void | First send-back | Yes | Medium |
| GAP-6 | 🟠 | Refund only InTouch | First non-MoMo refund | Yes (delayed) | Medium |
| GAP-7 | 🟠 | Cash POS doesn't dispatch | First cash walk-in | Yes (slow food) | Medium |
| GAP-8 | 🟠 | OCR provider dependency | OCR outage | None | High during outage |
| GAP-9 | 🟡 | MoMo idempotency | Rare double-log | None | Low |
| GAP-10 | 🟡 | Split payments unwired | First split bill | Yes | Low |
| GAP-11 | 🟡 | Day boundary | Reporting | None | Low |
| GAP-12 | 🟡 | Stock-aware menu | Indirect via GAP-1 | Yes | Low |

→ See operational survival narrative in <ref_file file="C:/Dev/ImboniResto/RESTAURANT_WORKFLOW_SURVIVAL_REPORT.md" />.
