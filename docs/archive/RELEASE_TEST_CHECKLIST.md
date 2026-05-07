# Imboni Serve - Release Test Checklist (Web + PWA)

Use this checklist before running the SQL migration and deploying. Updated with 50% launch discount pricing and business terminology migration.

**Last Updated:** Feb 17, 2026
**Platform Version:** 2.0 (Restaurant→Business migration complete)

## 0) Environment
- [ ] `.env` configured (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL/APP_URL)
- [ ] Database up and Prisma Client generated
- [ ] Optional: Seed demo data (owner, cashier, kitchen)

## 1) PWA & Mobile Readiness
- [ ] Manifest loads at `/manifest.json` (name, icons, start_url, display=standalone)
- [ ] Service worker served at `/sw.js`
- [ ] Offline fallback shows at `/offline.html`
- [ ] Install PWA on Android (Chrome): Add to Home Screen works
- [ ] Install PWA on iOS (Safari): Add to Home Screen works
- [ ] Offline test: open dashboard routes offline → see offline page or cached content
- [ ] Outbox: perform an action offline → queued → syncs on reconnect

## 2) Public Website Pages
- [ ] Home `/` renders hero, value, CTA
- [ ] Home page shows correct strikethrough prices (Starter: 10k, Pro: 20k, Business: 135k)
- [ ] Home page uses "business" terminology (not "restaurant")
- [ ] Pricing `/pricing` shows all 6 tiers with 50% discount strikethrough
- [ ] Pricing page displays "🎉 Launch Special: 50% OFF All Plans!" banner
- [ ] Pricing toggle (monthly/annual) works and shows correct discounted prices
- [ ] Login `/login` form usable (email+password)
- [ ] Signup `/signup` form uses "Business Name" label (not "Restaurant Name")
- [ ] Signup creates business and redirects to login with success message

## 3) Authentication & Session
- [ ] Owner login works; session persists across reload
- [ ] Logout clears session and redirects to login
- [ ] Accessing protected route without session redirects to `/login`

## 4) Dashboard Core
- [ ] Dashboard `/dashboard` loads cards and recent activity
- [ ] Sales `/dashboard/sales` list filters; pagination if applicable
- [ ] New Sale `/dashboard/sales/new` validates input; creates sale
- [ ] Inventory `/dashboard/inventory` CRUD operations; low-stock highlights
- [ ] Reports `/dashboard/reports` daily/weekly/monthly render correctly
- [ ] Transactions `/dashboard/transactions` shows history
- [ ] Settings `/dashboard/settings` profile, business details, notifications, billing

## 5) Smart Dining Slips & Printing
- [ ] Slip generation from sale works; totals and VAT correct (18%)
- [ ] PDF/print formatting ok; QR link points to `${APP_URL}/slips/{id}`
- [ ] ESC/POS output (if tested on a printer) aligns and cuts paper

## 6) Supplier & Marketplace (if in scope)
- [ ] Supplier orders page `/supplier/orders` gated to supplier login
- [ ] Supplier payments page `/supplier/payments` loads
- [ ] (Optional) End-to-end PO → GRN → Document flow per AUTOPILOT_TESTING_GUIDE.md

## 7) Admin (if in scope)
- [ ] Admin dashboard loads; protected by role
- [ ] Subscriptions and affiliates pages load and filter

## 8) Internationalization (EN/RW)
- [ ] Language switch toggles EN↔RW (`LanguageSwitcher`)
- [ ] Critical UI keys reflect translation (dashboard nav, buttons)
- [ ] English locale uses "Business" terminology (not "Restaurant")
- [ ] Kinyarwanda locale uses "Ubucuruzi" for business (not "Resitora")
- [ ] `public/locales/rw.json` strings reviewed and approved by native speaker

## 9) Payments (IremboPay)
- [ ] Pricing displays 50% discounted amounts correctly
- [ ] Invoice creation uses correct discounted prices (e.g., STARTER: 10,000 not 20,000)
- [ ] Hosted checkout link opens (IremboPay)
- [ ] Checkout shows VAT-inclusive pricing with "No extra charges" message
- [ ] Success/cancel flows return to app with correct state
- [ ] MoMo push validations (phone format 07XXXXXXXX) work
- [ ] Webhook signature verification passes
- [ ] Payment status updates reflect in subscription

## 10) Security & Quality
- [ ] Authenticated API calls require session
- [ ] No sensitive data in client logs
- [ ] Basic Lighthouse scores acceptable (Performance/PWA/Accessibility/SEO)

## 11) Smoke Test Automation
- [ ] Run: `scripts\autopilot-smoke-test.bat` (server at http://localhost:3000 or set APP_URL)
- [ ] Confirm PASS summary (or review failures/skips)

## 12) Migration & Deploy (final)
- [ ] Backup database (production)
- [ ] Run raw SQL migration for raw tables:
  - `psql $DATABASE_URL -f prisma/migrations/20260216_raw_tables_business_migration.sql`
- [ ] `npx prisma migrate deploy` (if new Prisma migrations exist)
- [ ] `npx prisma generate`
- [ ] Verify all API routes use `businessId` (not `restaurantId`)
- [ ] Verify seed data reflects 50% discounted prices
- [ ] Deploy (Vercel or Docker); set environment variables in host
- [ ] Post-deploy: Verify pricing page shows discounts correctly
- [ ] Post-deploy: Test signup flow end-to-end

---

Tip: For quick checks without login, use the smoke script; for authenticated routes, ensure test credentials via env `TEST_EMAIL`/`TEST_PASSWORD` or seed demo accounts.
