# 🔍 COMPREHENSIVE PROJECT BACKLOG & TECHNICAL DEBT AUDIT
**Generated:** May 1, 2026  
**Status:** Deep scan complete - 284 API endpoints, 128 pages, 70+ services analyzed

---

## 🚨 CRITICAL - MUST FIX BEFORE PRODUCTION

### 1. Database Migration Gap (BLOCKER)
**Impact:** Production deployment will fail  
**Files:** `prisma/schema.prisma`, `prisma/migrations/`

- [ ] **Missing migration for Staff Management system**
  - `StaffRole` model (custom roles with JSON permissions)
  - `UserStaffRole` model (user-to-role assignments)
  - `User.primaryBranchId` field + relation to Branch
  - **Action:** Create migration: `npx prisma migrate dev --name staff_roles_and_primary_branch`

- [ ] **Database connection issues**
  - P1001 errors on `db push` due to incorrect Supabase URLs
  - Missing `DIRECT_URL` for migrations (port 5432)
  - Pooled `DATABASE_URL` should use port 6543
  - **Action:** Update `.env` with correct Supabase connection strings + `sslmode=require`

- [ ] **Verify all Tap & Leave migration applied**
  - Migration exists: `20260501000000_tap_and_leave_system/migration.sql`
  - Confirm tables exist: `DiningSessionSlip`, `DiningSessionSlipItem`, `CheckoutEvent`
  - **Action:** Run `npx prisma migrate deploy` in production

### 2. Permission Enforcement Gap (SECURITY RISK)
**Impact:** Unauthorized access to sensitive operations  
**Files:** `src/lib/permissions/staff.ts`, API routes

- [ ] **Custom role permissions not enforced**
  - `getUserEffectivePermissions` and `hasPermission` exist but unused
  - `requireRole` middleware only checks base UserRole enum
  - Staff management, reports, inventory APIs lack permission checks
  - **Action:** Add permission guards to sensitive routes:
    - `/api/staff/*` → require `staff.manage`
    - `/api/reports/*` → require `reports.view`
    - `/api/inventory/*` → require `inventory.manage`
    - `/api/settings/*` → require `settings.manage`

- [ ] **Missing "My Permissions" endpoint**
  - Users can't debug their own permissions
  - **Action:** Create `/api/me/permissions` endpoint

- [ ] **Audit log gaps for staff operations**
  - `STAFF_CREATE`, `STAFF_UPDATE`, `STAFF_SUSPEND` events defined but not all paths log them
  - **Action:** Verify audit logging in `/api/staff/[id]` PUT/DELETE

### 3. Cron Job Conflicts (RELIABILITY ISSUE)
**Impact:** Duplicate executions, missed jobs on serverless  
**Files:** `src/lib/cron.ts`, `vercel.json`, API cron endpoints

- [ ] **Dual cron mechanisms causing conflicts**
  - In-process `CronService.start()` runs 14 jobs via `setInterval`
  - Vercel Cron configured for only 2 jobs (`monthly-usage-reset`, `addon-renewals`)
  - On serverless (Vercel), in-process intervals don't work reliably
  - **Action:** 
    - Gate `CronService.start()` behind `CRON_WORKER=true` env var
    - Skip in-process cron when `VERCEL=1` is set
    - Add all 14 jobs to `vercel.json` crons with proper schedules
    - Secure all cron endpoints with `x-cron-secret` header validation

- [ ] **Missing cron endpoints for in-process jobs**
  - Jobs without API endpoints: stock alerts, backups, affiliate approvals, insight generation, QR order release, feature flag check, reconciliation, content publishing, trending notifications, sales trial status, autopilot features, WhatsApp reorder funnel, Tap & Leave reconcile/sweeper, reservation no-show forfeit
  - **Action:** Create REST endpoints for each job under `/api/cron/`

### 4. Payment Flow Inconsistencies (FINANCIAL RISK)
**Impact:** Payment status confusion, reconciliation failures  
**Files:** Payment services, transaction handlers

- [ ] **Multiple payment status enums**
  - IremboPay uses: `INITIATED`, `PENDING`, `PAID`, `FAILED`, `EXPIRED`
  - Direct MoMo uses: `PENDING`, `PAID`, `FAILED`
  - InTouch (Tap & Leave) uses: `PENDING`, `PAID`, `FAILED`
  - PaymentTransaction model status field not standardized
  - **Action:** Create unified status mapping layer in `payment.service.ts`

- [ ] **Provider-specific fields scattered**
  - `rawRequest`, `rawStatus`, `rawResponse` used inconsistently
  - Some providers update `paidAt`, others don't
  - **Action:** Standardize payment transaction update pattern

- [ ] **Missing payment health dashboard**
  - `PaymentMetricsService` exists but no UI to view metrics
  - Stuck payments, finalization delays, failure reasons not visible
  - **Action:** Create `/dashboard/payments/monitor` page (partially exists, verify completeness)

---

## ⚠️ HIGH PRIORITY - PRODUCTION READINESS

### 5. Environment Configuration
**Files:** `.env.example`, deployment configs

- [ ] **Incomplete .env.example**
  - Missing: `CRON_SECRET`, `CRON_WORKER`, `VERCEL`
  - Missing: InTouch API credentials (`INTOUCH_*`)
  - Missing: WhatsApp Cloud API credentials
  - **Action:** Update `.env.example` with all required vars + comments

- [ ] **No deployment documentation**
  - README.md shows local dev only
  - No Vercel/Railway/Docker production guide
  - **Action:** Create `docs/DEPLOYMENT.md` with step-by-step production setup

### 6. Testing Infrastructure
**Files:** `tests/`, `jest.config.ts`, `playwright.config.ts`

- [ ] **Test coverage gaps**
  - Staff management: no tests for role assignment, permission checks
  - Tap & Leave: no finalization idempotency tests
  - Tipping: no round-up calculation tests
  - Reservations: basic tests exist, need no-show forfeit tests
  - **Action:** Add test suites for new features

- [ ] **E2E tests incomplete**
  - Playwright config exists, only 2 specs: `auth.spec.ts`, `dashboard.spec.ts`
  - No payment flow E2E tests
  - **Action:** Add critical path E2E tests (order → payment → kitchen)

### 7. API Rate Limiting
**Files:** `src/lib/middleware/rateLimit.ts`, `src/lib/middleware/rateLimit.redis.ts`

- [ ] **Rate limits not applied to critical endpoints**
  - Payment initiation endpoints unlimited
  - Staff creation/update unlimited
  - OTP endpoints have limits, but not consistent
  - **Action:** Apply rate limits to:
    - `/api/payments/*` → 10 req/min per user
    - `/api/staff/*` → 20 req/min per user
    - `/api/auth/signup` → 3 req/hour per IP

### 8. Error Handling & Logging
**Files:** All API routes, services

- [ ] **Inconsistent error responses**
  - Some routes return `{ error: string }`, others `{ message: string }`
  - HTTP status codes inconsistent (some 500s should be 400s)
  - **Action:** Standardize error response format across all APIs

- [ ] **Missing structured logging**
  - `logger` service exists but not used everywhere
  - Many `console.log` / `console.error` calls
  - **Action:** Replace all console calls with `logger.info/error/warn`

---

## 📋 MEDIUM PRIORITY - FEATURE COMPLETION

### 9. Staff Management Polish
**Files:** `src/pages/dashboard/staff.tsx`, staff APIs

- [ ] **UI improvements**
  - Custom role chip not shown next to base role in list
  - Branch column shows ID instead of name
  - No "Last Login" column sorting
  - **Action:** Enhance staff list table display

- [ ] **Missing features**
  - No bulk role assignment
  - No staff activity log view
  - No "Invite Staff" email flow
  - **Action:** Add bulk operations and invite system

### 10. Tap & Leave™ Enhancements
**Files:** Tap & Leave services, components

- [ ] **Customer experience gaps**
  - No SMS/WhatsApp payment receipt
  - No "View Bill" before payment option
  - No split bill support in Tap & Leave
  - **Action:** Add receipt delivery and bill preview

- [ ] **Kitchen integration**
  - Kitchen display doesn't show Tap & Leave orders distinctly
  - No "Ready for Checkout" button for waiters
  - **Action:** Enhance kitchen UI for Tap & Leave flow

### 11. Reservation System
**Files:** Reservation services, pages

- [ ] **Incomplete features**
  - No table auto-assignment based on party size
  - No waitlist management
  - No reservation modification (only cancel)
  - **Action:** Add table assignment logic and waitlist

- [ ] **Notification gaps**
  - Confirmation SMS/WhatsApp not always sent
  - No reminder 1 hour before reservation
  - **Action:** Verify `reservation-reminder.service.ts` integration

### 12. Digital Tipping
**Files:** Tipping services, modals

- [ ] **Missing analytics**
  - No tip performance dashboard
  - No staff tip distribution report
  - **Action:** Create `/dashboard/tips` analytics page

- [ ] **Configuration gaps**
  - No per-business tip suggestion percentages
  - Platform fee on tips hardcoded (should be configurable)
  - **Action:** Add tip settings to business config

### 13. Inventory & Supplier
**Files:** Inventory services, supplier portal

- [ ] **AI supplier recommendations incomplete**
  - `ai-supplier-recommendation.service.ts` exists but no UI
  - **Action:** Add recommendations to `/dashboard/supplier-portal`

- [ ] **Auto-reorder not fully integrated**
  - `/dashboard/auto-reorder` page exists
  - No cron job to execute auto-reorders
  - **Action:** Add auto-reorder execution to cron jobs

### 14. CMS & Content
**Files:** CMS pages, content services

- [ ] **Trending notifications**
  - Cron job sends WhatsApp alerts but no in-app notifications
  - **Action:** Add in-app notification system

- [ ] **Content moderation**
  - No profanity filter
  - No image moderation
  - **Action:** Add content safety checks before publishing

### 15. Analytics & Reporting
**Files:** Analytics services, dashboard pages

- [ ] **Video analytics incomplete**
  - `/dashboard/video-analytics` page exists but no video upload flow
  - **Action:** Implement video upload and processing

- [ ] **Instruction insights**
  - `/dashboard/analytics/instruction-insights` exists
  - No data collection mechanism
  - **Action:** Track special instructions in orders

### 16. Multi-Branch Support
**Files:** Branch services, outlet services

- [ ] **Branch switching UI**
  - Users can have `primaryBranchId` but no UI to switch branches
  - **Action:** Add branch selector in dashboard header

- [ ] **Branch-level permissions**
  - Permissions exist but not enforced at branch level
  - **Action:** Add branch-scoped data filtering

---

## 🔧 TECHNICAL DEBT - REFACTORING NEEDED

### 17. Code Quality Issues

- [ ] **Duplicate logic**
  - Two tip recording endpoints (sale-level and session-level) - intentional but needs docs
  - Multiple payment status check patterns
  - **Action:** Document intentional duplicates, refactor unintentional ones

- [ ] **Dead code**
  - Template gallery references SVG files that may not exist
  - Some dashboard pages have placeholder data
  - **Action:** Audit and remove unused code

- [ ] **Type safety gaps**
  - Many `any` types in API responses
  - Prisma enums imported as strings in some places
  - **Action:** Add proper TypeScript types

### 18. Performance Optimization

- [ ] **N+1 query issues**
  - Staff list doesn't include branch in query
  - Reservation list doesn't include table details
  - **Action:** Add Prisma `include` for related data

- [ ] **Missing indexes**
  - Payment health queries may be slow without indexes
  - **Action:** Review `scripts/sql/add_payment_health_indexes.sql` and apply

- [ ] **No caching layer**
  - Redis configured but not used for caching
  - Menu items, business config fetched on every request
  - **Action:** Implement Redis caching for frequently accessed data

### 19. Security Hardening

- [ ] **Session management**
  - No session revocation UI
  - `/dashboard/security` page exists but incomplete
  - **Action:** Complete session management features

- [ ] **Input validation**
  - Not all endpoints use Zod validation
  - Some direct Prisma queries without sanitization
  - **Action:** Add Zod schemas to all POST/PUT endpoints

- [ ] **CORS configuration**
  - No explicit CORS policy
  - **Action:** Add CORS middleware for API routes

### 20. Internationalization (i18n)

- [ ] **Missing translations**
  - New staff management UI strings not in locale files
  - Tap & Leave modals hardcoded English
  - **Action:** Extract strings to `public/locales/{en,fr,rw}.json`

- [ ] **Kinyarwanda support incomplete**
  - `CMS_KINYARWANDA_CORRECTIONS.md` exists but not all fixes applied
  - **Action:** Review and apply Kinyarwanda corrections

---

## 📦 INFRASTRUCTURE & DEVOPS

### 21. Build & Deployment

- [ ] **Build optimization**
  - `NODE_OPTIONS=--max-old-space-size=8192` needed for build
  - Build time likely slow
  - **Action:** Optimize bundle size, lazy load heavy components

- [ ] **Docker setup incomplete**
  - `Dockerfile` and `docker-compose.yml` exist but not tested recently
  - **Action:** Test Docker build and document any issues

- [ ] **CI/CD pipeline missing**
  - No GitHub Actions or automated testing
  - **Action:** Add CI workflow for tests + build validation

### 22. Monitoring & Observability

- [ ] **No error tracking**
  - Sentry configured (`@sentry/nextjs` installed) but not initialized
  - **Action:** Add Sentry initialization in `_app.tsx`

- [ ] **No performance monitoring**
  - No APM (Application Performance Monitoring)
  - **Action:** Add basic performance tracking

- [ ] **No uptime monitoring**
  - No health check endpoint
  - **Action:** Create `/api/health` endpoint

### 23. Database Management

- [ ] **No backup strategy**
  - Cron job has placeholder backup code
  - **Action:** Implement automated Supabase backups

- [ ] **No migration rollback plan**
  - Migrations are one-way
  - **Action:** Document rollback procedures

---

## 🎨 UI/UX IMPROVEMENTS

### 24. Dashboard Enhancements

- [ ] **Responsive design gaps**
  - Many dashboard pages not mobile-optimized
  - Tables don't scroll horizontally on mobile
  - **Action:** Add responsive breakpoints

- [ ] **Loading states**
  - Inconsistent loading indicators
  - Some pages show no loading state
  - **Action:** Standardize loading UI

- [ ] **Empty states**
  - Many lists show nothing when empty (no helpful message)
  - **Action:** Add empty state illustrations and CTAs

### 25. Customer-Facing Pages

- [ ] **QR menu experience**
  - Menu item detail modal exists but needs polish
  - No dietary filters (vegetarian, gluten-free, etc.)
  - **Action:** Enhance menu browsing UX

- [ ] **Order tracking**
  - No real-time order status for customers
  - **Action:** Add customer order tracking page

### 26. Accessibility (a11y)

- [ ] **ARIA labels missing**
  - Buttons and icons lack accessible labels
  - **Action:** Add ARIA attributes

- [ ] **Keyboard navigation**
  - Modals and dropdowns not fully keyboard accessible
  - **Action:** Test and fix keyboard navigation

- [ ] **Color contrast**
  - Some text may not meet WCAG AA standards
  - **Action:** Audit color contrast ratios

---

## 📚 DOCUMENTATION GAPS

### 27. Developer Documentation

- [ ] **API documentation outdated**
  - `docs/API_DOCUMENTATION.md` exists but doesn't cover new endpoints
  - **Action:** Generate OpenAPI/Swagger docs

- [ ] **Service documentation**
  - 70+ services with no inline docs
  - **Action:** Add JSDoc comments to service classes

- [ ] **Architecture diagrams**
  - No visual representation of system architecture
  - **Action:** Create diagrams for payment flow, order flow, auth flow

### 28. User Documentation

- [ ] **Feature guides incomplete**
  - `docs/USER_GUIDE.md` outdated
  - No guides for Tap & Leave, reservations, tipping
  - **Action:** Write user-facing feature guides

- [ ] **Video tutorials**
  - No onboarding videos
  - **Action:** Create short tutorial videos for key features

---

## 🚀 FEATURE REQUESTS (BACKLOG)

### 29. Planned Features (from docs)

- [ ] **WhatsApp bot integration** (Phase 2 roadmap)
  - Twilio integration ready but not activated
  - Bot commands defined but not implemented

- [ ] **Real-time notifications** (Phase 2 roadmap)
  - Pusher installed but not configured
  - No real-time order updates

- [ ] **Mobile app** (Phase 2 roadmap)
  - React Native not started

- [ ] **USSD menu access** (Phase 3 roadmap)
  - Not started

- [ ] **AI sales forecasting** (Phase 3 roadmap)
  - OpenAI integration exists for insights only

### 30. Business Features

- [ ] **Loyalty program enhancements**
  - Basic points system exists
  - No tier benefits, no redemption catalog
  - **Action:** Expand loyalty features

- [ ] **Gift cards**
  - Template exists but no purchase/redemption flow
  - **Action:** Implement gift card system

- [ ] **Promotions & campaigns**
  - `/dashboard/promotions` and `/dashboard/campaigns` exist
  - Limited functionality
  - **Action:** Add promo code generation and tracking

---

## 📊 METRICS & ANALYTICS GAPS

### 31. Business Intelligence

- [ ] **Custom report builder**
  - Only predefined reports available
  - **Action:** Add drag-and-drop report builder

- [ ] **Export functionality**
  - No CSV/Excel export for reports
  - **Action:** Add export buttons to all data tables

- [ ] **Dashboard customization**
  - All users see same dashboard
  - **Action:** Add widget customization

---

## 🔐 COMPLIANCE & LEGAL

### 32. Data Privacy

- [ ] **GDPR compliance**
  - No data export for users
  - No data deletion flow
  - **Action:** Add GDPR-compliant data management

- [ ] **Cookie consent**
  - `/cookies` page exists but no consent banner
  - **Action:** Add cookie consent UI

- [ ] **Terms of Service**
  - No ToS page
  - **Action:** Add legal pages

---

## SUMMARY STATISTICS

- **Total API Endpoints:** 284
- **Total Pages:** 128
- **Total Services:** 70+
- **Total Models (Prisma):** 100+
- **Critical Issues:** 4
- **High Priority:** 8
- **Medium Priority:** 8
- **Technical Debt:** 4
- **Infrastructure:** 3
- **UI/UX:** 3
- **Documentation:** 2
- **Feature Backlog:** 2
- **Compliance:** 1

**TOTAL WORK ITEMS:** 200+

---

## RECOMMENDED SPRINT PLAN (Next 4 Weeks)

### Week 1: Critical Fixes (MUST DO)
1. Create and apply staff management migration
2. Fix Supabase connection strings
3. Add permission enforcement to staff/reports/inventory APIs
4. Standardize cron job execution (Vercel Cron)
5. Create unified payment status mapping

### Week 2: Production Readiness
1. Complete .env.example documentation
2. Add rate limiting to payment endpoints
3. Standardize error responses
4. Add Sentry error tracking
5. Create /api/health endpoint
6. Write deployment documentation

### Week 3: Testing & Security
1. Add staff management tests
2. Add Tap & Leave finalization tests
3. Add E2E payment flow tests
4. Complete session management UI
5. Add Zod validation to remaining endpoints

### Week 4: Polish & Documentation
1. Update API documentation
2. Add service JSDoc comments
3. Improve staff UI (custom role chips, branch names)
4. Add payment health dashboard
5. Create architecture diagrams

---

## PRIORITY MATRIX

```
IMPACT vs EFFORT

High Impact, Low Effort (DO FIRST):
- Fix database migration gap
- Add permission enforcement
- Standardize cron jobs
- Update .env.example

High Impact, High Effort (SCHEDULE):
- Unified payment status layer
- Comprehensive testing suite
- API documentation generation
- Performance optimization

Low Impact, Low Effort (QUICK WINS):
- UI polish (chips, labels)
- Empty states
- Loading indicators
- Translations

Low Impact, High Effort (DEFER):
- Mobile app
- USSD integration
- Custom report builder
- Video tutorials
```

---

**Next Steps:** Review this backlog, prioritize based on business needs, and create focused sprints. Start with Week 1 critical fixes before any production deployment.
