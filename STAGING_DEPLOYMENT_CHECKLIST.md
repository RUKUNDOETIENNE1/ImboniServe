# 🚀 STAGING DEPLOYMENT CHECKLIST - Revenue Operations Layer

**Target Environment**: Staging (Vercel)  
**Deployment Date**: TBD  
**Deployed By**: _____________  
**Approved By**: _____________

---

## ✅ PRE-DEPLOYMENT CHECKS

### 1. Code Quality
- [ ] All Phase 8 enhancements merged to main branch
- [ ] Build passes locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests passing (`npm test`)
- [ ] E2E tests reviewed and updated

### 2. Database Preparation
- [ ] Prisma schema changes reviewed
- [ ] Migration script created (`npx prisma migrate dev --name revenue_ops_v1`)
- [ ] Migration tested on local database
- [ ] Backup of production database taken
- [ ] Rollback script prepared

### 3. Environment Variables
**Required for Staging**:
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://staging.imboni.rw"
NEXTAUTH_SECRET="[generate-new-secret]"

# MoMo API (Sandbox)
MOMO_API_USER="[sandbox-user]"
MOMO_API_KEY="[sandbox-key]"
MOMO_SUBSCRIPTION_KEY="[sandbox-subscription]"
MOMO_ENVIRONMENT="sandbox"
MOMO_CALLBACK_URL="https://staging.imboni.rw/api/webhooks/momo"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="[email]"
SMTP_PASSWORD="[app-password]"
SMTP_FROM="noreply@imboni.rw"

# WhatsApp (optional)
WHATSAPP_API_URL="[url]"
WHATSAPP_API_KEY="[key]"

# Monitoring
SENTRY_DSN="[sentry-dsn]"
SENTRY_ENVIRONMENT="staging"

# Storage (Supabase)
STORAGE_PROVIDER="supabase"
SUPABASE_STORAGE_URL="[url]"
SUPABASE_STORAGE_KEY="[key]"
```

- [ ] All environment variables set in Vercel dashboard
- [ ] Secrets rotated (don't use production values)
- [ ] MoMo sandbox credentials tested
- [ ] Email SMTP credentials verified
- [ ] Supabase 'media-uploads' bucket exists

### 4. Dependencies
- [ ] All npm packages installed (`npm install`)
- [ ] QRCode package verified (`qrcode@^1.5.4`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Package-lock.json committed

### 5. Feature Flags
- [ ] Revenue Ops feature enabled in staging
- [ ] Admin access restricted to test accounts
- [ ] Rate limiting configured
- [ ] Fraud detection thresholds set for testing

---

## 🗄️ DATABASE MIGRATION

### Step 1: Backup
```bash
# Backup staging database
pg_dump $DATABASE_URL > backup_staging_$(date +%Y%m%d_%H%M%S).sql
```
- [ ] Backup completed
- [ ] Backup file verified (can be restored)
- [ ] Backup stored securely

### Step 2: Apply Migration
```bash
# Push schema changes
npx prisma db push

# Or use migrations
npx prisma migrate deploy
```
- [ ] Migration applied successfully
- [ ] All 9 new tables created
- [ ] All 7 new enums created
- [ ] Indexes created
- [ ] Foreign keys validated

### Step 3: Seed Data (Optional)
```bash
# Create test marketer
npx prisma db seed
```
- [ ] Test marketer created
- [ ] Test wallet initialized
- [ ] Test attribution recorded
- [ ] Test commission created

### Step 4: Verify
```bash
# Check tables exist
psql $DATABASE_URL -c "\dt Marketer*"
psql $DATABASE_URL -c "\dt Revenue*"
```
- [ ] All tables present
- [ ] Row counts correct
- [ ] Constraints working

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy to Vercel
```bash
# Via GitHub integration (recommended)
git push origin main

# Or manual deploy
vercel --prod
```
- [ ] Deployment triggered
- [ ] Build completed successfully
- [ ] No build errors
- [ ] Deployment URL received

### Step 2: Verify Deployment
- [ ] Staging URL accessible: `https://staging.imboni.rw`
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard accessible

### Step 3: Smoke Tests
**Critical Paths**:
- [ ] Admin can access `/admin/payout-control`
- [ ] Marketer can access `/dashboard/marketer`
- [ ] API health check passes: `GET /api/health/revenue-ops`
- [ ] Database connection working

**API Tests**:
```bash
# Test marketer dashboard API
curl https://staging.imboni.rw/api/marketer/dashboard \
  -H "Cookie: next-auth.session-token=..."

# Test admin payout queue API
curl https://staging.imboni.rw/api/admin/payout/queue \
  -H "Cookie: next-auth.session-token=..."
```
- [ ] Marketer API responds
- [ ] Admin API responds
- [ ] QR code API works
- [ ] All endpoints return valid JSON

---

## 🧪 POST-DEPLOYMENT TESTING

### 1. Functional Testing
**Marketer Flow**:
- [ ] Create new marketer account
- [ ] Verify referral code generated (MKT-XXXXXXXXXX)
- [ ] Copy referral link
- [ ] Generate QR code
- [ ] Download QR code
- [ ] View wallet balances (all zeros initially)

**Attribution Flow**:
- [ ] Sign up business via referral link
- [ ] Verify attribution recorded
- [ ] Verify signup bonus created (50,000 RWF)
- [ ] Verify pending balance updated
- [ ] Wait 7 days or manually validate
- [ ] Verify available balance updated

**Payout Flow**:
- [ ] Request payout (10,000 RWF minimum)
- [ ] Verify funds locked
- [ ] Admin approves payout
- [ ] Verify MoMo API called (sandbox)
- [ ] Verify payout status updated
- [ ] Verify balance deducted

**Risk Detection**:
- [ ] Trigger velocity rule (3+ payouts in 24h)
- [ ] Verify risk score increases
- [ ] Verify alert generated
- [ ] Verify admin sees alert

### 2. Integration Testing
- [ ] Email notifications sent
- [ ] WhatsApp notifications sent (if enabled)
- [ ] Event logging working
- [ ] Alert system functional
- [ ] Monitoring metrics collected

### 3. Performance Testing
```bash
# Load test payout queue API
ab -n 1000 -c 10 https://staging.imboni.rw/api/admin/payout/queue
```
- [ ] API responds within 500ms (p95)
- [ ] No timeouts
- [ ] No memory leaks
- [ ] Database connections stable

### 4. Security Testing
- [ ] Authentication required on all endpoints
- [ ] Authorization working (admin vs marketer)
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection tests pass
- [ ] XSS tests pass

---

## 📊 MONITORING SETUP

### 1. Sentry Configuration
- [ ] Sentry project created for staging
- [ ] DSN configured in environment
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Source maps uploaded

### 2. Metrics Collection
- [ ] Prometheus metrics endpoint: `/api/metrics`
- [ ] Grafana dashboard imported
- [ ] Alert rules configured
- [ ] Notification channels tested

### 3. Health Checks
- [ ] `/api/health/revenue-ops` endpoint responding
- [ ] Database health check passing
- [ ] Event emission check passing
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)

### 4. Logging
- [ ] Application logs streaming to Vercel
- [ ] Error logs captured
- [ ] Audit logs working
- [ ] Log retention configured

---

## 🔔 NOTIFICATION SETUP

### 1. Slack Integration
- [ ] `#revenue-ops-staging` channel created
- [ ] Webhook configured
- [ ] Test alert sent
- [ ] Alert routing verified

### 2. Email Alerts
- [ ] Admin email list configured
- [ ] Test email sent
- [ ] Email delivery confirmed
- [ ] Spam filter checked

### 3. PagerDuty (Optional)
- [ ] Service created
- [ ] Integration key configured
- [ ] Escalation policy set
- [ ] Test incident triggered

---

## 📋 ROLLBACK PLAN

### If Deployment Fails

**Step 1: Immediate Actions**
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push origin main
```
- [ ] Previous version redeployed
- [ ] Site accessible
- [ ] Critical functions working

**Step 2: Database Rollback**
```bash
# Restore from backup
psql $DATABASE_URL < backup_staging_YYYYMMDD_HHMMSS.sql
```
- [ ] Database restored
- [ ] Data integrity verified
- [ ] Application connects successfully

**Step 3: Notify Stakeholders**
- [ ] Engineering team notified
- [ ] Product team notified
- [ ] Post-mortem scheduled

### If Critical Bug Found

**Severity Assessment**:
- **P0 (Critical)**: Data loss, security breach → Immediate rollback
- **P1 (High)**: Core feature broken → Rollback within 1 hour
- **P2 (Medium)**: Non-critical bug → Fix forward
- **P3 (Low)**: Minor issue → Fix in next release

**Decision Matrix**:
- [ ] Bug severity assessed
- [ ] Rollback decision made
- [ ] Stakeholders informed
- [ ] Action plan documented

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. User Acceptance Testing (UAT)
**Test Accounts**:
- Admin: `admin-staging@imboni.rw`
- Marketer: `marketer-staging@imboni.rw`
- Business: `business-staging@imboni.rw`

**Test Scenarios**:
- [ ] Admin approves 5 payouts
- [ ] Marketer requests 3 payouts
- [ ] Business signs up via referral
- [ ] Commission earned and validated
- [ ] Risk alert triggered and acknowledged

### 2. Stakeholder Sign-off
- [ ] Product Manager approved
- [ ] Engineering Lead approved
- [ ] QA Lead approved
- [ ] Security review passed

### 3. Documentation Updated
- [ ] Deployment notes added to wiki
- [ ] Known issues documented
- [ ] Runbook updated
- [ ] API documentation published

---

## 📈 SUCCESS CRITERIA

### Technical Metrics
- [ ] Uptime > 99.5%
- [ ] API response time < 500ms (p95)
- [ ] Error rate < 1%
- [ ] Zero data loss incidents

### Business Metrics
- [ ] 5+ test marketers onboarded
- [ ] 10+ test payouts processed
- [ ] 20+ test commissions created
- [ ] Zero critical bugs reported

### User Feedback
- [ ] Admin training completed
- [ ] Marketer onboarding tested
- [ ] Feedback collected
- [ ] Issues prioritized

---

## 🎯 NEXT STEPS

### Short-term (1-2 days)
- [ ] Monitor staging for 48 hours
- [ ] Fix any bugs found
- [ ] Collect user feedback
- [ ] Update documentation

### Medium-term (1 week)
- [ ] Complete remaining Phase 8 features
- [ ] Add email notifications
- [ ] Add CSV/PDF export
- [ ] Build auto-approval system

### Long-term (2-4 weeks)
- [ ] Plan production deployment
- [ ] Conduct load testing
- [ ] Security audit
- [ ] Compliance review

---

## 📝 DEPLOYMENT LOG

| Date | Time | Action | Result | Notes |
|------|------|--------|--------|-------|
| YYYY-MM-DD | HH:MM | Pre-deployment checks | ✅ Pass | All checks completed |
| YYYY-MM-DD | HH:MM | Database migration | ✅ Pass | 9 tables created |
| YYYY-MM-DD | HH:MM | Vercel deployment | ✅ Pass | Build #XXX |
| YYYY-MM-DD | HH:MM | Smoke tests | ✅ Pass | All endpoints working |
| YYYY-MM-DD | HH:MM | Monitoring setup | ✅ Pass | Alerts configured |

---

## 🔐 SECURITY CHECKLIST

- [ ] All secrets rotated for staging
- [ ] API keys not exposed in client code
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Input sanitization working
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] Session security configured

---

## 📞 CONTACTS

**On-Call Engineer**: _____________  
**Product Manager**: _____________  
**DevOps Lead**: _____________  
**Security Lead**: _____________

**Emergency Contacts**:
- Vercel Support: support@vercel.com
- Database Support: _____________
- MoMo Support: _____________

---

## ✅ FINAL SIGN-OFF

**Deployment Completed**: [ ] Yes [ ] No  
**All Tests Passed**: [ ] Yes [ ] No  
**Monitoring Active**: [ ] Yes [ ] No  
**Documentation Updated**: [ ] Yes [ ] No

**Approved By**:
- Engineering: _____________ Date: _______
- Product: _____________ Date: _______
- QA: _____________ Date: _______

**Ready for Production**: [ ] Yes [ ] No

---

**Status**: ⏳ **READY FOR STAGING DEPLOYMENT**

**Next Milestone**: Production deployment (after 1 week of staging testing)
