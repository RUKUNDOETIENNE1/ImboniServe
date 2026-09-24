# Phase 0.8 — Schema Governance & Drift Detection Framework

## 🎯 MISSION

**Build permanent governance layer** to prevent schema drift between:
1. Prisma schema
2. Supabase database
3. Migration history
4. Manual SQL files
5. Documentation
6. Analytics queries
7. Observation queries

**Root Cause**: Phase 0.7A discovered observation queries referenced columns that don't exist.

**Goal**: Ensure this NEVER happens again.

---

## 📦 DELIVERABLES

### ✅ CREATED (2 documents)

#### 1. `SCHEMA_GOVERNANCE_CHECKLIST.md`
**Status**: ✅ COMPLETE  
**Purpose**: Mandatory checklist for all schema-dependent work

**Contents**:
- ✅ Pre-migration checklist
- ✅ Pre-analytics checklist
- ✅ Pre-dashboard checklist
- ✅ Pre-report checklist
- ✅ Pre-reconciliation checklist
- ✅ Pre-watchdog checklist
- ✅ Pre-finance-metrics checklist
- ✅ Schema drift detection checklist
- ✅ Emergency schema change checklist
- ✅ Governance enforcement rules

**Impact**: MANDATORY for all future phases

---

#### 2. `scripts/audit-database-schema.ts`
**Status**: ✅ COMPLETE  
**Purpose**: Automated database truth discovery

**Capabilities**:
- Discovers all tables in Supabase
- Discovers all columns with types
- Discovers all enums with values
- Discovers all indexes
- Discovers all constraints
- Discovers all foreign keys
- Discovers all applied migrations
- Outputs `database-truth.json`

**Usage**: `npx tsx scripts/audit-database-schema.ts`

---

### ⏳ PENDING (5 documents - require database access)

#### 3. `DATABASE_TRUTH_REPORT.md`
**Status**: ⏳ PENDING (needs database-truth.json)  
**Purpose**: Authoritative source of truth for database schema

**Will Include**:
- Table inventory (all tables in Supabase)
- Column inventory (all columns by table)
- Enum inventory (all enums with values)
- Index inventory (all indexes with uniqueness)
- Constraint inventory (all constraints with FK relationships)
- Migration status (all applied migrations)

---

#### 4. `PRISMA_DB_DIFF_REPORT.md`
**Status**: ⏳ PENDING (needs database-truth.json)  
**Purpose**: Identify drift between Prisma and Supabase

**Will Include**:
- **GREEN**: Prisma and DB match
- **YELLOW**: Minor differences (defaults, nullability)
- **RED**: Breaking differences (missing tables/columns/enums)
- Risk assessment for each difference
- Fix recommendations

---

#### 5. `MIGRATION_GOVERNANCE_REPORT.md`
**Status**: ⏳ PENDING (needs database-truth.json)  
**Purpose**: Track migration status and conflicts

**Will Include**:
- Applied migrations (in `_prisma_migrations`)
- Unapplied migrations (in Git but not DB)
- Orphan migrations (in DB but not Git)
- Manual SQL files (standalone, untracked)
- Conflict detection
- Risk assessment

---

#### 6. `QUERY_VALIDATION_REPORT.md`
**Status**: ⏳ PENDING (needs database-truth.json)  
**Purpose**: Validate all queries against actual schema

**Will Include**:
- Query-by-query validation
- **PASS**: All tables/columns/enums exist
- **WARNING**: Uses nullable columns
- **FAIL**: Uses non-existent schema elements
- Fix recommendations

---

#### 7. `PHASE_0.8F_READINESS_SCORE.md`
**Status**: ⏳ PENDING (needs all reports)  
**Purpose**: Calculate governance readiness score

**Will Include**:
- Schema Integrity Score (0-100)
- Migration Integrity Score (0-100)
- Documentation Integrity Score (0-100)
- Analytics Integrity Score (0-100)
- Overall Governance Score (0-100)
- GO/NO-GO recommendation for Phase 1.0

---

## 🚀 EXECUTION PLAN

### Step 1: Run Database Audit (Phase 0.8A)

```bash
npx tsx scripts/audit-database-schema.ts
```

**Output**: `database-truth.json`

**Duration**: ~5 minutes

---

### Step 2: Generate Truth Report (Phase 0.8A)

**Input**: `database-truth.json`  
**Output**: `DATABASE_TRUTH_REPORT.md`

**Duration**: ~10 minutes (automated)

---

### Step 3: Generate Diff Report (Phase 0.8B)

**Input**: `database-truth.json` + `schema.prisma`  
**Output**: `PRISMA_DB_DIFF_REPORT.md`

**Duration**: ~30 minutes (analysis)

---

### Step 4: Generate Migration Report (Phase 0.8C)

**Input**: `database-truth.json` + `prisma/migrations/`  
**Output**: `MIGRATION_GOVERNANCE_REPORT.md`

**Duration**: ~20 minutes (analysis)

---

### Step 5: Generate Query Report (Phase 0.8D)

**Input**: `database-truth.json` + all SQL queries  
**Output**: `QUERY_VALIDATION_REPORT.md`

**Duration**: ~30 minutes (validation)

---

### Step 6: Calculate Readiness Score (Phase 0.8F)

**Input**: All reports  
**Output**: `PHASE_0.8F_READINESS_SCORE.md`

**Duration**: ~15 minutes (calculation)

---

## 📊 GOVERNANCE FRAMEWORK

### Permanent Governance Rules

#### BEFORE ANY MIGRATION
1. ✅ Run pre-migration checklist
2. ✅ Verify no schema drift
3. ✅ Test on staging
4. ✅ Document migration
5. ✅ Update governance docs

#### BEFORE ANY ANALYTICS
1. ✅ Run pre-analytics checklist
2. ✅ Verify tables exist
3. ✅ Verify columns exist
4. ✅ Verify enums exist
5. ✅ Test query execution

#### BEFORE ANY DASHBOARD
1. ✅ Run pre-dashboard checklist
2. ✅ Validate all data sources
3. ✅ Use FinancialLedgerEntry for revenue
4. ✅ Test performance
5. ✅ Document dashboard

#### BEFORE ANY REPORT
1. ✅ Run pre-report checklist
2. ✅ Verify report schema
3. ✅ Validate report logic
4. ✅ Test accuracy
5. ✅ Document report

#### MONTHLY SCHEMA AUDIT
1. ✅ Run database truth discovery
2. ✅ Update DATABASE_TRUTH_REPORT.md
3. ✅ Run Prisma diff check
4. ✅ Update PRISMA_DB_DIFF_REPORT.md
5. ✅ Run migration audit
6. ✅ Update MIGRATION_GOVERNANCE_REPORT.md
7. ✅ Run query validation
8. ✅ Update QUERY_VALIDATION_REPORT.md
9. ✅ Calculate governance score
10. ✅ Update PHASE_0.8F_READINESS_SCORE.md

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

## 🎯 SUCCESS CRITERIA

At the end of Phase 0.8, we must know:

1. ✅ Exactly what is running in Supabase
2. ✅ Exactly what Prisma believes exists
3. ✅ Exactly where they differ
4. ✅ Exactly which migrations are safe
5. ✅ Exactly which queries are valid
6. ✅ Exactly which documents can be trusted

---

## 📈 EXPECTED OUTCOMES

### Immediate Benefits

1. **No More Query Failures**: All queries validated before execution
2. **No More Schema Drift**: Monthly audits detect drift early
3. **No More Migration Conflicts**: All migrations tracked and validated
4. **No More Documentation Lag**: Docs auto-generated from truth

### Long-Term Benefits

1. **Confidence in Schema**: Always know what's in production
2. **Safe Migrations**: Validated before deployment
3. **Accurate Analytics**: Queries always match schema
4. **Reduced Incidents**: Catch issues before production

---

## 🔒 GOVERNANCE ENFORCEMENT

### Who Enforces?

**Developer**: Self-checks checklist before commit  
**Reviewer**: Verifies checklist before approval  
**CI/CD**: Runs schema validation before merge  
**Staging**: Validates schema before deploy  
**Production**: Pre-flight checks before deploy  
**Monthly**: Automated schema audit

### What Happens on Violation?

**YELLOW (Minor Drift)**:
- Document in diff report
- Create issue to resolve
- Schedule fix in next sprint
- Continue with caution

**RED (Breaking Drift)**:
- STOP all schema-dependent work
- Document in diff report
- Create emergency fix plan
- Resolve immediately
- Re-run all validation

---

## 📊 GOVERNANCE METRICS

### Track Monthly

- Checklist completion rate
- Schema drift incidents
- Query validation failures
- Migration conflicts
- Emergency schema changes

### Review Quarterly

- Governance effectiveness
- Process improvements
- Tool enhancements
- Training needs

---

## 🎯 PHASE 0.8 STATUS

### Completed
- ✅ Governance checklist created
- ✅ Database audit script created
- ✅ Execution guide created
- ✅ Framework documented

### Pending (requires database access)
- ⏳ Database truth discovery
- ⏳ Truth report generation
- ⏳ Diff report generation
- ⏳ Migration report generation
- ⏳ Query validation report
- ⏳ Readiness score calculation

### Blocked By
- Database access (DATABASE_URL)
- Network connectivity to Supabase

---

## 🚀 NEXT STEPS

### Immediate
1. **Run database audit script**
   ```bash
   npx tsx scripts/audit-database-schema.ts
   ```

2. **Review database-truth.json**

3. **Generate all reports** (automated)

### After Reports
1. **Address RED differences** (breaking)
2. **Address YELLOW differences** (minor)
3. **Fix failed queries**
4. **Apply governance checklist**

### Before Phase 1.0
1. **Governance score >80**
2. **No RED differences**
3. **All queries validated**
4. **All migrations tracked**

---

## 📝 DOCUMENTATION HIERARCHY

```
PHASE_0.8_GOVERNANCE_FRAMEWORK.md (this file)
├── PHASE_0.8_EXECUTION_GUIDE.md (how to run)
├── SCHEMA_GOVERNANCE_CHECKLIST.md (mandatory rules)
├── scripts/audit-database-schema.ts (audit tool)
│
└── Generated Reports (after database access):
    ├── database-truth.json (raw data)
    ├── DATABASE_TRUTH_REPORT.md (truth)
    ├── PRISMA_DB_DIFF_REPORT.md (drift)
    ├── MIGRATION_GOVERNANCE_REPORT.md (migrations)
    ├── QUERY_VALIDATION_REPORT.md (queries)
    └── PHASE_0.8F_READINESS_SCORE.md (score)
```

---

## ✅ PHASE 0.8 READINESS

**Framework**: ✅ COMPLETE  
**Tools**: ✅ COMPLETE  
**Documentation**: ✅ COMPLETE  
**Database Access**: ⏳ REQUIRED

**Ready to execute**: ✅ YES (pending database access)

---

**Run the audit script to begin Phase 0.8 execution:**

```bash
npx tsx scripts/audit-database-schema.ts
```

**After completion, I will generate all reports and calculate the governance readiness score.**
