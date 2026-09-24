# FOUNDER-GPV-001 — Platform Journey Map

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-JOURNEY-MAP |
| Date | 2026-08-14 |
| Source | Actual repository inspection (routes, APIs, models, UI) |

## Overview

This document maps the complete ImboniServe platform journey as derived from actual source code. It shows every major workflow, its entry point, its dependencies, and its expected outcome.

## The Complete Human Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FOUNDER-LED VERIFICATION                      │
│                   "Operating a real hospitality business"            │
└─────────────────────────────────────────────────────────────────────┘

SESSION A: OWNER SETUP
 ══════════════════════
 1. SIGNUP → /signup (name, email, password, phone, business, country, plan)
 2. WELCOME → /welcome
 3. LOGIN → /login (credentials → OTP → MFA confirm → session)
 4. SETUP WIZARD → /setup (menu? tables? payment config? staff?)
 5. DASHBOARD → /dashboard
 6. BUSINESS PROFILE → /dashboard/profile
 7. PAYMENT SETTINGS → /dashboard/payment-settings (tax mode, rate, currency)
 8. SETTINGS → /dashboard/settings (QR enable, business config)

SESSION B: TEAM & PERMISSIONS
 ════════════════════════════
 9. STAFF MANAGEMENT → /dashboard/staff
10. CREATE MANAGER → invite + role assignment
11. CREATE WAITER → invite + role assignment
12. CREATE KITCHEN STAFF → invite + role assignment
13. ROLE VERIFICATION → login as each role, verify permissions

SESSION C: MENU & TABLES & QR
 ════════════════════════════
14. MENU MANAGEMENT → /dashboard/menu/dynamic-edit
15. CREATE CATEGORY → group menu items
16. CREATE MENU ITEMS → name, price, cost, category, availability
17. TABLES → /dashboard/tables
18. CREATE TABLES → number, capacity, status
19. QR BUILDER → /dashboard/qr-builder
20. GENERATE QR → HMAC-signed, in-venue or remote
21. TEST QR → scan with phone → /order?branchId=...&tableId=...&signature=...

SESSION D: GUEST DINING
 ══════════════════════
22. GUEST SCANS QR → /order page loads
23. TOKEN EXCHANGE → POST /api/public/order/token → accessToken
24. MENU DISPLAY → GET /api/public/menu?branchId=...
25. BROWSE & ADD TO CART → item detail, preferences, recommendations
26. PLACE ORDER → POST /api/public/order/draft → saleId, orderNumber
27. ORDER CONFIRMATION → /order/confirmation?orderId=...
28. KITCHEN DISPATCH → automatic via KitchenDispatchService
29. ADD MORE ITEMS → multiple orders in one dining session
30. SMART DINING SLIP → live ledger tracks running bill

SESSION E: KITCHEN & PROMISE ENGINE
 ══════════════════════════════════
31. KITCHEN DISPLAY → /dashboard/kitchen (6 columns)
32. ACCEPT ORDER → pending → accepted
33. START PREP → accepted → preparing (triggers inventory consumption if enabled)
34. ALMOST READY → preparing → almost_ready
35. MARK READY → almost_ready → ready (Promise Engine → FULFILLED)
36. SERVE → ready → served
37. PROMISE ENGINE → WARNING at 8 min, CRITICAL at 15 min
38. SERVICE RISKS → /dashboard/operations/service-risks
39. SERVICE REPLAY → /dashboard/operations/service-replay

SESSION F: PAYMENT & TAP & LEAVE
 ════════════════════════════════
40. CHECKOUT → /order/checkout?sessionId=...
41. LIVE ORDER SUMMARY → running bill, VAT, fee
42. ENTER PHONE → Mobile Money number
43. TAP & LEAVE → POST /api/checkout/tap-and-leave
44. USSD PROMPT → approve payment on phone
45. WEBHOOK CALLBACK → POST /api/webhooks/intouch
46. PAYMENT COMPLETION → Sale COMPLETED, PaymentTransaction SUCCESS
47. FINANCIAL LEDGER → FinancialLedgerEntry created
48. SMART DINING SLIP (FINAL) → receipt generated
49. ⚠️ RECEIPT PAGE → /order/receipt (MISSING — FGPV-D001)
50. SESSION CLOSED → table released

SESSION G: FINANCIAL TRUTH & CLOSE DAY
 ══════════════════════════════════════
51. DASHBOARD REVENUE → /dashboard (revenue should match)
52. TRANSACTIONS → /dashboard/transactions
53. CLOSE DAY → /dashboard/close-day
54. Z-REPORT → sales, payment breakdown, tax, ledger cross-check
55. LEDGER VARIANCE = 0 → Sale total = Ledger total
56. CLOSE DAY POST → audit log, double-close prevention

SESSION H: EXECUTIVE REVIEW
 ══════════════════════════
57. CEO DASHBOARD → /dashboard/ceo (business health, revenue, customers)
58. CFO DASHBOARD → /dashboard/cfo (financial metrics)
59. REPORTS → /dashboard/reports
60. ANALYTICS → /dashboard/analytics (menu performance, peak hours, payments)

PARALLEL BRANCHES:
 ══════════════
 RESERVATIONS → /dashboard/reservations (create, confirm, complete, cancel, no-show)
 INVENTORY → /dashboard/inventory (CRUD, stock, alerts, auto-reorder)
 SUPPLIERS → /dashboard/supplier-portal (⚠️ MOCK DATA — not functional)
 SECURITY → role isolation, QR validation, session expiry
 FAILURE → payment failure, cancelled reservation, invalid QR
```

## Journey Entry Points by Role

| Role | Entry Point | Primary Workspace |
|---|---|---|
| Owner | `/dashboard` | Full access — all sections |
| Manager | `/dashboard` | Operations, menu, staff, reports (no settings manage, no refunds) |
| Cashier/Front Desk | `/dashboard` | Orders, payments, tables, reservations |
| Waiter | `/dashboard/waiter` | Order queue, table service |
| Kitchen | `/dashboard/kitchen` | Kitchen display, order status |
| Guest | `/order?branchId=...&signature=...` | Menu, cart, checkout |
| Admin | `/admin` | Platform administration |

## Key Routes Inventory

### Public (Guest-Facing)
- `/signup` — Business owner registration
- `/login` — Login with MFA
- `/welcome` — Post-signup welcome
- `/order` — Guest menu and ordering (QR-triggered)
- `/order/checkout` — Tap & Leave checkout
- `/order/confirmation` — Order confirmation with payment status

### Dashboard (Authenticated)
- `/dashboard` — Main dashboard
- `/dashboard/menu/dynamic-edit` — Menu management
- `/dashboard/menu-builder` — AI menu builder
- `/dashboard/tables` — Table management
- `/dashboard/qr-builder` — QR code generation
- `/dashboard/kitchen` — Kitchen display system
- `/dashboard/kds` — Alternative KDS
- `/dashboard/waiter` — Waiter workflow
- `/dashboard/staff` — Staff management
- `/dashboard/reservations` — Reservation management
- `/dashboard/inventory` — Inventory management
- `/dashboard/inventory-alerts` — Low stock alerts
- `/dashboard/auto-reorder` — Auto-reorder recommendations
- `/dashboard/supplier-portal` — Supplier management (MOCK)
- `/dashboard/payment-settings` — Tax and payment configuration
- `/dashboard/transactions` — Payment transactions
- `/dashboard/close-day` — Z-Report and day close
- `/dashboard/ceo` — CEO decision intelligence
- `/dashboard/cfo` — CFO financial dashboard
- `/dashboard/reports` — Reports
- `/dashboard/operations/service-risks` — Promise Engine risks
- `/dashboard/operations/service-replay` — Service timeline replay
- `/dashboard/settings` — Business settings
- `/dashboard/profile` — Business profile
- `/dashboard/security` — Security settings

### Setup
- `/setup` — Onboarding wizard (first-time)

## Evidence Sources

Every route, API, and flow in this map was verified against actual source files:
- `src/pages/` — All page components
- `src/pages/api/` — All API routes
- `src/lib/services/` — All service classes
- `src/lib/permissions/staff.ts` — Role definitions
- `src/components/DashboardLayout.tsx` — Navigation structure
- `prisma/schema.prisma` — Data models
- `.env` — Current configuration state
