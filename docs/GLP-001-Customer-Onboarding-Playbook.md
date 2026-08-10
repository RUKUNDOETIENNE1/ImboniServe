# GLP-001 — Customer Onboarding Playbook

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This playbook documents the complete 13-step onboarding journey for Customer #1, from invitation to first executive review. Each step includes the user action, system response, guidance needed, and verification method.

---

## Step 1: Invitation

**User Action:** Customer #1 receives an invitation via WhatsApp, email, or direct link.
**System Response:** Invitation link directs to signup page with attribution tracking.
**Guidance Needed:** Founder personally invites Customer #1 and explains the value proposition.
**Verification:** Customer #1 visits the signup page.

**Founder Role:**
- Personally contact the business owner
- Explain: "ImboniServe helps you manage orders, payments, and business intelligence in one platform"
- Share the signup link
- Offer to walk through the first steps together

---

## Step 2: Registration

**User Action:** Customer #1 fills out the signup form with:
- Personal info: name, email, phone, password
- Business info: business name, city, business type (RESTAURANT), GPS coordinates
- Plan selection (default: STARTER)

**System Response:**
- Anti-fraud checks (device fingerprint, IP, captcha)
- Attribution resolution (referral/affiliate codes)
- Business creation with risk assessment
- Auto-approval for low-risk hospitality businesses
- Founding Hospitality Business Program (first 100 get lifetime 50% discount)
- Redirect to `/welcome` page

**Guidance Needed:** Ensure Customer #1 uses a valid phone number (Rwandan format: +250) and email. GPS coordinates are optional but recommended for discovery features.

**Verification:** Customer #1 reaches the `/welcome` page. Business is created with status ACTIVE (auto-approved).

**Source Files:** `src/pages/signup.tsx`, `src/pages/api/auth/signup.ts`, `src/pages/welcome.tsx`

---

## Step 3: MFA (Multi-Factor Authentication)

**User Action:** Customer #1 logs in for the first time.
**System Response:**
1. **Pre-login:** Validates email + password, sends 6-digit OTP via email or WhatsApp
2. **OTP Verification:** Customer enters OTP code
3. **Session Creation:** NextAuth creates 8-hour session with 1-hour refresh

**Guidance Needed:** Inform Customer #1 that a one-time code will be sent to their email or phone. If they don't receive it, check spam folder or request WhatsApp delivery.

**Verification:** Customer #1 successfully logs in and sees the dashboard.

**Source Files:** `src/pages/api/auth/pre-login.ts`, `src/pages/api/auth/verify-mfa-otp.ts`, `src/pages/api/auth/[...nextauth].ts`

---

## Step 4: Business Creation (Automatic)

**User Action:** None (happens during registration).
**System Response:** Business is created with:
- Type: RESTAURANT
- Currency: RWF
- Tax Mode: EXCLUSIVE (default)
- Tax Rate: 18.0% (Rwanda standard)
- Plan: STARTER
- Trial: Started (if auto-approved and hospitality type)

**Guidance Needed:** Explain to Customer #1 that their business is configured with Rwanda's standard 18% VAT. They can change this later in payment settings.

**Verification:** `/api/business/current` returns the business with correct settings.

---

## Step 5: Setup Wizard

**User Action:** Customer #1 sees the dashboard with a setup progress banner.
**System Response:** Setup progress banner shows 4 steps:
1. hasMenu (at least 1 MenuItem)
2. hasTables (at least 1 Table)
3. hasPaymentConfig (tax/currency settings — default 18% VAT is valid per CR-001A)
4. hasStaff (more than 1 User)

Progress: 0% → 25% → 50% → 75% → 100%

**Guidance Needed:** Walk Customer #1 through each step in order. The banner suggests the next action automatically.

**Verification:** `/api/business/setup-status` returns `percentComplete: 100` and `coreSetupComplete: true`.

**Source Files:** `src/pages/api/business/setup-status.ts`, `src/components/SetupProgressBanner.tsx`, `src/pages/dashboard/index.tsx`

---

## Step 6: Payment Configuration

**User Action:** Customer #1 visits `/dashboard/payment-settings`.
**System Response:** Payment settings page shows:
- Tax mode selection (INCLUSIVE vs EXCLUSIVE)
- Tax rate configuration (default 18% for Rwanda)
- Currency selection (RWF default)
- Split payment convenience fee configuration

**Guidance Needed:**
- Explain the difference between INCLUSIVE (VAT included in price) and EXCLUSIVE (VAT added at checkout)
- For most Rwandan restaurants: EXCLUSIVE with 18% is standard
- If they keep the default, setup is already complete (per CR-001A fix)
- If they change anything, save the settings

**Verification:** `hasPaymentConfig = true` in setup status. Settings saved to database.

**Source Files:** `src/pages/dashboard/payment-settings.tsx`, `src/pages/api/business/[businessId]/settings`

---

## Step 7: Staff Invitation

**User Action:** Customer #1 visits `/dashboard/staff` and creates staff accounts.
**System Response:** Staff creation form requires:
- Name, email, phone, password
- Role assignment (MANAGER, CASHIER, WAITER, KITCHEN_MANAGER, etc.)
- Branch assignment (if multi-branch)

**Guidance Needed:**
- Recommend creating at least 1 staff member (required for setup completion)
- Suggest roles: MANAGER for the owner's right-hand, WAITER for front-of-house, KITCHEN_MANAGER for kitchen
- Each staff member will need to log in with MFA

**Verification:** `hasStaff = true` in setup status (userCount > 1).

**Source Files:** `src/pages/api/staff/index.ts`, `src/pages/dashboard/staff.tsx`

---

## Step 8: Menu Creation

**User Action:** Customer #1 visits `/dashboard/menu-builder` or `/dashboard/menu`.
**System Response:**
- Menu Builder: AI-powered extraction from menu photos/PDFs
- Manual Menu: Create items with name, description, price, cost, category

**Guidance Needed:**
- Recommend the AI Menu Builder: take a photo of their physical menu, upload it
- AI will extract items with confidence scores (green ≥80%, amber ≥60%, red <60%)
- Review candidates and publish
- Alternatively, manually add items one by one
- Set prices in RWF

**Verification:** `hasMenu = true` in setup status (menuItemCount > 0).

**Source Files:** `src/pages/dashboard/menu-builder.tsx`, `src/pages/api/menu/index.ts`

---

## Step 9: QR Code Generation

**User Action:** Customer #1 visits `/dashboard/qr-builder`.
**System Response:** QR Builder allows:
- Table QR (for specific tables)
- Branch QR (for entire venue)
- Pre-order QR
- Pickup QR
- Template selection with customization (logo, colors, message)
- Download as PNG

**Guidance Needed:**
- Generate Table QR codes for each table
- Print and place on tables
- Customers scan to view menu and place orders
- Explain: "When a customer scans the QR, they see your menu and can order directly. The order goes straight to your kitchen display."

**Verification:** QR codes generated and downloaded. `qrCodesCount` incremented on business.

**Source Files:** `src/pages/dashboard/qr-builder.tsx`, `src/pages/api/qr/generate.ts`

---

## Step 10: First Order

**User Action:** A customer scans the QR code and places an order, OR staff creates an order via `/dashboard/sales/new`.
**System Response:**
- QR ordering: Customer views menu, adds items, submits order
- Order creates a Sale with paymentStatus PENDING
- Kitchen dispatch triggered (KitchenDisplayService)
- Business notified via WhatsApp (NotificationService)
- Real-time update broadcast (Pusher)

**Guidance Needed:**
- For the first order, recommend the founder be present
- Walk through: customer scans QR → selects items → places order → kitchen receives → prepare → serve
- Alternatively, staff can create a test order via the POS

**Verification:** Sale created with status CONFIRMED. Kitchen display shows the order. WhatsApp notification sent.

**Source Files:** `src/pages/api/public/order/draft.ts`, `src/pages/api/public/order/confirm.ts`, `src/pages/dashboard/sales/new.tsx`

---

## Step 11: First Payment

**User Action:** Customer pays for the order via Mobile Money, Card, or Cash.
**System Response:**
- Mobile Money: InTouch processes payment → webhook callback → PaymentCompletionService
- Card: IremboPay processes payment → webhook callback → PaymentCompletionService
- Cash: Staff marks as paid → PaymentCompletionService

PaymentCompletionService (per CR-001A):
- Atomic transaction: Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry → CREATED
- Smart Dining Slip generated
- Guest recognition updated
- Kitchen dispatch confirmed
- Real-time broadcast
- Audit log created

**Guidance Needed:**
- For first payment, recommend a cash transaction (simplest)
- Then test Mobile Money with a small amount
- Verify the Smart Dining Slip is sent (if WhatsApp enabled)
- Check that the sale appears in the sales dashboard

**Verification:** Sale paymentStatus = COMPLETED. FinancialLedgerEntry exists. Smart Dining Slip sent (if applicable).

**Source Files:** `src/lib/services/payment-completion.service.ts`, `src/pages/api/webhooks/intouch.ts`

---

## Step 12: First Closing Day

**User Action:** Customer #1 visits `/dashboard/close-day` at end of business day.
**System Response:**
- Z-Report shows: total revenue, total orders, avg order value, VAT collected
- Payment method breakdown
- Order source breakdown
- Pending orders warning (if any pending — per CR-001A)
- Outstanding liabilities (commissions, payouts, refunds — per CR-001A)
- Ledger cross-check (Sale total vs FinancialLedgerEntry total)
- Customer clicks "Close Day"
- If pending orders > 0: warning dialog with "Go Back & Review" or "Close Day Anyway"
- Atomic close: audit log created within transaction (per CR-001A)

**Guidance Needed:**
- Walk Customer #1 through the Z-Report at end of their first day
- Explain each section: revenue, payment breakdown, VAT, reconciliation
- Show the ledger cross-check (green = matched)
- If there are pending orders, explain the warning
- Click "Close Day" to finalize

**Verification:** Audit log entry created with action CLOSE_DAY. Z-Report shows isClosed = true.

**Source Files:** `src/pages/api/reports/close-day.ts`, `src/pages/dashboard/close-day.tsx`

---

## Step 13: First Executive Review

**User Action:** Customer #1 (or founder on their behalf) visits the CEO dashboard.
**System Response:** CEO Dashboard shows:
- Business Health Score (0-100, with EXCELLENT/HEALTHY/AT_RISK/CRITICAL status)
- Revenue metrics (MRR, ARR, GMV)
- Customer health and retention
- Operations health (payment health, queue health)
- Hospitality performance by branch
- Executive AI insights (auto-generated summaries)
- Auto-refresh every 5 minutes

**Guidance Needed:**
- Schedule a review session with Customer #1 on Day 2 or Day 3
- Walk through the CEO dashboard together
- Explain the Business Health Score and what it means
- Show the executive insights and how to act on them
- Set a cadence: daily review for first week, then weekly

**Verification:** CEO dashboard loads with data. Business Health Score is calculated. Executive insights are generated.

**Source Files:** `src/pages/dashboard/ceo.tsx`, `src/pages/api/dashboard/ceo.ts`

---

## Onboarding Timeline

| Day | Activity | Founder Presence |
|-----|----------|-----------------|
| Day 0 | Invitation + Registration | In person or WhatsApp |
| Day 0 | MFA setup + first login | Remote support |
| Day 1 | Setup wizard: menu, tables, payment config, staff | On-site or remote |
| Day 1 | QR code generation + printing | On-site |
| Day 1 | First test order + payment | On-site |
| Day 1 | First closing day (Z-Report) | On-site or remote |
| Day 2 | First executive review (CEO dashboard) | Remote (scheduled call) |
| Day 3 | Follow-up call: any issues? | Remote |
| Day 7 | First week review | Remote (scheduled call) |
| Day 14 | Two-week check-in | Remote |
| Day 30 | First month review | Remote (scheduled call) |

---

## Onboarding Success Criteria

Customer #1 onboarding is complete when:
- [ ] Registration complete (business created, auto-approved)
- [ ] MFA working (can log in with OTP)
- [ ] Setup wizard at 100% (menu, tables, payment config, staff)
- [ ] QR codes generated and placed on tables
- [ ] First real order processed (not a test)
- [ ] First real payment completed (cash or mobile money)
- [ ] First closing day completed (Z-Report finalized)
- [ ] First executive review conducted (CEO dashboard reviewed with founder)
- [ ] Customer #1 can independently perform all daily operations
