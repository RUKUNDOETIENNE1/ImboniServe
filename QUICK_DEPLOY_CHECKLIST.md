# ⚡ Quick Deploy Checklist

**Use this checklist to deploy ImboniServe to production**

---

## 🔴 CRITICAL (Must Do Before Production)

### 1. Apply Database Indexes
```bash
# Run this script
apply-indexes.bat

# OR manually
psql "$DATABASE_URL" -f scripts/sql/add_payment_health_indexes.sql
```
- [ ] Indexes applied
- [ ] Verified with SQL query

### 2. Set Production Environment Variables
```bash
# In Vercel dashboard or .env.production
NEXTAUTH_SECRET="<generate-32-char-secret>"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="<supabase-prod-url>"
DIRECT_URL="<supabase-direct-url>"
INTOUCH_USERNAME="<your-username>"
INTOUCH_ACCOUNT_NO="<your-account>"
INTOUCH_PASSWORD="<your-password>"
TWILIO_ACCOUNT_SID="<your-sid>"
TWILIO_AUTH_TOKEN="<your-token>"
SUPABASE_STORAGE_URL="<your-url>"
SUPABASE_STORAGE_KEY="<service-key>"
SENTRY_DSN="<your-dsn>"
SENTRY_ENVIRONMENT="production"
CRON_SECRET="<generate-32-char-secret>"
```
- [ ] All critical vars set
- [ ] Secrets generated
- [ ] URLs updated

---

## 🟡 HIGH PRIORITY (Recommended)

### 3. QA Testing
- [ ] Test language switching (EN/RW/FR)
- [ ] Test payment flow
- [ ] Test WhatsApp notifications
- [ ] Test QR ordering
- [ ] Test kitchen display
- [ ] Test analytics

### 4. Native Speaker Review
- [ ] Kinyarwanda translations reviewed
- [ ] French translations reviewed
- [ ] Context verified

---

## 🟢 DEPLOYMENT

### Option A: Vercel (Recommended)
```bash
# 1. Install CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy staging
vercel

# 4. Test staging thoroughly

# 5. Deploy production
vercel --prod
```
- [ ] Staging deployed
- [ ] Staging tested
- [ ] Production deployed
- [ ] Production verified

### Option B: Self-Hosted
```bash
# 1. Apply indexes (see above)

# 2. Clone on server
git clone <repo>
cd ImboniResto

# 3. Install
npm ci --production

# 4. Build
npm run build

# 5. Start
pm2 start npm --name "imboni" -- start
pm2 save
```
- [ ] Server prepared
- [ ] Build successful
- [ ] Service running
- [ ] SSL configured

---

## 📊 POST-DEPLOYMENT

### Monitor (First 24 Hours)
- [ ] Check Sentry for errors
- [ ] Monitor database performance
- [ ] Verify cron jobs running
- [ ] Test payment transactions
- [ ] Check WhatsApp delivery

### Validate
- [ ] All pages load correctly
- [ ] Language switching works
- [ ] Payments processing
- [ ] Notifications sending
- [ ] Analytics tracking

---

## 🆘 ROLLBACK PLAN

If issues occur:

### Vercel
```bash
# Rollback to previous deployment
vercel rollback
```

### Self-Hosted
```bash
# Stop service
pm2 stop imboni

# Revert to previous version
git checkout <previous-commit>
npm ci
npm run build
pm2 restart imboni
```

---

## ✅ COMPLETION

When all items are checked:
- [ ] Platform deployed
- [ ] All tests passing
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

**Deployment Complete! 🎉**

---

**Quick Reference**:
- Staging URL: `<your-vercel-staging-url>`
- Production URL: `<your-production-domain>`
- Sentry: `https://sentry.io/organizations/<your-org>`
- Supabase: `https://supabase.com/dashboard/project/<your-project>`
