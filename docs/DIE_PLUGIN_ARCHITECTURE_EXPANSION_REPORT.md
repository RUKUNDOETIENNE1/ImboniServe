# DIE Plugin Architecture Expansion Report — Hospitality v1.0

## Discovery Summary
The following additional hospitality-capable modules were discovered and included in the conversion scope:

- Table Management (lib/services/table.service.ts)
- Waiter Calls (pages/api/waiter-calls/*)
- Dining Sessions & Slips (lib/services/dining-session-slip.service.ts, smart-dining-slip.service.ts)
- Menu Management (dashboard/menu-builder.tsx + related APIs)
- Procurement & Suppliers (services/purchase-order.service.ts, ai-supplier-recommendation)
- Campaigns/Marketing (pages/api/campaigns*, dashboard/campaigns.tsx)
- Stations/Kitchen Routing (kitchen-dispatch.service.ts, station APIs)
- Hotel Rooms (pages/api/hotel/rooms.ts) — supports future Room Service

No incompatible or blocking legacy systems were found that would prevent additive plugin conversion.

## Inclusion Decisions
- All discovered modules are suitable as first-class plugins under the conversion framework.
- Some will be modeled as support plugins (e.g., Stations/Routing) to reduce coupling while surfacing domain health.

## Dependency Map (High-Level)
- KDS depends on Stations/Routing (support plugin) and on Orders/Sale events
- Dining Slips depend on Sales and Menu Items data
- Reservations depend on Table Management (optional), Customer, Business
- Procurement depends on Suppliers and Inventory
- Loyalty depends on Customer and Sales
- Delivery depends on Orders (customer-facing) and/or Supplier deliveries

## Risk Ranking (Per Domain)
- Low: Reservations, Inventory, Loyalty, Waiter Calls, Promotions, Menu Management
- Medium: KDS, Stations/Routing, Table Management, Campaigns/Marketing
- Medium-High: Procurement & Suppliers, Delivery Management, Dining Sessions & Slips (due to document workflows)
- Future Planning: Hotel Room Service (design abstraction only for now)

## Recommendations
- Proceed with Reservations as pilot for live integration in a subsequent phase.
- Wire Observability/Intelligence first (read-only), then Governance/Marketplace signals.
- Use feature flags for event-tap enablement and plugin registration (enterprise visibility).

## Rollback Strategy
- Disable feature flag per domain to stop event taps and registration.
- No schema rewrites involved; original business services remain authoritative.
- Observability and intelligence signals cease upon flag disable; no further action required.
