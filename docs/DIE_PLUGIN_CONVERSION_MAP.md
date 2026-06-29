# DIE Plugin Conversion Map — Hospitality Domains v1.0

## Scope
Map all hospitality-capable modules to first-class DIE plugins using the Business→Plugin Conversion Framework. Includes initial scope and discovered domains.

## Standard Adapter Surfaces (per plugin)
- Events → Governance lifecycle/anomaly
- Events → Marketplace adoption/usage/stability
- Events → Intelligence metrics (risk/stability/consistency)
- Events → Unified Observability feed (severity + code)

## Core Domains (Initial Scope)

### 1) Reservations Plugin
- Events:
  - BOOKING_CREATED, BOOKING_UPDATED, BOOKING_CANCELLED, CONFIRMED, NO_SHOW, CAPACITY_ALERT
- Governance:
  - INSTALL (created), ENABLE (updated/confirmed), DISABLE (cancelled/no_show), ANOMALY_DETECTED (capacity)
- Marketplace:
  - usageFrequency (booking volume), trendDirection (recent vs prior), adoptionScore (business count)
- Intelligence:
  - anomalyRate (capacity alerts), stabilityScore (cancel/no-show ratio), governanceRiskScore (overbooking patterns)
- Feed:
  - RESERVATION_CAPACITY_ALERT (WARN), RESERVATION_SPIKE (INFO), RESERVATION_CANCELLATION_SPIKE (WARN)

### 2) Kitchen Display System (KDS) Plugin
- Events:
  - ORDER_CREATED, ITEM_ROUTED, ITEM_PREPARING, ITEM_READY, ORDER_SERVED, ROUTING_FAILED, BACKLOG_ALERT
- Governance:
  - ENABLE (order flow events), ANOMALY_DETECTED (routing failures/backlogs/latency spikes)
- Marketplace:
  - usageFrequency (orders), activityScore (weighted item events), stabilityScore (routing success, latency)
- Intelligence:
  - risk scoring from dispatch failures and queue delay distributions
- Feed:
  - KDS_ROUTING_FAILED (WARN), KDS_BACKLOG_ALERT (WARN), KDS_THRUPUT_UP (INFO)

### 3) Inventory Plugin
- Events:
  - STOCK_ADD, STOCK_REMOVE, WASTE, ADJUSTMENT, LOW_STOCK_ALERT
- Governance:
  - ENABLE (stock changes), ANOMALY_DETECTED (low stock)
- Marketplace:
  - usageFrequency (updates), trendDirection (stock ops), stabilityScore (low-stock frequency)
- Intelligence:
  - anomalyRate (alerts), lifecycleConsistencyScore (adjustments vs sales/consumption)
- Feed:
  - INVENTORY_LOW_STOCK (WARN/CRITICAL), INVENTORY_WASTE_SPIKE (WARN)

### 4) Loyalty Plugin
- Events:
  - POINTS_EARNED, POINTS_REDEEMED, VIP_TIER_CHANGED
- Governance:
  - ENABLE (earn/redeem), ANOMALY_DETECTED (invalid redemption attempts)
- Marketplace:
  - adoptionScore (business enablement), usageFrequency (earn/redeem events), stabilityScore (error rate)
- Intelligence:
  - riskScore (suspicious redemption patterns), consistency (balance invariants)
- Feed:
  - LOYALTY_REDEMPTION (INFO), LOYALTY_SUSPICIOUS_ACTIVITY (WARN)

### 5) Delivery Management Plugin
- Events (customer-facing):
  - DELIVERY_DISPATCHED, DRIVER_ASSIGNED, EN_ROUTE, DELIVERED, DELIVERY_DELAY_ALERT
- Events (supplier-facing):
  - SUPPLIER_DELIVERY_SCHEDULED, SUPPLIER_DELIVERED, DELIVERY_DELAY_ALERT
- Governance:
  - ENABLE (status transitions), ANOMALY_DETECTED (delays)
- Marketplace:
  - usageFrequency (deliveries), trendDirection, stabilityScore (delay rate)
- Intelligence:
  - riskScore from delay outliers
- Feed:
  - DELIVERY_DELAY_ALERT (WARN), DELIVERY_ONTIME_RATE (INFO)

### 6) Event Management Plugin
- Events:
  - EVENT_CREATED, TICKET_BOOKED, CAPACITY_ALERT, ATTENDANCE_UPDATED, EVENT_COMPLETED, SPIKE_DETECTED
- Governance:
  - INSTALL/ENABLE (setup/activity), ANOMALY_DETECTED (capacity)
- Marketplace/Intelligence/Feed: analogous to Reservations with event semantics

### 7) Hotel Room Service Plugin (future-ready)
- Events:
  - ROOM_SERVICE_ORDER_PLACED, IN_PROGRESS, DELIVERED, DELAY_ALERT
- Governance/Marketplace/Intelligence/Feed: analogous to Delivery + KDS hybrid

## Discovered Hospitality Domains (to include)

### 8) Table Management Plugin
- Source: lib/services/table.service.ts
- Events: TABLE_STATUS_UPDATED, WAITER_ASSIGNED, TABLE_OCCUPIED, TABLE_AVAILABLE, TABLE_CLEANING
- Governance: ENABLE (status), ANOMALY (conflicts)
- Marketplace/Intelligence/Feed: occupancy, turnaround time, conflict detection

### 9) Waiter Calls Plugin
- Source: pages/api/waiter-calls/*, components/WaiterCallsPanel.tsx
- Events: WAITER_CALLED, CALL_ACKNOWLEDGED, CALL_RESOLVED, HIGH_PRIORITY_BILL
- Governance: ENABLE (calls), ANOMALY (SLA breach)
- Marketplace/Intelligence/Feed: usage, response SLAs, severity

### 10) Dining Session & Slips Plugin
- Source: lib/services/dining-session-slip.service.ts, smart-dining-slip.service.ts
- Events: SLIP_GENERATED, SLIP_SENT_WHATSAPP, SLIP_EDITED, PROCUREMENT_DOC_GENERATED
- Governance: ENABLE, ANOMALY (send failures)
- Marketplace/Intelligence/Feed: adoption, send success rate, edit anomalies

### 11) Menu Management Plugin
- Source: dashboard/menu-builder.tsx and menu APIs
- Events: MENU_ITEM_ADDED, MENU_ITEM_UPDATED, MENU_PUBLISHED
- Governance/Marketplace/Intelligence/Feed: content velocity, publish health

### 12) Procurement & Suppliers Plugin
- Source: services/purchase-order.service.ts, ai-supplier-recommendation, supplier portal pages
- Events: PO_CREATED, PO_APPROVED, GRN_RECEIVED, SUPPLIER_DELIVERY_MARKED, SUPPLIER_PAYOUT_INITIATED
- Governance: ENABLE/ANOMALY (mismatches, delays)
- Marketplace/Intelligence/Feed: throughput, mismatch/anomaly rates

### 13) Campaigns/Marketing Plugin
- Source: campaign scheduler/pages/api/campaigns
- Events: CAMPAIGN_SCHEDULED, CAMPAIGN_SENT, CAMPAIGN_FAILED
- Governance/Marketplace/Intelligence/Feed: adoption/usage, failure rates

### 14) Promotions Plugin
- Source: services/promotion.service.ts
- Events: PROMOTION_CREATED, PROMOTION_ACTIVATED, PROMOTION_REDEEMED
- Governance/Marketplace/Intelligence/Feed: usage, redemption consistency

### 15) Stations/Kitchen Routing Plugin (Support)
- Source: services/kitchen-dispatch.service.ts, station APIs
- Events: STATION_CREATED, ITEM_ROUTED, ROUTE_FAILED
- Governance/Marketplace/Intelligence/Feed: routing health

## Notes
- All mappings are read-only; no runtime rewrites
- Feature-flagged event taps will enable dual-write observation later
- Business isolation preserved across all domains
