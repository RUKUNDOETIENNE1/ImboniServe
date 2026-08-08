# ADR-002: Disable RLS — Application-Level Authorization via NextAuth

```yaml
id: ADR-002
title: Disable RLS — Application-Level Authorization via NextAuth
type: adr
version: 1.0
status: active
owner: Founder
created: 2026-07-29
updated: 2026-07-30
review_frequency: on-change
depends_on: [IECON-001, ARCH-INV-001]
implements: [DB-003]
related_documents: [DB-003, IAS-V1]
supersedes: []
tags: [adr, architecture, security, rls, nextauth]
```

## Context

During DB-003 recovery, we discovered that Row-Level Security (RLS) was enabled on Recipe, RecipeIngredient, and InventoryConsumption tables without corresponding policies. This blocked all access to those tables. We needed to decide whether to create RLS policies or disable RLS in favor of application-level authorization.

## Options Considered

### Option 1: Create RLS policies for all tables
- **Description:** Write RLS policies for every table to enforce authorization at the database level
- **Pros:** Defense in depth; database-level security; works even if application is bypassed
- **Cons:** Complex to maintain; policies must mirror application logic; Supabase + Prisma interaction is non-trivial; significant engineering effort
- **Trade-offs:** Security depth vs. development velocity and complexity

### Option 2: Disable RLS, use application-level authorization
- **Description:** Disable RLS on all tables; enforce authorization through NextAuth middleware in the application layer
- **Pros:** Simpler; consistent with existing NextAuth patterns; no database-level policy maintenance; Prisma works without RLS complications
- **Cons:** Database is accessible if application layer is bypassed; relies on application correctness
- **Trade-offs:** Simplicity vs. defense-in-depth

## Decision

**Option 2: Disable RLS, use application-level authorization via NextAuth.**

The application already uses NextAuth with role-based middleware for all API routes. RLS policies would duplicate this logic at the database level with significant maintenance burden. The risk of bypassing the application layer is acceptable given the hosting architecture (Supabase with restricted access).

## Consequences

- **Positive:** Simpler architecture; no RLS policy maintenance; Prisma works without complications; faster development
- **Negative:** Database security depends entirely on application layer; direct database access bypasses authorization
- **Neutral:** Supabase connection pooling and access controls provide additional protection

## Governance References

- First Principles: FP-7 (Simplicity Before Complexity), FP-6 (Consistency Before Convenience)
- Standards: ARCH-INV-001
- Constitution: IECON-001 §2.2

## Traceability

```
FP-7, FP-6 → IECON-001 §2.2 → ARCH-INV-001 → This ADR → DB-003 Recovery → Application middleware
```
