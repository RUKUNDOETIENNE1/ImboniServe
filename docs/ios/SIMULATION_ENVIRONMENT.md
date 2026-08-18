# Simulation Environment

> **Internal Operational Simulation (IOS)**  
> **Date:** July 26, 2026

---

## Platform Under Test

| Attribute | Value |
|-----------|-------|
| Platform | ImboniServe |
| Version | RC1 (Post-PRRS) |
| Certification | Product Ready Certified (90/100) |
| Database | PostgreSQL (Prisma ORM) |
| Payment Gateways | InTouch (MTN/Airtel MoMo), IremboPay (Card) |
| Real-time | Pusher WebSockets |
| AI Provider | OpenAI (GPT-4o-mini) |
| Monitoring | Sentry |
| Storage | Supabase |
| Notifications | Twilio WhatsApp |

## Simulation Methodology

This simulation is conducted as a **code-inventory operational simulation**. The platform is evaluated by tracing every operational workflow through the actual API endpoints, services, database models, and UI pages. Each simulated action is mapped to a real code path to verify the platform can support the operation.

### Verification Approach
- **API tracing**: Every simulated action is mapped to a real API endpoint
- **Service verification**: Business logic is traced through actual service files
- **Permission checking**: Role-based access is verified against the permission matrix
- **Data model validation**: Database schema fields are checked for completeness
- **UI page verification**: Dashboard pages are confirmed to exist and handle the workflow
- **Error path analysis**: Failure scenarios are traced through actual error handling code

### Simulation Scope
- 7 consecutive operating days
- 6 staff roles actively using the system
- 40+ simulated customers across 7 days
- All payment methods (Cash, MTN MoMo, Airtel Money, Card)
- All order sources (QR Table, QR Branch, Waiter POS, WhatsApp)
- All kitchen status transitions
- All AI features exercised
- Operational stress tests on Day 5 and Day 7

### Out of Scope
- Actual database seeding (simulation is traced, not executed live)
- Real payment gateway calls (gateway behavior is simulated based on code analysis)
- Real Pusher events (event triggers are verified in code)
- Real OpenAI API calls (AI service code paths are traced)

---

## Platform Capability Map

### API Endpoints Available

| Category | Endpoints | Key Operations |
|----------|-----------|----------------|
| Orders | `/api/orders/unified`, `/api/orders/[id]` | List, detail, status filter |
| Sales | `/api/sales`, `/api/sales/[id]` | Create sale, list sales, get detail |
| Kitchen | `/api/kitchen/orders`, `/api/kitchen/update-status`, `/api/kitchen/messages` | KDS display, status transitions, kitchen-to-customer messages |
| Reservations | `/api/reservations`, `/api/reservations/[id]` | Create, list, update status, manage deposits |
| Payments | `/api/payments/intouch/initiate`, `/api/payments/intouch/status`, `/api/payments/irembo/*`, `/api/payments/refunds` | Initiate MoMo, check status, card payments, refunds |
| Inventory | `/api/inventory`, `/api/inventory/[id]`, `/api/inventory/alerts`, `/api/inventory/updates` | CRUD, alerts, stock updates |
| Menu | `/api/menu`, `/api/menu/[id]`, `/api/menu/recommendations`, `/api/menu/ask` | CRUD, AI recommendations, AI menu assistant |
| Tables | `/api/tables`, `/api/tables/[id]`, `/api/tables/lookup` | CRUD, QR lookup, seat management |
| Staff | `/api/staff`, `/api/staff/[id]`, `/api/staff/performance` | CRUD, performance metrics |
| Customers | `/api/customers/[id]/favorites`, `/api/customers/[id]/orders` | Customer favorites, order history |
| Guest | `/api/guest/recognize`, `/api/guest/staff-intelligence` | Guest recognition, staff intelligence |
| Loyalty | `/api/loyalty/balance`, `/api/loyalty/issue` | Balance check, points issuance |
| QR | `/api/qr/generate`, `/api/qr/designs`, `/api/qr/templates` | QR generation, design, templates |
| Split Payment | `/api/split-payment/[id]/progress` | Split bill tracking |
| Reports | `/api/reports/daily`, `/api/reports/weekly`, `/api/reports/monthly`, `/api/reports/export`, `/api/reports/close-day` | Reports, PDF export, Z-Report |
| Analytics | `/api/analytics/dashboard`, `/api/analytics/payments`, `/api/analytics/menu-performance`, `/api/analytics/peak-hours` | Dashboard, payment analytics, menu performance, peak hours |
| AI | `/api/ai/brand-assistant`, `/api/ai/cost-anomalies`, `/api/ai/reorder` | Brand assistant, cost anomaly detection, reorder recommendations |
| Insights | `/api/insights/generate`, `/api/insights/history` | AI insights generation, history |
| Optimization | `/api/optimization/recommendations`, `/api/optimization/metrics`, `/api/optimization/actions` | Recommendations, metrics, action tracking |
| Waiter | `/api/waiter/queue`, `/api/waiter/pickup-order`, `/api/waiter/deliver-order` | Waiter queue, pickup, delivery |
| Checkout | `/api/checkout/tap-and-leave` | Tap & Leave payment |
| Tips | `/api/tips` | Staff tip management |
| Waiter Calls | `/api/waiter-calls` | Customer-to-staff waiter calls |

### Role Permission Matrix

| Permission | Owner | Manager | Cashier | Waiter | Kitchen |
|-----------|-------|---------|---------|--------|---------|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.create | ✅ | ✅ | ❌ | ✅ | ❌ |
| orders.update | ✅ | ✅ | ❌ | ✅ | ✅ |
| orders.refund | ✅ | ❌ | ❌ | ❌ | ❌ |
| tables.read | ✅ | ✅ | ✅ | ✅ | ✅ |
| tables.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| tables.update | ✅ | ✅ | ❌ | ✅ | ❌ |
| tables.manageReservations | ✅ | ✅ | ❌ | ❌ | ❌ |
| payments.read | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.create | ✅ | ✅ | ✅ | ❌ | ❌ |
| payments.refund | ✅ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff.manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| inventory.read | ✅ | ✅ | ❌ | ❌ | ✅ |
| inventory.update | ✅ | ✅ | ❌ | ❌ | ✅ |
| inventory.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings.read | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ |

### Kitchen Status Flow
```
pending → accepted → preparing → almost_ready → ready → served
```
Each transition is enforced server-side via `allowedTransitions` in `/api/kitchen/update-status.ts`. Skipping steps is blocked.

### Order Sources
- `WAITER_POS` — Waiter enters order from dashboard
- `QR_IN_VENUE` — Customer scans QR code at table
- `QR_REMOTE` — Customer scans QR code remotely (pre-order)
- `WHATSAPP` — Order via WhatsApp

### Payment Methods
- `CASH` — Cash payment
- `MTN_MOBILE_MONEY` — MTN MoMo via InTouch
- `AIRTEL_MONEY` — Airtel Money via InTouch
- `CARD` — Card payment via IremboPay
- `BANK_TRANSFER` — Bank transfer
- `MOMO_PUSH` — Direct MTN MoMo push

---

## Simulation Artifacts Location

All IOS deliverable documents are stored in `/docs/ios/`:
- `SIMULATION_ENVIRONMENT.md` (this file)
- `RESTAURANT_PROFILE.md`
- `SEVEN_DAY_OPERATION_LOG.md`
- `DAILY_OPERATION_REPORT_DAY1.md` through `DAILY_OPERATION_REPORT_DAY7.md`
- `STAFF_ACTIVITY_REPORT.md`
- `CUSTOMER_JOURNEY_REPORT.md`
- `PAYMENT_OPERATION_REPORT.md`
- `KITCHEN_OPERATION_REPORT.md`
- `INVENTORY_OPERATION_REPORT.md`
- `AI_OPERATION_REPORT.md`
- `BUSINESS_INTELLIGENCE_REPORT.md`
- `INCIDENT_REPORT.md`
- `OPERATIONAL_METRICS_DASHBOARD.md`
- `FINAL_OPERATIONAL_READINESS_REPORT.md`
- `IOS_EXECUTIVE_SUMMARY.md`
