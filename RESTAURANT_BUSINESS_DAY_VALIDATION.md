# Restaurant Business Day Validation

**Mission**: Determine whether one real restaurant could operate from 7:00 AM to midnight using ONLY the current ImboniServe V1 implementation.

**Method**: Stage-by-stage walkthrough of a typical restaurant day. Every claim is backed by file:line evidence from the current codebase. No imagined features.

**Classifications**: 🟢 Production Ready · 🟡 Minor Improvement · 🟠 Operational Risk · 🔴 Pilot Blocker

---

## Stage 1 — 7:00 AM · Restaurant Opening

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Manager login | ✅ | NextAuth with MFA OTP at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/auth/[...nextauth].ts" lines="28-65" /> + <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/auth/pre-login.ts" lines="24-101" />. Role-based redirect at <ref_snippet file="C:/Dev/ImboniResto/src/pages/login.tsx" lines="101-133" /> | 🟢 |
| Cashier / Waiter / Kitchen / Bar staff login | ✅ Same MFA flow. 9 roles defined at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="2060-2070" />. Kitchen page gates roles at <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/kitchen.tsx" lines="9-17" /> | 🟢 |
| Opening inventory snapshot | ⚠️ Inventory page exists <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/inventory.tsx" /> and shows `currentStock`, but **opening counts reflect whatever the system thinks the closing stock was — there is no end-of-day reconciliation, so day 1 may be accurate but day 7 will drift** (see Stage 8) | 🟠 |
| Menu availability | ⚠️ Menu endpoint <ref_file file="C:/Dev/ImboniResto/src/pages/api/menu/index.ts" /> returns all active menu items. **There is no menu-item ↔ inventory link**, so "available today" = "isActive=true". No automatic 86-list. | 🟠 |
| Printer readiness | ❌ ESC/POS formatter exists at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/printer.service.ts" lines="22-50" /> but `printViaBluetooth()` throws `"Bluetooth printing only available in mobile app"` <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/printer.service.ts" lines="133-137" />. Receipt printing falls back to `window.print()` <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/receipt-generator.service.ts" lines="152-155" />. No kitchen printer at all. | 🔴 |
| Station initialization | ✅ <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/initialize.ts" lines="1-33" /> creates default Kitchen + Bar stations. 7 station types supported at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="3935-3943" /> | 🟢 |
| System startup health | ✅ `/api/health` + `/api/health/ready` (DB ping) | 🟢 |
| Opening checks (cash float, expected stock) | ❌ NOT FOUND. No cash-drawer / float-entry / opening-check workflow anywhere in `src/` | 🟠 |

**Verdict**: Staff CAN log in and see the system, but the day starts with **no opening-count workflow, no kitchen printer, and no automatic menu availability**.

---

## Stage 2 — 8:00 AM · Receiving Supplier Deliveries (OCR V1)

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Upload JPG/PNG/PDF | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/die/upload.ts" /> · idempotency by `sourceHash` | 🟢 |
| OCR extraction (image) | ✅ OpenAI Vision provider <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/provider/openai.ts" lines="80-143" /> | 🟢 |
| OCR extraction (PDF) | ✅ Puppeteer→PNG pipeline (P0-1 fix applied) <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/provider/openai.ts" lines="26-78" /> | 🟢 |
| Document preview | ✅ Signed URL + fallback streaming <ref_file file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/preview.ts" /> | 🟢 |
| Review & edit extracted lines | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/die/review/[id].tsx" /> | 🟢 |
| Inventory safety layer (qty/unit/price validation, outlier detection) | ✅ <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="102-212" /> | 🟢 |
| Apply → InventoryUpdate audit with before/after | ✅ <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="218-264" /> | 🟢 |
| Supplier traceability | ✅ supplier name captured in InventoryUpdate.notes <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/die/documents/[id]/apply.ts" lines="252-262" /> | 🟢 |
| DLQ / retry behavior on failure | ✅ 3 attempts → DLQ → ScanJob+Document marked FAILED <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/orchestrator/worker-start.ts" lines="319-375" /> | 🟢 |
| **Provider dependency** | ❌ Today's test environment showed `429 quota exceeded` repeatedly. Without quota OR Azure Document Intelligence credentials, OCR fails over to DLQ and supplier must be entered manually. | 🟠 |

**Verdict**: 🟢 with OPENAI quota OR Azure DI configured; 🟠 if neither.

---

## Stage 3 — 9:00 AM · Preparing for Service

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Kitchen receives "stock available" signal | ❌ Stock is only in `InventoryItem.currentStock`; the kitchen UI <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/kitchen.tsx" /> shows ORDERS, not stock | 🟠 |
| Available items shown to customers | ❌ Menu API returns all `isActive=true` items regardless of stock. No automatic 86-list. <ref_file file="C:/Dev/ImboniResto/src/pages/api/menu/index.ts" /> | 🟠 |
| Out-of-stock handling | ❌ Manager must manually toggle `isActive` on menu items — no link between InventoryItem stock and MenuItem availability | 🟠 |
| Recipe / BOM readiness | ❌ **No `Recipe`, `MenuItemIngredient`, or `ProductRecipe` model exists in `prisma/schema.prisma`**. The Recipe Management page is a hardcoded UI mockup at <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="44-74" /> using `Ingredient[]` and `Recipe[]` arrays defined in the component. | 🔴 |

**Verdict**: 🔴 — the kitchen runs *blind* relative to inventory.

---

## Stage 4 — 12:00 PM · Customer Arrival & Order Creation

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| QR menu ordering | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/public/order/draft.ts" /> creates Sale with `orderSource: QR_IN_VENUE`/`QR_REMOTE`. Idempotency at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/public/order/draft.ts" lines="79-93" /> | 🟢 |
| POS / Waiter order entry | ⚠️ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/sales/new.tsx" /> is a basic cart screen. **No table picker, no waiter selector, no kitchen routing on submit**. `SalesService.createSale` <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="8-76" /> creates the Sale but does NOT call `KitchenDispatchService` — the kitchen only gets the order if/when payment is confirmed | 🟠 |
| Walk-in cash order | ⚠️ Works via `/api/sales`, marks paid immediately (CASH auto-completes) <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="31-34" />. But again, no automatic kitchen dispatch from POS path | 🟠 |
| Table assignment | ✅ `Sale.tableId` + `TableSession` + `SessionParticipant` models at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="839-889" />. Tables API at <ref_file file="C:/Dev/ImboniResto/src/pages/api/tables/index.ts" /> | 🟢 |
| Duplicate order prevention | ✅ `IdempotencyKey` model <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="3988-4003" /> used by `/api/sales`, `/api/public/order/draft`, `/api/station/update-item-status` | 🟢 |
| Order add-on (after first send) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/orders/[id]/add-items.ts" /> creates linked addon Sale with `isAddon=true, parentOrderId=…` | 🟢 |
| Customer can see order status | ✅ `/api/public/order/status` | 🟢 |

**Verdict**: 🟡 — QR works end-to-end; POS path exists but is minimal and does not auto-dispatch unpaid orders to the kitchen.

---

## Stage 5 — 12:30 PM · Kitchen Operations

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Kitchen receives new order | ✅ For PAID orders: `confirm-payment.ts:71` sets `kitchenReleasedAt`. `KitchenDispatchService.dispatchToKitchen` <ref_file file="C:/Dev/ImboniResto/src/lib/services/kitchen-dispatch.service.ts" />. For QR webhook-paid orders, dispatch triggers from <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/webhook.ts" lines="148-156" />. Pusher push to `private-kitchen-{businessId}` and per-station channels | 🟢 |
| Routing to correct station | ✅ `RouteRule` model + `RoutingService.resolveStation` <ref_snippet file="C:/Dev/ImboniResto/src/lib/die/services" lines="0-0" /> — item-specific > category > default KITCHEN | 🟢 |
| Item state machine | ✅ `NEW → PREPARING → READY → DELIVERED → CANCELED`. Enforced by `StateMachineService.validateAndExplain` <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="91-99" />. Timestamps recorded for each transition | 🟢 |
| Real-time KDS updates | ✅ Pusher with 3-s polling fallback + snapshot reconciliation <ref_file file="C:/Dev/ImboniResto/src/lib/realtime.ts" />. KDS at <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/kds.tsx" /> | 🟢 |
| Multiple stations | ✅ 7 station types, station mgmt UI <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/stations.tsx" /> | 🟢 |
| Kitchen ticket printer | ❌ No printer integration on web; KDS is screen-only. Small restaurants without a tablet per station cannot operate. | 🟠 |
| Item-level void / 86 | ❌ NO endpoint to void a fired item. SaleItem has `mutationType: CANCELLED` enum value but no API surfacing it. Only sale-level cancel exists. | 🟠 |
| Cash-paid POS sale dispatching to kitchen | ⚠️ `SalesService.createSale` does NOT call `KitchenDispatchService`. Only happens via the payment-confirmation path. A cash sale created at the POS may never reach the kitchen as a dispatched order. | 🟠 |

**Verdict**: 🟡 — kitchen workflow is well-modeled and real-time, but tied to *paid* orders only and lacks an item-void endpoint.

---

## Stage 6 — 7:00 PM · Bar Operations (Late-Night Drinks)

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Bar is a separate station | ✅ `StationType.BAR` <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="3935-3943" /> | 🟢 |
| Drink routing | ✅ via category or item `RouteRule` to `BAR` station. Default initialization creates Kitchen + Bar | 🟢 |
| Mixed food + drinks on one order | ✅ Same Sale, items routed to different stations by RouteRule. Each station only sees its items via `/api/station/orders` | 🟢 |
| Bar synchronization (drinks ready before food) | ✅ `expoStatus` on Sale tracks expediter ready state <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="330-423" /> | 🟢 |
| Late-night sales (after midnight) | ⚠️ Sales recorded with `createdAt` UTC; "today" reports use `endOfDay` set to 23:59:59 of a target date <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="266-273" />. A sale at 00:30 AM is reported as the next day. No business-defined "business day" boundary. | 🟡 |

**Verdict**: 🟢 — bar workflow is the same as kitchen workflow but on a different station; this part is well-built.

---

## Stage 7 — Throughout Day · Payments

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Cash | ✅ Auto-completes as PAID <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="31-34" /> | 🟢 |
| MTN Mobile Money (push) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/payments/momo/initiate.ts" />, callback <ref_file file="C:/Dev/ImboniResto/src/pages/api/payments/mtn-momo/callback.ts" />. **Callback lacks idempotency guard** (IremboPay has it, MTN MoMo does not) | 🟡 |
| Airtel Money | ✅ Via InTouch provider abstraction <ref_file file="C:/Dev/ImboniResto/src/pages/api/payments/intouch/initiate.ts" /> | 🟢 |
| IremboPay (web / card) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/create-invoice.ts" /> + webhook with idempotency guard <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/irembo/webhook.ts" lines="83-93" /> | 🟢 |
| Card | ✅ Via IremboPay | 🟢 |
| Pesapal | ❌ Disabled (`pesapal.ts.disabled`) | 🟡 |
| Stripe | ❌ NOT FOUND | 🟡 |
| Split payments | ⚠️ `SalePayment` model exists <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="2283-2304" /> + `SplitPaymentWhatsAppTrigger`. No active POS UI flow exercises it; service file `split-payment-whatsapp.service.ts` exists but no sales endpoint creates `SalePayment` rows | 🟠 |
| Failed payments | ✅ Status logged as FAILED in PaymentTransaction + FinancialLedgerEntry <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/mtn-momo/callback.ts" lines="51-53" /> | 🟢 |
| Refunds | ⚠️ <ref_file file="C:/Dev/ImboniResto/src/pages/api/payments/refunds.ts" /> works for **InTouch ONLY** <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/payments/refunds.ts" lines="67-72" />. Cash and IremboPay payments cannot be refunded via API | 🟠 |
| Cancellation (sale-level) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/sales/[id]/cancel.ts" /> blocks paid orders <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="207-209" /> | 🟢 |
| Cancellation (item-level) | ❌ No API. After firing, a single item cannot be voided. | 🟠 |
| Tap-and-leave checkout | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/checkout/tap-and-leave.ts" /> + sweep cron | 🟢 |
| Payment monitoring | ✅ Watchdog every 5 min <ref_file file="C:/Dev/ImboniResto/src/pages/api/cron/watchdog-payment.ts" /> | 🟢 |

**Verdict**: 🟡 — happy paths solid, but refunds only on one rail and no item-void.

---

## Stage 8 — Throughout Day · Inventory

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| **Automatic deduction on sale** | ❌ **`SalesService.createSale`** <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="8-76" /> **creates Sale + SaleItem and never touches `InventoryItem.currentStock`**. No code anywhere in `src/` decrements stock when a sale completes (search of `currentStock` + `inventoryItem.update` confirms no sale-path usage; only manual updates and reorder-suggestion reads). | 🔴 |
| Recipe / BOM link MenuItem → InventoryItem | ❌ **No model in `prisma/schema.prisma`**. Recipe Management UI <ref_snippet file="C:/Dev/ImboniResto/src/pages/dashboard/recipe-management.tsx" lines="37-74" /> is hardcoded mock data. | 🔴 |
| Manual stock adjustments | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/inventory/updates.ts" /> via `InventoryService.recordUpdate` <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="77-131" />. Types: ADD, REMOVE, WASTE, ADJUSTMENT | 🟢 |
| Negative stock prevention | ✅ Hard guard <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="102-102" /> | 🟢 |
| Stock visibility | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/inventory.tsx" /> + low-stock alerts dashboard <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/inventory-alerts.tsx" /> | 🟢 |
| Supplier traceability | ✅ Captured in `InventoryUpdate.notes` when OCR-applied; manual updates allow `reason` + `notes` | 🟢 |
| Audit history | ✅ `InventoryUpdate` model retained indefinitely with user attribution | 🟢 |
| Reorder suggestions | ✅ <ref_file file="C:/Dev/ImboniResto/src/lib/services/reorder-autopilot.service.ts" /> + <ref_file file="C:/Dev/ImboniResto/src/lib/services/smart-reorder.service.ts" /> | 🟢 |

**Verdict**: 🔴 — **the single biggest pilot blocker**. A restaurant that sells 100 plates and 100 drinks today will show *the same* stock tomorrow morning as it did this morning. Reorder suggestions are based on inventory that is never decremented. Auto-reorder will under-order. After 3 days, inventory is fiction.

---

## Stage 9 — Throughout Day · Manager Operations

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Live sales dashboard | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/dashboard/live-metrics.ts" /> + <ref_file file="C:/Dev/ImboniResto/src/pages/api/dashboard/sales-chart.ts" /> | 🟢 |
| CFO / CEO dashboards | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/cfo.tsx" />, <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/ceo.tsx" />, API at <ref_file file="C:/Dev/ImboniResto/src/pages/api/dashboard/cfo.ts" /> | 🟢 |
| Daily / weekly / monthly reports | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/reports/daily.ts" />, weekly, monthly, send-now | 🟢 |
| Staff management | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/staff/index.ts" /> + <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/staff.tsx" /> + staff performance | 🟢 |
| Audit logs (admin) | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/admin/audit-logs/index.ts" /> | 🟢 |
| Reservations | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/reservations/index.ts" /> + deposit flow | 🟢 |
| Table management | ✅ Full CRUD <ref_file file="C:/Dev/ImboniResto/src/pages/api/tables/index.ts" /> | 🟢 |
| Multi-tenant isolation | ✅ `resolveBusinessContext` <ref_file file="C:/Dev/ImboniResto/src/lib/api/business-context.ts" /> used by 100+ routes; sample routes all enforce `businessId` match | 🟢 |
| Branches | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/dashboard/branches.tsx" /> | 🟢 |

**Verdict**: 🟢 — strongest area of the system.

---

## Stage 10 — Midnight · Restaurant Closing

| Sub-process | Works? | Evidence | Class |
|---|---|---|---|
| Total daily sales report | ✅ <ref_file file="C:/Dev/ImboniResto/src/pages/api/reports/daily.ts" /> + daily summary cron <ref_file file="C:/Dev/ImboniResto/src/pages/api/cron/summary-daily.ts" /> | 🟢 |
| Inventory accuracy at close | ❌ Inventory was never deducted during the day (Stage 8), so closing snapshot ≠ reality | 🔴 |
| **Cash reconciliation (cash in drawer vs system)** | ❌ NOT FOUND. No cash-drawer model, no `cashReconciliation`, no `drawerClose`, no `endOfShift` endpoint. Manager cannot reconcile expected cash vs counted cash via the platform. | 🟠 |
| **Z-report / shift close** | ❌ NOT FOUND. No `closeOfDay`, no `zReport`, no `shiftClose`. Only date-range queries use the word `endOfDay`. | 🟠 |
| Audit logs persisted | ✅ AuditLog, SecurityEvent, FinancialLedgerEntry, DocumentProcessingLog, DocumentEventTimeline, InventoryUpdate all retained indefinitely | 🟢 |
| Nightly reconciliation cron (payments) | ✅ Every night at 00:00 UTC <ref_file file="C:/Dev/ImboniResto/src/pages/api/cron/reconciliation.ts" /> reconciles PaymentTransaction ↔ Sale and alerts on mismatch | 🟢 |
| Next-day readiness (carry-over) | ⚠️ Open Sales (status=ACTIVE) carry over with no warning. No "force-close all tables" mechanism. | 🟡 |

**Verdict**: 🟠 — reports exist but the *operational closing ritual* (count cash, reconcile, lock day) is absent.

---

## Cross-cutting · Reliability

| Concern | Status | Evidence |
|---|---|---|
| Background worker (DIE/OCR) | 🟢 Running with Redis + BullMQ, retries, DLQ |
| DLQ FK violations | 🟢 Fixed (today's session) |
| Real-time fallback | 🟢 Pusher → 3-s polling → snapshot sync <ref_file file="C:/Dev/ImboniResto/src/lib/realtime.ts" /> |
| Health endpoints | 🟢 `/api/health`, `/api/health/ready` |
| Watchdog crons | 🟢 7 active: payment, queue, reconciliation, revenue, customer, subscription |
| Idempotency framework | 🟢 IdempotencyKey model used by sales, public-order, station-update |
| Multi-tenant isolation | 🟢 Strong (sampled) |

---

## Final Scoring of Each Stage

| Stage | Class | Why |
|---|---|---|
| 1 Opening | 🟠 | No printer, no opening checks, no float entry |
| 2 Receiving (OCR V1) | 🟢 (with OpenAI/Azure quota) | All P0 fixed today |
| 3 Prep | 🔴 | No recipe model = kitchen blind to stock |
| 4 Order creation | 🟡 | QR good; POS minimal & doesn't dispatch unpaid |
| 5 Kitchen | 🟡 | Strong KDS, no item-void, no printer |
| 6 Bar | 🟢 | Reuses station model cleanly |
| 7 Payments | 🟡 | Cash/MoMo/Card work; refunds only InTouch |
| 8 Inventory | 🔴 | No auto deduction; recipes are mockups |
| 9 Manager | 🟢 | Strongest area |
| 10 Closing | 🟠 | Reports yes; cash reconciliation no |

---

## Answer

**Question**: *"If a restaurant opens at 7:00 AM and closes at midnight using ONLY ImboniServe V1, where would operations fail?"*

**Operations would fail in three specific places, in order of severity**:

1. **🔴 Inventory drift the moment service starts** — selling food does not decrement stock. By close of business, every stock figure in the system is wrong. By day 7 the inventory module is fiction. Reorder suggestions and OCR-applied restocks land on a moving baseline that nobody trusts.

2. **🔴 Kitchen runs blind to availability** — without recipes linking menu items to ingredients, neither customer-facing menu nor staff KDS know what's truly available. The only way to "86" an item is for the manager to flip `isActive=false` in the menu page after a customer is told it's unavailable.

3. **🟠 No way to close the day** — staff can run reports, but cannot count the cash drawer, reconcile cash + MoMo against system totals, or lock yesterday. After multiple shifts, accountability evaporates.

Two important things **do** work end-to-end:
- The **OCR V1 supplier-intake** path you completed today produces a complete, audited inventory increase — the only inventory path that actually adjusts stock correctly.
- The **kitchen/bar real-time dispatch** for paid orders is genuinely strong: idempotent, stationed, recoverable on Pusher reconnect.

The system therefore *receives* inventory beautifully but *consumes* it not at all, which produces a growing, monotonically increasing fiction in `currentStock`.

→ Continued analysis in <ref_file file="C:/Dev/ImboniResto/RESTAURANT_OPERATIONAL_GAPS.md" />.
