# Localization Changelog — ImboniServe v1.0

All notable localization changes are documented in this file.

---

## 2026-07-30 — Pass 2: Hardcoded String Sweep & Terminology Audit

### Pages Localized (hardcoded strings → `t()` calls)
- **`src/pages/forgot-password.tsx`**: Replaced all hardcoded UI text with `t()` calls (title, description, labels, button text, success/error messages, links).
- **`src/pages/reset-password.tsx`**: Added `useTranslation` import; replaced all hardcoded UI text with `t()` calls (title, labels, password validation messages, placeholders, button text, success/error states).
- **`src/pages/500.tsx`**: Added `useTranslation`; localized "Server Error", description, and "Go Back Home" CTA.
- **`src/pages/_error.tsx`**: Added `getTranslation` for SSR; localized error messages for both server and client error states.
- **`src/pages/welcome.tsx`**: Localized "Powered by ICTHubs" footer link.
- **`src/components/PublicLayout.tsx`**: Localized SocialShare text in footer.

### Locale Keys Added (all 3 files: en.json, fr.json, rw.json)
- **Auth block** (30 keys): `forgot_failed`, `network_error`, `check_email`, `reset_link_sent`, `reset_link_will_arrive`, `reset_link_expires`, `back_to_login`, `forgot_password_title`, `forgot_password_desc`, `send_reset_link`, `invalid_reset_link`, `password_min_length`, `password_uppercase`, `password_lowercase`, `password_number`, `passwords_no_match`, `fix_password_requirements`, `reset_failed`, `reset_success_title`, `reset_success_desc`, `redirecting_to_login`, `go_to_login`, `reset_password_title`, `enter_new_password_for`, `new_password`, `enter_new_password`, `confirm_password`, `confirm_new_password`, `resetting_password`, `reset_password`.
- **Errors block** (6 keys): `server_error`, `server_error_desc`, `go_home`, `server_error_code`, `client_error`, `go_home_link`.
- **Public footer** (1 key): `share_text`.

### Terminology Fixes (rw.json only)
- **Commande → Komande**: All remaining instances in kitchen, qr_analytics, peak_hours, instruction_insights, payment_analytics, feedback_analytics, and qr builder sections.
- **kafe/kafé → kafeyi**: All instances in discovery, homepage, pricing, site builder, plan descriptions, and category label.
- **ibikoresho → ibikorenerwa**: In supplier/procurement context only (store badge/title, procurement workflow feature, procurement market nav). General "ibikoresho" (tools/devices) left unchanged.

### Pending Decisions
- FR "Inventaire" vs "Stocks": Guide specifies "Stocks" but locale uses "Inventaire" across 20+ keys. Awaiting product decision.

---

## 2026-07-29 — Pass 1: Meta Descriptions, Features Pages, Initial Terminology

### Pages Localized
- **Features pages** (operations, AI, analytics, finance, growth, infrastructure, index): Added localized `metaDescription` props to `PublicLayout`.
- **`src/pages/_app.tsx`**: Replaced hardcoded meta description with localized version via `getTranslation`.
- **`src/pages/index.tsx`**: Localized homepage title, stats labels (trial_days, no_card, plans_count), and features tagline.
- **`src/pages/refer/index.tsx`**: All hardcoded strings replaced with `t()` calls.
- **`src/pages/login.tsx`**: All hardcoded strings replaced with `t()` calls.
- **`src/pages/signup.tsx`**: Remaining hardcoded strings replaced with `t()` calls.
- **`src/components/PublicLayout.tsx`**: Localized dark/light mode titles, menu aria-labels, and "Powered by ICTHubs".

### Locale Keys Added
- `homepage.title_page`, `homepage.features.tagline`, `homepage.stats.trial_days`, `homepage.stats.no_card`, `homepage.stats.plans_count`.
- `public.nav.close_menu`, `public.nav.open_menu`, `public.footer.powered_by`.
- `refer` block (full referral program translations).
- Auth keys for login page hardcoded strings.
- Meta description keys for all features pages.

### Terminology Fixes (rw.json)
- Commande → Komande in marketplace, cart, checkout, dashboard metrics, hero, analytics, RT sections.
- kafe/kafé → kafeyi in discovery, homepage hero, pricing.
- Abatanga ibikoresho → Abatanga ibikorenerwa in marketplace and pricing features.

### Infrastructure
- Exported `getTranslation` from `src/lib/i18n.ts` for SSR usage.
- Fixed invalid JSON (extra closing braces) in `en.json`.
- Fixed missing auth block closing in `en.json`, `fr.json`, `rw.json`.
