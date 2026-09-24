# Hospitality Intelligence Platform - Staging Readiness

**Date:** July 14, 2026  
**Status:** ⚠️ CRITICAL FIXES APPLIED - READY FOR FINAL STEPS

---

## Critical Fixes Applied ✅

### C1: Authentication Module ✅ FIXED
- **Created:** `src/lib/auth.ts`
- **Action:** Re-exports `authOptions` from NextAuth configuration
- **Status:** ✅ Complete
- **Impact:** All 11 API routes can now import authentication

### C2: Intelligence Platform Schema ✅ FIXED
- **Created:** Migration `20260714000000_intelligence_platform_schema`
- **Updated:** `prisma/schema.prisma` with 4 new models
- **Models Added:**
  - `IntelligenceReport` - Stores generated intelligence reports
  - `KnowledgeEntry` - Stores historical knowledge (IKB)
  - `ReplayEvent` - Stores events for Service Replay™
  - `ConversationHistory` - Stores AI Copilot™ conversations
- **Status:** ✅ Complete
- **Impact:** Intelligence platform can now persist data

---

## Remaining Critical Work

### C3: HIE/IKB Integration ⚠️ NOT FIXED

**This is the final critical blocker.**

**Current State:**
- All intelligence consumers have service layers with placeholder methods
- Methods return empty arrays or mock data
- No actual HIE or IKB endpoints are called

**Required Work:**

#### 1. Identify HIE and IKB Endpoints

**Questions to answer:**
- Where is HIE deployed? (URL/endpoint)
- Where is IKB deployed? (URL/endpoint)
- What is the API contract?
- What authentication is required?
- Are they internal services or external?

#### 2. Wire Service Layers

**Files to update (6 consumers × 2 methods each = 12 updates):**

**Service Intelligence™:**
- `src/lib/service-intelligence/v2/service.ts`
  - `retrieveStructuredIntelligence()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

**Daily Briefings™:**
- `src/lib/daily-briefings/service.ts`
  - `retrieveIntelligenceReports()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

**Kitchen Intelligence™:**
- `src/lib/kitchen-intelligence/service.ts`
  - `retrieveIntelligenceReports()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

**Menu Intelligence™:**
- `src/lib/menu-intelligence/service.ts`
  - `retrieveIntelligenceReports()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

**Multi-location Intelligence™:**
- `src/lib/multi-location-intelligence/service.ts`
  - `retrieveIntelligenceReports()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

**AI Copilot™:**
- `src/lib/ai-copilot/service.ts`
  - `retrieveIntelligenceReports()` - Call HIE
  - `retrieveHistoricalContext()` - Call IKB

#### 3. Implementation Pattern

```typescript
// Example: Wire HIE integration
private async retrieveIntelligenceReports(query: Query): Promise<Report[]> {
  try {
    const response = await fetch(`${process.env.HIE_ENDPOINT}/api/intelligence/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HIE_API_KEY}`,
      },
      body: JSON.stringify({
        businessId: query.businessId,
        period: query.period,
        type: query.type,
      }),
    })

    if (!response.ok) {
      throw new Error(`HIE query failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.reports || []
  } catch (error) {
    console.error('HIE integration error:', error)
    return [] // Fallback to empty array
  }
}

// Example: Wire IKB integration
private async retrieveHistoricalContext(query: Query): Promise<Context> {
  try {
    const response = await fetch(`${process.env.IKB_ENDPOINT}/api/knowledge/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.IKB_API_KEY}`,
      },
      body: JSON.stringify({
        businessId: query.businessId,
        category: query.category,
        timeframe: query.timeframe,
      }),
    })

    if (!response.ok) {
      throw new Error(`IKB query failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.context || null
  } catch (error) {
    console.error('IKB integration error:', error)
    return null // Fallback to null
  }
}
```

#### 4. Environment Variables Required

Add to `.env`:
```bash
# HIE Configuration
HIE_ENDPOINT=https://hie.imbonirestaurant.com
HIE_API_KEY=your_hie_api_key_here

# IKB Configuration
IKB_ENDPOINT=https://ikb.imbonirestaurant.com
IKB_API_KEY=your_ikb_api_key_here

# Service Replay Configuration
SERVICE_REPLAY_ENDPOINT=https://replay.imbonirestaurant.com
SERVICE_REPLAY_API_KEY=your_replay_api_key_here
```

#### 5. Estimated Time

- **Identify endpoints:** 1 hour
- **Wire all service layers:** 6 hours
- **Test integrations:** 2 hours
- **Fix issues:** 2 hours
- **Total:** ~11 hours

---

## Pre-Staging Checklist

### Database ⚠️ PENDING

- [ ] Run `npx prisma generate` to regenerate Prisma client
- [ ] Run `npx prisma migrate deploy` to apply intelligence platform schema
- [ ] Verify migration applied successfully
- [ ] Test database connectivity
- [ ] Verify all models accessible

### Environment Variables ⚠️ PENDING

- [ ] Add HIE_ENDPOINT
- [ ] Add HIE_API_KEY
- [ ] Add IKB_ENDPOINT
- [ ] Add IKB_API_KEY
- [ ] Add SERVICE_REPLAY_ENDPOINT
- [ ] Add SERVICE_REPLAY_API_KEY
- [ ] Verify DATABASE_URL
- [ ] Verify DIRECT_URL
- [ ] Verify NEXTAUTH_SECRET
- [ ] Verify NEXTAUTH_URL

### Code ✅ MOSTLY COMPLETE

- [x] Authentication module created
- [x] Intelligence platform schema created
- [ ] HIE integration wired (CRITICAL)
- [ ] IKB integration wired (CRITICAL)
- [ ] Service Replay™ integration verified

### Testing ⚠️ PENDING

- [ ] Run unit tests: `npm test`
- [ ] Verify all tests pass
- [ ] Run E2E tests
- [ ] Verify E2E tests pass
- [ ] Manual smoke test each consumer

### Build ⚠️ PENDING

- [ ] Run `npm run build`
- [ ] Verify build succeeds
- [ ] Check for TypeScript errors
- [ ] Check for build warnings
- [ ] Verify bundle size acceptable

---

## Staging Deployment Steps

### 1. Prepare Staging Environment

```bash
# Set up staging environment
export NODE_ENV=staging
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
export NEXTAUTH_URL="https://staging.imbonirestaurant.com"
export HIE_ENDPOINT="https://hie-staging.imbonirestaurant.com"
export HIE_API_KEY="..."
export IKB_ENDPOINT="https://ikb-staging.imbonirestaurant.com"
export IKB_API_KEY="..."
```

### 2. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

### 3. Build Application

```bash
# Install dependencies
npm ci

# Build application
npm run build

# Verify build
ls -la .next/
```

### 4. Deploy to Staging

```bash
# Deploy (method depends on hosting platform)
# Example for Vercel:
vercel --prod --env staging

# Example for custom server:
pm2 start npm --name "imboni-staging" -- start
```

### 5. Smoke Tests

**Test each intelligence consumer:**

1. **Service Intelligence™**
   - Navigate to `/dashboard/service-intelligence`
   - Select period
   - Generate report
   - Verify data loads
   - Check evidence panel
   - Test replay links
   - Test export

2. **Daily Briefings™**
   - Navigate to `/dashboard/daily-briefings`
   - Generate briefing
   - Verify sections load
   - Check evidence
   - Test replay
   - Test export

3. **Kitchen Intelligence™**
   - Navigate to `/dashboard/kitchen-intelligence`
   - Select period
   - Generate report
   - Verify kitchen metrics
   - Check evidence
   - Test replay
   - Test export

4. **Menu Intelligence™**
   - Navigate to `/dashboard/menu-intelligence`
   - Select period
   - Generate report
   - Verify menu metrics
   - Check evidence
   - Test replay
   - Test export

5. **Multi-location Intelligence™**
   - Navigate to `/dashboard/multi-location-intelligence`
   - Select period
   - Generate portfolio report
   - Verify restaurant ranking
   - Check evidence
   - Test replay
   - Test export

6. **AI Copilot™**
   - Navigate to `/dashboard/ai-copilot`
   - Ask question
   - Verify response
   - Check evidence
   - Test replay links
   - Test suggested questions
   - Test export

### 6. Integration Tests

**Test platform integrations:**

1. **HIE Integration**
   - Verify intelligence reports retrieved
   - Check report structure
   - Verify confidence scores
   - Check evidence references

2. **IKB Integration**
   - Verify historical context retrieved
   - Check knowledge entries
   - Verify trend data
   - Check pattern recognition

3. **Service Replay™ Integration**
   - Click replay link
   - Verify replay interface loads
   - Check timestamp accuracy
   - Verify context preservation

4. **Database Persistence**
   - Generate report
   - Verify saved to database
   - Retrieve historical report
   - Verify data integrity

### 7. Performance Tests

```bash
# Load test with k6
k6 run performance-tests/load-test.js

# Monitor metrics
- Response times
- Error rates
- Database query times
- Memory usage
- CPU usage
```

### 8. Security Tests

```bash
# Run security scan
npm audit

# OWASP ZAP scan
zap-cli quick-scan https://staging.imbonirestaurant.com

# Check authentication
- Test without session
- Test with expired session
- Test with invalid token
- Test role-based access

# Check tenant isolation
- Test cross-tenant data access
- Verify businessId filtering
- Test unauthorized access
```

### 9. Monitor for 24 Hours

**Metrics to monitor:**
- Error rates
- Response times
- Database performance
- Memory leaks
- Failed requests
- User feedback

---

## Staging Success Criteria

### Functional ✅

- [ ] All 6 intelligence consumers load
- [ ] All dashboards render correctly
- [ ] All reports generate successfully
- [ ] All evidence panels work
- [ ] All replay links work
- [ ] All exports work
- [ ] All conversations work (AI Copilot™)

### Performance ✅

- [ ] Report generation < 500ms (avg)
- [ ] Dashboard loading < 2s
- [ ] API response times < 200ms (p95)
- [ ] Database queries < 100ms (p95)
- [ ] No memory leaks
- [ ] No performance degradation over time

### Security ✅

- [ ] Authentication works
- [ ] Authorization enforced
- [ ] Tenant isolation verified
- [ ] No security vulnerabilities
- [ ] No data leakage
- [ ] Audit logs working

### Stability ✅

- [ ] No crashes
- [ ] No unhandled errors
- [ ] Graceful error handling
- [ ] No data corruption
- [ ] 24-hour uptime
- [ ] No critical bugs

---

## Production Readiness Criteria

**After successful staging validation (3-5 days), the platform will be ready for production if:**

1. ✅ All staging success criteria met
2. ✅ No critical bugs found
3. ✅ Performance targets met
4. ✅ Security review passed
5. ✅ User acceptance testing passed
6. ✅ 24-hour stability demonstrated
7. ✅ Rollback plan documented
8. ✅ Monitoring configured
9. ✅ Support team trained
10. ✅ Documentation complete

---

## Rollback Plan

**If issues are discovered in staging:**

1. **Identify Issue**
   - Document error
   - Capture logs
   - Reproduce issue

2. **Assess Severity**
   - Critical: Rollback immediately
   - High: Fix within 4 hours
   - Medium: Fix within 24 hours
   - Low: Schedule for next release

3. **Rollback Database**
   ```bash
   # Revert migration
   npx prisma migrate resolve --rolled-back 20260714000000_intelligence_platform_schema
   
   # Apply previous migration
   npx prisma migrate deploy
   ```

4. **Rollback Code**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   
   # Redeploy
   vercel --prod
   ```

5. **Verify Rollback**
   - Test application
   - Verify data integrity
   - Check all features
   - Monitor for issues

---

## Next Steps

### Immediate (Before Staging)

1. **Wire HIE Integration** (~6 hours)
   - Identify HIE endpoints
   - Update all service layers
   - Test integrations

2. **Wire IKB Integration** (~2 hours)
   - Identify IKB endpoints
   - Update all service layers
   - Test integrations

3. **Apply Database Migration** (~30 minutes)
   - Run `npx prisma generate`
   - Run `npx prisma migrate deploy`
   - Verify migration

4. **Run Tests** (~1 hour)
   - Execute unit tests
   - Execute E2E tests
   - Fix any failures

5. **Build Application** (~15 minutes)
   - Run `npm run build`
   - Verify build success
   - Check for errors

**Total Estimated Time: ~10 hours**

### Staging Phase (3-5 days)

1. Deploy to staging
2. Execute smoke tests
3. Execute integration tests
4. Execute performance tests
5. Execute security tests
6. Monitor for 24 hours
7. User acceptance testing
8. Fix any issues
9. Retest
10. Approve for production

### Production Phase (After Staging)

1. Final reviews
2. Production deployment
3. Monitoring
4. Support

---

## Summary

**Status:** ⚠️ **2 of 3 Critical Blockers Fixed**

**Completed:**
- ✅ C1: Authentication module created
- ✅ C2: Intelligence platform schema created

**Remaining:**
- ⚠️ C3: HIE/IKB integration (estimated 10 hours)

**After C3 is complete:**
- Platform will be ready for staging deployment
- Estimated staging validation: 3-5 days
- Production deployment: After successful staging

---

**Document Version:** 1.0  
**Last Updated:** July 14, 2026  
**Status:** Ready for Final Integration Work
