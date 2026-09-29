# FOUNDER-GPV-001 — Owner Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-OWNER-JOURNEY |
| Date | 2026-08-14 |
| Role | Business Owner |
| Source | Actual repository inspection |

## Overview

The Owner is the primary actor in the founder-led verification. The Owner creates the business, configures it, builds the team, sets up the menu and tables, generates QR codes, and ultimately verifies the financial truth of the entire operation.

## Owner Journey Phases

### Phase 1: Account Creation

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-01 | Navigate to signup | `/signup` | Signup form displayed with fields: name, email, password, phone, business name, city, country, plan, business type |
| O-02 | Fill signup form | — | All required fields completed |
| O-03 | Submit signup | POST `/api/auth/signup` | Business created, user created with OWNER role, trial started |
| O-04 | Redirect to welcome | `/welcome` | Welcome page displayed |

### Phase 2: First Login (MFA)

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-05 | Navigate to login | `/login` | Login form displayed (email + password) |
| O-06 | Enter credentials | POST `/api/auth/pre-login` | OTP sent to email/WhatsApp, step changes to OTP entry |
| O-07 | Enter OTP code | POST `/api/auth/verify-mfa-otp` | confirmToken returned |
| O-08 | Complete login | signIn('mfa-confirm') | Session created, redirected based on setup status |
| O-09 | Setup incomplete → redirect | `/setup` | Setup wizard displayed |

### Phase 3: Business Configuration

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-10 | View setup wizard | `/setup` | Progress: hasMenu? hasTables? hasPaymentConfig? hasStaff? |
| O-11 | Configure payment settings | `/dashboard/payment-settings` | Tax mode (INCLUSIVE/EXCLUSIVE), tax rate, currency set |
| O-12 | Configure business profile | `/dashboard/profile` | Business name, address, phone, WhatsApp number set |
| O-13 | Configure business settings | `/dashboard/settings` | QR modes enabled (enableQRInVenue, enableQRRemote) |
| O-14 | Verify country/currency/timezone | Settings pages | EGR-016: Geography is configuration — not hardcoded |

### Phase 4: Team Building

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-15 | Navigate to staff | `/dashboard/staff` | Staff list displayed (empty initially) |
| O-16 | Create manager | POST `/api/staff` | Manager invited with 'manager' role |
| O-17 | Create waiter | POST `/api/staff` | Waiter invited with 'waiter_staff' role |
| O-18 | Create kitchen staff | POST `/api/staff` | Kitchen staff invited with 'kitchen_operations' role |
| O-19 | Verify staff list | `/dashboard/staff` | All staff members visible with correct roles |

### Phase 5: Menu Creation

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-20 | Navigate to menu | `/dashboard/menu/dynamic-edit` | Menu editor displayed |
| O-21 | Create category | POST `/api/menu` | Category created |
| O-22 | Create menu items | POST `/api/menu` | Items created with name, price, cost, category, availability |
| O-23 | Add translations (optional) | Menu editor | Translations added for en/rw/fr |
| O-24 | Verify public menu | GET `/api/public/menu?branchId=...` | Menu items visible publicly |

### Phase 6: Table & QR Setup

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-25 | Navigate to tables | `/dashboard/tables` | Table list displayed (empty initially) |
| O-26 | Create tables | POST `/api/tables` | Tables created with number, capacity, status |
| O-27 | Navigate to QR builder | `/dashboard/qr-builder` | QR builder displayed |
| O-28 | Generate QR codes | QR builder | HMAC-signed QR codes generated for each table |
| O-29 | Test QR scan | Phone camera → `/order?branchId=...&tableId=...&signature=...` | Guest order page loads with menu |

### Phase 7: Operational Verification

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-30 | Monitor kitchen | `/dashboard/kitchen` | Orders appear in kitchen display |
| O-31 | Check service risks | `/dashboard/operations/service-risks` | Promise Engine risks visible (WARNING/CRITICAL) |
| O-32 | Review service replay | `/dashboard/operations/service-replay` | Timeline of service events visible |
| O-33 | Check dashboard revenue | `/dashboard` | Revenue matches completed sales |

### Phase 8: Financial Verification

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-34 | View transactions | `/dashboard/transactions` | Payment transactions listed |
| O-35 | Run close-day | `/dashboard/close-day` | Z-Report displayed with sales, tax, ledger cross-check |
| O-36 | Verify ledger variance | Z-Report | ledgerVarianceCents = 0 |
| O-37 | Close the day | POST `/api/reports/close-day` | Audit log created, day closed |

### Phase 9: Executive Review

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| O-38 | CEO dashboard | `/dashboard/ceo` | Business health, revenue, customer metrics |
| O-39 | CFO dashboard | `/dashboard/cfo` | Financial metrics, reconciliation status |
| O-40 | Reports | `/dashboard/reports` | Operational and financial reports |
| O-41 | Analytics | `/dashboard/analytics` | Menu performance, peak hours, payment analytics |

## Owner's Unique Capabilities

The Owner is the ONLY role that can:
- Process refunds (`orders.refund`, `payments.refund`)
- Manage business settings (`settings.manage`)
- Manage inventory configuration (`inventory.manage`)
- Configure payment settings (tax mode, currency)
- Invite and manage all staff types
- Access executive dashboards with full financial detail
- Close the day and generate Z-Reports
- Generate QR codes

## Owner's Verification Responsibilities

The Owner must ultimately verify:
1. **Financial truth**: Sale = PaymentTransaction = FinancialLedgerEntry = Dashboard = Z-Report = CEO (variance = 0)
2. **Business isolation**: No cross-business data leakage
3. **Role boundaries**: Each role sees only what they should
4. **Operational completeness**: The full cycle from order to payment to close-day works
5. **Customer experience**: Guest can scan QR, order, pay, and receive confirmation
