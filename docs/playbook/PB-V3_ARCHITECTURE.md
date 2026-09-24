# Playbook Volume III — Architecture

```yaml
id: PB-V3
title: Architecture
type: playbook
version: 1.0
status: active
owner: Chief Software Architect
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, IEOS-FP-001, IECON-001]
implements: [MEP-001 D2]
related_documents: [IAS_V1_CONSTITUTION, ARCHITECTURAL_INVARIANTS]
supersedes: []
tags: [playbook, architecture, design]
```

## Purpose

Define how architectural decisions are made, documented, and reviewed at Imboni.

---

## 1. Architecture Principles

1. **Architecture precedes implementation** (FP-3)
2. **Business capability over technical layer** (IECON-001 §2.2)
3. **Permanent over temporary** (FP-9)
4. **Reversibility over efficiency** (FP-4)
5. **Consistency before convenience** (FP-6)

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14+ |
| Database | PostgreSQL (Supabase) | 17 |
| ORM | Prisma | 5.22+ |
| Auth | NextAuth | — |
| Storage | Supabase Storage | — |
| Hosting | Vercel / Supabase | — |
| Language | TypeScript | 5+ |

**Architecture changes require an ADR.**

---

## 3. Architectural Invariants

Refer to `docs/architecture/ARCHITECTURAL_INVARIANTS.md` for the full list. Key invariants:

- All commercial decisions flow through centralized middleware
- No hardcoded plan checks in endpoints
- FinancialLedgerEntry is the exclusive source of truth for revenue analytics
- Migrations must be idempotent
- RLS disabled; authorization at application layer via NextAuth

---

## 4. ADR Process

### When to create an ADR:
- Adding, removing, or changing a technology
- Changing architectural patterns
- Making decisions that affect multiple domains
- Decisions that future engineers need to understand

### ADR Lifecycle:
```
Draft → Review → Approved → Active → (Revised if needed) → (Deprecated if superseded)
```

### ADR Requirements:
- Context and problem statement
- Options considered (at least 2)
- Decision and rationale
- Consequences (positive, negative, neutral)
- Governance references (first principles, standards)

---

## 5. Architecture Review Process

### When required:
- New domain implementation
- Cross-domain integration
- Technology change
- Data model change
- Security-relevant change

### Process:
1. Engineer creates architecture description
2. Engineer creates ADR(s) for key decisions
3. Engineering Lead reviews
4. Review decision: APPROVED / APPROVED WITH CONDITIONS / REQUIRES CHANGES / REJECTED
5. If approved, proceed to implementation

### Review Checklist:
- [ ] Follows IAS patterns
- [ ] Follows architectural invariants
- [ ] No hardcoded business logic
- [ ] Reversible changes
- [ ] Decisions documented as ADRs
- [ ] Data model follows existing patterns
- [ ] Security considered

---

## 6. Domain Architecture

### Current Domains:
- **Orders** — QR ordering, sales, payments
- **Kitchen** — Station management, ticket events
- **Inventory** — Items, suppliers, consumption
- **Reservations** — Table management
- **Finance** — Ledger, billing, subscriptions
- **Intelligence** — KPIs, dashboards, watchdogs
- **Marketplace** — Products, suppliers
- **Partnerships** — Affiliates, referrals
- **Platform** — Users, businesses, plans, features

### Domain Rules:
- Each domain is certified independently
- Cross-domain integration requires architecture review
- Domain boundaries are defined in the schema

---

## 7. Decision Tree: Does This Need Architecture Review?

```
Is this a new domain or major feature?
├── YES → Architecture review required
└── NO → Is this a technology change?
    ├── YES → ADR + architecture review
    └── NO → Is this a cross-domain integration?
        ├── YES → Architecture review required
        └── NO → Is this a data model change?
            ├── YES → ADR recommended
            └── NO → Proceed with normal workflow
```

---

## References

| Document | Location |
|----------|----------|
| IAS Constitution | `docs/architecture/IAS_V1_CONSTITUTION.md` |
| Architectural Invariants | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` |
| ADR Template | `docs/templates/TPL-ADR-001_ADR_TEMPLATE.md` |
| Architecture Review Template | `docs/templates/TPL-AR-001_ARCHITECTURE_REVIEW_TEMPLATE.md` |
