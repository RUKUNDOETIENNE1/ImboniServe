# Deployment Checklist
**Imboni Serve - Site Builder & Platform Updates**  
**Version:** 2.0  
**Date:** March 15, 2026

---

## Pre-Deployment Checklist

### 1. Code Review
- [x] All TypeScript errors resolved
- [x] All feature flags seeded
- [x] Database schema synced to Supabase
- [x] API endpoints tested
- [x] Error handling middleware applied
- [x] Response helpers standardized
- [x] Environment variables documented

### 2. Database
- [x] Schema changes pushed to Supabase
- [x] CustomDomain model added
- [x] Feature flags seeded
- [x] Indexes created
- [ ] Backup created before deployment

### 3. Environment Variables
- [ ] OpenAI API key configured (see MANUAL_TASKS_NON_PROGRAMMER.md)
- [x] Supabase connection verified
- [x] IremboPay credentials set
- [ ] Twilio credentials configured (optional)
- [ ] SMTP credentials configured (optional)

### 4. Feature Flags
- [ ] Phase 1 flags enabled via admin UI
- [ ] Phase 2/3 flags disabled (autopilot will enable)
- [ ] Kill switch disabled
- [ ] Autopilot cron scheduled

### 5. Testing
- [ ] Site Builder: Template selection works
- [ ] Site Builder: Branding customization works
- [ ] Site Builder: AI copy generation works (requires OpenAI key)
- [ ] Site Builder: Publish functionality works
- [ ] Custom Domain: Request flow works
- [ ] Custom Domain: Verification instructions shown
- [ ] Referral: Code generation works
- [ ] Referral: Leaderboard displays
- [ ] Admin: Feature flags UI accessible
- [ ] Admin: Flag toggle works

---

## Deployment Steps

### Step 1: Build Application
```powershell
npm run build
```

**Expected Output:**
- Build completes without errors
- Static files generated in `.next` folder

### Step 2: Run Database Seed (First Time Only)
```powershell
npm run seed
```

**Expected Output:**
- Plans created
- Users created
- Feature flags created
- Demo data populated

### Step 3: Start Production Server
```powershell
npm start
```

**Or with PM2:**
```powershell
pm2 start npm --name "imboni-serve" -- start
pm2 save
```

### Step 4: Verify Deployment
- [ ] Application accessible at production URL
- [ ] Login works with seeded credentials
- [ ] Dashboard loads
- [ ] Site Builder accessible
- [ ] Admin feature flags accessible (ADMIN only)

---

## Post-Deployment Checklist

### 1. Smoke Tests
- [ ] Create a test business account
- [ ] Build a test mini-site
- [ ] Publish the test site
- [ ] Verify "Powered by Imboni Serve" badge present
- [ ] Test AI copy generation (if OpenAI configured)
- [ ] Request a test custom domain
- [ ] Generate a customer referral code

### 2. Monitoring Setup
- [ ] Cron jobs running (check logs)
- [ ] Autopilot feature check scheduled
- [ ] Error logging working
- [ ] Performance metrics tracking

### 3. Documentation
- [ ] MANUAL_TASKS_NON_PROGRAMMER.md shared with team
- [ ] Admin credentials shared securely
- [ ] Support team trained
- [ ] Customer-facing documentation published

### 4. Marketing
- [ ] Site Builder announcement prepared
- [ ] Referral program announcement prepared
- [ ] Demo video created
- [ ] Social media posts scheduled

---

## Rollback Plan

### If Critical Issues Occur

**Option 1: Kill Switch (Site Builder Only)**
1. Log in as ADMIN
2. Go to `/dashboard/admin/feature-flags`
3. Enable `site_builder_kill_switch`
4. All site builder features disabled immediately
5. Existing sites remain live (read-only)

**Option 2: Disable Specific Features**
1. Go to `/dashboard/admin/feature-flags`
2. Disable problematic feature flag
3. Feature becomes unavailable to users

**Option 3: Full Rollback**
1. Stop application: `pm2 stop imboni-serve`
2. Restore previous code version
3. Restore database backup (if schema changed)
4. Restart: `pm2 start imboni-serve`

---

## Monitoring Metrics

### Daily (First Week)
- [ ] Published sites count
- [ ] AI copy generation requests
- [ ] AI copy generation errors
- [ ] Custom domain requests
- [ ] Domain verification success rate
- [ ] Error logs review
- [ ] User feedback review

### Weekly
- [ ] Autopilot threshold check
- [ ] OpenAI API costs
- [ ] Twilio costs (if used)
- [ ] Database performance
- [ ] Feature adoption rates

### Monthly
- [ ] Total costs vs budget
- [ ] Feature flag autopilot status
- [ ] Template usage distribution
- [ ] Referral program performance
- [ ] Customer satisfaction scores

---

## Success Criteria

### Week 1
- [ ] 5+ businesses publish mini-sites
- [ ] 0 critical bugs
- [ ] AI success rate > 95%
- [ ] Positive user feedback

### Month 1
- [ ] 30+ published sites (Phase 2 threshold)
- [ ] 1,000+ unique visits
- [ ] 5+ custom domains connected
- [ ] Phase 2 auto-enabled (if thresholds met)

### Month 3
- [ ] 100+ published sites (Phase 3 threshold)
- [ ] 25+ custom domains
- [ ] 10,000+ weekly visits
- [ ] Phase 3 auto-enabled (if thresholds met)

---

## Known Issues & Workarounds

### Issue 1: AI Copy Generation Requires OpenAI Key
**Workaround:** Configure OpenAI API key in `.env` (see MANUAL_TASKS_NON_PROGRAMMER.md)

### Issue 2: Custom Domain Verification Takes Time
**Workaround:** Inform users DNS propagation can take up to 24 hours

### Issue 3: .tk and .ml Domains Blocked
**Workaround:** This is intentional. Inform users to use other TLDs

---

## Emergency Contacts

- **Development Team:** dev@imboni.serve
- **Emergency Hotline:** +250788917126
- **OpenAI Support:** https://help.openai.com
- **Supabase Support:** https://supabase.com/support
- **IremboPay Support:** support@irembopay.com

---

## Deployment Sign-Off

- [ ] Code reviewed and approved
- [ ] Database changes verified
- [ ] Environment variables configured
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback plan understood

**Deployed By:** _______________  
**Date:** _______________  
**Time:** _______________  
**Version:** 2.0

---

**Next Deployment:** TBD  
**Next Review:** April 15, 2026
