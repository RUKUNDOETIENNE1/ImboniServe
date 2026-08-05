# PP-003A — Partnership Experience Design & Product Specification

**Date:** 2026-07-31  
**Phase:** PP-003A — Experience Design & Product Specification  
**Predecessor:** PP-002A — Operational Simulation (Passed)  
**Certification:** PP-003A — Experience Design Approved

---

## 1. Executive Summary

This specification defines the complete user experience for the ImboniServe Partnership Platform across four products: Internal Operations, Founder Partner Portal, Restaurant Experience, and Executive Intelligence. It covers every screen, workflow, dashboard, notification, permission, and component needed for a frontend team to implement without rediscovering business requirements.

The platform's backend — 9 services, 15+ Prisma models, 40+ event types, 111 passing tests — is operationally certified. This spec designs experiences on top of that foundation. No backend changes are required for any screen defined here.

---

## 2. Product Vision

**Vision:** Make ImboniServe the easiest partnership platform to operate in emerging markets. Every screen should make someone's work easier. Every workflow should reduce friction. Every dashboard should help someone make a better decision.

**Design philosophy:** Decision-first design. Every page answers three questions: What happened? What requires attention? What should I do next?

---

## 3. User Personas

### Internal Users

| Persona | Role | Primary Need |
|---|---|---|
| **Partnership Manager** | Manages partner relationships end-to-end | Review applications, onboard partners, monitor health |
| **Sales Team Member** | Recruits new partners | Track pipeline, manage prospects |
| **Marketing Team Member** | Launches and measures campaigns | Campaign performance, code management |
| **Customer Success Manager** | Proactive partner health monitoring | Health scores, risk flags, engagement metrics |
| **Finance Officer** | Commission and payout management | Month-end close, ledger review, payout approval |
| **Support Agent** | Investigates partner and restaurant issues | Code lookup, attribution tracing, timeline review |
| **Legal Officer** | Contractual compliance | Agreement history, audit trail, status changes |
| **System Administrator** | Platform configuration | User management, feature flags, permissions |
| **CEO / Executive** | Strategic decisions | Performance overview, LTV, CAC, liability, forecasts |

### External Users

| Persona | Role | Primary Need |
|---|---|---|
| **Founder Partner** | Media company, YouTuber, influencer | Track referrals, campaigns, commissions, payouts |
| **Restaurant Owner** | Joins via founder code | Signup, trial, subscription, referral visibility |

---

## 4. Product Breakdown

### Product 1 — Internal Operations Portal

**Location:** `/admin/partnerships/*`  
**Layout:** Existing `AdminLayout` with sidebar navigation  
**Users:** All internal roles

### Product 2 — Founder Partner Portal

**Location:** `/portal/*`  
**Layout:** New `PartnerPortalLayout` (simplified sidebar, partner-brandable)  
**Users:** Founder Partners only

### Product 3 — Restaurant Experience

**Location:** Existing restaurant dashboard `/dashboard/*`  
**Modifications:** Add referral visibility section to existing dashboard  
**Users:** Restaurant owners who joined via partnership codes

### Product 4 — Executive Intelligence

**Location:** `/admin/executive/*`  
**Layout:** Existing `AdminLayout`, dedicated section  
**Users:** CEO, management, investors

---

## 5. Information Architecture

### 5.1 Internal Operations Navigation

```
Partnerships (section)
  ├── Overview          /admin/partnerships
  ├── Applications      /admin/partnerships/applications
  ├── Partners          /admin/partnerships/partners
  ├── Agreements        /admin/partnerships/agreements
  ├── Campaigns         /admin/partnerships/campaigns
  ├── Codes             /admin/partnerships/codes
  ├── Commissions       /admin/partnerships/commissions
  ├── Payouts           /admin/partnerships/payouts
  ├── Health & Risk     /admin/partnerships/health
  ├── Audit Trail       /admin/partnerships/audit
  └── Settings          /admin/partnerships/settings
```

### 5.2 Founder Partner Portal Navigation

```
Partner Portal
  ├── Dashboard         /portal
  ├── Campaigns         /portal/campaigns
  ├── Codes             /portal/codes
  ├── Commissions       /portal/commissions
  ├── Payouts           /portal/payouts
  ├── Agreement         /portal/agreement
  ├── Performance       /portal/performance
  ├── Timeline          /portal/timeline
  └── Settings          /portal/settings
```

### 5.3 Executive Intelligence Navigation

```
Executive (section)
  ├── Overview          /admin/executive
  ├── Partners          /admin/executive/partners
  ├── Campaigns         /admin/executive/campaigns
  ├── Financial         /admin/executive/financial
  ├── Regional          /admin/executive/regional
  └── Forecasting       /admin/executive/forecasting
```

### 5.4 Restaurant Experience Additions

```
Dashboard → Growth (section)
  ├── Referral Source   /dashboard/referral
  └── Trial Status      /dashboard/trial
```

---

## 6. Screen Inventory

### 6.1 Internal Operations Screens (28 screens)

| # | Screen | Route | Purpose |
|---|---|---|---|
| 1 | Partnerships Overview | `/admin/partnerships` | Platform-wide KPIs, attention items |
| 2 | Applications Queue | `/admin/partnerships/applications` | Review submitted applications |
| 3 | Application Detail | `/admin/partnerships/applications/[id]` | Review, approve, reject, withdraw |
| 4 | Partners List | `/admin/partnerships/partners` | Search, filter, manage all partners |
| 5 | Partner Detail | `/admin/partnerships/partners/[id]` | Full partner profile with tabs |
| 6 | Partner Timeline | `/admin/partnerships/partners/[id]/timeline` | Chronological activity + events |
| 7 | Partner Commissions | `/admin/partnerships/partners/[id]/commissions` | Commission ledger for partner |
| 8 | Partner Payouts | `/admin/partnerships/partners/[id]/payouts` | Payout history for partner |
| 9 | Partner Codes | `/admin/partnerships/partners/[id]/codes` | Code management for partner |
| 10 | Partner Campaigns | `/admin/partnerships/partners/[id]/campaigns` | Campaign list for partner |
| 11 | Partner Agreements | `/admin/partnerships/partners/[id]/agreements` | Agreement chain for partner |
| 12 | Partner Audit | `/admin/partnerships/partners/[id]/audit` | Audit trail for partner |
| 13 | Partner Health | `/admin/partnerships/partners/[id]/health` | Health score + risk profile |
| 14 | Agreements List | `/admin/partnerships/agreements` | All agreements across partners |
| 15 | Agreement Detail | `/admin/partnerships/agreements/[id]` | Agreement terms, status, history |
| 16 | Campaigns List | `/admin/partnerships/campaigns` | All campaigns with performance |
| 17 | Campaign Detail | `/admin/partnerships/campaigns/[id]` | Campaign analytics, codes, metrics |
| 18 | Codes List | `/admin/partnerships/codes` | All codes with status, redemptions |
| 19 | Code Detail | `/admin/partnerships/codes/[id]` | Code info, redemption history |
| 20 | Commissions Ledger | `/admin/partnerships/commissions` | Full commission ledger with filters |
| 21 | Commission Detail | `/admin/partnerships/commissions/[id]` | Commission lifecycle, events, payout |
| 22 | Payouts Queue | `/admin/partnerships/payouts` | Pending payouts for approval |
| 23 | Payout Detail | `/admin/partnerships/payouts/[id]` | Payout lifecycle, commissions, events |
| 24 | Health & Risk Overview | `/admin/partnerships/health` | All partners' health and risk |
| 25 | Audit Trail | `/admin/partnerships/audit` | Cross-partner audit records |
| 26 | Support Lookup | `/admin/partnerships/support` | Code/business lookup tool |
| 27 | Partnership Settings | `/admin/partnerships/settings` | Commission rates, trial defaults |
| 28 | New Partner Wizard | `/admin/partnerships/new` | Guided partner creation flow |

### 6.2 Founder Partner Portal Screens (14 screens)

| # | Screen | Route | Purpose |
|---|---|---|---|
| 1 | Partner Dashboard | `/portal` | Performance overview, quick actions |
| 2 | Campaigns List | `/portal/campaigns` | View and track campaigns |
| 3 | Campaign Detail | `/portal/campaigns/[id]` | Campaign performance, codes |
| 4 | Codes List | `/portal/codes` | Manage referral codes |
| 5 | Code Detail | `/portal/codes/[id]` | Code performance, redemptions |
| 6 | Commissions | `/portal/commissions` | Commission history and status |
| 7 | Payouts | `/portal/payouts` | Payout history and status |
| 8 | Agreement | `/portal/agreement` | View and sign agreement |
| 9 | Performance | `/portal/performance` | Analytics: signups, conversions, revenue |
| 10 | Timeline | `/portal/timeline` | Activity feed |
| 11 | Settings | `/portal/settings` | Profile, notification preferences |
| 12 | Onboarding Wizard | `/portal/onboarding` | First-time setup flow |
| 13 | Apply Page | `/portal/apply` | Public application form |
| 14 | Marketing Kit | `/portal/marketing-kit` | Downloadable assets, guidelines |

### 6.3 Restaurant Experience Screens (2 additions)

| # | Screen | Route | Purpose |
|---|---|---|---|
| 1 | Referral Source | `/dashboard/referral` | Show who referred them, code used |
| 2 | Trial Status | `/dashboard/trial` | Trial days remaining, conversion prompt |

### 6.4 Executive Intelligence Screens (6 screens)

| # | Screen | Route | Purpose |
|---|---|---|---|
| 1 | Executive Overview | `/admin/executive` | CEO dashboard with all KPIs |
| 2 | Partner Performance | `/admin/executive/partners` | Top/bottom partners, LTV by type |
| 3 | Campaign Analytics | `/admin/executive/campaigns` | Conversion rates, ROI |
| 4 | Financial Overview | `/admin/executive/financial` | Liability, payouts, CAC, revenue |
| 5 | Regional Performance | `/admin/executive/regional` | Geographic breakdown |
| 6 | Forecasting | `/admin/executive/forecasting` | Renewal pipeline, projections |

**Total: 50 screens**

---

## 7. Workflow Specifications

### 7.1 Founder Partner Onboarding

```
[Public] Apply Page (/portal/apply)
  → Fill application form (name, email, phone, organization, motivation, experience, network size)
  → Submit → PartnershipApplicationService.submit()
  → Confirmation screen with application ID
  → Email: "Application Received"

[Internal] Applications Queue (/admin/partnerships/applications)
  → Application appears in queue (status: SUBMITTED)
  → Partnership Manager clicks "Review"
  → Application Detail → status: UNDER_REVIEW
  → Review notes added
  → Schedule meeting (activity log: MEETING_SCHEDULED)
  → Negotiation (activity log: NEGOTIATION_STARTED)

[Internal] Application Detail → Approve
  → FounderPartnerApplicationService.approve()
  → FounderPartnerOnboardingService.onboard()
    → Partnership: APPLIED → ONBOARDED
    → FounderPartner profile created
    → Default agreement created (DRAFT)
    → HealthScore initialized (score=50, grade=C)
    → RiskProfile initialized (LOW, score=20)
  → Email to partner: "Application Approved"

[Internal] Agreement Management
  → PartnershipAgreementService.sendForSignature() → SENT
  → Email to partner: "Agreement Ready for Signature"

[Partner] Agreement Page (/portal/agreement)
  → View agreement terms
  → Click "Sign Agreement"
  → PartnershipAgreementService.sign() → SIGNED
  → Email: "Agreement Signed"

[Internal] Partner Activation
  → PartnershipService.activate() → ACTIVE
  → Email to partner: "Welcome to ImboniServe Partners"

[Internal] Campaign Creation
  → PartnershipCampaignService.create() → DRAFT
  → PartnershipCampaignService.launch() → ACTIVE

[Internal] Code Generation
  → PartnershipCodeService.create() → ACTIVE
  → Partner can now share codes

[Internal] Marketing Kit Assignment
  → Activity log: MARKETING_KIT_ASSIGNED
  → Partner sees marketing kit in portal

[Partner] Onboarding Wizard (/portal/onboarding)
  → First login: guided tour
  → Step 1: Profile verification
  → Step 2: Agreement review & signature
  → Step 3: Campaign overview
  → Step 4: Code generation
  → Step 5: Marketing kit download
  → Step 6: Dashboard tour
```

### 7.2 Campaign Launch

```
[Internal or Partner] Campaign Creation
  → Create campaign (name, channel, targets, dates, UTM)
  → Status: DRAFT
  → Launch campaign → ACTIVE
  → Event: CAMPAIGN_LAUNCHED

[Partner] Share Code
  → Partner shares code (e.g., ISIMBI30) in video/content
  → Code appears on YouTube/video/description

[Restaurant] Signup with Code
  → Restaurant visits signup page
  → Enters code ISIMBI30
  → AttributionResolverService.resolve() validates code
  → TrialPolicyService.getTrialDays() → 30 days
  → PartnershipCodeService.redeem() records redemption
  → Business created with 30-day trial
  → Event: CODE_REDEEMED, TRIAL_ACTIVATED

[Partner] Dashboard Updates
  → totalSignups incremented
  → Campaign actualSignups incremented
  → Notification: "New referral from ISIMBI30!"

[Internal] Dashboard Updates
  → Partnership metrics refreshed
  → Campaign metrics refreshed
```

### 7.3 Subscription Conversion

```
[Restaurant] Trial → Subscription
  → Trial expires or restaurant subscribes early
  → Payment processed
  → FinancialLedgerEntry created

[Internal] Commission Accrual
  → PartnershipCommissionService.accrueRecurring()
  → Status: PENDING
  → Event: COMMISSION_ACCRUED
  → Partner notification: "Commission earned!"

[Finance] Commission Review
  → Commissions Ledger → filter PENDING
  → Validate → VALIDATED
  → Approve → APPROVED
  → Event: COMMISSION_APPROVED

[Finance] Payout Processing
  → Payouts Queue → Create payout
  → Approve → Process → Mark Paid
  → Commissions linked: APPROVED → PAID
  → Event: COMMISSION_PAID, PAYOUT_PAID
  → Partner notification: "Payout sent!"

[Partner] Payout Visibility
  → Portal → Payouts → status: PAID
  → Commission status: PAID
  → Timeline updated
```

### 7.4 Operational Issues

```
Restaurant Cancels:
  → Subscription cancelled
  → Commission (if PENDING): void()
  → Commission (if PAID): clawback() with reason "Subscription cancelled"
  → Event: COMMISSION_VOIDED or COMMISSION_CLAWED_BACK
  → Partner notification: "Commission adjusted"

Restaurant Upgrades:
  → New subscription amount
  → New commission accrued at higher amount
  → No change to existing commissions

Restaurant Downgrades:
  → Lower subscription amount
  → Future commissions accrued at lower amount
  → No change to existing commissions

Refund / Chargeback:
  → Commission clawback: clawback(reason="Chargeback")
  → Status: PAID → CLAWED_BACK
  → Audit record created
  → Partner notification: "Commission clawed back"

Expired Agreement:
  → PartnershipAgreementService.expire() → EXPIRED
  → Internal notification: "Agreement expired"
  → Partner notification: "Agreement expired — contact your manager"

Expired Campaign:
  → PartnershipCampaignService.complete() → COMPLETED
  → Option to renew with new dates

Paused Code:
  → PartnershipCodeService.pause() → PAUSED
  → Redemptions blocked
  → Partner notification: "Code paused"

Revoked Code:
  → PartnershipCodeService.revoke() → REVOKED
  → Permanently blocked
  → Partner notification: "Code revoked"

Suspended Partner:
  → PartnershipService.suspend() → SUSPENDED
  → All active codes auto-paused
  → Partner notification: "Account suspended"
  → Partner portal shows suspended state

Reactivated Partner:
  → PartnershipService.reactivate() → ACTIVE
  → Paused codes auto-resumed
  → Partner notification: "Account reactivated"

Partner Type Change:
  → PartnershipService.changePartnerType()
  → Event: PARTNER_TYPE_CHANGED
  → Audit record: oldType → newType

Agreement Amendment:
  → PartnershipAgreementService.amend()
  → Old agreement: AMENDED
  → New agreement: ACTIVE (new version)
  → Partner notification: "Agreement amended"

Campaign Renewal:
  → PartnershipCampaignService.renew() with new dates
  → Status: COMPLETED → ACTIVE
  → Partner notification: "Campaign renewed"
```

### 7.5 Customer Support Investigation

```
[Support] Code Lookup
  → Support Lookup page → enter code "ISIMBI30"
  → lookupCode() returns: status, partnership, campaign, redemptions, trial days
  → Support can answer: "Yes, ISIMBI30 is active, grants 30 days, owned by Isimbi TV"

[Support] Business Attribution Lookup
  → Enter business ID
  → lookupBusinessAttribution() returns: all touches, canonical attribution
  → Support can answer: "You were referred by Isimbi TV via code ISIMBI30"

[Support] Trial Verification
  → lookupCode() → trialDays field
  → lookupBusinessAttribution() → trialDaysOverride
  → Cross-reference: "Your code grants 30 days, your attribution shows 30-day override"

[Support] Referral Not Recognized
  → lookupBusinessAttribution() shows all touches
  → If no PARTNERSHIP_CODE touch: code was not entered or was invalid
  → If touch exists but not canonical: another source took precedence
  → Support can explain and, if needed, manually record attribution
```

### 7.6 Finance Month-End Close

```
[Finance] Review Pending Commissions
  → Commissions Ledger → filter status: PENDING, VALIDATED
  → Review each: validate → approve
  → getCommissionSummary() for totals

[Finance] Create Payouts
  → Payouts Queue → "Create Payout" for each partner
  → Enter amount, method (MTN/Airtel/Bank), recipient details
  → Status: PENDING

[Finance] Approve Payouts
  → Review payout details
  → Approve → APPROVED
  → Process → PROCESSING
  → Mark Paid (after bank confirmation) → PAID
  → Commissions auto-linked

[Finance] Reconciliation
  → getMonthEndSummary() → totals by status
  → getCommissionLedger() with date range → export
  → Compare with FinancialLedgerEntry totals
  → Audit trail review: getAuditTrail() per partner

[Finance] Export
  → Commission ledger → CSV/Excel export
  → Payout records → CSV/Excel export
  → Audit records → CSV/Excel export
```

---

## 8. Dashboard Specifications

### 8.1 Partnerships Overview (Internal)

**User:** Partnership Manager  
**Answers:** What's happening across all partnerships? What needs attention?

**Sections:**
- **KPI Cards:** Active partners, pending applications, total signups, total conversions, total commission liability
- **Attention Required Panel:** Suspended partners, low health (D/F), high risk, expiring agreements (30 days)
- **Recent Applications:** Last 5 submitted applications with quick-review action
- **Top Performing Partners:** Top 5 by signups this month
- **Recent Activity:** Last 10 platform-wide events

**Primary KPIs:** Active partner count, conversion rate, commission liability  
**Actions:** Review application, view partner, create partner  
**Data sources:** `getPartnersRequiringAttention()`, `getTopPartners()`, `PartnershipEvent.findMany()`

### 8.2 Partner Dashboard (Founder Portal)

**User:** Founder Partner  
**Answers:** How am I performing? What should I do next?

**Sections:**
- **Performance KPIs:** Total signups, conversions, conversion rate, total commission earned, pending commission, last payout
- **Active Campaigns:** Cards with progress bars (actual vs target signups/conversions)
- **Active Codes:** Status badges, redemption counts, quick-pause action
- **Recent Referrals:** Last 5 code redemptions with business name and trial days
- **Commission Summary:** Pending, approved, paid, clawed back totals
- **Quick Actions:** Create campaign, generate code, view agreement, request payout

**Primary KPIs:** Signups, conversion rate, pending commission  
**Actions:** Create campaign, generate code, pause code, view agreement  
**Data sources:** `PartnershipService.getById()`, `PartnershipCampaignService.listForPartnership()`, `PartnershipCodeService.listForPartnership()`, `PartnershipCommissionService.getPendingTotal()`

### 8.3 Finance Dashboard

**User:** Finance Officer  
**Answers:** What's our commission liability? What payouts need processing?

**Sections:**
- **Liability Summary:** Total pending/validated/approved commission amounts
- **Payout Queue:** Pending and approved payouts with approve/process actions
- **Monthly Totals:** Paid this month, failed, rejected, outstanding
- **Commission Status Breakdown:** Pie chart: PENDING, VALIDATED, APPROVED, PAID, VOID, CLAWED_BACK
- **Recent Payouts:** Last 10 payouts with status and amount

**Primary KPIs:** Outstanding liability, pending payout count, monthly paid total  
**Actions:** Approve payout, process payout, mark paid, reject payout, view ledger  
**Data sources:** `getCommissionSummary()`, `getPendingPayouts()`, `getMonthEndSummary()`

### 8.4 Support Dashboard

**User:** Support Agent  
**Answers:** What issues need investigation?

**Sections:**
- **Quick Lookup:** Search bar for code or business ID
- **Recent Support Events:** Recent CODE_REDEEMED, COMMISSION_CLAWED_BACK events
- **Suspended Partners:** List with suspend reason and date
- **Failed Payouts:** List with failure reason

**Primary KPIs:** Open issues, failed payouts, suspended partners  
**Actions:** Lookup code, lookup business, view partner timeline  
**Data sources:** `lookupCode()`, `lookupBusinessAttribution()`, `PartnershipPayoutService.listForPartnership()`

### 8.5 CEO Dashboard (Executive Overview)

**User:** CEO / Executive  
**Answers:** How is the partnership program performing strategically?

**Sections:**
- **Strategic KPIs:** Total active partners, total revenue from partnerships, total commission liability, average CAC, average LTV
- **Top Partners:** Top 5 by revenue with partner type and region
- **Campaign Performance:** Top 5 campaigns by conversion rate
- **Regional Performance:** Map/table: signups, conversions, revenue by region
- **LTV by Partner Type:** Bar chart: revenue, commission, payouts per type
- **Expiring Agreements:** Next 30 days with partner name and date
- **Attention Required:** Partners needing intervention
- **Commission Liability:** Total + top 5 partners by liability

**Primary KPIs:** Revenue from partnerships, CAC, LTV, conversion rate  
**Actions:** Drill into partner, drill into campaign, export report  
**Data sources:** `getTopPartners()`, `getCampaignPerformance()`, `getPartnershipTypeLTV()`, `getRegionalPerformance()`, `getExpiringAgreements()`, `getTotalCommissionLiability()`, `getCACByPartnerType()`

### 8.6 Marketing Dashboard

**User:** Marketing Team Member  
**Answers:** Which campaigns are performing? Which channels work?

**Sections:**
- **Campaign Performance Table:** All active campaigns with signups, conversions, rate, revenue
- **Channel Breakdown:** Performance grouped by channel (YOUTUBE, INSTAGRAM, etc.)
- **Code Performance:** Top codes by redemption count
- **Campaign Calendar:** Visual timeline of campaign start/end dates

**Primary KPIs:** Campaign conversion rate, channel ROI, code utilization  
**Actions:** Launch campaign, pause campaign, create code, view campaign detail  
**Data sources:** `getCampaignPerformance()`, `PartnershipCodeService.listForPartnership()`

### 8.7 Customer Success Dashboard

**User:** Customer Success Manager  
**Answers:** Which partners are healthy? Which need intervention?

**Sections:**
- **Health Distribution:** A/B/C/D/F grade distribution chart
- **At-Risk Partners:** High risk profiles with flags
- **Low Health Partners:** D/F grades with component scores
- **Engagement Trends:** Partners with declining health scores
- **Upcoming Renewals:** Agreements expiring in 60 days

**Primary KPIs:** Average health score, at-risk count, renewal pipeline  
**Actions:** View partner, contact partner, schedule QBR  
**Data sources:** `getPartnersRequiringAttention()`, `PartnershipHealthScore` queries

---

## 9. Component Inventory

### 9.1 Display Components

| Component | Purpose | Data Source |
|---|---|---|
| **PartnerCard** | Compact partner summary (name, type, status, signups) | Partnership |
| **StatusBadge** | Color-coded status indicator for any entity | Enum values |
| **Timeline** | Chronological feed of activities and events | `getPartnershipTimeline()` |
| **AgreementCard** | Agreement summary with version, status, dates | PartnershipAgreement |
| **CampaignCard** | Campaign summary with progress bars | PartnershipCampaign |
| **CodeCard** | Code display with status, redemption count, trial days | PartnershipCode |
| **CommissionCard** | Commission summary with status, amount, type | PartnershipCommission |
| **PayoutCard** | Payout summary with status, amount, method | PartnershipPayout |
| **HealthWidget** | Health score gauge with grade and trend | PartnershipHealthScore |
| **RiskIndicator** | Risk level badge with flags tooltip | PartnershipRiskProfile |
| **ActivityFeed** | Real-time activity stream | PartnershipActivityLog |
| **AuditTimeline** | Audit records with old/new values | PartnershipAuditRecord |
| **PerformanceChart** | Line/bar chart for signups, conversions, revenue over time | Denormalized metrics |
| **ApprovalBanner** | Pending approval action banner | Status checks |
| **NotificationCenter** | Dropdown notification panel | PartnershipEvent |
| **MetricCard** | Single KPI with label, value, trend indicator | Aggregated data |
| **ComparisonTable** | Side-by-side comparison (targets vs actuals) | Campaign metrics |
| **TrendChart** | Sparkline showing metric trend | HealthScore trendDirection |
| **EmptyState** | Illustration + guidance for empty data | N/A |
| **LoadingState** | Skeleton loader matching component shape | N/A |
| **ErrorState** | Error message with retry action | N/A |
| **SuccessState** | Success confirmation with next steps | N/A |
| **ProgressBar** | Campaign progress: actual vs target | Campaign metrics |
| **ConversionFunnel** | Signups → Conversions → Revenue funnel | Attribution + Commission |
| **RegionMap** | Geographic performance visualization | Regional queries |
| **FilterBar** | Reusable filter controls (status, type, date range) | N/A |
| **DataTable** | Sortable, paginated table with row actions | Any list query |
| **DetailDrawer** | Slide-out panel for quick detail view | Any entity |
| **ConfirmDialog** | Action confirmation with reason input | N/A |
| **StatusTransition** | Visual state machine diagram | Entity lifecycle |

### 9.2 Action Components

| Component | Purpose |
|---|---|
| **CreateCampaignButton** | Opens campaign creation modal/wizard |
| **GenerateCodeButton** | Opens code generation modal |
| **ApproveCommissionButton** | Validates and approves commission |
| **CreatePayoutButton** | Opens payout creation form |
| **ProcessPayoutButton** | Processes approved payout |
| **SuspendPartnerButton** | Suspends with reason dialog |
| **ReactivatePartnerButton** | Reactivates suspended partner |
| **SignAgreementButton** | Triggers agreement signing flow |
| **AmendAgreementButton** | Opens amendment creation form |
| **PauseCodeButton** | Pauses active code |
| **RevokeCodeButton** | Revokes code with reason |
| **ExportButton** | Exports current view data to CSV/Excel |

---

## 10. Notification Specifications

### 10.1 Notification Matrix

| Event | Email | Dashboard | In-App | Partner Portal |
|---|---|---|---|---|
| Application received | ✅ To partner | ✅ To internal | — | — |
| Application approved | ✅ To partner | ✅ To internal | — | ✅ |
| Application rejected | ✅ To partner | ✅ To internal | — | — |
| Agreement ready for signature | ✅ To partner | ✅ To internal | — | ✅ Banner |
| Agreement signed | ✅ To internal | ✅ To internal | — | ✅ |
| Agreement expired | ✅ To both | ✅ To internal | — | ✅ Banner |
| Agreement amended | ✅ To partner | ✅ To internal | — | ✅ |
| Codes generated | — | ✅ To internal | — | ✅ |
| First referral (code redeemed) | ✅ To partner | ✅ To internal | — | ✅ |
| First subscription conversion | ✅ To partner | ✅ To internal | — | ✅ |
| Commission earned (accrued) | ✅ To partner | ✅ To internal | — | ✅ |
| Commission approved | — | ✅ To finance | — | ✅ |
| Commission paid | ✅ To partner | ✅ To finance | — | ✅ |
| Commission clawed back | ✅ To partner | ✅ To finance | — | ✅ |
| Commission voided | — | ✅ To finance | — | ✅ |
| Payout created | ✅ To partner | ✅ To finance | — | ✅ |
| Payout paid | ✅ To partner | ✅ To finance | — | ✅ |
| Payout failed | ✅ To partner | ✅ To finance | — | ✅ |
| Payout rejected | ✅ To partner | ✅ To finance | — | ✅ |
| Campaign ending soon (7 days) | ✅ To partner | ✅ To internal | — | ✅ |
| Campaign completed | — | ✅ To internal | — | ✅ |
| Agreement expiring (30 days) | ✅ To partner | ✅ To internal | — | ✅ Banner |
| Partner suspended | ✅ To partner | ✅ To internal | — | ✅ Full-screen |
| Partner reactivated | ✅ To partner | ✅ To internal | — | ✅ |
| Partner type changed | ✅ To partner | ✅ To internal | — | ✅ |
| Code paused (by system on suspend) | — | ✅ To internal | — | ✅ |
| Code exhausted | — | ✅ To internal | — | ✅ |
| Health score dropped to D/F | — | ✅ To CS team | — | — |
| Risk flag added | — | ✅ To CS + Legal | — | — |
| Trial expiring (3 days) | ✅ To restaurant | — | — | — |
| Trial converted | ✅ To partner | ✅ To internal | — | ✅ |

### 10.2 Notification Channels

- **Email:** Transactional emails via existing email infrastructure
- **Dashboard:** Bell icon in header with unread count, dropdown panel
- **In-App:** Toast notifications for real-time events
- **Partner Portal:** Banner notifications for actionable items, bell icon for history
- **Mobile (Future):** Push notifications via PWA

---

## 11. Permission Matrix

### 11.1 Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access |
| `PARTNERSHIP_MANAGER` | Manage partners, applications, agreements, campaigns, codes |
| `SALES` | View partners, create prospects, manage pipeline |
| `MARKETING` | View campaigns, create/launch campaigns, view codes |
| `FINANCE` | View commissions, manage payouts, export ledgers |
| `SUPPORT` | Lookup codes, view partners, view timelines |
| `LEGAL` | View agreements, view audit trails, view status history |
| `CUSTOMER_SUCCESS` | View health scores, view risk profiles, view partners |
| `EXECUTIVE` | View all dashboards, view reports, export |
| `FOUNDER_PARTNER` | Portal access only — own data only |
| `OBSERVER` | Read-only access to all data |

### 11.2 Screen Permissions

| Screen | Super Admin | Partnership Mgr | Sales | Marketing | Finance | Support | Legal | CS | Executive | Partner |
|---|---|---|---|---|---|---|---|---|---|---|
| Partnerships Overview | V/C/E | V/C/E | V | V | V | V | V | V | V | — |
| Applications Queue | V/C/E/D | V/C/E/D | V | — | — | V | V | — | V | — |
| Partners List | V/C/E | V/C/E | V/C | V | V | V | V | V | V | — |
| Partner Detail | V/E | V/E | V | V | V | V | V | V | V | — |
| Partner Timeline | V | V | V | V | V | V | V | V | V | — |
| Partner Commissions | V/E | V | — | — | V/E | V | V | — | V | — |
| Partner Payouts | V/E | V | — | — | V/E | V | V | — | V | — |
| Partner Codes | V/C/E/D | V/C/E/D | V | V/C/E | — | V | V | — | V | — |
| Partner Campaigns | V/C/E/D | V/C/E/D | V | V/C/E/D | — | V | — | V | V | — |
| Partner Agreements | V/C/E | V/C/E | V | — | — | V | V/C/E | — | V | — |
| Partner Audit | V | V | — | — | V | V | V | — | V | — |
| Partner Health | V/E | V | — | — | — | — | — | V/E | V | — |
| Agreements List | V/C/E | V/C/E | V | — | — | V | V/C/E | — | V | — |
| Campaigns List | V/C/E | V/C/E | V | V/C/E | — | V | — | V | V | — |
| Codes List | V/C/E | V/C/E | V | V/C/E | — | V | — | — | V | — |
| Commissions Ledger | V/E | V | — | — | V/E | V | V | — | V | — |
| Payouts Queue | V/C/E | V | — | — | V/C/E | — | — | — | V | — |
| Health & Risk | V/E | V | — | — | — | — | V | V/E | V | — |
| Audit Trail | V | V | — | — | V | V | V | — | V | — |
| Support Lookup | V | V | — | — | — | V | — | — | — | — |
| Settings | V/C/E | V | — | — | — | — | — | — | — | — |
| Executive Overview | V | V | — | — | V | — | — | V | V | — |
| Partner Portal | — | — | — | — | — | — | — | — | — | V (own) |

**Legend:** V=View, C=Create, E=Edit, D=Delete

### 11.3 Action Permissions

| Action | Roles |
|---|---|
| Approve application | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Reject application | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Create agreement | SUPER_ADMIN, PARTNERSHIP_MANAGER, LEGAL |
| Sign agreement | SUPER_ADMIN, PARTNERSHIP_MANAGER (internal), FOUNDER_PARTNER (portal) |
| Amend agreement | SUPER_ADMIN, PARTNERSHIP_MANAGER, LEGAL |
| Create campaign | SUPER_ADMIN, PARTNERSHIP_MANAGER, MARKETING |
| Launch campaign | SUPER_ADMIN, PARTNERSHIP_MANAGER, MARKETING |
| Generate code | SUPER_ADMIN, PARTNERSHIP_MANAGER, MARKETING |
| Pause/resume code | SUPER_ADMIN, PARTNERSHIP_MANAGER, MARKETING |
| Revoke code | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Validate commission | SUPER_ADMIN, FINANCE |
| Approve commission | SUPER_ADMIN, FINANCE |
| Adjust commission | SUPER_ADMIN, FINANCE |
| Void commission | SUPER_ADMIN, FINANCE |
| Clawback commission | SUPER_ADMIN, FINANCE |
| Create payout | SUPER_ADMIN, FINANCE |
| Approve payout | SUPER_ADMIN, FINANCE |
| Process payout | SUPER_ADMIN, FINANCE |
| Mark payout paid | SUPER_ADMIN, FINANCE |
| Reject payout | SUPER_ADMIN, FINANCE |
| Suspend partner | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Reactivate partner | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Terminate partner | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Change partner type | SUPER_ADMIN, PARTNERSHIP_MANAGER |
| Export data | SUPER_ADMIN, FINANCE, EXECUTIVE, LEGAL |
| View audit trail | SUPER_ADMIN, PARTNERSHIP_MANAGER, FINANCE, LEGAL, SUPPORT |

---

## 12. Timeline Standards

### 12.1 Timeline Philosophy

Every important entity has a timeline. Timelines merge `PartnershipActivityLog` and `PartnershipEvent` records chronologically. Support staff should immediately understand: What happened? When? Why? Who did it?

### 12.2 Entity Timelines

| Entity | Timeline Source | Display Location |
|---|---|---|
| Partnership | ActivityLog + Events (entityType=partnership) | Partner Detail → Timeline tab |
| Agreement | Events (entityType=partnership_agreement) | Agreement Detail → History |
| Campaign | Events (entityType=partnership_campaign) | Campaign Detail → Activity |
| Code | Events (entityType=partnership_code) | Code Detail → History |
| Commission | Events (entityType=partnership_commission) | Commission Detail → History |
| Payout | Events (entityType=partnership_payout) | Payout Detail → History |

### 12.3 Timeline Entry Format

Each entry shows:
- **Timestamp:** Relative (2 hours ago) + absolute (Jul 31, 2026 3:45 PM)
- **Type:** Icon + label (e.g., 🟢 CODE_REDEEMED)
- **Actor:** Who triggered the action (name or "System")
- **Description:** Human-readable summary
- **Metadata:** Expandable JSON for technical details

---

## 13. Design System Principles

### 13.1 Behavioral Principles

1. **Consistency** — Same entity types use same components across all products. A CodeCard looks identical in internal portal and partner portal.
2. **Auditability** — Every financial action shows who, when, and why. Every status change has an audit record visible in the UI.
3. **Predictability** — Status badges use consistent colors: green=active, yellow=pending/paused, red=suspended/revoked/failed, gray=expired/void.
4. **Minimal Clicks** — No important action requires more than 3 clicks from any dashboard.
5. **Progressive Disclosure** — List → Detail → Timeline. Don't overwhelm; reveal depth on demand.
6. **Action-Oriented Dashboards** — Every dashboard has at least one actionable item. Dashboards are not reports; they are workspaces.
7. **Decision-First Design** — Every chart answers a business question. No vanity metrics.
8. **Accessibility** — WCAG 2.1 AA compliant. Keyboard navigation, screen reader support, color contrast 4.5:1.
9. **Mobile Readiness** — All internal screens functional on tablet (1024px). Partner portal functional on mobile (375px). Responsive breakpoints: 375px, 768px, 1024px, 1440px.
10. **Performance Awareness** — Lists use pagination (50 items default). Dashboards use denormalized metrics (O(1) reads). Heavy queries show loading skeletons.

### 13.2 State Standards

| State | Visual Treatment |
|---|---|
| **Empty** | Illustration + headline + guidance text + primary action button |
| **Loading** | Skeleton loader matching content shape, not generic spinner |
| **Error** | Error icon + message + retry button + support contact |
| **Success** | Green checkmark + confirmation message + next step link |
| **No Permission** | Lock icon + message + contact admin link |

### 13.3 Color Semantics

| Color | Meaning | Usage |
|---|---|---|
| Green | Active, paid, approved, healthy | Status badges, success states |
| Yellow/Amber | Pending, paused, under review, warning | Status badges, attention items |
| Red | Suspended, revoked, failed, rejected, high risk | Status badges, error states |
| Blue | Informational, primary action | Buttons, links, info badges |
| Gray | Expired, void, draft, neutral | Status badges, disabled states |
| Purple | Executive/strategic | Executive dashboard accents |

---

## 14. Executive Intelligence Design

### 14.1 CEO Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Executive Overview                                       │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Active   │ Revenue  │ Comm.    │ Avg CAC  │ Avg LTV      │
│ Partners │ (Month)  │ Liability│          │              │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│ Top Performing Partners        │ Campaign Performance     │
│ (Table: name, type, signups,   │ (Bar chart: conversion   │
│  conversions, revenue)         │  rate by campaign)       │
├───────────────────────────────┼──────────────────────────┤
│ LTV by Partner Type            │ Regional Performance     │
│ (Bar chart: revenue, comm,     │ (Table: region, signups, │
│  payout per type)              │  conversions, revenue)   │
├───────────────────────────────┼──────────────────────────┤
│ Expiring Agreements (30 days)  │ Partners Requiring       │
│ (Table: partner, date, action) │ Attention (count + list) │
├───────────────────────────────┴──────────────────────────┤
│ Commission Liability by Partner (Top 5)                  │
│ (Horizontal bar chart)                                   │
└─────────────────────────────────────────────────────────┘
```

### 14.2 Executive Query Mapping

| CEO Question | Service Method | Visualization |
|---|---|---|
| Top partners this month | `getTopPartners({ metric: 'signups' })` | Ranked table |
| Highest conversion campaigns | `getCampaignPerformance()` | Bar chart |
| LTV by partnership type | `getPartnershipTypeLTV()` | Grouped bar chart |
| Underperforming regions | `getRegionalPerformance()` | Table + map |
| Expiring agreements | `getExpiringAgreements(30)` | Table with action |
| Partners requiring attention | `getPartnersRequiringAttention()` | Summary card + list |
| Total commission liability | `getTotalCommissionLiability()` | KPI card + bar chart |
| CAC by partnership type | `getCACByPartnerType()` | Comparison table |

---

## 15. Mobile Considerations

### 15.1 Priority by Product

| Product | Mobile Priority | Rationale |
|---|---|---|
| Partner Portal | **High** — Primary mobile experience | Partners are external, often on mobile |
| Restaurant Experience | **High** — Existing PWA | Restaurant owners use mobile primarily |
| Internal Operations | **Medium** — Tablet-first | Internal staff use desktops/tablets |
| Executive Intelligence | **Low** — Desktop-first | Executives view on large screens |

### 15.2 Mobile Design Principles

- Partner portal: Bottom navigation bar, card-based layouts, swipeable tables
- Restaurant: Existing PWA patterns, offline-capable
- Internal: Collapsible sidebar, responsive tables → card view on mobile
- Executive: Simplified KPI cards, no complex charts on mobile

---

## 16. Accessibility Guidelines

- **WCAG 2.1 AA** compliance across all products
- Keyboard navigation: Tab order follows visual order, Enter/Space for actions
- Screen reader: ARIA labels on all interactive elements, live regions for dynamic updates
- Color contrast: Minimum 4.5:1 for text, 3:1 for large text and UI components
- Don't rely on color alone: Status badges include text labels and icons
- Focus indicators: Visible focus ring on all focusable elements
- Form validation: Error messages associated with fields via aria-describedby
- Tables: Proper `<thead>`, `<th scope>`, caption elements
- Images: Alt text for all meaningful images
- Language: Support Kinyarwanda (rw), English (en), French (fr) — existing i18n system

---

## 17. Future Expansion

### 17.1 Partnership Type Expansion

All screens use `PartnerType` enum. Adding a new type (e.g., `TOURISM_BOARD`) requires:
- Add enum value to Prisma schema
- Add type filter to Partner List screen
- Add type option to New Partner Wizard
- No new screens, no new services, no architectural changes

### 17.2 Future Products

| Future Product | Foundation |
|---|---|
| Affiliate Portal | Reuse Partner Portal with type-specific views |
| Tourism Board Dashboard | Reuse Executive Intelligence with regional focus |
| AI-Driven Insights | Event store + denormalized metrics provide training data |
| Partner Mobile App | Partner Portal PWA wrapper |
| Webhook System | Event log already captures all domain events |

### 17.3 Future Features

- **Batch payout creation** — Select multiple partners, create payouts in one action
- **Campaign A/B testing** — Compare code performance within same campaign
- **Partner leaderboard** — Gamification with rankings
- **QBR (Quarterly Business Review) module** — `QBR_CREATED` and `QBR_REVIEWED` events already in schema
- **Partner referral network** — Partners referring other partners
- **Multi-currency support** — Commission currency field already exists

---

## 18. Risks & UX Considerations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | Partner portal complexity overwhelms non-technical partners | High | Onboarding wizard, progressive disclosure, simplified default view |
| 2 | Finance dashboard shows too much data | Medium | Tabbed interface: Overview / Pending / History / Export |
| 3 | Support agents can see sensitive financial data | Medium | Role-based field visibility: support sees code/attribution, not commission amounts |
| 4 | Partner sees competitor performance | High | Strict data isolation: partner portal shows only own data |
| 5 | Executive dashboard becomes stale | Medium | Auto-refresh on load, "last updated" timestamp, manual refresh button |
| 6 | Mobile partner portal lacks features | Medium | Prioritize core actions: view codes, view commissions, view payouts |
| 7 | Notification overload | Medium | Notification preferences in settings, digest mode option |
| 8 | Agreement signing UX is clunky | Medium | Clear call-to-action banner, one-click sign, PDF preview |
| 9 | Multi-language support incomplete | Low | Start with EN + RW, add FR in phase 2 |
| 10 | Large partner lists are slow | Low | Pagination (50), search, filters, server-side sorting |

---

## 19. Implementation Roadmap

### Recommended Implementation Order

```
PP-003B — Internal Operations Portal
    ↓
PP-003C — Founder Partner Portal
    ↓
PP-003D — Executive Intelligence
    ↓
PP-003E — Mobile Experience
```

### Rationale

**PP-003B (Internal Operations) first because:**
1. Internal team is the primary user — they operate the platform daily
2. All services and queries already exist — pure UI implementation
3. Internal testing validates the UX before external exposure
4. Partner portal depends on internal workflows being visible (agreements, codes, campaigns)
5. Finance and support workflows are most critical for launch readiness

**PP-003C (Founder Partner Portal) second because:**
1. Partners are external — their experience must be polished
2. Depends on internal operations being functional (agreements, codes created internally)
3. Onboarding wizard requires agreement and code flows to be tested internally first
4. Partner portal is a subset of internal data — simpler to build once internal screens validate the data

**PP-003D (Executive Intelligence) third because:**
1. Executive dashboards are read-only — no complex workflows
2. All query methods already exist and are tested
3. Can be built in parallel with PP-003C if resources allow
4. Not blocking for launch — executives can use internal portal initially

**PP-003E (Mobile Experience) last because:**
1. Partner portal PWA can serve as initial mobile experience
2. Native mobile features (push notifications, offline) are enhancements
3. Desktop/tablet experience must be solid first
4. Mobile-specific UX patterns need validation from desktop usage data

### Restaurant Experience

The restaurant experience additions (Referral Source, Trial Status) are minor — 2 screens added to existing dashboard. These can be implemented during PP-003B as they are low-effort and high-visibility for end users.

---

## 20. PP-003A Certification

### **PP-003A — Experience Design Approved**

This specification defines:
- **50 screens** across 4 products
- **7 complete workflows** with step-by-step user flows
- **7 dashboard designs** with KPIs, sections, and data sources
- **30+ reusable components** defined with purpose and data sources
- **30+ notification types** mapped across 4 channels
- **11 roles** with complete permission matrix
- **6 entity timelines** with display standards
- **10 design system principles** with state and color standards
- **8 executive intelligence views** with query mappings
- **Mobile, accessibility, and future expansion** guidelines
- **Implementation roadmap** with 4 phases and rationale

The specification is detailed enough that a frontend engineering team can begin implementation without rediscovering business requirements. Every screen references existing backend services. No backend changes are required.

**The Partnership Platform is ready for PP-003B — Internal Operations Portal.**
