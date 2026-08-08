# Founder Partner Program V2 — Final Review, UX Validation & Implementation Readiness

Companion to `docs/FOUNDER_PARTNER_PROGRAM_BLUEPRINT.md`. This document is the **pre-flight review** performed against the actual current codebase. It walks every user journey, identifies concrete bugs (with file:line evidence), and lists required blueprint changes and refinements before any production code is written.

**Verdict up-front:** ⚠️ **Do not begin implementation yet.** The current app has **five real bugs** that silently break attribution today (for existing programs — not V2), a **hardcoded "14-day" everywhere** that will contradict the new 30-day Founder trial, and **zero customer-visible trial or attribution surface**. All of these will corrupt the Founder Partner Program from day one if we implement on top of them. They must be fixed as part of Phase A of the migration, and the blueprint should be amended to make that explicit.

---

## 1. Executive Summary of Findings

| # | Severity | Area | Finding |
|---|---|---|---|
| B1 | 🔴 Critical | Referral attribution | **Cookie-name mismatch**: `/api/r/{code}` sets `referral_code`, but `/api/auth/signup` reads `im_ref`. Every Tier-2 dining-slip referral link click currently produces zero attribution at signup. Silent data loss today. |
| B2 | 🔴 Critical | Signup UX | Signup page does **not read `?ref=`, `?partner=`, or `?m=` from the URL** and pre-fill the referral field. The one line of `useEffect` reads only `?plan=`. Every "share a link" flow depends on the user manually copying the code. |
| B3 | 🔴 Critical | Marketer attribution | `/api/auth/signup` calls `prisma.affiliate.findUnique` only. **It never resolves marketer codes.** `ProfessionalMarketer` codes shared as `/signup?m=CODE` are silently dropped. `MarketerAttribution` is never written from the signup path. |
| B4 | 🟠 High | Post-signup UX | After signup, user is redirected to `/login?signup=success` (`signup.tsx:73`) but `login.tsx` **never reads that param** — no confirmation, no trial explanation, no partner acknowledgement. |
| B5 | 🟠 High | Trial messaging | Every trial mention is hardcoded `"14-day"` across `signup.tsx`, `pricing.tsx`, `index.tsx`, `features/*.tsx`. There's no dynamic pipe from `PRICING_CONFIG.trialDays` or from a resolved Founder Code. |
| B6 | 🟠 High | Business dashboard | I could not find **any** business-facing surface that shows trial days remaining, trial source, or referrer. Only admin `sales-pipeline` has that. The owner is flying blind. |
| B7 | 🟡 Medium | Cookie policy | Referral cookie set `HttpOnly` — signup page can't read it in JS to pre-fill the form. Server-side pre-fill via `getServerSideProps` is missing. |
| B8 | 🟡 Medium | Signup form | Business-type dropdown offers `AFFILIATE` (`signup.tsx:263`) but the signup API treats it as non-hospitality and doesn't create an `Affiliate` row — an affiliate self-signup here is a dead end. |
| B9 | 🟡 Medium | Login routing | `login.tsx:167-176` checks affiliate dashboard, but no equivalent for marketers or (future) partners. Founder Partner portal login has nowhere to land. |
| B10 | 🟡 Medium | Namespace collisions | `Affiliate.code`, `ReferralLink.code`, `CustomerReferral.referralCode`, `ProfessionalMarketer.referralCode`, future `FounderCode.code` are all resolved via the same `?ref=` query param. There's no single resolver that walks all four namespaces + Founder in the right order. |
| B11 | 🟡 Medium | Customer referral | `CUST-XXXX` codes are shared in signup URLs but `signup.ts` never calls `CustomerReferralService.trackSignup`, so the referrer's `customerReferral.status` never flips from `PENDING → CONVERTED` via signup — only via a later manual `POST /api/customer-referrals/track` call. Ambiguous behavior. |

**All of the above exist today, before the Founder Partner Program is added.** They are pre-existing bugs and UX gaps. The Founder Program will amplify their damage; therefore Phase A of the migration must fix them.

---

## 2. User-Journey Simulation Report

I walked every scenario as each persona would. Below is the actual behavior of the current app, and what should happen after V2.

### Persona A — Business Owner discovering ImboniServe directly

**Journey**: Home → `/pricing` → `/signup` → fills form → submits.

**Current app**:
- Homepage shows "Start Free 14-Day Trial" — correct.
- Signup shows the 14-day banner and CTA "Start Your 14-Day Free Trial" — correct.
- Submits → API creates business with `trialSource=<none>` (column doesn't exist yet), `trialEndDate = now + 14d`, auto-approval if low risk.
- Redirected to `/login?signup=success` — **no confirmation UI, no trial info surfaced**. User has no idea whether signup worked until they log in.

**Post-V2 expected**:
- Same experience.
- Add a real post-signup confirmation page (`/welcome`) showing: "Your account is ready · 14-day free trial · ends [date]".
- `Business.trialSource=STANDARD` recorded.
- All Tier-2/3 and Affiliate flows unchanged.

**Verdict**: acceptable today, but the post-signup experience must be built anyway (see Improvement I-3).

### Persona B — Business Owner watching a Founder Partner campaign (e.g. ISIMBI TV shows `ISIMBI30`)

Two arrival modes:

**B.1** — Owner types `https://imboniserve.com/f/ISIMBI30` directly.

*Current app*: `/f/*` route **does not exist**. 404. Complete dead end.

*Post-V2 expected*:
- `/f/{code}` public redirect route (mirror of `/api/r/{code}` but Founder-scoped): validates the code, stores an `im_ref` cookie **matching the signup reader**, sets a friendly `im_partner_context` cookie (partner display name + trial days), redirects to `/signup?ref=ISIMBI30`.
- Signup page reads `?ref=` from URL and pre-fills the referral field, disables it (with an "×" to clear), and swaps the trial banner from "14-day" to **"30-day Founder Trial · Powered by ISIMBI TV"**.

**B.2** — Owner arrives via the partner's tracked URL `imboniserve.com/signup?ref=ISIMBI30`.

*Current app*: signup page loads with an **empty referral field**. The `?ref=` param is never inspected client-side. The trial banner still says "14-day". Only if the owner remembers what code they typed and copies it into the referral field will attribution occur.

*Post-V2 expected*:
- URL param → pre-filled, non-editable-but-clearable input → API validates → returns `{trialDays:30, partnerDisplayName:"ISIMBI TV"}` for real-time banner + confirmation.
- On submit, business is auto-attributed via `FounderCodeRedemption`, `trialSource=FOUNDER_CODE`, `trialDaysGranted=30`.
- Welcome screen post-signup: "Your 30-day Founder Trial is active — welcome from ISIMBI TV."

**Verdict**: **The current signup will silently drop Founder attribution in every case unless we fix B1 + B2 + add `/f/` route.**

### Persona C — Owner remembers the code but arrives on `/signup` manually

*Current app*: Referral field exists (`signup.tsx:273-289`), labeled "Referral Code (optional)". Placeholder `e.g. IMBONI-XXXX` is misleading (implies an Affiliate-only namespace).

*Post-V2 expected*:
- Rename label to **"Referral or Invitation Code (Optional)"** as the user explicitly requested.
- Update placeholder to a neutral pattern (e.g. `e.g. ISIMBI30 or IMBONI-XXXX`).
- Add a *live-validate* affordance: as the user types, debounced `POST /api/codes/resolve` returns `{valid, tier, trialDays, partnerDisplayName?}` — if valid & Founder-tier, animate the trial banner to "30-day Founder Trial · Powered by …".
- If invalid, show a subtle "Not recognized — you can leave this blank" hint. Never block submission.

**Verdict**: current UX is functional but feels transactional and doesn't reward the user for remembering the code. Trivially improvable.

### Persona D — Owner signed up without a code, receives a Founder Code during trial

*Current app*: **No way to apply a code post-signup.** Nothing in dashboard, billing, or account settings.

*Post-V2 expected* (mirrors blueprint §7.5):
- Trial banner in dashboard shows a subtle "Have a Founder Code? Apply it" link.
- `POST /api/founder-partners/codes/apply-post-signup` (auth required):
  - Reject if any invoice has been paid on the business.
  - Reject if a Founder code is already applied.
  - Extend `trialEndDate` to `max(trialEndDate, trialStartDate + code.trialDays)`.
  - Attribute business to the partner (`FounderCodeRedemption`), stamp `trialSource=FOUNDER_CODE` (was `STANDARD`).
  - Emit `founder.trial.extended`.
- Toast in dashboard: "Founder Trial applied — you now have 30 days total (X more days added)."

**Verdict**: blueprint already covers this in §7.5; only the dashboard surface + reminder banner are new UX asks.

### Persona E — Owner arrives from an existing Affiliate (Tier 1)

*Current app*: `?ref=IMBONI-ABCD` → signup form empty (B2 bug), user types code manually → `signup.ts:69-84` correctly resolves the Affiliate → `Business.referredByAffiliateId` set → 14-day trial.

*Post-V2 expected*: **Identical**. Attribution resolver's fall-through must land here. The one required refinement: if the user arrived via `/api/r/CODE` (which sets `referral_code` cookie), the signup API must read that cookie too, not just `im_ref`.

**Verdict**: works today only because users manually type the code. B1 must be fixed to keep the affiliate program healthy.

### Persona F — Owner arrives from Customer Referral (Smart Dining Slip, Tier 2)

*Current app*: `refer/index.tsx:45` shares `/signup?ref=<CUST-XXXX>`. Query param not read (B2). If the user types it manually, `signup.ts` calls `Affiliate.findUnique` — **fails** (wrong table) — returns null, no attribution stored, no error, `CustomerReferral.status` stays `PENDING`. Nobody ever earns the 1,000 RWF unless a later order path invokes `/api/customer-referrals/track` manually.

*Post-V2 expected*: Attribution resolver walks `Affiliate → Marketer → CustomerReferral → ReferralLink` and, on `CUST-XXXX` match, marks the referral `CONVERTED` immediately on business signup (as a lead) but only awards the 1,000 RWF once the referred business hits the qualifying event (per `smart-dining-slip.service.ts` rules).

**Verdict**: **Bug B11 exists today.** The Founder Program adds precedence handling that fixes this as a side benefit if we build the unified resolver.

### Persona G — Owner arrives from a Professional Marketer (`?m=CODE`)

*Current app*: `dashboard/marketer.tsx:95` and `api/marketer/qr-code.ts:70` share `/signup?m=<MKT-XXXX>`. Neither the signup form nor the signup API reads `?m`. `MarketerAttribution` is never created. **The entire self-serve marketer acquisition path is broken today.**

*Post-V2 expected*: Signup form reads `?m=` (and also `?ref=` for fallback), signup API resolver dispatches to `Marketer` resolver, calls `MarketerAttributionService.recordAttribution`, business is attributed correctly.

**Verdict**: **Critical pre-existing bug (B3).** Must be fixed before Founder rollout because it's identical wiring.

### Persona H — Founder Partner (external user)

*Current app*: No portal. No login. No dashboard. No application form.

*Post-V2 expected*: `/partners/apply` (public inbound), `/partners/dashboard` (post-login OTP), `/partners/agreement/:id` (view/sign flow via signed URL). All UX per blueprint §11 & §19.1.

**Verdict**: greenfield build; blueprint is sufficient. UX refinements below.

### Persona I — Partnership Manager (internal)

*Current app*: No `/admin/partnerships/*`. Admin can only see approved businesses via `admin/sales-pipeline`.

*Post-V2 expected*: Kanban of pipeline stages, per-partner CRM timeline, agreement editor, code manager, campaign manager. UX refinements below.

**Verdict**: greenfield; blueprint sufficient.

### Persona J — Finance Administrator

*Current app*: No dedicated partnership payout UI. `FinancialLedgerEntry` is read via ad-hoc admin pages.

*Post-V2 expected*: Payout run screen, dual-control confirmation, reversal tool, per-partner ledger view, quarterly WHT summary export.

**Verdict**: blueprint covers.

### Persona K — System Administrator

*Current app*: existing role-gates already cover admin. No RBAC for `PARTNERSHIPS_*` roles yet.

*Post-V2 expected*: extend `UserRole` enum + policy layer per blueprint §16.

**Verdict**: blueprint covers.

---

## 3. Signup-Page UX Recommendations

Concrete changes I recommend for `src/pages/signup.tsx`. Each is small, testable, and preserves every existing flow.

### 3.1 Read URL params (fix B2)

Extend the existing `useEffect` at `src/pages/signup.tsx:43-49` to also hydrate `formData.referralCode`:

```ts
useEffect(() => {
  const q = router.query
  const plan = (q.plan as string | undefined)?.toUpperCase()
  const ref = (q.ref as string | undefined)
             || (q.partner as string | undefined)
             || (q.m as string | undefined)
             || (q.invite as string | undefined)
  const allowedPlans = ['STARTER','PROFESSIONAL','BUSINESS','PREMIUM','ENTERPRISE']
  setFormData(prev => ({
    ...prev,
    ...(plan && allowedPlans.includes(plan) ? { planCode: plan } : {}),
    ...(ref ? { referralCode: ref.toUpperCase() } : {}),
  }))
}, [router.query.plan, router.query.ref, router.query.partner, router.query.m, router.query.invite])
```

Rationale: single source of truth for accepted param names. Handles Tier 1 / Tier 2 / Marketer / Founder / Business-invite uniformly.

### 3.2 Rename the label (user request)

Change label from `"Referral Code (optional)"` (`signup.tsx:276`) to **`"Referral or Invitation Code (Optional)"`**, and swap placeholder from `"e.g. IMBONI-XXXX"` (implies affiliate namespace) to a neutral hint like `"e.g. ISIMBI30, IMBONI-XXXX"`.

### 3.3 Live-resolve the code

Add a new endpoint `GET /api/codes/resolve?code=X` returning `{valid, tier, trialDays, partnerDisplayName?}` — read-only, rate-limited, no side effects. On the signup page, debounce the input by 400 ms and call this endpoint. When it resolves to a Founder code, animate the trial banner:

```
🎉 30-Day Founder Trial · powered by ISIMBI TV — no credit card required.
```

Fallback to the standard `"14-day free trial"` banner otherwise. Never block submission if resolution fails; the server is the final authority.

### 3.4 CTA button copy is dynamic

Replace hardcoded `"Start Your 14-Day Free Trial"` (`signup.tsx:326`) with `"Start Your {trialDays}-Day Free Trial"` where `trialDays` comes from the same resolver.

### 3.5 Prefill cookie on server-side render

Convert `signup.tsx` to use `getServerSideProps` (or a lightweight `useEffect` calling `/api/codes/resolve`) that reads the referral cookie (`im_ref`, `referral_code`, `im_inv`) and returns a pre-populated `initialReferralCode`. This closes the loop where a partner-link-click sets a cookie but the form is empty.

### 3.6 The `AFFILIATE` account-type option is misleading

The dropdown option at `signup.tsx:263` (`AFFILIATE`) is a trap: the API path (`signup.ts:96-98`) doesn't create an `Affiliate` row. **Recommendation**: remove that option from the public signup form and instead point interested users to a dedicated `/apply-affiliate` (or `/partners/apply`) page. If we want a fast lane, we build the `Affiliate` creation path properly in the API; but shipping V2 without cleaning this up is a papercut we should not carry.

---

## 4. URL Behavior — Recommendation

Adopt a **single canonical redirect route** and a **single canonical query param**, plus deprecation-friendly aliases:

- **Canonical entry**: `https://imboniserve.com/f/{code}`
  - Public GET route.
  - Resolves the code (Founder-first, then falls through), tracks the click, sets **one cookie** (`im_ref=<code>`, 30 days, HttpOnly, Lax), redirects to `/signup?ref={code}`.
- **Canonical signup param**: `?ref={code}`.
- **Aliases (accepted but not preferred)**: `?partner=`, `?m=`, `?invite=`. Signup client reads all four.
- **Existing routes preserved unchanged**: `/api/r/{code}` continues to work but also sets `im_ref` (in addition to `referral_code`) so both cookie names coexist during a deprecation window.

The signup page displays a small provenance badge if the resolved code is a Founder code:

```
Applied: ISIMBI30 (30-day Founder Trial · ISIMBI TV) [Remove]
```

The "Remove" link clears the field and the cookie. This gives users agency without forcing manual re-entry.

---

## 5. Cookie & Attribution Preservation

### 5.1 Unify cookie name

- Reader (`src/pages/api/auth/signup.ts:39`) currently reads `im_ref`.
- Writer (`src/pages/api/r/[code].ts:44-47`) currently writes `referral_code`.

**Action**: pick `im_ref` as the canonical name (it's the reader). Update `/api/r/[code].ts` to write both `im_ref` and `referral_code` for a transition period, then remove `referral_code` after 60 days. Zero attribution loss.

### 5.2 Preserve attribution through the auth flow

- Cookie is set 30 days, `HttpOnly`, `SameSite=Lax`. Good default.
- **The cookie must survive the signup → login → dashboard round-trip.** After signup, if user is redirected to `/login?signup=success`, the cookie is still valid and, if the user re-enters signup, we can still pre-fill. However once the business is created and attributed, we should **clear the cookie** to prevent double-attribution on subsequent signups from the same device (e.g. household with two businesses). The signup API can `res.setHeader('Set-Cookie', 'im_ref=; Max-Age=0; ...')` after a successful create.

### 5.3 Preserve attribution across email verification

Currently there is no email verification step in `signup.ts`. If we later add one, the redemption row must be created at signup-time (as blueprint §6.3 already specifies) so verification-lag doesn't lose attribution.

### 5.4 Preserve attribution when user leaves and returns

If user hits `/signup?ref=ISIMBI30` and doesn't finish, we already set the cookie via `/f/{code}`. When they return within 30 days and open `/signup`, `getServerSideProps` pulls the cookie and pre-fills. Preservation done.

---

## 6. Trial Messaging — Single Source of Truth

There are currently **at least 12 hardcoded** `"14-day"` mentions across the codebase (signup, pricing, index, features/*, service-terms, admin UIs). This will break the moment we ship the 30-day Founder trial.

**Action** (Phase A, non-negotiable):

1. Introduce a `<TrialLengthLabel />` React component that:
   - Reads the resolved trial length from context / URL / server prop.
   - Falls back to `PRICING_CONFIG.trialDays` (14).
   - Renders `"{n}-day free trial"` or a Founder-specific string when applicable.

2. Replace every literal `"14-day"` / `"14-Day"` string in `.tsx` files with `<TrialLengthLabel />` or an i18n helper `t('trial.duration_days', {n: trialDays})`.

3. On the server, provide `PRICING_CONFIG.trialDays` and, when a resolved Founder code is present, the Founder trialDays, to any page that renders trial copy.

4. Add lint check (regex `/\b14-?day\b/i`) to CI to prevent regressions.

**Copy recommendations** — after review of blueprint tone:

| Context | Standard trial | Founder trial |
|---|---|---|
| Signup banner | 🎉 14-day free trial — no credit card required. | 🎉 30-day Founder Trial — powered by **{partner}** · no credit card required. |
| CTA button | Start Your 14-Day Free Trial | Start Your 30-Day Founder Trial |
| Dashboard trial pill | 14-day trial · 9 days remaining | Founder Trial · 27 days remaining |
| Email confirmation | Your 14-day free trial is active until {date}. | Your 30-day Founder Trial (powered by **{partner}**) is active until {date}. |
| Billing page | Free trial ends {date} ({n} days remaining) | Founder Trial ends {date} ({n} days remaining) |

The label **"Founder Trial"** is warmer than "extended trial" and gives the partner a first-class mention.

---

## 7. Dashboard — Business Owner Surface

**Current app**: I could not find a trial-remaining widget on any `/dashboard/*` page. This is a significant gap.

**Required** (Phase A):

1. **Trial pill** in the top-right of the main dashboard header:
   `[ Trial · 9 days left · Upgrade ]` — colored by urgency (green > 7, orange 3–7, red < 3).
2. **Referrer acknowledgement card** on first-login (dismissable):
   `You joined via ISIMBI TV — enjoy your 30-day Founder Trial.`
   Only shown if `Business.founderPartnerId` is set and the business has opted in (blueprint §11 privacy rules).
3. **"Have a code?" link** in the trial pill, opening the post-signup code-application modal (Persona D).
4. On the billing page (`pages/billing/index.tsx`), surface `trialSource` and `trialDaysGranted`:
   `Trial: 30-day Founder Trial (ISIMBI30) · ends {date}`.

**Optional but valuable**:

- Onboarding checklist item: "Your Founder Partner said 'welcome'" — small partner branded message stored in `FounderPartner.welcomeMessage` (add nullable field to schema).

---

## 8. Partner Experience — Refinements

### 8.1 Outbound

The blueprint's CRM stages are good. One refinement: **add an explicit `WARM_INTRO_REQUESTED` sub-stage** between `CONTACTED` and `RESPONDED` for partners approached via a mutual connection — this is very common with associations and chambers. Track the referrer in `PartnerActivity.subject`.

### 8.2 Inbound

The blueprint's application form is fine, but the public landing page must show **three real proof points** to build trust:

- Existing partner logos (opt-in showcase).
- Anonymized case studies ("A tourism board in Rwanda referred 43 hotels in Q1 2027 and earned 4.2M RWF").
- FAQ addressing commission privacy ("Rates are negotiated privately per partner. There is no fixed public rate.").

Without these, inbound conversion will underperform.

### 8.3 Application review time promise

Show applicants a **48-hour first-response SLA** on submission. Failure to hit SLA triggers an internal alert (already covered in blueprint §20.2).

### 8.4 Agreement flow

The blueprint mentions `documentUrl` on `PartnerAgreement` but doesn't specify signing. Recommendation: integrate with a lightweight e-signature layer (e.g., a signed URL to a PDF + a click-to-accept UI backed by `PartnerAgreement.approvedBy/approvedAt` and an audit-log entry). Full DocuSign-style is v2; click-to-accept is enough for v1.

### 8.5 Campaign flow

Refinement: allow **one code to be attached to multiple campaigns simultaneously** (many-to-many via a `PartnerCampaignCode` junction). Real-world use: `ISIMBI30` runs across "TV spring push" and "YouTube shorts" for the same partner. Blueprint has 1:many; change to many:many with default-single relation for simplicity.

### 8.6 Code management

Add **bulk QR download** (ZIP of PNGs) and **bulk short-link generation** for enterprise partners with many campaigns. Piggy-backs on `qr-code.service.ts` already in the codebase.

### 8.7 Partner dashboard KPI numbers

Show trend indicators (▲ / ▼ vs previous 30 days) on every headline number. Small UX detail, large emotional impact for partners deciding whether to invest more effort.

---

## 9. Required Blueprint Changes

The blueprint is 95% ready. Six explicit amendments to make it 100% implementable:

**BC-1 — Add Phase 0 to the migration** (§22): fix B1, B2, B3, B4, B11 as prerequisites, gated behind a smoke-test suite that validates each of the seven persona journeys above. Ship Phase 0 before Phase A. Duration: 3–5 days.

**BC-2 — Publish canonical query-param and cookie contract** (§6, §7): `?ref=` (with `?partner`/`?m`/`?invite` aliases) and `im_ref` cookie. Deprecate `referral_code` cookie over 60 days.

**BC-3 — Introduce `AttributionResolver` as a top-level, ordered service** (§3.2 & §22): shipped in Phase A, wired at signup. Resolver walks `Founder → Affiliate → Marketer → ReferralLink → CustomerReferral` and writes the attribution attempt row every time. This is the fix for B3 + B11 in addition to enabling Founder attribution.

**BC-4 — Introduce a `TrialPolicyService.resolveTrialDays()` and a `<TrialLengthLabel />` component** (§9): single source of truth server-side and client-side. Blueprint currently mentions the service but not the client component.

**BC-5 — Change `FounderCode → PartnerCampaign` to many-to-many** (§17 schema): add `FounderCodeCampaign` junction. Preserves the 1:1 default (a code typically belongs to one campaign) but unblocks enterprise use.

**BC-6 — Add three additive fields** to the schema for UX polish:
- `FounderPartner.welcomeMessage` (text, nullable) — shown to referred businesses.
- `FounderPartner.publicShowcaseOptIn` (bool, default false) — for the landing-page logo wall.
- `Business.referrerRevealConsent` (bool, default false) — the "let my referrer see I signed up" toggle from blueprint §11 privacy notes; make it a real column, not just a UI concept.

---

## 10. Recommended Strategic Improvements (Roadmap Integration)

The user asked whether these should be integrated. My recommendation:

| Feature | Add to V1? | Add to Roadmap (§23)? | Rationale |
|---|---|---|---|
| **Referral attribution window** (configurable expiry) | **Yes — as a config** | — | Cheap: `PARTNERSHIP_ATTRIBUTION_WINDOW_DAYS` env var (default 30). Already implicitly present via the 30-day cookie. Making it explicit + admin-editable per code (via `FounderCode.attributionWindowDays`) unlocks flexible negotiations at zero engineering cost. |
| **Partner Health Score** | No | **Yes** | Belongs in analytics maturity phase; needs at least 90 days of signal to be meaningful. |
| **Partner recruitment campaigns** | No | **Yes** | Marketing-driven; not core engine. |
| **Versioned marketing asset library** | Partial | Yes for full versioning | v1 ships `FounderPartner.brandAssetsUrl` + a signed-URL marketing kit. Full versioning (with rollback, expiry, per-partner customization) is v2. |
| **AI-powered partner recommendations** | No | **Yes** | Needs a corpus. Roadmap item. |
| **Next-best-action for PMs** | No | **Yes** | Needs CRM data density first (60+ partners in the system). |

**Concrete addition to blueprint §17** — add one optional field to `FounderCode`:

```prisma
attributionWindowDays  Int?    // overrides the platform default when set
```

That's the entirety of the V1 impact of the "attribution window" idea.

---

## 11. Implementation Readiness Assessment

Ranked go/no-go on each dimension:

| Dimension | Status | Notes |
|---|---|---|
| **Database design** | 🟡 Almost | Apply BC-5 (m:n code↔campaign), BC-6 (three additive fields), and one field per BC-3 (`AttributionWindowDays`). Otherwise ready. |
| **API design** | 🟢 Ready | Add `GET /api/codes/resolve` for the live-validate UX (§3.3). Everything else in blueprint §19. |
| **Prisma models** | 🟡 Almost | Same as database — three-field addition. Migration remains additive and zero-downtime. |
| **Event architecture** | 🟢 Ready | Domain events in §18 are complete. |
| **Feature flags** | 🟢 Ready | `founder_partners_enabled` flag from §22 is sufficient. Add a second flag `unified_attribution_resolver_enabled` for Phase 0 safe rollout. |
| **Migration strategy** | 🟠 Needs Phase 0 | See BC-1. |
| **Security** | 🟢 Ready | RBAC + dual-control approvals in §16 are complete. |
| **Permissions** | 🟢 Ready | Roles are additive. |
| **Audit logs** | 🟢 Ready | `PartnershipAuditLog` model in §17 is complete. |
| **UX** | 🔴 Not ready | Fix B1–B7 first. Fixes are small; without them, V2 launch will silently lose Founder attribution. |
| **Copy / i18n** | 🟠 Needs work | Every hardcoded "14-day" must move behind `<TrialLengthLabel />` + `t()` before Founder trials ship. |
| **Tests** | 🟠 Add persona-journey e2e | Playwright scripts for the 11 personas / scenarios above; must pass before Phase B ships. |

---

## 12. Final Approval Checklist

Before writing production code, all of these must be checked:

- [ ] Blueprint amended with BC-1..BC-6.
- [ ] Phase 0 (bug fixes + unified resolver) scoped as a discrete PR set.
- [ ] Copy audit: all `"14-day"` literals refactored behind `<TrialLengthLabel />`.
- [ ] `<TrialLengthLabel />` component spec agreed (props: `days?`, `source?`, `partnerName?`).
- [ ] `AttributionResolver` service spec agreed (order, event emission, dedupe, idempotency).
- [ ] `GET /api/codes/resolve` contract agreed (read-only, no side effects, returns `{valid, tier, trialDays, partnerDisplayName?}`).
- [ ] Cookie contract agreed: canonical `im_ref`, deprecate `referral_code` over 60 days.
- [ ] Query-param contract agreed: canonical `?ref=`, aliases `?partner`, `?m`, `?invite`.
- [ ] Post-signup welcome page (`/welcome`) spec agreed.
- [ ] Business-dashboard trial pill + "have a code?" modal spec agreed.
- [ ] Persona e2e Playwright scripts drafted (one per persona A–K).
- [ ] Feature flags provisioned (`founder_partners_enabled`, `unified_attribution_resolver_enabled`).
- [ ] Prisma migration diff reviewed against schema; verified additive-only.
- [ ] Ledger-event enum extension reviewed by Finance.
- [ ] Alert routing for §20.2 configured.
- [ ] `AFFILIATE` dropdown option removed from public signup form OR affiliate-signup path implemented properly.
- [ ] Legal reviewed the agreement template and clawback policy.
- [ ] Partner-portal login route wired into `login.tsx` (avoid B9).

---

## 13. Sign-off

Once BC-1..BC-6 are applied to the blueprint and the checklist above is green, this program is **fully ready** for implementation in five sequential phases as originally scoped in blueprint §22, with Phase 0 (bug fixes + resolver) prepended.

Estimated total effort to production-ready V1 (all phases, no parallelization): **10–12 engineering weeks** (2 engineers), inclusive of Phase 0, admin UI, partner portal, commission engine, notification templates, and persona-journey e2e coverage.

**Recommended kickoff order**:

1. Phase 0 — Fix B1–B7 + ship `AttributionResolver` + `TrialPolicyService` + `<TrialLengthLabel />` + persona e2e suite. [1–2 sprints]
2. Blueprint Phase A — Schema + `CommissionEngine` scaffold behind flags. [1 sprint]
3. Blueprint Phase B — Admin UI + agreement flow. [1 sprint]
4. Blueprint Phase C — Pilot with 3–5 anchor partners. [2 sprints]
5. Blueprint Phase D — Public inbound + partner portal GA. [1 sprint]
6. Blueprint Phase E — GA + monthly payout runs. [ongoing]

This review is complete and this document is intended to travel with the blueprint as its companion QA/UX gate.
