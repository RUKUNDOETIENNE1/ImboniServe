# Deployment Integrity Audit & Route Consistency Verification

**Date:** 2026-07-24  
**Commit Audited:** `a908406` (fix(build): resolve missing service-intelligence component imports via simple-components barrel)  
**Production Domain:** https://imboniserve.com  
**Production Build ID:** `IRMLo_CODUSS6KnhGJBoA`  
**Git Status:** Clean working tree, HEAD at a908406

---

## Task 1 — Route Audit: Complete Route Map

### Routing Architecture
- **Pages Router** (`src/pages/`): Primary routing system for all pages
- **App Router** (`src/app/`): Contains only API routes (8 `route.ts` files) and a root `layout.tsx`. Zero `page.tsx` files.
- **No page-level route conflicts** between `app/` and `pages/`

### Public Route Map

| Route | Source File | Rendering | Layout | PublicLayout? |
|-------|------------|-----------|--------|---------------|
| `/` | `src/pages/index.tsx` (1514 lines) | Static (autoExport) | **Inline** | **NO** |
| `/pricing` | `src/pages/pricing.tsx` (195 lines) | Static (autoExport) | PublicLayout | YES |
| `/faq` | `src/pages/faq.tsx` (180 lines) | Client-side | PublicLayout | YES |
| `/privacy` | `src/pages/privacy.tsx` (365 lines) | Client-side | PublicLayout | YES |
| `/terms` | `src/pages/terms.tsx` (411 lines) | Client-side | PublicLayout | YES |
| `/cookies` | `src/pages/cookies.tsx` (354 lines) | Client-side | PublicLayout | YES |
| `/service-terms` | `src/pages/service-terms.tsx` (501 lines) | Client-side | PublicLayout | YES |
| `/unsubscribe` | `src/pages/unsubscribe.tsx` (70 lines) | Client-side | PublicLayout | YES |
| `/refer` | `src/pages/refer/index.tsx` (355 lines) | Client-side | PublicLayout | YES |
| `/affiliate/program` | `src/pages/affiliate/program.tsx` (338 lines) | Client-side | PublicLayout | YES |
| `/discover` | `src/pages/discover/index.tsx` (209 lines) | Client-side | **Inline** | **NO** |
| `/discover/feed` | `src/pages/discover/feed.tsx` (275 lines) | Client-side | **None** | **NO** |
| `/discover/map` | `src/pages/discover/map.tsx` (210 lines) | Client-side | **None** | **NO** |
| `/discover/[slug]` | `src/pages/discover/[slug].tsx` (187 lines) | Client-side | **None** | **NO** |
| `/store` | `src/pages/store/index.tsx` (344 lines) | Client-side | **Inline header** | **NO** |
| `/login` | `src/pages/login.tsx` (482 lines) | Client-side | Auth (inline) | N/A (expected) |
| `/signup` | `src/pages/signup.tsx` (337 lines) | Client-side | Auth (inline) | N/A (expected) |
| `/forgot-password` | `src/pages/forgot-password.tsx` (139 lines) | Client-side | Auth (inline) | N/A (expected) |
| `/reset-password` | `src/pages/reset-password.tsx` (221 lines) | Client-side | Auth (inline) | N/A (expected) |
| `/explore-businesses` | `src/pages/explore-businesses.tsx` | SSR redirect → `/discover` | N/A | N/A |
| `/business/[id]` | `src/pages/business/[id].tsx` | SSR redirect → `/discover/[slug]` | N/A | N/A |
| `/q/[token]` | `src/pages/q/[token].tsx` | SSR redirect → QR target | N/A | N/A |
| `/t/[id]` | `src/pages/t/[id].tsx` (267 lines) | SSR + Client | QR ordering | N/A (functional) |
| `/plugins/qr-menu/[menuId]` | `src/pages/plugins/qr-menu/[menuId].tsx` | SSR | QR menu | N/A (functional) |
| `/test-swc` | `src/pages/test-swc.tsx` (14 lines) | Client-side | DashboardLayout | **Should not exist** |

### Authenticated Route Map (not public)

| Route Prefix | Layout | Notes |
|-------------|--------|-------|
| `/dashboard/*` | DashboardLayout | 90+ files, auth-gated |
| `/admin/*` | AdminLayout | 25 files, auth-gated |
| `/billing/*` | Inline auth | Auth-gated |
| `/affiliate/index` | Inline auth | Auth-gated portal |
| `/affiliate/dashboard` | Inline auth | Auth-gated |
| `/supplier/*` | DashboardLayout | Auth-gated |
| `/setup/*` | Inline | Auth-gated wizard |

### API Routes
- `src/pages/api/` — 461 items (Pages Router API)
- `src/app/api/` — 8 route.ts files (App Router API)
- No path conflicts between the two API directories

---

## Task 2 — Duplicate Route Detection

**Result: NO page-level duplicate routes found.**

- `src/app/` contains zero `page.tsx` files
- All pages are served exclusively from `src/pages/`
- 8 App Router API routes exist alongside Pages Router API routes but serve different paths:
  - `/api/ai-copilot/conversation`
  - `/api/daily-briefings/export`, `/api/daily-briefings/generate`
  - `/api/kitchen-intelligence/export`
  - `/api/menu-intelligence/export`
  - `/api/multi-location-intelligence/export`, `/api/multi-location-intelligence/generate`
  - `/api/service-intelligence/export`

---

## Task 3 — Routing Conflict Audit

### next.config.js
- **i18n:** Configured with locales `['en', 'fr', 'rw']`, defaultLocale `en`, localeDetection false
- **output:** `standalone`
- **basePath:** Not set (default `/`)
- **trailingSlash:** Not set (default `false`)
- **rewrites:** `/favicon.ico` → `/imgs/imboni-serve-favicon.png`
- **redirects:** None configured
- **headers:** Security headers (dev/prod variants), cache headers for static assets
- **Sentry:** Conditionally wrapped when DSN is configured

### middleware.ts
- **Function:** Captures `?ref=CODE` and `?inv=INV-XXXXXXXX` params, sets 30-day cookies
- **Request ID:** Adds `x-request-id` header for observability
- **Matcher:** All routes except `api`, `_next/static`, `_next/image`, `favicon.ico`, and image files
- **No redirects or rewrites in middleware**

### vercel.json
- **Crons:** 9 daily cron jobs (Hobby plan compatible, spread across hours 2-10)
- **buildCommand:** `npx prisma generate && next build`
- **functions:** maxDuration overrides for 3 cron endpoints
- **No routing conflicts**

**Routing Conflict Verdict: NO conflicts detected.**

---

## Task 4 — Static Artifact Audit

### Build Cache
- `.next/cache/` directory exists with 75 entries — normal Next.js build cache, not served

### Public Assets
- `public/manifest.json` — PWA manifest
- `public/offline.html` — Offline fallback page
- `public/sw.js` — Service worker
- `public/docs/go-live-checklist.html` — Static doc
- `public/imgs/` — 13 image files
- `public/locales/` — 3 i18n JSON files (en, fr, rw)
- `public/sounds/.gitkeep` — Empty placeholder
- `public/templates/` — 8 SVG templates
- `public/uploads/.gitkeep` — Empty placeholder

### Issues Found
- **Double-extension files:** `imboni-serve-favoricon-pwa-512.png.png` (also has typo "favoricon"), `imboni-serve-logo.png.png`
- **No stale HTML artifacts** or cached build output in public/

---

## Task 5 — Component Resolution Audit: Homepage

### Render Chain
```
Request → middleware.ts (ref/inv capture) → pages/_app.tsx (providers) → pages/index.tsx
```

### Homepage Structure (1514 lines)
- **Lines 1-55:** Imports (React, Next.js, lucide-react, config, hooks, components)
- **Lines 56-198:** Data definitions (features array, heroSlides, testimonials, plans)
- **Lines 200-515:** Component state + inline `<Head>` + inline `<nav>` + mobile menu
- **Lines 517-1417:** Page content sections (hero, features, pricing, testimonials, growth, payments, final CTA)
- **Lines 1418-1514:** Inline `<footer>` + widget components

### Key Finding
**Homepage does NOT use PublicLayout.** It has a completely self-contained:
- `<Head>` with its own meta tags, JSON-LD structured data
- `<nav>` with different links, different Solutions dropdown items, dark mode toggle, mobile menu
- `<footer>` with NewsletterSignup, SocialShare, InstallAppButton — features absent from PublicLayout footer

### Navigation Comparison

| Feature | Homepage Nav | PublicLayout Nav |
|---------|-------------|-----------------|
| Features link | `/#features` | `/#features` |
| Pricing link | `/#pricing` | `/pricing` |
| Solutions dropdown items | Discover, Supplier Marketplace | Site Builder, Marketplace, Store, List Your Business, Referral Program |
| Store link | absent | `/#store` |
| Refer link | absent | `/refer` (orange button) |
| Discover link | present | present |
| Contact | WhatsApp link | WhatsApp link |
| Dark mode toggle | YES | NO |
| Mobile menu | YES | NO |
| Language switcher | YES | YES |
| Sign in / Sign up | YES | YES |
| PWA install indicator | YES | NO |

### Footer Comparison

| Feature | Homepage Footer | PublicLayout Footer |
|---------|----------------|-------------------|
| NewsletterSignup | YES | NO |
| SocialShare | YES | NO |
| InstallAppButton | YES | NO |
| CookieConsentBanner | YES | YES |
| Copyright | `© year Imboni Serve. Built for...` | `© year Imboni Serve. Built for...` |
| Legal links | Terms, Privacy, Cookies, Cookie Prefs, Service Terms | Same |
| Powered by ICTHubs | YES | YES |

---

## Task 6 — Pricing Page Audit

### Render Chain
```
Request → middleware.ts → pages/_app.tsx → pages/pricing.tsx → PublicLayout → page content
```

### Data Source
- `PRICING_PLANS` from `@/config/pricing` — single source of truth
- Homepage also imports from same `@/config/pricing` — **consistent**
- No duplicate pricing data sources found

### Pricing Page Structure (195 lines)
- Uses `PublicLayout` correctly
- Has `CurrencySelector` component
- Has billing toggle (monthly/annual)
- Renders plans from unified config

**Pricing Page Verdict: Correctly architected. No issues found.**

---

## Task 7 — Repository Integrity Audit

### Issues Found

| File | Issue | Severity |
|------|-------|----------|
| `src/pages/test-swc.tsx` | Test page accessible in production at `/test-swc`, uses DashboardLayout | Medium |
| `src/app/dashboard/` | Empty orphaned directory (no files) | Low |
| `public/imgs/imboni-serve-favoricon-pwa-512.png.png` | Double extension + typo ("favoricon" should be "favicon") | Low |
| `public/imgs/imboni-serve-logo.png.png` | Double extension | Low |
| `src/pages/supplier/index.tsx` | Static mock data dashboard (hardcoded values, not connected to API) | Low (not public-facing) |

### Redirect/Alias Pages (functionally correct)
- `src/pages/explore-businesses.tsx` — Permanent redirect to `/discover`
- `src/pages/business/[id].tsx` — Server-side redirect to `/discover/[slug]`
- `src/pages/q/[token].tsx` — QR code redirect

---

## Task 8 — Build Integrity

### Production Build Verification
- **Build ID:** `IRMLo_CODUSS6KnhGJBoA`
- **Both `/` and `/pricing`:** `nextExport: true, autoExport: true` (statically exported)
- **CSS:** Both pages load `/_next/static/css/819160826d358a75.css`
- **_app chunk:** Both pages load `pages/_app-07dfe741f18e3a07.js`
- **Page chunks:** `pages/index-e888b1337f726501.js`, `pages/pricing-f20aa99bea75f013.js`
- **No App Router page chunks** — consistent with zero `page.tsx` in `app/`

**Build Integrity Verdict: Compiled routes match repository structure.**

---

## Task 9 — Deployment Integrity

### Chain Verification
```
Production Domain (https://imboniserve.com)
  → Vercel Deployment (buildId: IRMLo_CODUSS6KnhGJBoA)
    → Git Commit a908406 (HEAD, clean working tree)
      → Repository at src/pages/ (Pages Router)
        → Rendered Application (autoExport static pages)
```

- Git HEAD: `a908406337b158e9033c1aed70b3b556e72ba18f`
- `git status --short`: Clean (no uncommitted changes)
- Production HTML confirms Pages Router with correct build ID
- Both `/` and `/pricing` serve from the same build

**Deployment Integrity Verdict: Production matches commit a908406.**

---

## Task 10 — Runtime Verification

### Production vs Repository Comparison

| Aspect | Production | Repository | Match? |
|--------|-----------|------------|--------|
| Homepage route | `pages/index` (from __NEXT_DATA__) | `src/pages/index.tsx` | YES |
| Pricing route | `pages/pricing` (from __NEXT_DATA__) | `src/pages/pricing.tsx` | YES |
| Build ID | `IRMLo_CODUSS6KnhGJBoA` | N/A (build-time) | N/A |
| CSS file | `819160826d358a75.css` | Build output | YES |
| _app chunk | `_app-07dfe741f18e3a07.js` | Build output | YES |
| Locales | `en, fr, rw` | next.config.js i18n | YES |
| Favicon | `/imgs/imboni-serve-favicon.png` | `public/imgs/imboni-serve-favicon.png` | YES |
| Manifest | `/manifest.json` | `public/manifest.json` | YES |

**Runtime Verification Verdict: Production serves exactly what the repository defines.**

---

## Task 11 — Public Route Consistency

### Pages Using PublicLayout (9 pages — CORRECT)
1. `/pricing` — `src/pages/pricing.tsx`
2. `/faq` — `src/pages/faq.tsx`
3. `/privacy` — `src/pages/privacy.tsx`
4. `/terms` — `src/pages/terms.tsx`
5. `/cookies` — `src/pages/cookies.tsx`
6. `/service-terms` — `src/pages/service-terms.tsx`
7. `/unsubscribe` — `src/pages/unsubscribe.tsx`
8. `/refer` — `src/pages/refer/index.tsx`
9. `/affiliate/program` — `src/pages/affiliate/program.tsx`

### Pages Bypassing PublicLayout (3 pages — ARCHITECTURAL INCONSISTENCY)
1. **`/` (homepage)** — `src/pages/index.tsx` — completely inline nav + footer
2. **`/discover`** — `src/pages/discover/index.tsx` — completely inline nav + footer
3. **`/store`** — `src/pages/store/index.tsx` — completely inline header bar

### Pages Without PublicLayout (expected — auth/functional)
- `/login`, `/signup`, `/forgot-password`, `/reset-password` — auth pages with their own layout
- `/dashboard/*`, `/admin/*`, `/billing/*` — authenticated layouts
- `/t/[id]`, `/q/[token]`, `/order/*`, `/pre-order/*` — functional/redirect pages
- `/plugins/qr-menu/[menuId]` — specialized public QR menu

### Navigation Implementation Count: **4 separate implementations**
1. `PublicLayout.tsx` — used by 9 pages
2. `index.tsx` (homepage) — inline, 1 page
3. `discover/index.tsx` — inline, 1 page
4. `store/index.tsx` — inline header, 1 page

### Footer Implementation Count: **3 separate implementations**
1. `PublicLayout.tsx` — used by 9 pages
2. `index.tsx` (homepage) — inline, with NewsletterSignup + SocialShare
3. `discover/index.tsx` — inline, minimal

---

## Phase 2 — Findings Classification

### Category A — Architectural Inconsistencies (MUST FIX before RC1)

| # | Finding | Impact |
|---|---------|--------|
| A1 | Homepage `/` bypasses PublicLayout — has inline nav, footer, Head | 4 separate nav implementations, inconsistent branding |
| A2 | `/discover` bypasses PublicLayout — has inline nav and footer | Different nav links, different footer from PublicLayout |
| A3 | `/store` bypasses PublicLayout — has inline header bar | Completely different visual style and navigation |
| A4 | 4 separate navigation implementations exist for public pages | No single source of truth for navigation |
| A5 | 3 separate footer implementations exist for public pages | No single source of truth for footer |
| A6 | `test-swc.tsx` is a test page accessible in production | Should not be deployed |
| A7 | `src/app/dashboard/` is an empty orphaned directory | Repository clutter |
| A8 | Image files with double extensions: `imboni-serve-favoricon-pwa-512.png.png`, `imboni-serve-logo.png.png` | Incorrect filenames, potential broken references |

### Category B — UI/Feature Differences (product decisions, NOT architectural)

| # | Finding | Notes |
|---|---------|-------|
| B1 | Homepage Solutions dropdown has different items than PublicLayout | Content decision — will be resolved by A1 fix |
| B2 | Homepage has dark mode toggle, PublicLayout doesn't | Feature gap — will be resolved by unifying into PublicLayout |
| B3 | Homepage has mobile menu, PublicLayout doesn't | Feature gap — will be resolved by unifying into PublicLayout |
| B4 | Homepage footer has NewsletterSignup + SocialShare, PublicLayout doesn't | Feature gap — will be resolved by unifying into PublicLayout |
| B5 | Store page has cart icon and dashboard link | Feature-specific to store — can remain as page content within PublicLayout |
| B6 | Discover page has search bar in nav | Feature-specific to discover — can remain as page content within PublicLayout |
| B7 | Different button text between nav implementations | Will be resolved by unification |

---

## Phase 3 — Architectural Fix Plan

### Fix 1: Enhance PublicLayout to include homepage features
- Add dark mode toggle (from `useTheme` hook)
- Add mobile menu
- Add NewsletterSignup + SocialShare to footer
- Add InstallAppButton + PWAInstallPrompt
- Add PublicSupportWidget
- This ensures no functionality is lost when homepage switches to PublicLayout

### Fix 2: Refactor homepage to use PublicLayout
- Remove inline `<Head>`, `<nav>`, mobile menu, `<footer>`
- Wrap page content (hero through final CTA) in `<PublicLayout>`
- Keep homepage-specific content sections as-is

### Fix 3: Refactor /discover to use PublicLayout
- Remove inline `<nav>` and `<footer>`
- Wrap content in `<PublicLayout>`
- Keep search bar as page content within layout

### Fix 4: Refactor /store to use PublicLayout
- Remove inline header bar
- Wrap content in `<PublicLayout>`
- Keep cart and store-specific UI as page content

### Fix 5: Remove test-swc.tsx
- Delete `src/pages/test-swc.tsx`

### Fix 6: Remove empty app/dashboard/ directory
- Delete `src/app/dashboard/`

### Fix 7: Rename double-extension image files
- `imboni-serve-favoricon-pwa-512.png.png` → `imboni-serve-favicon-pwa-512.png`
- `imboni-serve-logo.png.png` → `imboni-serve-logo.png`
- Update any references

---

## Root Cause Analysis

The root cause of the deployment integrity discrepancies is **not** a deployment or build issue. Production at `https://imboniserve.com` exactly matches commit `a908406`. The issue is an **architectural inconsistency in the repository itself**: the homepage, discover, and store pages were developed with self-contained inline navigation and footer implementations, while all other public pages correctly use the shared `PublicLayout` component. This results in:

1. **Inconsistent navigation** across public pages (different links, different dropdown items)
2. **Inconsistent footer** (some pages have newsletter signup, others don't)
3. **Inconsistent features** (dark mode toggle only on homepage, mobile menu only on homepage)
4. **No single source of truth** for public page chrome

The fix is to unify all public pages under `PublicLayout`, enhancing it to include the features currently only present in the homepage's inline implementation.
