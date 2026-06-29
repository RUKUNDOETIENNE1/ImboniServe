# Inventory Consumption Model

**Question**: Exactly when does stock leave inventory, how is the operation made safe under every failure mode, and how does the model accommodate partial orders, voids, refunds, split bills, kitchen remakes, and waste?

---

## 1. The Single Deduction Rule

> **Stock leaves InventoryItem at the moment a SaleItem transitions from `NEW` to `PREPARING`.**

Selected from four candidates after the analysis in <ref_file file="C:/Dev/ImboniResto/KITCHEN_CONSUMPTION_ENGINE_ARCHITECTURE.md" /> §4. The rule is:

- **Item-level**, not order-level (a Sale with kitchen + bar items hits different stations at different times).
- **State-driven**, not endpoint-driven (the existing state machine at <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="91-99" /> is the single source of truth).
- **Forward-and-reverse**: `PREPARING → CANCELED` reverses; `READY → DELIVERED` is a no-op for inventory.

---

## 2. Lifecycle Mapping (Every State → Engine Action)

| Transition | Engine action | Why |
|---|---|---|
| `NEW → PREPARING` | **CONSUME** — write InventoryUpdate (REMOVE), InventoryConsumption (state=ACTIVE), flip `consumptionState` PENDING→CONSUMED, emit event | Cook physically takes ingredients. |
| `NEW → CANCELED` | No-op | Never consumed; nothing to reverse. |
| `PREPARING → READY` | No-op | Ingredients already consumed; the dish is just done cooking. |
| `PREPARING → CANCELED` | **REVERSE** — write InventoryUpdate (ADD), InventoryConsumption (state=ACTIVE, negative qty) AND flip original to state=REVERSED, flip `consumptionState` CONSUMED→REVERSED | Already prepped but won't be served — return ingredients to stock. |
| `READY → CANCELED` | **REVERSE + WASTE classification** — same as above PLUS the reverse row is flagged `reasonCode=KITCHEN_WASTE_AFTER_PREP` for analytics | Food was made but never served. Manager analytics need to see this as waste, not as "stock returned". (Stock IS returned to the InventoryItem balance because the food is already disposed of *separately*; see §6.) |
| `READY → DELIVERED` | No-op | Inventory math already done. |
| `DELIVERED → CANCELED` | **REFUND PATH, NOT INVENTORY** — engine writes nothing to inventory. Refund logic in `/api/payments/refunds.ts` runs separately. Food was eaten. | Inventory is not the right ledger to fix a customer dispute. |

**No transition can cause a duplicate deduction**: the `consumptionState` column guards every write at the SQL level (UPDATE ... WHERE consumptionState='PENDING' returning rowcount = 1).

---

## 3. Atomic Transaction Boundary

Every consume / reverse runs inside a single `prisma.$transaction`:

```
TX BEGIN
  1. SELECT InventoryItem rows FOR UPDATE   (one per RecipeIngredient)
  2. For each ingredient:
       compute quantityToConsume + cost (via CostingStrategy)
       INSERT InventoryUpdate (existing service, existing negative-stock guard)
       INSERT InventoryConsumption
  3. UPDATE SaleItem SET consumptionState='CONSUMED' WHERE id=? AND consumptionState='PENDING'
       → if rowcount=0, ABORT (someone else already consumed)
  4. UPDATE SaleItem SET itemStatus='PREPARING', prepStartedAt=now()
  5. INSERT TicketEvent (idempotencyKey-protected)
TX COMMIT
  6. After-commit: fire DIE plugin event (out-of-tx, idempotent retry)
```

The state-machine update happens *inside* the same tx. Either the whole consumption AND the status flip succeed, or none of it does.

**Failure handling**:
- Negative stock detected at step 2 → transaction aborts; existing guard at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="102-102" /> throws. UI surfaces "insufficient stock to fire item". Manager either adjusts inventory or 86s the menu item.
- Idempotency collision at step 3 → graceful no-op; return existing audit.
- DB error mid-tx → automatic rollback. Item stays in `NEW`. Cook re-taps Start. No silent corruption.

---

## 4. Partial Orders

A Sale can carry items at different lifecycle stages. The engine treats each SaleItem independently:

| SaleItem #1 | SaleItem #2 | SaleItem #3 | Engine behavior |
|---|---|---|---|
| PREPARING | NEW | NEW | One consumption recorded for #1; #2 and #3 untouched. |
| PREPARING | PREPARING | NEW | Two consumptions, two transactions, completely independent. |
| CANCELED | DELIVERED | PREPARING | One reverse (#1 if it was past PREPARING), no-op (#2), consume (#3). |

This composability is the practical reason the trigger is item-level. Order-level would force whole-order atomicity which doesn't match how restaurants actually fire dishes.

---

## 5. Voids, Refunds, Cancellations, Split Bills, Remakes

| Real-world event | Mapping |
|---|---|
| **Customer cancels before food fires** | UI cancels each `NEW` SaleItem one by one → no consumption ever happened → no engine action. Sale-level cancel API blocks if paid but item-level transitions remain available. |
| **Send back a dish (item void after prep)** | `PREPARING → CANCELED` or `READY → CANCELED` → engine reverses. A new SaleItem (the remake) goes through its own consumption. This requires the item-void endpoint flagged in <ref_file file="C:/Dev/ImboniResto/RESTAURANT_OPERATIONAL_GAPS.md" /> GAP-5; engine logic is ready, only the endpoint is missing. |
| **Whole sale void (unpaid)** | Existing endpoint at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/sales.service.ts" lines="186-236" /> sets Sale.status='CANCELLED'. Engine listens for any SaleItem state going to CANCELED via the existing transition mechanism. Any items still in NEW: no-op. Items past PREPARING: reverse. |
| **Whole sale void (paid)** | Existing endpoint already refuses. Refund flow + per-item reverse is the operator's responsibility. Engine accepts the per-item CANCELED transitions and reverses. |
| **Refund** | `/api/payments/refunds.ts` flow — engine is NOT involved (DELIVERED items stay consumed). Money returns; ingredients don't. |
| **Split bill** | `SalePayment` rows divide the financial total. Engine doesn't care — consumption is at the SaleItem layer, payment-side is independent. |
| **Kitchen remake** | Existing `mutationType=REPLACED` on SaleItem at <ref_snippet file="C:/Dev/ImboniResto/prisma/schema.prisma" lines="448-449" />. The replaced item stays CONSUMED (its ingredients were really used). The replacement SaleItem fires its own consumption. Both rows visible in audit. |
| **Voided after delivery (rare)** | DELIVERED→CANCELED is allowed by the state machine for accounting purposes but the engine does NOT reverse inventory. Logged for finance. |

Every case is handled by the same single rule (§1) plus the natural item-level state machine. No special branches.

---

## 6. Waste & Spoilage — Separate Discipline

The engine deducts **ingredients used in dishes**. It does NOT handle:

| Source of stock loss | Path |
|---|---|
| Prep waste (trim, peel) | Already baked into recipe via `yieldFactor` (<ref_file file="C:/Dev/ImboniResto/RECIPE_ENGINE_REALITY_REVIEW.md" /> §3.2). |
| Kitchen waste (dropped pan, overcooked batch) | Manual `InventoryUpdate type='WASTE'` via existing endpoint <ref_file file="C:/Dev/ImboniResto/src/pages/api/inventory/updates.ts" />. Already supported by `InventoryService.recordUpdate` at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="89-100" />. |
| Spoilage / expired | Same — manual `WASTE` update with reason="Spoilage". A nightly cron candidate, but not engine logic. |
| Returned to supplier | Manual `REMOVE` update with reason="Return to supplier". |
| Inventory recount | Manual `ADJUSTMENT` update — already supported, sets absolute value at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="97-99" />. |
| Cancellation after READY | Reverse adds stock back AND logs `KITCHEN_WASTE_AFTER_PREP` on the InventoryConsumption row. Stock balance is correct; analytics gets a waste counter for free. |

**The architectural rule**: the engine touches inventory *only* for sale-driven consumption. Every other flow uses the pre-existing `WASTE | ADJUSTMENT | ADD | REMOVE` types on `InventoryUpdate`. **One audit table, multiple causes, no duplication.**

---

## 7. Manual Adjustments — Reconciling Reality

Restaurants always need a "the count says 7 kg but the system says 8" reconciliation flow.

The existing manual ADJUSTMENT path at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="97-99" /> already does this. After the engine ships, the daily reconciliation workflow becomes:

1. End of shift: physical count.
2. Manager enters counts.
3. System computes variance = counted − systemStock.
4. For each variance:
   - If small (< threshold): one `ADJUSTMENT` update with reason="Daily recount variance".
   - If large: an investigation log row (out of scope, but `DocumentProcessingLog` could host it).

This is operational discipline on top of the engine, not engine logic. The engine merely ensures the system stock is accurate enough that variance becomes a small number rather than a fictional number.

---

## 8. Negative Inventory Policy

Existing hard guard at <ref_snippet file="C:/Dev/ImboniResto/src/lib/services/inventory.service.ts" lines="102-102" />: `if (newStock < 0) throw`.

The engine inherits this. Consequences:

- **Stale recipe**: If a cook tries to fire a dish whose ingredient is depleted, the tx aborts with a clear error. KDS surfaces "Cannot fire — out of stock: chicken". This is *the right experience* — better than silently lying.
- **Override**: A `Business.allowNegativeInventory` flag is left as a configuration option but **defaults to false**, matching today's behavior. Hotels with central kitchen replenishment may want true; restaurants want false.
- **Race condition**: Two cooks fire dishes that share the last 0.2 kg of cheese. Both tx attempt to SELECT FOR UPDATE on the InventoryItem row; second waits, computes negative, aborts. First one wins. UX-wise, second cook sees the error 200ms later. Acceptable.

---

## 9. Idempotency Guarantees (Across All Edge Cases)

| Failure mode | Defence |
|---|---|
| Pusher reconnect → station UI retries the POST | `IdempotencyKey` model already catches it at the HTTP layer <ref_snippet file="C:/Dev/ImboniResto/src/pages/api/station/update-item-status.ts" lines="29-43" />. |
| Two cooks simultaneously tap Start | DB row lock + `consumptionState='PENDING'` guard. One wins. |
| Worker retries the BullMQ job | (Not currently a path — engine runs in the request handler, not the worker — but the same guards protect it.) |
| Network blip mid-tx | DB rollback; nothing was committed. Cook re-taps. |
| Plugin event listener crashes | Out-of-tx; the engine's writes are already committed. Listener retry is the listener's problem. |
| Duplicate plugin event delivery | Listeners must idempotency-key on `(saleItemId, eventType, sequenceNumber)`. The event itself already carries `idempotencyKey` from `TicketEvent`. |

**Net property**: a SaleItem can be CONSUMED at most once and REVERSED at most once. Guaranteed by the row-level state guard and verified by integration tests on publication.

---

## 10. Risk Matrix (Inventory Consumption)

| ID | Risk | Class | Mitigation |
|---|---|---|---|
| IC1 | Double deduction (race) | 🔴 | `consumptionState` row guard + FOR UPDATE lock. |
| IC2 | Missed deduction (event lost) | 🔴 | Inline in same tx as state transition — no event in between. |
| IC3 | Negative inventory | 🟠 | Existing guard + business-level `allowNegativeInventory` opt-in. |
| IC4 | Unit conversion error (g vs kg) | 🟠 | `UnitNormalizationService` at recipe publish + at consumption. |
| IC5 | Reverse never fires (cook leaves CANCELED un-transitioned) | 🟡 | Watchdog cron: items with `consumptionState=CONSUMED, itemStatus=CANCELED, age>10min` → auto-reverse + manager alert. Reuses pattern from existing watchdog crons (`watchdog-queue.ts`). |
| IC6 | Sub-recipe stock not properly cascaded | 🟡 | Engine resolves recursively before opening tx; aborts if any terminal InventoryItem fails. |
| IC7 | Modifier not honored (consumed cheese even though customer said "no cheese") | 🟠 | `RecipeIngredient.isOptional=true` lines are gated on `SaleItem.instructions` parse at consume time. Default is "consume" unless explicitly disabled. |
| IC8 | Inventory grows after consumption (impossible accidentally) | 🟢 | Only `REVERSE` produces ADD; reverse is gated by `consumptionState='CONSUMED'`. |

---

## 11. Verdict

The model deducts at exactly one moment, in exactly one place, with one guard against double-fire, one row-level lock against race, and one mechanism (state machine + plugin events) for everything downstream. Voids, refunds, remakes, split bills, partial orders, and waste each map to a path that already exists in the codebase. No new endpoint is required for the trigger; only the missing item-void endpoint (GAP-5) and the consumption invocation inside `update-item-status` are new code surface.

This is the **safest production rule** for the system as it stands today.
