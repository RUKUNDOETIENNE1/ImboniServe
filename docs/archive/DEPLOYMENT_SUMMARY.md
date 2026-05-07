# Imboni Serve - Deployment Summary

**Platform Version:** 2.0  
**Status:** Ready for Production Deployment  
**Last Updated:** Feb 17, 2026

---

## What's Been Completed

### ✅ Major Migration: Restaurant → Business
- **Database:** Prisma model renamed to `Business` with `@@map("Restaurant")` for backward compatibility
- **Code:** All `restaurantId` parameters renamed to `businessId` across services and components
- **UI:** All user-facing text updated from "restaurant" to "business"
- **Locales:** English and Kinyarwanda translations updated

### ✅ Pricing: 50% Launch Discount
- **Pricing Page:** All 6 tiers show strikethrough on original prices (doubled amounts)
- **Home Page:** Correct strikethrough prices (Starter: 10k, Pro: 20k, Business: 135k)
- **Discount Badge:** "🎉 Launch Special: 50% OFF All Plans!" banner added
- **Seed Data:** Prices in database match discounted amounts

### ✅ Payment Integration: IremboPay
- **Complete Integration:** Invoice creation, hosted checkout, MoMo push, webhook verification
- **VAT Calculation:** 18% VAT-inclusive pricing
- **Gateway Fee:** 3.42% calculated correctly
- **Status Tracking:** Real-time payment status updates via webhook

### ✅ PWA & Offline Support
- **Service Worker:** Caches critical routes, offline fallback page
- **Outbox Service:** IndexedDB queue for offline actions with auto-sync
- **Manifest:** PWA installable on Android and iOS
- **Offline Indicator:** Visual feedback for offline status and sync progress

### ✅ Internationalization (i18n)
- **Languages:** English and Kinyarwanda
- **Translation Files:** `public/locales/en.json` and `rw.json`
- **Language Switcher:** Toggle between EN ↔ RW
- **Business Terminology:** Updated in both languages

---

## Deployment Checklist Files

### 1. RELEASE_TEST_CHECKLIST.md
**Purpose:** Pre-deployment testing checklist  
**Covers:** PWA, public pages, dashboard, payments, i18n, security  
**Use:** Run through before deploying to production

### 2. WEB_DEPLOYMENT_CHECKLIST.md
**Purpose:** Web app deployment guide  
**Covers:** Vercel, Docker, VPS deployment options  
**Includes:** Environment variables, migration steps, monitoring setup

### 3. MOBILE_DEPLOYMENT_CHECKLIST.md
**Purpose:** PWA installation and mobile deployment  
**Covers:** Android/iOS installation, testing, troubleshooting  
**Includes:** User installation guide, future Play Store (TWA) option

---

## Quick Start Commands

### Local Development
```bash
# One-time setup
scripts\autopilot-setup.bat

# Start dev server
scripts\autopilot-run-dev.bat

# Run smoke tests
scripts\autopilot-smoke-test.bat http://localhost:3000
```

### Database Migration
```bash
# Backup first!
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Run raw SQL migration (Restaurant→Business)
psql $DATABASE_URL -f prisma/migrations/20260216_raw_tables_business_migration.sql

# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate
```

### Production Deployment (Vercel)
```bash
# Deploy to production
vercel --prod

# Or via Git push (if connected)
git push origin main
```

---

## Environment Variables Required

### Core (Required)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret (32+ chars)
- `NEXTAUTH_URL` - Production domain (e.g., https://imboni.rw)
- `APP_URL` - Same as NEXTAUTH_URL

### IremboPay (Required for Payments)
- `IREMBO_SECRET_KEY` - IremboPay secret key
- `IREMBO_PUBLIC_KEY` - IremboPay public key
- `IREMBO_PAYMENT_ACCOUNT` - Payment account ID
- `IREMBO_PAYMENT_ITEM_CODE` - Item code
- `IREMBO_API_BASE` - (Optional) Default: sandbox

### Optional
- `TWILIO_ACCOUNT_SID` - WhatsApp integration
- `TWILIO_AUTH_TOKEN` - WhatsApp integration
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp number
- `SMTP_*` - Email notifications

---

## Pricing Structure (50% Launch Discount)

| Plan | Original Monthly | Discounted Monthly | Original Annual/mo | Discounted Annual/mo |
|------|------------------|--------------------|--------------------|----------------------|
| STARTER | 20,000 | **10,000** | 15,000 | **7,500** |
| ESSENTIALS | 27,000 | **13,500** | 20,000 | **10,000** |
| PROFESSIONAL | 40,000 | **20,000** | 30,000 | **15,000** |
| GROWTH | 134,000 | **67,000** | 100,000 | **50,000** |
| BUSINESS | 270,000 | **135,000** | 200,000 | **100,000** |
| ENTERPRISE | 670,000 | **335,000** | 500,000 | **250,000** |

*All prices in RWF, VAT-inclusive*

---

## Post-Deployment Verification

### Critical Paths to Test
1. **Home Page** → Verify 50% discount messaging
2. **Pricing Page** → Verify all 6 tiers with strikethrough
3. **Signup** → Create business (not "restaurant")
4. **Login** → Authenticate and access dashboard
5. **Payment** → Initiate IremboPay checkout
6. **PWA Install** → Add to home screen on mobile

### Performance Targets
- Lighthouse Score: > 80
- First Contentful Paint: < 2s
- Time to Interactive: < 3s

---

## Known Limitations

### PWA on iOS
- No automatic install prompt (manual only)
- Limited service worker capabilities
- No push notifications
- 50MB storage limit

### Future Enhancements
- Google Play Store via TWA wrapper
- iOS App Store via Capacitor wrapper (if needed)
- Plan-based feature gating middleware
- Advanced analytics and monitoring

---

## Support & Troubleshooting

### Common Issues

**Issue:** Pricing shows wrong amounts  
**Fix:** Verify seed data matches discounted prices; re-run seed if needed

**Issue:** "Restaurant" terminology still visible  
**Fix:** Check locales (en.json, rw.json) and UI components

**Issue:** PWA not installing on Android  
**Fix:** Verify HTTPS, manifest valid, service worker registered

**Issue:** Payment webhook fails  
**Fix:** Check HMAC signature verification, ensure webhook URL accessible

### Debug Commands
```bash
# Check TypeScript errors
npm run build

# View database
npx prisma studio

# Check service worker registration
# DevTools → Application → Service Workers

# Test webhook locally
# Use ngrok or similar to expose localhost
```

---

## Deployment Sign-Off

- [ ] All tests pass (RELEASE_TEST_CHECKLIST.md)
- [ ] Database migration successful
- [ ] Environment variables configured
- [ ] Pricing verified (50% discount)
- [ ] PWA installable on mobile
- [ ] Payment flow tested
- [ ] Monitoring configured

**Deployed by:** _______________  
**Date:** _______________  
**Production URL:** _______________  
**Version:** 2.0

---

**Platform is production-ready! 🚀**

For detailed deployment steps, see:
- `WEB_DEPLOYMENT_CHECKLIST.md` - Web deployment
- `MOBILE_DEPLOYMENT_CHECKLIST.md` - PWA installation
- `RELEASE_TEST_CHECKLIST.md` - Testing checklist
