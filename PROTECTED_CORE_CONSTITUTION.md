# Protected Core Constitution

**Date:** 2026-06-29
**Author:** Senior Product Architect
**Status:** GOVERNING DOCUMENT

---

## Purpose

This document defines the **Protected Core** of ImboniServe Version 1. These modules are architecturally critical and require formal approval before any modification.

The Protected Core represents the minimum viable restaurant operating system. Removing or breaking any Protected Core module renders ImboniServe non-functional for its primary use case.

---

## Definition of Protected Core

A module is part of the Protected Core if:

1. **Mission Critical** - Restaurant cannot operate without it
2. **Revenue Generating** - Directly involved in order-to-cash flow
3. **Data Integrity** - Maintains financial or inventory truth
4. **Customer Facing** - Directly used by restaurant customers
5. **Regulatory** - Required for legal compliance

---

## Protected Core Modules

### Tier 1: Absolute Core (Cannot Be Hidden)

These modules must ALWAYS be visible and functional. They cannot be feature-flagged, admin-only, or hidden under any circumstance.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| Dashboard | `/dashboard` | Central command center | Platform Team | CTO |
| Orders | `/dashboard/orders/unified` | Revenue generation | Orders Team | CTO |
| Kitchen | `/dashboard/kitchen` | Order fulfillment | Kitchen Team | CTO |
| Menu | `/dashboard/menu` | Product catalog | Menu Team | CTO |
| Settings | `/dashboard/settings` | System configuration | Platform Team | CTO |

### Tier 2: Operational Core (V1 Visible)

These modules are essential for daily operations. They can be reorganized but not hidden in V1.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| Tables | `/dashboard/tables` | Seating management | Operations Team | Engineering Lead |
| Reservations | `/dashboard/reservations` | Booking management | Operations Team | Engineering Lead |
| Inventory | `/dashboard/inventory` | Stock tracking | Inventory Team | Engineering Lead |
| Inventory Alerts | `/dashboard/inventory-alerts` | Stock safety | Inventory Team | Engineering Lead |
| Staff | `/dashboard/staff` | Team management | HR Team | Engineering Lead |
| Reports | `/dashboard/reports` | Business insights | Analytics Team | Engineering Lead |
| Transactions | `/dashboard/transactions` | Payment history | Finance Team | Engineering Lead |

### Tier 3: Financial Core (V1 Visible)

These modules maintain financial truth. They require Finance team approval for any changes.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| Payment Settings | `/dashboard/payment-settings` | Payment configuration | Finance Team | CFO |
| Payout Summary | `/dashboard/payout-summary` | Earnings tracking | Finance Team | CFO |
| Payment Analytics | `/dashboard/analytics/payments` | Revenue analysis | Finance Team | CFO |
| DIE (OCR) | `/dashboard/die` | Cost truth | Finance Team | CFO |

### Tier 4: Customer-Facing Core (Always Accessible)

These routes are used by restaurant customers. They must always work.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| QR Entry | `/q/[token]` | Customer access | QR Team | Product Lead |
| Table Link | `/t/[id]` | Customer access | QR Team | Product Lead |
| Order Page | `/order` | Customer ordering | Orders Team | Product Lead |
| Checkout | `/order/checkout` | Payment | Orders Team | Product Lead |
| Confirmation | `/order/confirmation` | Order receipt | Orders Team | Product Lead |
| QR Menu | `/plugins/qr-menu/[menuId]` | Menu display | Menu Team | Product Lead |

### Tier 5: Authentication Core (Always Accessible)

These routes handle user authentication. They must always work.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| Login | `/login` | User access | Auth Team | Security Lead |
| Signup | `/signup` | User registration | Auth Team | Security Lead |
| Forgot Password | `/forgot-password` | Account recovery | Auth Team | Security Lead |
| Reset Password | `/reset-password` | Account recovery | Auth Team | Security Lead |
| Setup | `/setup` | Onboarding | Onboarding Team | Product Lead |

### Tier 6: Legal Core (Always Accessible)

These routes are legally required. They must always be accessible.

| Module | Path | Why Protected | Owner | Approval Required |
|--------|------|---------------|-------|-------------------|
| Privacy Policy | `/privacy` | GDPR compliance | Legal Team | Legal Counsel |
| Terms of Service | `/terms` | Legal requirement | Legal Team | Legal Counsel |
| Cookie Policy | `/cookies` | GDPR compliance | Legal Team | Legal Counsel |
| Unsubscribe | `/unsubscribe` | CAN-SPAM compliance | Legal Team | Legal Counsel |

---

## Protected Core Invariants

### Invariant 1: Order Flow Integrity

The following flow must ALWAYS work:

```
Customer scans QR → Views menu → Places order → Kitchen receives → Order completed
```

**Protected Routes:**
- `/q/[token]` → `/plugins/qr-menu/[menuId]` → `/order` → `/order/checkout` → `/order/confirmation`
- `/dashboard/kitchen` (receives order)
- `/dashboard/orders/unified` (tracks order)

### Invariant 2: Financial Truth Chain

The following data flow must ALWAYS be accurate:

```
Order placed → Sale recorded → Inventory consumed → COGS calculated → Profit reported
```

**Protected Services:**
- `SaleService` → `InventoryConsumption` → `FinancialTruthService` → `ProfitService`

### Invariant 3: Inventory Truth Chain

The following data flow must ALWAYS be accurate:

```
Document uploaded → OCR extracted → Items approved → Inventory updated → Ledger recorded
```

**Protected Routes:**
- `/dashboard/die` → `/dashboard/die/review/[id]` → `/dashboard/inventory`

### Invariant 4: Authentication Chain

The following flow must ALWAYS work:

```
User visits → Logs in → Session created → Dashboard accessible
```

**Protected Routes:**
- `/login` → `/dashboard`

---

## Modification Rules

### Rule 1: No Silent Changes

Any change to a Protected Core module must be:
1. Documented in a change request
2. Reviewed by the module owner
3. Approved by the designated approver
4. Tested against all invariants

### Rule 2: No Breaking Changes

Protected Core modules may not introduce breaking changes without:
1. Migration path documented
2. Backward compatibility maintained for 2 releases
3. Customer notification (if customer-facing)

### Rule 3: No Feature Flags on Absolute Core

Tier 1 (Absolute Core) modules may NEVER be:
- Hidden behind feature flags
- Made admin-only
- Removed from navigation
- Disabled for any user

### Rule 4: Rollback Requirement

Any change to Protected Core must have:
1. Tested rollback procedure
2. Rollback time < 5 minutes
3. No data loss on rollback

---

## Change Request Template

```markdown
## Protected Core Change Request

**Module:** [Module name]
**Path:** [Route path]
**Tier:** [1-6]
**Owner:** [Team name]
**Approver:** [Required approver]

### Change Description
[What is being changed]

### Justification
[Why this change is necessary]

### Impact Analysis
- Routes affected: [list]
- APIs affected: [list]
- Data affected: [list]
- Invariants affected: [list]

### Testing Plan
[How the change will be tested]

### Rollback Plan
[How to revert if needed]

### Approval
- [ ] Owner approved
- [ ] Approver approved
- [ ] Tests passed
- [ ] Rollback tested
```

---

## Enforcement

### Automated Checks

The following automated checks enforce Protected Core rules:

1. **Route Protection Test** - Verifies all Protected Core routes return 200
2. **Navigation Test** - Verifies Tier 1 modules always appear in navigation
3. **Invariant Tests** - Verifies all invariants pass
4. **Rollback Test** - Verifies rollback completes in < 5 minutes

### Code Review Requirements

Pull requests affecting Protected Core require:
- 2 approvals (including module owner)
- All tests passing
- No TypeScript errors
- No ESLint warnings

### Deployment Gates

Deployments affecting Protected Core require:
- Staging environment validation
- Smoke test suite passing
- Rollback procedure documented

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-29 | Senior Product Architect | Initial constitution |

---

## Signatures

This constitution is approved by:

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CTO | | | |
| CFO | | | |
| Engineering Lead | | | |
| Product Lead | | | |
| Security Lead | | | |

---

**This document governs all future modifications to ImboniServe's Protected Core. Violations require executive review.**
