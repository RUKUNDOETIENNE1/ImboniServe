# DIE Supply Chain Intelligence Design (Read-Only, Shadow Mode)

Objective: Build a read-only intelligence loop across Inventory → Procurement → Suppliers → Restocking → Inventory Recovery.

- Data Source: Shadow Observability Buffer (in-memory) and shadow bindings. No persistence added.
- Engine: `correlationEngine` extended to produce correlation signals based on codes and tags.

## Correlation Heuristics

- Inventory Shortage Correlation
  - Trigger: frequent `INVENTORY_STOCK_LOW`, `INVENTORY_STOCK_OUT`, `INVENTORY_THRESHOLD_BREACH` (sourceTag=inventory)
  - Output: riskSignal "Inventory Shortage Pressure" affecting inventory, procurement, suppliers.

- Procurement Delay Correlation
  - Trigger: `PROCUREMENT_DELAY_DETECTED` following shortage signals
  - Output: riskSignal "Delayed Replenishment After Shortages"

- Supplier Reliability Correlation
  - Trigger: repeated `SUPPLIER_DELIVERY_DELAYED` and `SUPPLIER_DELIVERY_FAILED`
  - Output: riskSignal "Supplier Reliability Risk"

- Inventory Recovery Correlation
  - Trigger sequence: `INVENTORY_STOCK_LOW` → `PROCUREMENT_ORDER_CREATED` → `PROCUREMENT_ORDER_RECEIVED` → `INVENTORY_RESTOCKED`
  - Output: optimization candidate with observed average replenishment time (hours) derived from shadow buffer.

## Output Surfaces
- Correlation report via `correlationEngine.generateReport()` (no schema changes)
- Unified Observability feed (ephemeral) with `source='intelligence-core'` and `sourceTag` per plugin.

## Safety
- Feature flags must be ON per domain to contribute signals.
- All computations are best-effort and fail-safe; exceptions swallowed.
