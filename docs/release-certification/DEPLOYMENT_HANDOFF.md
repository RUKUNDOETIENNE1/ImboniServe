# Deployment Handoff — ImboniServe Version 1.0

> **Sprint**: Release Checkpoint & GitHub Preservation Sprint (RGPS)
> **Date**: 2026-07-26
> **Status**: COMPLETE
> **Audience**: Operations / Deployment Engineer
> **Purpose**: Mark the transition from engineering to operations

---

## 1. Purpose

This document describes **everything required before production deployment**
of ImboniServe Version 1.0. Engineering is complete and certified (see
`VERSION_1_RELEASE_MANIFEST.md` and `RELEASE_CHECKPOINT_REPORT.md`). The
remaining work is operational and is documented here.

**Do not deploy to production without completing every item in § 4.**

---

## 2. Engineering State at Handoff

| Field | Value |
|-------|-------|
| Release tag | `v1.0.0-rc1` |
| Commit | `2321888a8e8c1613772100b72f9b6478b5777770` |
| Branch | `main` (synchronized with `origin/main`) |
| Engineering phase | CLOSED |
| Schema reconciliation | COMPLETE (see `SCHEMA_RECONCILIATION_REPORT.md`) |
| Migration safety | VERIFIED (see `MIGRATION_SAFETY_REPORT.md`) |
| Release certification | COMPLETE (see `V1_RELEASE_CERTIFICATION_FINAL.md`) |

---

## 3. The Single Remaining Operational Prerequisite

### 3.1 The production database is not the configured `.env` database

Environment discovery (see `ENVIRONMENT_DISCOVERY_REPORT.md`) established that
the database currently configured in `.env` (`DATABASE_URL` /
`DIRECT_URL` → `postgres.dkhnocretmzpskadqhlq` on
`aws-1-eu-west-1.pooler.supabase.com`) is **empty**:

- 0 application tables
- no `_prisma_migrations` table
- no `LedgerDomain` enum
- no `Restaurant`, `Reservation`, `Customer`, `Room`, `InventoryItem`, or
  `Contact` tables

This is **not** the production environment that originally received the manual
schema changes described in `docs/MIGRATION_SUMMARY.md`. It must not be used
as the deployment target without explicit confirmation.

### 3.2 What this means for deployment

Before any production deployment, the operator must:

1. **Identify the correct production database.**
2. **Verify its migration history state.**
3. **Apply the reconciliation procedure if required.**
4. **Run `prisma migrate deploy`.**
5. **Perform post-deployment verification.**

Each step is detailed in § 4 below.

---

## 4. Production Deployment Checklist

### Step 1 — Identify the correct production database

- [ ] Confirm the production Supabase project ref and region.
- [ ] Confirm the production database connection string (do **not** reuse the
      `.env` value blindly — it points to an empty project).
- [ ] Confirm the production database is reachable from the deployment
      environment (Vercel / CI / local admin machine).
- [ ] Confirm you have appropriate credentials and that they are stored in the
      deployment environment's secrets (Vercel project env vars, etc.), not
      committed to the repo.

### Step 2 — Verify migration history

- [ ] Run `npx prisma migrate status` against the production database.
- [ ] Confirm whether `_prisma_migrations` exists.
- [ ] If `_prisma_migrations` exists: record which migrations are already
      marked applied.
- [ ] If `_prisma_migrations` does **not** exist: the environment has been
      managed by manual SQL / `prisma db push` only. Proceed to Step 3a.
- [ ] If `_prisma_migrations` exists and is up to date through
      `20260714000000_intelligence_platform_schema` (the migration immediately
      before the reconciliation): proceed to Step 3b.
- [ ] If `_prisma_migrations` exists but is behind: proceed to Step 3b after
      reviewing which earlier migrations are pending.

### Step 3 — Apply the reconciliation procedure

The reconciliation procedure is documented in detail in
`docs/release-certification/SCHEMA_RECONCILIATION_REPORT.md` § 5. Summary:

#### Step 3a — If `_prisma_migrations` is missing

`prisma migrate deploy` will attempt to apply **all 25 migrations from the
beginning**, which will fail on the first `CREATE TABLE` because the table
already exists. Before running `migrate deploy`:

- [ ] Either restore `_prisma_migrations` from a backup, or
- [ ] Manually insert baseline rows into `_prisma_migrations` for every
      migration that has already been applied to production. Use the migration
      folder names under `prisma/migrations/` as `migration_name`, the current
      timestamp as `finished_at`, and `1` as `rolled_back_at` (NULL is also
      acceptable per Prisma's schema).
- [ ] Re-run `npx prisma migrate status` to confirm only genuinely-pending
      migrations (including `20260726000000_schema_reconciliation_v1`) remain.

#### Step 3b — Run the reconciliation migration

- [ ] Run `npx prisma migrate deploy`.
- [ ] Confirm `20260726000000_schema_reconciliation_v1` is applied
      successfully.
- [ ] On an environment where the Part B manual changes already exist, every
      guarded statement in the reconciliation is a no-op; only the 3 Part A
      columns (`isFoundingMember`, `foundingJoinedAt`,
      `foundingDiscountPercent`) are actually added.
- [ ] On a fresh environment, all reconciliation objects are created.

#### Step 3c — Backfill `Reservation.customerId` (only if needed)

If `Reservation.customerId` contains `User.id` values that have not been
migrated to `Customer.id` (this is the case for any environment that still
had the `User`-targeted FK before the reconciliation swap):

- [ ] Run the reservation customer backfill: for each reservation with
      `customerPhone`, resolve to `Customer` via
      `CustomerService.findOrCreateByPhone` and update `customerId`.
- [ ] Run the room customer backfill: for each room with `guestPhone`,
      resolve to `Customer` and update `customerId`.
- [ ] Run the contact-customer bridge backfill: for each `Customer`, call
      `ContactCustomerBridge.ensureContactForCustomer`; for each `Contact` of
      type `CUSTOMER`, call `ContactCustomerBridge.ensureCustomerForContact`.

These backfill scripts are described in `docs/MIGRATION_SUMMARY.md` § "Step 3:
Backfill Customer Links".

### Step 4 — Deploy the application

- [ ] Deploy the `v1.0.0-rc1` build to Vercel (or the chosen hosting
      platform).
- [ ] Confirm all required environment variables are set in the deployment
      environment (see `.env.example` for the full list; do not commit real
      secrets).
- [ ] Confirm the deployment's `DATABASE_URL` and `DIRECT_URL` point to the
      **correct** production database identified in Step 1.
- [ ] Confirm cron jobs are registered (see `vercel.json`).
- [ ] Confirm webhook endpoints (IremboPay, MTN MoMo, Intouch) are reachable
      and configured with the correct production URLs.

### Step 5 — Post-deployment validation

- [ ] `npx prisma migrate status` reports no pending migrations.
- [ ] The 3 Part A columns exist on `Restaurant`:
      `isFoundingMember`, `foundingJoinedAt`, `foundingDiscountPercent`.
- [ ] `Reservation.customerId` FK references `Customer` (not `User`).
- [ ] `LedgerDomain` enum includes `SALES`.
- [ ] `Customer.contactId` column, unique constraint, and FK to `Contact`
      exist.
- [ ] `Room.customerId` column, FK, and index exist.
- [ ] `InventoryItem.reorderLevel` column exists.
- [ ] Application health check endpoint responds 200.
- [ ] Authentication (login, OTP) works end-to-end.
- [ ] A test reservation can be created and retrieved.
- [ ] A test payment webhook is acknowledged (use a sandbox/staging key if
      available).
- [ ] Dashboard pages load without server errors for an OWNER role.
- [ ] Cron jobs fire on schedule (verify via Vercel cron logs or the
      application's own job log).

### Step 6 — Tag promotion (optional, after verification)

Once production deployment is verified:

- [ ] Create `v1.0.0` annotated tag pointing at the verified production
      commit (either `2321888` if no production fixes were needed, or the
      subsequent production-verified commit).
- [ ] Push `v1.0.0` to origin.
- [ ] Update `VERSION_1_RELEASE_MANIFEST.md` with a forward reference to the
      promoted tag.

---

## 5. Rollback Considerations

The reconciliation migration is **forward-only** by design. Rollback is not
recommended. If a critical issue arises after deployment:

### 5.1 Code rollback

- Revert the deployment to the previous Vercel deployment via the Vercel
  dashboard ("Promote to Production" on the prior deployment).
- This does **not** revert the database.

### 5.2 Database rollback (manual, only if absolutely required)

Manual rollback steps (documented for completeness only — do not attempt
without a verified backup):

1. Drop the 3 Part A columns from `Restaurant` (`isFoundingMember`,
   `foundingJoinedAt`, `foundingDiscountPercent`) — only if no data depends
   on them.
2. Drop `Customer_contactId_key`, `Customer_contactId_fkey`,
   `Customer.contactId`.
3. Drop `Room_customerId_fkey`, `Room_customerId_idx`, `Room.customerId`.
4. Revert `Reservation_customerId_fkey` to reference `User` — requires the
   `User.id` values to still be present in `Reservation.customerId`. If they
   were overwritten by the backfill, this is **not possible** without a
   backup restore.
5. Remove `SALES` from `LedgerDomain` — requires no
   `FinancialLedgerEntry` rows to use `SALES`.

### 5.3 Recommended rollback strategy

- **Take a verified backup before deploying.**
- If a critical issue arises, restore the database from backup and revert the
  code deployment. This is safer than attempting a partial manual rollback.

---

## 6. Post-Deployment Validation Checklist (Quick Reference)

| Check | Command / Action | Expected Result |
|-------|------------------|-----------------|
| No pending migrations | `npx prisma migrate status` | "No pending migrations" |
| Part A columns present | `\d "Restaurant"` in psql | `isFoundingMember`, `foundingJoinedAt`, `foundingDiscountPercent` columns |
| Reservation FK target | `SELECT confrelid::regclass FROM pg_constraint WHERE conname='Reservation_customerId_fkey'` | `"Customer"` |
| LedgerDomain.SALES | `SELECT * FROM pg_enum ... WHERE enumlabel='SALES'` | one row |
| App health | `GET /api/health` (or equivalent) | 200 OK |
| Login flow | manual | success |
| Reservation flow | manual | success |
| Payment webhook | sandbox test | acknowledged |
| Owner dashboard | manual | loads without error |
| Cron jobs | Vercel logs | firing on schedule |

---

## 7. Operational Contacts And Escalation

(To be filled in by the operations team before deployment.)

- **Deployment owner**: ______
- **Database admin**: ______
- **On-call engineer**: ______
- **Rollback approver**: ______

---

## 8. Handoff Declaration

Engineering work for ImboniServe Version 1.0 is complete and certified. The
release is preserved in Git at tag `v1.0.0-rc1` (commit `2321888`), pushed to
GitHub. The single remaining prerequisite before public launch is the
operational deployment procedure documented in § 4.

Responsibility for Version 1.0 now transitions from engineering to
operations.

```
Engineering (CLOSED)
  ↓
Operations (this document)
  ↓
First Hospitality Business Onboarding
  ↓
First Paying Customer
  ↓
Continuous Improvement (Version 1.x)
```
