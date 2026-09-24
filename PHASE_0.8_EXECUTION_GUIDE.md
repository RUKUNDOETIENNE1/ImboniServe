# Phase 0.8 — Execution Guide

## 🎯 OBJECTIVE

Build permanent governance layer to prevent schema drift.

**This is an AUDIT phase, not an implementation phase.**

---

## 📋 EXECUTION STEPS

### PHASE 0.8A — DATABASE TRUTH DISCOVERY

#### Step 1: Run Database Audit Script

```bash
# Install dependencies (if needed)
npm install

# Run database truth discovery
npx tsx scripts/audit-database-schema.ts
```

**Output**: `database-truth.json`

**What it discovers**:
- All tables in Supabase
- All columns with types
- All enums with values
- All indexes
- All constraints
- All foreign keys
- All applied migrations

#### Step 2: Review Discovery Output

```bash
# View the report
cat database-truth.json | jq '.'

# Or open in editor
code database-truth.json
```

#### Step 3: Generate DATABASE_TRUTH_REPORT.md

After reviewing `database-truth.json`, I will generate a comprehensive markdown report documenting:
- Table inventory
- Column inventory (by table)
- Enum inventory (with values)
- Index inventory (with uniqueness)
- Constraint inventory (with FK relationships)
- Migration status

---

### PHASE 0.8B — PRISMA ↔ DATABASE DIFF REPORT

#### Step 1: Compare Prisma Schema vs Database

Using `database-truth.json` and `schema.prisma`, I will identify:

**GREEN (Match)**:
- Tables that exist in both
- Columns that match type and nullability
- Enums that match values
- Indexes that exist in both

**YELLOW (Minor Differences)**:
- Columns with different defaults
- Indexes with different names
- Constraints with different names
- Nullable vs NOT NULL mismatches

**RED (Breaking Differences)**:
- Tables in Prisma but not in DB
- Tables in DB but not in Prisma
- Columns in Prisma but not in DB
- Columns in DB but not in Prisma
- Enum values mismatch
- Type mismatches

#### Step 2: Generate PRISMA_DB_DIFF_REPORT.md

Comprehensive diff report with:
- Summary statistics
- Table-by-table comparison
- Column-by-column comparison
- Enum-by-enum comparison
- Risk assessment for each difference

---

### PHASE 0.8C — MIGRATION GOVERNANCE

#### Step 1: Inventory All Migrations

**Prisma Migrations** (from `prisma/migrations/`):
- 21 timestamped directories
- Each with `migration.sql`

**Manual SQL Files** (from `prisma/migrations/`):
- 9 standalone SQL files
- No Prisma tracking

**Applied Migrations** (from `_prisma_migrations` table):
- From `database-truth.json`

#### Step 2: Determine Migration Status

For each migration:
- **Applied**: In `_prisma_migrations` table
- **Unapplied**: In Git but not in DB
- **Unknown**: Manual SQL file, unknown status
- **Orphan**: In DB but not in Git

#### Step 3: Generate MIGRATION_GOVERNANCE_REPORT.md

Comprehensive migration report with:
- Applied migrations list
- Unapplied migrations list
- Orphan migrations list
- Manual SQL files list
- Risk assessment for each
- Conflict detection

---

### PHASE 0.8D — QUERY VALIDATION SYSTEM

#### Step 1: Audit All Queries

**Observation Queries**:
- `PHASE_0.7_OBSERVATION_QUERIES.sql` (22 queries)

**Analytics Queries** (to be discovered):
- Search for `$queryRaw` in codebase
- Search for SQL files
- Search for analytics services

#### Step 2: Validate Each Query

For each query, verify:
- ✅ **PASS**: All tables, columns, enums exist
- ⚠️ **WARNING**: Uses nullable columns, may return NULL
- 🚨 **FAIL**: Uses non-existent tables/columns/enums

#### Step 3: Generate QUERY_VALIDATION_REPORT.md

Comprehensive query validation with:
- Query-by-query validation status
- Missing tables/columns/enums
- Risk assessment
- Fix recommendations

---

### PHASE 0.8E — AUTOPILOT SAFETY CHECKLIST

**Status**: ✅ **COMPLETE**

**Deliverable**: `SCHEMA_GOVERNANCE_CHECKLIST.md`

**Contents**:
- Pre-migration checklist
- Pre-analytics checklist
- Pre-dashboard checklist
- Pre-report checklist
- Pre-reconciliation checklist
- Pre-watchdog checklist
- Pre-finance-metrics checklist
- Schema drift detection checklist
- Emergency schema change checklist
- Governance enforcement rules

---

### PHASE 0.8F — READINESS SCORE

#### Step 1: Calculate Integrity Scores

**Schema Integrity Score** (0-100):
- Tables match: +40 points
- Columns match: +30 points
- Enums match: +20 points
- Indexes match: +10 points

**Migration Integrity Score** (0-100):
- All migrations applied: +50 points
- No orphan migrations: +25 points
- No manual SQL conflicts: +25 points

**Documentation Integrity Score** (0-100):
- All tables documented: +30 points
- All columns documented: +30 points
- All enums documented: +20 points
- All queries validated: +20 points

**Analytics Integrity Score** (0-100):
- All queries validated: +50 points
- No failed queries: +30 points
- All warnings addressed: +20 points

**Overall Governance Score**:
- Average of all 4 scores

#### Step 2: Generate PHASE_0.8F_READINESS_SCORE.md

Comprehensive readiness report with:
- Individual scores
- Overall governance score
- Risk assessment
- Recommendations
- GO/NO-GO for Phase 1.0

---

## 🚀 QUICK START

### Run Everything at Once

```bash
# 1. Run database truth discovery
npx tsx scripts/audit-database-schema.ts

# 2. Wait for me to generate all reports based on database-truth.json

# 3. Review all generated reports:
# - DATABASE_TRUTH_REPORT.md
# - PRISMA_DB_DIFF_REPORT.md
# - MIGRATION_GOVERNANCE_REPORT.md
# - QUERY_VALIDATION_REPORT.md
# - PHASE_0.8F_READINESS_SCORE.md

# 4. Review governance checklist:
# - SCHEMA_GOVERNANCE_CHECKLIST.md
```

---

## 📊 EXPECTED OUTPUTS

### After Phase 0.8A
- ✅ `database-truth.json` (raw data)
- ✅ `DATABASE_TRUTH_REPORT.md` (human-readable)

### After Phase 0.8B
- ✅ `PRISMA_DB_DIFF_REPORT.md`

### After Phase 0.8C
- ✅ `MIGRATION_GOVERNANCE_REPORT.md`

### After Phase 0.8D
- ✅ `QUERY_VALIDATION_REPORT.md`

### After Phase 0.8E
- ✅ `SCHEMA_GOVERNANCE_CHECKLIST.md` (already created)

### After Phase 0.8F
- ✅ `PHASE_0.8F_READINESS_SCORE.md`

---

## ⏱️ ESTIMATED TIME

- **Phase 0.8A**: 5 minutes (script execution)
- **Phase 0.8B**: 30 minutes (diff analysis)
- **Phase 0.8C**: 20 minutes (migration audit)
- **Phase 0.8D**: 30 minutes (query validation)
- **Phase 0.8E**: ✅ Complete (checklist created)
- **Phase 0.8F**: 15 minutes (score calculation)

**Total**: ~2 hours (mostly automated)

---

## 🚨 CRITICAL NOTES

### Database Access Required

**Phase 0.8A CANNOT proceed without**:
- Valid `DATABASE_URL` in `.env`
- Network access to Supabase
- Read permissions on database schema

**If database access fails**:
1. Verify `.env` has correct `DATABASE_URL`
2. Verify network connectivity
3. Verify database credentials
4. Check firewall rules

### No Code Changes

**This phase makes ZERO code changes** except:
- `scripts/audit-database-schema.ts` (audit script only)
- Documentation files (markdown reports)

**No modifications to**:
- Prisma schema
- Database schema
- Application code
- Migrations
- Queries

---

## ✅ SUCCESS CRITERIA

At the end of Phase 0.8, we must know:

1. ✅ Exactly what is running in Supabase
2. ✅ Exactly what Prisma believes exists
3. ✅ Exactly where they differ
4. ✅ Exactly which migrations are safe
5. ✅ Exactly which queries are valid
6. ✅ Exactly which documents can be trusted

---

## 🎯 NEXT STEPS

### After Phase 0.8 Complete

1. **Review all reports**
2. **Address RED (breaking) differences**
3. **Address YELLOW (minor) differences**
4. **Fix failed queries**
5. **Apply governance checklist to all future work**
6. **Proceed to Phase 1.0 (if governance score >80)**

---

**Ready to begin? Run the database audit script and I'll generate all reports.**

```bash
npx tsx scripts/audit-database-schema.ts
```
