# 🚨 CRITICAL BLOCKERS - EXECUTION PLAN
**Created:** May 1, 2026  
**Scope:** 4 blockers only - no feature work  
**Approach:** Additive, safe, one-at-a-time

---

## BLOCKER #1: Missing Database Migration for Staff Management

### Root Cause
- Prisma schema contains `StaffRole`, `UserStaffRole`, `User.primaryBranchId` models/fields
- Prisma Client generated successfully (schema is valid)
- **No migration file exists** to apply these changes to production database
- Running `prisma migrate deploy` in production will skip these tables/columns
- Any code referencing these models will fail with "relation does not exist" errors

### Affected Files
```
prisma/schema.prisma (lines 22, 60, 1425-1447, 1450-1462)
  - User.primaryBranchId (line 22)
  - User.primaryBranch relation (line 60)
  - StaffRole model (lines 1425-1447)
  - UserStaffRole model (lines 1450-1462)

src/pages/api/staff/index.ts
src/pages/api/staff/[id].ts
src/pages/api/staff/roles.ts
src/lib/permissions/staff.ts
src/pages/dashboard/staff.tsx
```

### Safest Additive Fix

**Step 1:** Create migration file
```bash
npx prisma migrate dev --name staff_management_system --create-only
```

**Step 2:** Review generated migration SQL
- Verify it creates tables: `StaffRole`, `UserStaffRole`
- Verify it adds column: `User.primaryBranchId`
- Verify it adds foreign keys and indexes
- **Critical:** Ensure `primaryBranchId` is NULLABLE (existing users won't have it)

**Step 3:** Add data migration for existing users (optional, safe)
```sql
-- Set all existing OWNER users to have no primary branch (they manage all)
-- No changes needed - NULL is correct default
```

**Step 4:** Apply migration locally first
```bash
npx prisma migrate dev
```

**Step 5:** Test locally
- Create a custom role via `/api/staff/roles`
- Assign it to a user via `/api/staff/[id]`
- Verify permissions are computed correctly

**Step 6:** Apply to production
```bash
npx prisma migrate deploy
```

### Migration Risk Assessment
- **Risk Level:** LOW
- **Additive only:** New tables and nullable column
- **No data loss:** Existing data untouched
- **Rollback:** Can drop tables/column if needed (but keep migration for history)
- **Downtime:** None (additive schema changes are non-blocking in PostgreSQL)

### Rollout Plan
1. ✅ Verify Prisma schema is valid (already done - generate succeeded)
2. ✅ Create migration file with `--create-only` flag
3. ✅ Review SQL - ensure no destructive operations
4. ✅ Apply to local dev database
5. ✅ Test staff management APIs locally
6. ✅ Commit migration file to git
7. ✅ Deploy code (APIs already exist, will work once migration runs)
8. ✅ Run `prisma migrate deploy` in production
9. ✅ Verify tables exist in production DB
10. ✅ Test creating a custom role in production

### Verification Steps
```bash
# Local verification
psql $DATABASE_URL -c "\d \"StaffRole\""
psql $DATABASE_URL -c "\d \"UserStaffRole\""
psql $DATABASE_URL -c "\d \"User\"" | grep primaryBranchId

# API verification
curl -X GET http://localhost:3000/api/staff/roles \
  -H "Cookie: next-auth.session-token=..."

# Production verification (after deploy)
# Check Supabase Table Editor for StaffRole, UserStaffRole tables
# Test creating a custom role via dashboard
```

### Dependencies
- **Before:** Fix Supabase connection strings (DIRECT_URL for migrations)
- **After:** Can proceed with permission enforcement

---

## BLOCKER #2: Permission Enforcement Gaps

### Root Cause
- Custom role system fully implemented in `src/lib/permissions/staff.ts`
- Functions exist: `getUserEffectivePermissions()`, `hasPermission()`
- **BUT:** No API routes actually call these functions
- `requireRole()` middleware only checks base `UserRole` enum (OWNER, ADMIN, etc.)
- Users with custom roles can't be restricted by granular permissions
- Security risk: Staff with limited roles can access everything an ADMIN can

### Affected Files
```
src/lib/permissions/staff.ts (permission logic - COMPLETE)
src/lib/middleware/auth.ts (requireRole - INCOMPLETE)

API routes needing protection:
src/pages/api/staff/index.ts (needs staff.manage)
src/pages/api/staff/[id].ts (needs staff.manage)
src/pages/api/staff/roles.ts (needs staff.manage)
src/pages/api/reports/* (needs reports.view)
src/pages/api/inventory/* (needs inventory.manage)
src/pages/api/settings/* (needs settings.manage)
src/pages/api/business/[id].ts (needs settings.manage)
```

### Safest Additive Fix

**Step 1:** Create new permission middleware (additive, doesn't break existing)
```typescript
// src/lib/middleware/requirePermission.ts
export function requirePermission(permission: string) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const permissions = await getUserEffectivePermissions(session.user.id)
    if (!hasPermission(permissions, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    req.userPermissions = permissions
    return null // Continue to handler
  }
}
```

**Step 2:** Wrap sensitive routes (one at a time, test each)
```typescript
// Example: src/pages/api/staff/index.ts
export default async function handler(req, res) {
  // Check permission first
  const permCheck = await requirePermission('staff.manage')(req, res)
  if (permCheck) return permCheck // Early return if forbidden

  // Existing logic continues unchanged
  if (req.method === 'GET') { ... }
}
```

**Step 3:** Keep backward compatibility
- OWNER role always gets all permissions (already in permission logic)
- Existing users without custom roles continue working
- Only new custom roles are restricted

**Step 4:** Add "My Permissions" debug endpoint
```typescript
// src/pages/api/me/permissions.ts
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const permissions = await getUserEffectivePermissions(session.user.id)
  return res.json({ permissions })
}
```

### Migration Risk Assessment
- **Risk Level:** MEDIUM
- **Breaking change potential:** Could lock out users if misconfigured
- **Mitigation:** OWNER role has all permissions by default
- **Rollback:** Remove permission checks, revert to role-only checks
- **Testing required:** Verify OWNER can still access everything

### Rollout Plan
1. ✅ Create `requirePermission` middleware
2. ✅ Add `/api/me/permissions` debug endpoint
3. ✅ Test with OWNER user (should have all permissions)
4. ✅ Apply to `/api/staff/*` routes first (lowest risk)
5. ✅ Test creating/editing staff with OWNER
6. ✅ Create a test custom role with limited permissions
7. ✅ Test that limited role is properly restricted
8. ✅ Apply to `/api/reports/*` routes
9. ✅ Apply to `/api/inventory/*` routes
10. ✅ Apply to `/api/settings/*` routes
11. ✅ Document which routes require which permissions

### Verification Steps
```bash
# Test 1: OWNER can access everything
curl -X GET /api/staff -H "Cookie: ..." # Should succeed

# Test 2: Custom role with staff.manage can access staff
curl -X GET /api/staff -H "Cookie: ..." # Should succeed

# Test 3: Custom role WITHOUT staff.manage is blocked
curl -X GET /api/staff -H "Cookie: ..." # Should return 403

# Test 4: Check own permissions
curl -X GET /api/me/permissions -H "Cookie: ..."
# Should return: { permissions: ['staff.manage', 'reports.view', ...] }
```

### Dependencies
- **Before:** Blocker #1 must be complete (StaffRole tables must exist)
- **After:** Can safely assign granular permissions to staff

---

## BLOCKER #3: Cron Job Conflicts / Duplicate Schedulers

### Root Cause
- **Two cron mechanisms running simultaneously:**
  1. In-process `CronService.start()` in `src/lib/cron.ts` (14 jobs via setInterval)
  2. Vercel Cron in `vercel.json` (2 jobs via HTTP endpoints)
- On serverless (Vercel), in-process intervals don't survive between requests
- Jobs may run twice (once in-process, once via Vercel Cron)
- Jobs may not run at all (if no long-running process)
- **Missing:** 12 cron jobs have no HTTP endpoint (can't be called by Vercel Cron)

### Affected Files
```
src/lib/cron.ts (in-process scheduler - 14 jobs)
vercel.json (Vercel Cron config - 2 jobs)

Jobs WITH endpoints:
src/pages/api/cron/monthly-usage-reset.ts ✅
src/pages/api/cron/addon-renewals.ts ✅
src/pages/api/cron/reservation-reminders.ts ✅ (exists but not in vercel.json)
src/pages/api/cron/invite-maintenance.ts ✅ (exists but not in vercel.json)

Jobs WITHOUT endpoints (12):
- schedulePerBusinessDailyReports
- scheduleStockAlerts
- scheduleBackups
- scheduleAffiliateApprovals
- scheduleInsightGeneration
- scheduleQROrderRelease
- scheduleFeatureFlagCheck
- scheduleReconciliation
- scheduleAutopilotFeatures
- scheduleSalesTrialStatusUpdate
- scheduleContentPublishing
- scheduleTrendingNotifications
- scheduleTapLeavePaymentReconcile
- scheduleTapLeaveFinalizationSweeper
- scheduleWhatsappReorderFunnel
- scheduleReservationNoShowForfeit
```

### Safest Additive Fix

**Step 1:** Gate in-process cron (doesn't break existing)
```typescript
// src/lib/cron.ts
export class CronService {
  static start() {
    // Only run in-process cron if explicitly enabled
    if (process.env.CRON_WORKER !== 'true') {
      logger.info('Skipping in-process cron (use CRON_WORKER=true to enable)')
      return
    }

    // Skip on Vercel (use Vercel Cron instead)
    if (process.env.VERCEL === '1') {
      logger.info('Skipping in-process cron on Vercel (use Vercel Cron)')
      return
    }

    logger.info('Starting in-process cron jobs...')
    // ... existing job scheduling
  }
}
```

**Step 2:** Create missing cron endpoints (one per job)
```typescript
// src/pages/api/cron/daily-reports.ts
import { requireCronAuth } from '@/lib/middleware/cronAuth'

export default requireCronAuth(async (req, res) => {
  // Extract logic from CronService.schedulePerBusinessDailyReports
  // Run once, return result
  const result = await runDailyReports()
  return res.json({ success: true, result })
})
```

**Step 3:** Update vercel.json with all jobs
```json
{
  "crons": [
    { "path": "/api/cron/daily-reports", "schedule": "* * * * *" },
    { "path": "/api/cron/stock-alerts", "schedule": "0 * * * *" },
    { "path": "/api/cron/tap-leave-reconcile", "schedule": "*/2 * * * *" },
    ...
  ]
}
```

**Step 4:** Secure all cron endpoints
```typescript
// src/lib/middleware/cronAuth.ts (already exists, verify usage)
export function requireCronAuth(handler) {
  return async (req, res) => {
    const secret = req.headers['x-cron-secret'] || req.query.secret
    if (secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return handler(req, res)
  }
}
```

### Migration Risk Assessment
- **Risk Level:** LOW-MEDIUM
- **Risk:** Jobs might not run during transition
- **Mitigation:** Keep in-process cron as fallback (gated by env var)
- **Rollback:** Set `CRON_WORKER=true` to re-enable in-process cron
- **Testing:** Monitor cron execution logs for 24 hours

### Rollout Plan
1. ✅ Add env var gates to `CronService.start()`
2. ✅ Deploy with `CRON_WORKER=false` (disables in-process, Vercel Cron takes over)
3. ✅ Create missing cron endpoints (12 new files)
4. ✅ Extract job logic from CronService into reusable functions
5. ✅ Update `vercel.json` with all 14+ cron schedules
6. ✅ Add `CRON_SECRET` to production env vars
7. ✅ Deploy and monitor cron execution
8. ✅ Verify all jobs run on schedule (check logs)
9. ✅ After 7 days of stable operation, remove in-process cron code

### Verification Steps
```bash
# Local development (in-process cron)
CRON_WORKER=true npm run dev
# Check logs for "Starting in-process cron jobs..."

# Production (Vercel Cron)
# Check Vercel dashboard > Cron Jobs tab
# Verify all jobs are scheduled
# Check execution logs for each job

# Manual trigger test
curl -X POST https://your-app.vercel.app/api/cron/daily-reports \
  -H "x-cron-secret: $CRON_SECRET"

# Verify job ran
# Check database for expected changes (e.g., reports sent, stock alerts created)
```

### Dependencies
- **Before:** None (independent change)
- **After:** Cron jobs run reliably on schedule

---

## BLOCKER #4: Unified Payment Status Model Across Providers

### Root Cause
- **Three payment providers with different status models:**
  1. **IremboPay:** INITIATED → PENDING → PAID/FAILED/EXPIRED
  2. **Direct MoMo (MTN/Airtel):** PENDING → PAID/FAILED
  3. **InTouch (Tap & Leave):** PENDING → PAID/FAILED
- PaymentTransaction model has `status` field but no standardized enum
- Different providers update different fields (`paidAt`, `rawStatus`, etc.)
- Reconciliation logic has to handle 3 different status vocabularies
- **Impact:** Payment metrics, reporting, and admin dashboards are inconsistent

### Affected Files
```
prisma/schema.prisma (PaymentTransaction model)
src/lib/services/irembopay.service.ts
src/lib/services/momo.service.ts
src/lib/services/intouch.service.ts
src/pages/api/payments/irembo/webhook.ts
src/pages/api/payments/momo/initiate.ts
src/pages/api/checkout/tap-and-leave.ts
src/lib/services/payment-metrics.service.ts
src/lib/cron.ts (Tap & Leave reconciliation)
```

### Safest Additive Fix

**Step 1:** Define canonical payment status enum (additive)
```typescript
// src/lib/types/payment.ts (NEW FILE)
export enum PaymentStatus {
  INITIATED = 'INITIATED',   // Payment request created
  PENDING = 'PENDING',       // Waiting for customer action
  PROCESSING = 'PROCESSING', // Provider is processing
  PAID = 'PAID',            // Successfully completed
  FAILED = 'FAILED',        // Failed or rejected
  EXPIRED = 'EXPIRED',      // Timeout or expiration
  CANCELLED = 'CANCELLED'   // Manually cancelled
}

export interface PaymentStatusMapping {
  canonical: PaymentStatus
  providerStatus: string
  description: string
}
```

**Step 2:** Create provider status mappers (additive, no breaking changes)
```typescript
// src/lib/services/payment-status-mapper.service.ts (NEW FILE)
export class PaymentStatusMapper {
  static fromIremboPay(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'INITIATED': PaymentStatus.INITIATED,
      'PENDING': PaymentStatus.PENDING,
      'PAID': PaymentStatus.PAID,
      'FAILED': PaymentStatus.FAILED,
      'EXPIRED': PaymentStatus.EXPIRED,
      'CANCELLED': PaymentStatus.CANCELLED
    }
    return mapping[status] || PaymentStatus.PENDING
  }

  static fromMoMo(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'PENDING': PaymentStatus.PENDING,
      'SUCCESSFUL': PaymentStatus.PAID,
      'FAILED': PaymentStatus.FAILED,
      'TIMEOUT': PaymentStatus.EXPIRED
    }
    return mapping[status] || PaymentStatus.PENDING
  }

  static fromInTouch(responseCode: string): PaymentStatus {
    // InTouch uses response codes
    if (InTouchService.isSuccess(responseCode)) return PaymentStatus.PAID
    if (InTouchService.isPending(responseCode)) return PaymentStatus.PENDING
    return PaymentStatus.FAILED
  }

  static toCanonical(provider: string, providerStatus: string): PaymentStatus {
    switch (provider) {
      case 'IREMBOPAY': return this.fromIremboPay(providerStatus)
      case 'MTN_MOMO':
      case 'AIRTEL_MONEY': return this.fromMoMo(providerStatus)
      case 'INTOUCH': return this.fromInTouch(providerStatus)
      default: return PaymentStatus.PENDING
    }
  }
}
```

**Step 3:** Update payment transaction updates (non-breaking)
```typescript
// In webhook handlers, use mapper before updating status
const canonicalStatus = PaymentStatusMapper.toCanonical('IREMBOPAY', webhookStatus)

await prisma.paymentTransaction.update({
  where: { id: txnId },
  data: {
    status: canonicalStatus, // Use canonical status
    rawStatus: { 
      ...existing,
      providerStatus: webhookStatus, // Keep original for debugging
      canonicalStatus: canonicalStatus
    }
  }
})
```

**Step 4:** Update queries to use canonical status
```typescript
// Before (inconsistent):
const paid = await prisma.paymentTransaction.findMany({
  where: { status: 'PAID' } // Might miss 'SUCCESSFUL' from MoMo
})

// After (consistent):
const paid = await prisma.paymentTransaction.findMany({
  where: { status: PaymentStatus.PAID } // Works for all providers
})
```

### Migration Risk Assessment
- **Risk Level:** LOW
- **Breaking change:** None (additive mapping layer)
- **Data migration:** Not required (existing statuses remain valid)
- **Rollback:** Remove mapper, use provider statuses directly
- **Testing:** Verify all payment flows still work

### Rollout Plan
1. ✅ Create `PaymentStatus` enum and mapper service
2. ✅ Add unit tests for status mapping
3. ✅ Update IremboPay webhook to use mapper (test with sandbox)
4. ✅ Update MoMo service to use mapper (test with sandbox)
5. ✅ Update InTouch service to use mapper (test with dev mode)
6. ✅ Update payment metrics service to use canonical statuses
7. ✅ Update cron reconciliation to use canonical statuses
8. ✅ Deploy to production
9. ✅ Monitor payment success rates (should remain unchanged)
10. ✅ Update admin dashboard to show canonical statuses

### Verification Steps
```bash
# Test 1: IremboPay payment
# Trigger payment, verify status transitions:
# INITIATED → PENDING → PAID (all canonical)

# Test 2: MoMo payment
# Trigger payment, verify status maps correctly:
# PENDING → PAID (not SUCCESSFUL)

# Test 3: Tap & Leave payment
# Trigger payment, verify InTouch response code maps:
# Response 00 → PAID

# Test 4: Payment metrics
curl -X GET /api/admin/payments/health
# Verify counts are accurate across all providers

# Test 5: Database check
SELECT status, gateway, COUNT(*) 
FROM "PaymentTransaction" 
GROUP BY status, gateway;
# Should show consistent statuses across gateways
```

### Dependencies
- **Before:** None (independent change)
- **After:** Payment reporting becomes consistent

---

## EXECUTION ORDER

### Phase 1: Foundation (Day 1-2)
1. **Blocker #1:** Database migration
   - Lowest risk, enables everything else
   - No code changes, just schema sync

### Phase 2: Security (Day 3-4)
2. **Blocker #2:** Permission enforcement
   - Depends on Blocker #1 (needs StaffRole tables)
   - Medium risk, test thoroughly

### Phase 3: Reliability (Day 5-6)
3. **Blocker #3:** Cron job standardization
   - Independent, can run in parallel with #2
   - Low risk, has fallback mechanism

### Phase 4: Consistency (Day 7)
4. **Blocker #4:** Payment status unification
   - Independent, additive only
   - Low risk, improves observability

---

## SUCCESS CRITERIA

### Blocker #1 Complete When:
- [ ] Migration file exists in `prisma/migrations/`
- [ ] Tables exist in production: `StaffRole`, `UserStaffRole`
- [ ] Column exists: `User.primaryBranchId`
- [ ] Can create custom role via API
- [ ] Can assign custom role to user

### Blocker #2 Complete When:
- [ ] `requirePermission` middleware exists
- [ ] `/api/me/permissions` endpoint works
- [ ] OWNER role has all permissions
- [ ] Custom role with limited permissions is properly restricted
- [ ] All sensitive routes are protected

### Blocker #3 Complete When:
- [ ] In-process cron gated by `CRON_WORKER` env var
- [ ] All 14+ cron jobs have HTTP endpoints
- [ ] `vercel.json` lists all cron schedules
- [ ] All endpoints secured with `CRON_SECRET`
- [ ] Jobs run on schedule in production (verified via logs)

### Blocker #4 Complete When:
- [ ] `PaymentStatus` enum defined
- [ ] `PaymentStatusMapper` service exists
- [ ] All payment providers use canonical statuses
- [ ] Payment metrics use canonical statuses
- [ ] Admin dashboard shows consistent statuses

---

## ROLLBACK PROCEDURES

### If Blocker #1 Fails:
```bash
# Drop tables (safe, no data loss)
psql $DATABASE_URL -c 'DROP TABLE "UserStaffRole" CASCADE;'
psql $DATABASE_URL -c 'DROP TABLE "StaffRole" CASCADE;'
psql $DATABASE_URL -c 'ALTER TABLE "User" DROP COLUMN "primaryBranchId";'

# Remove migration file
rm -rf prisma/migrations/*_staff_management_system/
```

### If Blocker #2 Fails:
```bash
# Remove permission checks from API routes
# Revert to role-only checks
# No database changes needed
```

### If Blocker #3 Fails:
```bash
# Re-enable in-process cron
CRON_WORKER=true

# Remove Vercel Cron schedules from vercel.json
# Keep endpoints for manual triggering
```

### If Blocker #4 Fails:
```bash
# Remove status mapper usage
# Revert to provider-specific statuses
# No database changes needed
```

---

**Next Step:** Execute Blocker #1 (database migration) first. Await confirmation before proceeding to Blocker #2.
