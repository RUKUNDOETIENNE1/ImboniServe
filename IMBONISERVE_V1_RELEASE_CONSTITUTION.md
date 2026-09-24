# ImboniServe V1 Release Constitution

**Effective Date:** 2026-06-29
**Version:** 1.0
**Status:** GOVERNING DOCUMENT

---

## Preamble

This Constitution establishes the governing principles, boundaries, and success criteria for ImboniServe Version 1. It serves as the authoritative reference for all product decisions during the V1 pilot phase.

This document exists to prevent feature creep, maintain focus, and ensure the first restaurant customers have the clearest possible experience.

---

## Article I: Definition of ImboniServe V1

### Section 1.1: What ImboniServe V1 Is

ImboniServe V1 is a **restaurant operating system** that enables:

1. **Digital Menu & Ordering** - QR-based menu display and customer ordering
2. **Kitchen Operations** - Real-time order management and kitchen display
3. **Table Management** - Table and reservation tracking
4. **Inventory Tracking** - Stock levels and low-stock alerts
5. **OCR Receipt Processing** - Automated supplier receipt extraction
6. **Financial Reporting** - Daily, weekly, and monthly reports
7. **Staff Management** - Team roles and permissions
8. **Payment Processing** - Multiple payment method support

### Section 1.2: What ImboniServe V1 Is Not

ImboniServe V1 is **not**:

1. A marketing automation platform
2. A customer loyalty system
3. A website builder
4. A supplier marketplace
5. An AI-powered business advisor
6. A multi-location enterprise system
7. A hotel management system
8. A content management system

These capabilities exist in the codebase but are intentionally excluded from V1.

---

## Article II: Target Customer

### Section 2.1: Primary Customer Profile

**Single-location restaurant owner in Rwanda**

Characteristics:
- Operates 1 restaurant location
- 2-20 staff members
- Serves 50-500 customers per day
- Uses mobile money for payments
- Limited technical expertise
- Values simplicity over features

### Section 2.2: Customer Success Definition

A V1 customer is successful when they can:

1. Create and manage their menu
2. Generate QR codes for tables
3. Receive and process orders
4. Track inventory levels
5. Upload supplier receipts
6. View daily revenue reports
7. Manage staff access

Within **30 days** of signup.

---

## Article III: Feature Boundaries

### Section 3.1: Included Features (22 Navigation Items)

| Category | Features |
|----------|----------|
| Operations | Dashboard, Orders, Kitchen, Tables, Reservations |
| Menu & Inventory | Menu, Inventory, Inventory Alerts, OCR Documents |
| QR & Digital | QR Builder, QR Analytics |
| Reports | Reports, Menu Performance, Peak Hours, Payment Analytics |
| Team | Staff |
| Financial | Transactions, Payout Summary, Payment Settings |
| Settings | Settings, Profile, Security |

### Section 3.2: Excluded Features (32 Navigation Items)

| Category | Features | Reason |
|----------|----------|--------|
| AI | AI Insights, Optimization Hub, Menu Builder | Overwhelming |
| Marketing | Campaigns, Marketer, Referrals, Invite & Earn | Not core |
| CRM | Customer CRM, Contacts, Customer Feedback | Too advanced |
| Enterprise | Branches, Outlets, Hotel Mode | Wrong customer |
| Content | CMS, Video Analytics, Site Builder, Templates | Not core |
| Advanced | A/B Testing, Smart Dining Slips, Staff Performance | Premature |
| Growth | Loyalty, Promotions | Feature-flagged |
| Internal | Support Inbox, Canned Replies, Feature Flags | Admin only |

### Section 3.3: Feature Addition Prohibition

**No new features may be added to V1 navigation without:**

1. Written justification from pilot customer feedback
2. Evidence that the feature solves a blocking problem
3. Approval from the Product Review Board
4. Verification that the feature is production-ready

---

## Article IV: Intentional Exclusions

### Section 4.1: Strategically Deferred to V2

| Feature | Rationale | V2 Condition |
|---------|-----------|--------------|
| Multi-branch | Wrong customer for V1 | 5+ successful single-location pilots |
| Loyalty Program | Requires customer base | 1000+ orders processed |
| AI Insights | Requires data | 30+ days of operation |
| CRM | Requires customer history | 100+ unique customers |
| Supplier Marketplace | Requires supplier network | 10+ verified suppliers |
| Website Builder | Not core to operations | Customer request |

### Section 4.2: Architecturally Ready but Disabled

| Feature | Flag | Enable Condition |
|---------|------|------------------|
| Advanced Analytics | `advanced_analytics` | 10 active businesses |
| Multi-Language | `multi_language` | 10 active businesses |
| Loyalty System | `loyalty_system` | Professional plan |
| Promotions Engine | `promotions_engine` | Professional plan |
| Hotel Mode | `hotel_mode` | Business plan |
| Discovery Marketplace | `discovery_marketplace` | 20 active businesses |

### Section 4.3: Internal Tools (Admin Only)

| Feature | Access |
|---------|--------|
| CEO Dashboard | Platform admins only |
| CFO Dashboard | Platform admins only |
| Pilot Observer | Platform admins only |
| Payment Monitor | Platform admins only |
| DIE Operations | Platform admins only |
| Feature Flags | Platform admins only |

---

## Article V: Success Criteria

### Section 5.1: Pilot Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Order | < 15 minutes | From signup to first order |
| Setup Completion Rate | > 80% | Completed setup wizard |
| 7-Day Retention | > 70% | Active on day 7 |
| 30-Day Retention | > 50% | Active on day 30 |
| Support Tickets per User | < 2 | First 30 days |
| OCR Success Rate | > 90% | Receipts processed correctly |
| Daily Active Usage | > 60% | Days with activity |

### Section 5.2: Pilot Failure Criteria

The pilot is considered failing if:

1. **Setup abandonment > 50%** - Users cannot complete setup
2. **Support tickets > 5 per user** - Platform is confusing
3. **7-day retention < 50%** - Users are not returning
4. **OCR success rate < 70%** - Core feature is broken
5. **Critical bugs > 3** - Platform is unstable

### Section 5.3: V1 Graduation Criteria

V1 graduates to general availability when:

1. 5 pilot restaurants successfully operational for 30+ days
2. All success metrics met
3. No critical bugs outstanding
4. Support ticket volume sustainable
5. Positive customer feedback documented

---

## Article VI: Prohibited Changes

### Section 6.1: Changes Prohibited During Pilot

The following changes are **prohibited** without explicit approval:

1. **Adding navigation items** - Increases cognitive load
2. **Enabling feature flags** - Introduces untested features
3. **Exposing admin tools** - Confuses customers
4. **Changing core workflows** - Disrupts learned behavior
5. **Adding payment methods** - Requires compliance review
6. **Modifying pricing** - Requires business approval

### Section 6.2: Changes Requiring Approval

| Change Type | Approval Required From |
|-------------|------------------------|
| Bug fixes | Engineering Lead |
| Performance improvements | Engineering Lead |
| Copy/text changes | Product Manager |
| New navigation items | Product Review Board |
| Feature flag changes | Product Review Board |
| Pricing changes | CEO |
| Payment changes | CEO + Compliance |

### Section 6.3: Emergency Changes

Emergency changes (security, data loss, critical bugs) may bypass approval but must be:

1. Documented within 24 hours
2. Reviewed within 72 hours
3. Rolled back if not approved

---

## Article VII: Customer Communication

### Section 7.1: What We Tell Customers

**V1 includes:**
- Digital menu and QR ordering
- Kitchen display system
- Table and reservation management
- Inventory tracking with OCR
- Daily/weekly/monthly reports
- Staff management
- Payment processing

**V1 does not include (yet):**
- AI-powered insights
- Customer loyalty programs
- Multi-location management
- Website builder
- Supplier marketplace

### Section 7.2: What We Don't Promise

We do not promise:

1. Specific feature release dates
2. Features "coming soon"
3. Capabilities not in V1
4. Integration with specific systems
5. Custom development

### Section 7.3: Feedback Collection

Customer feedback is collected via:

1. In-app feedback widget
2. Weekly check-in calls
3. Support ticket analysis
4. Usage analytics

Feedback informs V2, not V1 changes.

---

## Article VIII: Technical Boundaries

### Section 8.1: Code Preservation

**No code may be deleted** during V1. Features are hidden, not removed.

### Section 8.2: Database Stability

**No schema migrations** during active pilot without:

1. 48-hour notice
2. Backup verification
3. Rollback plan
4. Off-peak execution

### Section 8.3: API Stability

**No breaking API changes** during pilot. All changes must be:

1. Backward compatible
2. Versioned if necessary
3. Documented

---

## Article IX: Governance

### Section 9.1: Product Review Board

The Product Review Board consists of:

1. Chief Product Officer (Chair)
2. Senior Hospitality Product Manager
3. Restaurant Operations Consultant
4. Engineering Lead
5. Customer Success Lead

### Section 9.2: Decision Authority

| Decision | Authority |
|----------|-----------|
| Bug fixes | Engineering Lead |
| Feature visibility | Product Review Board |
| Feature flags | Product Review Board |
| V1 scope changes | Product Review Board (unanimous) |
| V1 graduation | Product Review Board + CEO |

### Section 9.3: Amendment Process

This Constitution may be amended by:

1. Written proposal with justification
2. Product Review Board review
3. Unanimous approval
4. 7-day implementation notice

---

## Article X: Definitions

| Term | Definition |
|------|------------|
| V1 | Version 1 of ImboniServe, the initial public release |
| Pilot | The initial deployment to 5 selected restaurants |
| Feature Flag | A database-controlled toggle for feature visibility |
| Navigation Item | A clickable entry in the sidebar menu |
| Production Ready | Feature is complete, tested, and stable |
| Feature Creep | Adding features beyond the defined scope |

---

## Article XI: Effective Date and Duration

### Section 11.1: Effective Date

This Constitution is effective immediately upon approval.

### Section 11.2: Duration

This Constitution governs ImboniServe until:

1. V1 graduates to general availability, OR
2. V1 is deprecated in favor of V2, OR
3. This Constitution is formally superseded

### Section 11.3: Review Schedule

This Constitution will be reviewed:

1. 30 days after pilot launch
2. Upon pilot graduation decision
3. Upon any major incident

---

## Signatures

This Constitution is approved by:

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Chief Product Officer | _____________ | ______ | _________ |
| Senior Hospitality Product Manager | _____________ | ______ | _________ |
| Restaurant Operations Consultant | _____________ | ______ | _________ |
| Engineering Lead | _____________ | ______ | _________ |
| Customer Success Lead | _____________ | ______ | _________ |
| CEO | _____________ | ______ | _________ |

---

## Appendix A: V1 Navigation Reference

```
OPERATIONS
├── Dashboard           /dashboard
├── Orders              /dashboard/orders/unified
├── Kitchen             /dashboard/kitchen
├── Tables              /dashboard/tables
└── Reservations        /dashboard/reservations

MENU & INVENTORY
├── Menu                /dashboard/menu
├── Inventory           /dashboard/inventory
├── Inventory Alerts    /dashboard/inventory-alerts
└── OCR Documents       /dashboard/die

QR & DIGITAL
├── QR Builder          /dashboard/qr-builder
└── QR Analytics        /dashboard/qr-analytics

REPORTS
├── Reports             /dashboard/reports
├── Menu Performance    /dashboard/analytics/menu-performance
├── Peak Hours          /dashboard/analytics/peak-hours
└── Payment Analytics   /dashboard/analytics/payments

TEAM
└── Staff               /dashboard/staff

FINANCIAL
├── Transactions        /dashboard/transactions
├── Payout Summary      /dashboard/payout-summary
└── Payment Settings    /dashboard/payment-settings

SETTINGS
├── Settings            /dashboard/settings
├── Profile             /dashboard/profile
└── Security            /dashboard/security
```

---

## Appendix B: Feature Flag Reference

| Flag | Default | Plan Required |
|------|---------|---------------|
| `advanced_analytics` | OFF | None (threshold) |
| `multi_language` | OFF | None (threshold) |
| `multi_branch` | OFF | Business |
| `ai_menu_builder` | OFF | None (threshold) |
| `loyalty_system` | OFF | Professional |
| `discovery_marketplace` | OFF | None (threshold) |
| `promotions_engine` | OFF | Professional |
| `hotel_mode` | OFF | Business |
| `whatsapp_cloud_api` | ON | Essentials |
| `configurable_reports` | ON | None |
| `cms_v1` | OFF | None |
| `feed_v1` | OFF | None |

---

## Appendix C: Support Escalation Path

```
Customer Issue
    ↓
Tier 1: In-app Help / FAQ
    ↓
Tier 2: Support Chat
    ↓
Tier 3: Customer Success Call
    ↓
Tier 4: Engineering Escalation
    ↓
Tier 5: Product Review Board
```

---

**END OF CONSTITUTION**

*This document is the governing authority for ImboniServe V1.*
*All product decisions must align with this Constitution.*
*Violations require immediate escalation to the Product Review Board.*
