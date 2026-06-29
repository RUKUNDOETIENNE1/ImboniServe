# Schema Governance Checklist — Phase 0.8E

## 🎯 PURPOSE

**Prevent schema drift** between Prisma, Supabase, migrations, and queries.

**Mandatory** for all future phases involving:
- Migrations
- Analytics
- Dashboards
- Reports
- Reconciliation
- Watchdog
- Finance metrics

---

## ✅ PRE-MIGRATION CHECKLIST

### Before Creating ANY Migration

- [ ] **Review Current Schema State**
  - [ ] Read `DATABASE_TRUTH_REPORT.md`
  - [ ] Read `PRISMA_DB_DIFF_REPORT.md`
  - [ ] Verify no unresolved drift

- [ ] **Validate Migration Purpose**
  - [ ] Migration solves documented problem
  - [ ] Migration does not duplicate existing structure
  - [ ] Migration does not conflict with manual SQL files

- [ ] **Check for Breaking Changes**
  - [ ] No enum value removal (unless data migrated)
  - [ ] No column type changes (unless safe cast exists)
  - [ ] No column removal (unless data preserved)
  - [ ] No table removal (unless data migrated)

- [ ] **Test on Staging First**
  - [ ] Migration runs without errors
  - [ ] Data integrity maintained
  - [ ] Application still functions
  - [ ] Rollback plan documented

- [ ] **Update Documentation**
  - [ ] Add migration to `MIGRATION_INVENTORY.md`
  - [ ] Update `PAYMENT_SCHEMA_TRUTH.md` (if payment-related)
  - [ ] Update affected query validation docs

---

## ✅ PRE-ANALYTICS CHECKLIST

### Before Creating ANY Analytics Query

- [ ] **Verify Schema Existence**
  - [ ] Check table exists in `DATABASE_TRUTH_REPORT.md`
  - [ ] Check columns exist in `DATABASE_TRUTH_REPORT.md`
  - [ ] Check enums exist in `DATABASE_TRUTH_REPORT.md`

- [ ] **Validate Query Design**
  - [ ] Query uses indexed columns
  - [ ] Query uses proper enum values
  - [ ] Query handles NULL values
  - [ ] Query has time-based filtering (performance)

- [ ] **Test Query Execution**
  - [ ] Run with LIMIT 1 first
  - [ ] Verify execution time <5 seconds
  - [ ] Verify results match expectations
  - [ ] Test on staging database

- [ ] **Document Query**
  - [ ] Add to `QUERY_VALIDATION_REPORT.md`
  - [ ] Document purpose and expected output
  - [ ] Document dependencies (tables, columns, enums)

---

## ✅ PRE-DASHBOARD CHECKLIST

### Before Creating ANY Dashboard

- [ ] **Verify Data Sources**
  - [ ] All queries validated (see Pre-Analytics Checklist)
  - [ ] All tables exist in production
  - [ ] All columns exist in production
  - [ ] All enums match production values

- [ ] **Validate Financial Data**
  - [ ] Uses `FinancialLedgerEntry` for revenue (NOT PaymentTransaction)
  - [ ] Uses proper idempotency checks
  - [ ] Handles missing ledger entries gracefully
  - [ ] Aggregations use correct currency

- [ ] **Test Performance**
  - [ ] All queries execute in <5 seconds
  - [ ] Dashboard loads in <10 seconds
  - [ ] No N+1 query problems
  - [ ] Caching strategy documented

- [ ] **Document Dashboard**
  - [ ] Data sources documented
  - [ ] Refresh frequency documented
  - [ ] Known limitations documented

---

## ✅ PRE-REPORT CHECKLIST

### Before Creating ANY Report

- [ ] **Verify Report Schema**
  - [ ] All tables exist (check `DATABASE_TRUTH_REPORT.md`)
  - [ ] All columns exist (check `DATABASE_TRUTH_REPORT.md`)
  - [ ] All enums exist (check `DATABASE_TRUTH_REPORT.md`)
  - [ ] All joins have FK relationships

- [ ] **Validate Report Logic**
  - [ ] Uses canonical enums (not raw strings)
  - [ ] Uses proper date filtering
  - [ ] Handles NULL values
  - [ ] Currency conversions correct

- [ ] **Test Report Accuracy**
  - [ ] Spot-check against known data
  - [ ] Verify totals match ledger
  - [ ] Test edge cases (empty data, single record, etc.)
  - [ ] Test on staging first

- [ ] **Document Report**
  - [ ] Add to `QUERY_VALIDATION_REPORT.md`
  - [ ] Document calculation logic
  - [ ] Document data sources
  - [ ] Document known limitations

---

## ✅ PRE-RECONCILIATION CHECKLIST

### Before Running ANY Reconciliation

- [ ] **Verify Reconciliation Schema**
  - [ ] `PaymentTransaction` table exists
  - [ ] `FinancialLedgerEntry` table exists
  - [ ] `Sale` table exists
  - [ ] All FK relationships exist

- [ ] **Validate Reconciliation Logic**
  - [ ] Uses idempotency keys correctly
  - [ ] Handles missing ledger entries
  - [ ] Handles duplicate ledger entries
  - [ ] Handles orphan payments

- [ ] **Test Reconciliation**
  - [ ] Dry-run mode first
  - [ ] Verify no false positives
  - [ ] Verify no false negatives
  - [ ] Test on staging first

- [ ] **Document Reconciliation**
  - [ ] Document reconciliation rules
  - [ ] Document auto-fix logic
  - [ ] Document manual review process

---

## ✅ PRE-WATCHDOG CHECKLIST

### Before Deploying ANY Watchdog

- [ ] **Verify Watchdog Schema**
  - [ ] All monitored tables exist
  - [ ] All monitored columns exist
  - [ ] All monitored enums exist
  - [ ] All alert delivery channels configured

- [ ] **Validate Watchdog Logic**
  - [ ] Thresholds documented
  - [ ] False positive rate acceptable
  - [ ] Alert frequency reasonable
  - [ ] Escalation path clear

- [ ] **Test Watchdog**
  - [ ] Trigger test alert
  - [ ] Verify alert delivery
  - [ ] Verify alert content accurate
  - [ ] Test on staging first

- [ ] **Document Watchdog**
  - [ ] Document trigger conditions
  - [ ] Document alert recipients
  - [ ] Document escalation process

---

## ✅ PRE-FINANCE-METRICS CHECKLIST

### Before Creating ANY Finance Metric

- [ ] **Verify Financial Schema**
  - [ ] `FinancialLedgerEntry` table exists
  - [ ] `idempotencyKey` unique constraint exists
  - [ ] All required indexes exist
  - [ ] All required enums exist

- [ ] **Validate Metric Logic**
  - [ ] Uses `FinancialLedgerEntry` ONLY (not PaymentTransaction)
  - [ ] Uses proper idempotency checks
  - [ ] Handles missing entries gracefully
  - [ ] Currency conversions correct

- [ ] **Test Metric Accuracy**
  - [ ] Spot-check against known data
  - [ ] Verify totals match ledger
  - [ ] Test edge cases
  - [ ] Test on staging first

- [ ] **Document Metric**
  - [ ] Add to `QUERY_VALIDATION_REPORT.md`
  - [ ] Document calculation formula
  - [ ] Document data sources
  - [ ] Document known limitations

---

## ✅ SCHEMA DRIFT DETECTION

### Monthly Schema Audit

- [ ] **Run Database Truth Discovery**
  - [ ] Execute `scripts/audit-database-schema.ts`
  - [ ] Review `database-truth.json`
  - [ ] Update `DATABASE_TRUTH_REPORT.md`

- [ ] **Run Prisma Diff Check**
  - [ ] Compare schema.prisma vs database
  - [ ] Update `PRISMA_DB_DIFF_REPORT.md`
  - [ ] Document any drift

- [ ] **Run Migration Audit**
  - [ ] Check for unapplied migrations
  - [ ] Check for orphan SQL files
  - [ ] Update `MIGRATION_GOVERNANCE_REPORT.md`

- [ ] **Run Query Validation**
  - [ ] Validate all observation queries
  - [ ] Validate all analytics queries
  - [ ] Update `QUERY_VALIDATION_REPORT.md`

- [ ] **Update Governance Score**
  - [ ] Calculate schema integrity score
  - [ ] Calculate migration integrity score
  - [ ] Calculate query integrity score
  - [ ] Update `PHASE_0.8F_READINESS_SCORE.md`

---

## ✅ EMERGENCY SCHEMA CHANGE

### If Schema Change Required Immediately

- [ ] **Document Emergency**
  - [ ] Document reason for emergency change
  - [ ] Document risk assessment
  - [ ] Document rollback plan

- [ ] **Minimal Validation**
  - [ ] Verify table exists (if using existing)
  - [ ] Verify column exists (if using existing)
  - [ ] Test on staging (if possible)

- [ ] **Execute Change**
  - [ ] Apply change
  - [ ] Monitor for errors
  - [ ] Verify application still functions

- [ ] **Post-Emergency Cleanup**
  - [ ] Run full schema audit
  - [ ] Update all documentation
  - [ ] Create proper migration (if manual SQL used)
  - [ ] Validate all queries still work

---

## ✅ SCHEMA GOVERNANCE VIOLATIONS

### If Drift Detected

**YELLOW (Minor Drift)**:
- [ ] Document drift in `PRISMA_DB_DIFF_REPORT.md`
- [ ] Create issue to resolve drift
- [ ] Schedule fix in next sprint
- [ ] Continue with caution

**RED (Breaking Drift)**:
- [ ] STOP all schema-dependent work
- [ ] Document drift in `PRISMA_DB_DIFF_REPORT.md`
- [ ] Create emergency fix plan
- [ ] Resolve drift immediately
- [ ] Re-run all validation checklists

---

## 🎯 GOVERNANCE ENFORCEMENT

### Who Enforces This?

**Before Merge**:
- [ ] Developer self-checks checklist
- [ ] Code reviewer verifies checklist
- [ ] CI/CD runs schema validation

**Before Deploy**:
- [ ] Staging deployment validates schema
- [ ] Production pre-flight checks schema
- [ ] Rollback plan documented

**After Deploy**:
- [ ] Monitor for schema errors
- [ ] Run post-deploy schema audit
- [ ] Update governance score

---

## 📊 CHECKLIST METRICS

### Track Compliance

**Monthly Report**:
- Checklist completion rate
- Schema drift incidents
- Query validation failures
- Migration conflicts
- Emergency schema changes

**Quarterly Review**:
- Governance effectiveness
- Process improvements
- Tool enhancements
- Training needs

---

## 🚨 CRITICAL RULES

### NEVER

- ❌ Create migration without testing on staging
- ❌ Create analytics query without schema validation
- ❌ Use `PaymentTransaction` for revenue aggregation
- ❌ Use raw string literals for enum values
- ❌ Skip checklist "because it's urgent"
- ❌ Apply manual SQL without documenting
- ❌ Deploy without schema validation

### ALWAYS

- ✅ Verify schema before writing code
- ✅ Test on staging before production
- ✅ Document all schema changes
- ✅ Update governance docs
- ✅ Run validation checklists
- ✅ Use canonical enums
- ✅ Use `FinancialLedgerEntry` for finance

---

## 📝 CHECKLIST VERSION

**Version**: 1.0.0  
**Created**: Phase 0.8E  
**Last Updated**: Phase 0.8E  
**Next Review**: Monthly

---

**This checklist is MANDATORY for all future schema-dependent work.**

**Violations will result in schema drift, broken queries, and production incidents.**

**When in doubt, run the checklist. When urgent, run the checklist faster.**
