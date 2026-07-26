# Imboni Partnership Program — Completion Plan

**Platform:** ImboniServe  
**Date:** July 26, 2026  
**Sprint:** Marketing Alignment Sprint (MAS)  
**Status:** MANDATORY — Must reach production quality before launch  

---

## 1. Program Overview

The "Imboni Partnership Program" is the umbrella term for all partner, referral, and growth-channel programs that drive customer acquisition. It consists of **five interconnected programs**:

| Program | Tier | Target Audience | Reward | Current Status |
|---------|------|----------------|--------|----------------|
| **B2B Affiliate Program** | Tier 1 | Professional marketers & influencers | 15% recurring commission for 12 months | ✅ Backend complete, ❌ Application form non-functional |
| **Customer Referral Program** | Tier 2 | Customers ordering from restaurants | 1,000 RWF one-time (both sides) | ✅ Backend complete, ❌ Reward amount bug, ❌ No signup field |
| **Business Invite Program** | Peer-to-Peer | Restaurant owners inviting other owners | 1 free month (both sides) | ✅ Backend complete, ✅ Dashboard page, ❌ Not in sidebar |
| **Professional Marketer Program** | Enterprise | B2B acquisition agents | Commission + wallet + payouts | ✅ Backend complete, ✅ Dashboard page, ❌ No public registration |
| **Founding Restaurant Program** | Launch | First 100 restaurants | 50% lifetime discount | ❌ Homepage only, ❌ No backend logic |

---

## 2. Implementation Audit

### 2.1 B2B Affiliate Program (Tier 1)

**Database Models:** `Affiliate`, `AffiliateCommission`, `AffiliatePayout` — ✅ Complete

**Backend Services:**
- `AffiliateService.createCommissionForInvoice()` — ✅ Creates 15% commission on invoice payment
- `AffiliateService.approveLockedCommissions()` — ✅ 7-day lock period auto-approval
- `AffiliateService.getAffiliateStats()` — ✅ Dashboard stats
- `AffiliateService.requestPayout()` — ✅ Minimum 10,000 RWF threshold
- `AffiliateService.markPayoutPaid()` — ✅ Admin payout marking
- `AffiliateService.applyAffiliateCode()` — ✅ Signup attribution
- `AffiliateService.generateAffiliateCode()` — ✅ IMB-XXXXXX format

**API Endpoints:**
- `GET /api/affiliate/dashboard` — ✅ Returns affiliate stats and commissions
- `POST /api/affiliate/payout` — ✅ Request payout
- `GET /api/admin/affiliates` — ✅ Admin list affiliates
- `POST /api/admin/affiliates` — ✅ Admin create affiliate
- `POST /api/admin/affiliates/[id]/suspend` — ✅ Admin suspend affiliate
- `POST /api/admin/affiliates/payout/[id]` — ✅ Admin mark payout paid

**Frontend Pages:**
- `/affiliate/program` — ✅ Public program page with earnings calculator, how it works, requirements
- `/affiliate` (index) — ✅ Affiliate dashboard with stats, commissions, referral link, payout request
- `/admin/affiliates` — ✅ Admin management with create, suspend, payout

**Missing Capabilities:**
1. **Application form is non-functional** — `handleApply()` in `/affiliate/program.tsx` line 22 has `// TODO: Implement application submission` — just sets `submitted = true` without sending data
2. **No public self-registration** — Affiliates must be created by admin
3. **No email notification** when application is submitted or approved
4. **No marketing materials distribution** — Page promises "brochures, demo videos, presentation decks" but none exist
5. **No affiliate link click tracking** — `ReferralTrackingTierService.trackClick()` exists but is not called from the homepage
6. **No conversion tracking** — No webhook fires when a referred business makes their first payment to trigger commission creation
7. **No affiliate leaderboard on public page** — API exists at `/api/referrals/leaderboard` but no public-facing leaderboard page

### 2.2 Customer Referral Program (Tier 2)

**Database Models:** `CustomerReferral`, `ReferralLink`, `ReferralClick`, `ReferralReward`, `AffiliateEarnings` — ✅ Complete

**Backend Services:**
- `ReferralTrackingTierService.trackClick()` — ✅ Click tracking with fraud detection
- `ReferralTrackingTierService.awardWelcomeBonus()` — ✅ 1,000 RWF bonus (100,000 cents) to both sides
- `ReferralTrackingTierService.processLifecycleValidation()` — ✅ EARNED → VALIDATED → WITHDRAWABLE
- `ReferralTrackingTierService.getAffiliateDashboard()` — ✅ Dashboard data

**API Endpoints:**
- `POST /api/customer-referrals/generate` — ✅ Generate referral code
- `POST /api/customer-referrals/track` — ✅ Track conversion — ❌ **BUG: rewardCents = 5000 (50 RWF) instead of 100000 (1,000 RWF)**
- `GET /api/referrals/leaderboard` — ✅ Leaderboard with both restaurant and customer referrals
- `GET /api/referrals/dashboard` — ✅ Dashboard by referral code

**Frontend Pages:**
- `/refer` — ✅ Public referral page with code generation and sharing
- `/dashboard/referrals` — ✅ Dashboard leaderboard

**Missing Capabilities:**
1. **Reward amount bug** — `track.ts` line 28: `const rewardCents = 5000` should be `100000`
2. **No referral code input on signup** — Attribution is cookie-based only (`im_ref` cookie), no visible field
3. **No reward distribution** — Tracking marks as CONVERTED but no Mobile Money payout to referrer/referred
4. **No referral link click tracking integration** — `trackClick()` is not called from `/r/[code]` redirect handler
5. **No WhatsApp share message localization** — English only

### 2.3 Business Invite Program (Peer-to-Peer)

**Database Models:** `BusinessInvite`, `InviteCredit` — ✅ Complete

**Backend Services:**
- `BusinessInviteService.getOrCreateCode()` — ✅ Generate invite code
- `BusinessInviteService.attributeInvite()` — ✅ Attribute on signup with self-referral prevention
- `BusinessInviteService.processQualification()` — ✅ 30 Smart Dining Slips in 30 days
- `BusinessInviteService.processPaymentQualification()` — ✅ Issue 1 free month credit to both sides
- `BusinessInviteService.unlockDueCredits()` — ✅ Unlock credits after 14-day lock
- `BusinessInviteService.expireStalePending()` — ✅ Expire old invites
- `BusinessInviteService.getInviteStats()` — ✅ Stats for referrer

**API Endpoints:**
- `POST /api/business-invite/generate` — ✅ Generate invite code
- `GET /api/business-invite/stats` — ✅ Get invite stats

**Frontend Pages:**
- `/dashboard/invite` — ✅ Invite page with code generation, WhatsApp share, stats, credit status

**Missing Capabilities:**
1. **Not in V1 sidebar** — Page exists but is not navigable from dashboard
2. **No invite code input on signup** — Cookie-based only (`im_inv` cookie)
3. **No credit application to invoices** — `InviteCredit` has `appliedToInvoiceId` field but no logic to auto-apply
4. **No cron job for `unlockDueCredits()` and `expireStalePending()`** — Services exist but are not scheduled
5. **No notification when credit is unlocked** — No WhatsApp or email notification

### 2.4 Professional Marketer Program

**Database Models:** `ProfessionalMarketer`, `MarketerAttribution`, `MarketerWallet`, `MarketerCommission`, `MarketerPayout`, `MarketerRiskProfile` — ✅ Complete

**Backend Services:**
- `ProfessionalMarketerService` — ✅ Create, get, dashboard, marketer-by-email
- `MarketerCommissionService` — ✅ Commission stats
- `MarketerPayoutService` — ✅ Payout stats and history
- `MarketerWalletService` — ✅ Balance summary
- `MarketerAttributionService` — ✅ Attribution stats
- `MarketerRiskService` — ✅ Risk assessment
- `FraudDetectionService` — ✅ Fraud detection

**API Endpoints:**
- `POST /api/marketer/register` — ✅ Admin registers marketer
- `GET /api/marketer/dashboard` — ✅ Marketer dashboard
- `GET /api/marketer/payout/history` — ✅ Payout history
- `GET /api/marketer/businesses` — ✅ Referred businesses
- `GET /api/marketer/qr-code` — ✅ QR code for referral
- `GET /api/marketer/export/businesses` — ✅ Export businesses
- `GET /api/marketer/export/commissions` — ✅ Export commissions
- `GET /api/marketer/export/payouts` — ✅ Export payouts
- Admin payout control at `/admin/payout-control` — ✅

**Frontend Pages:**
- `/dashboard/marketer` — ✅ Full marketer dashboard with wallet, commissions, payouts, QR code, attribution
- `/admin/payout-control` — ✅ Admin payout queue with risk profiles

**Missing Capabilities:**
1. **No public registration page** — Marketers must be registered by admin
2. **No public program page** — Unlike B2B affiliates, no public-facing page describes the marketer program
3. **No commission creation trigger** — `MarketerCommissionService` has stats but no `createCommission()` method visible
4. **No attribution on signup** — Marketer referral codes (MKT-XXXX) are not checked during signup

### 2.5 Founding Restaurant Program

**Database Models:** ❌ **No founding member fields on Business model**

**Backend Services:** ❌ **None**

**Configuration:**
- `PRICING_CONFIG.launchDiscountPercent = 50` in `pricing.ts` — exists but is **never referenced** by `initiate-payment.ts`

**Frontend Pages:**
- Homepage section (lines 973–1079) — ✅ Marketing page with benefits, CTA, "Limited to first 100 restaurants"

**Missing Capabilities:**
1. **No `isFoundingMember` field on Business model** — Cannot track who is a founding member
2. **No founding member counter** — Cannot enforce "first 100" limit
3. **No discount application in billing** — `initiate-payment.ts` uses `plan.priceCents` directly, no founding discount
4. **No founding member badge** — No visual indicator on dashboard
5. **No founding member admin panel** — Cannot view or manage founding members
6. **No founding member expiration logic** — "Lifetime" discount needs to persist through plan changes
7. **No founding member signup tracking** — No way to mark a business as founding during signup

---

## 3. Completion Plan

### Phase 1: Founding Restaurant Program Backend (CRITICAL)

**Estimated Effort:** 1–3 days

#### 3.1.1 Database Changes

Add to `Business` model in `prisma/schema.prisma`:
```prisma
isFoundingMember    Boolean  @default(false)
foundingJoinedAt    DateTime?
foundingDiscountPercent Float @default(50.0)
```

Run migration: `npx prisma migrate dev --name add_founding_member_fields`

#### 3.1.2 Signup Logic

In `src/pages/api/auth/signup.ts`:
- Check current founding member count: `prisma.business.count({ where: { isFoundingMember: true } })`
- If count < 100, set `isFoundingMember: true` and `foundingJoinedAt: new Date()`
- If count >= 100, do not set founding member flag

#### 3.1.3 Billing Logic

In `src/pages/api/subscriptions/initiate-payment.ts`:
- After fetching business, check `business.isFoundingMember`
- If true, apply discount: `amountCents = Math.round(amountCents * (1 - business.foundingDiscountPercent / 100))`
- Recalculate VAT breakdown with discounted amount
- Add `foundingDiscountApplied: true` to transaction metadata

#### 3.1.4 Dashboard Badge

In `src/components/DashboardLayout.tsx` or `src/pages/dashboard/index.tsx`:
- Fetch `business.isFoundingMember` in server-side props
- Display "Founding Member" badge in sidebar header or dashboard header
- Badge: orange/gold star icon with "Founding Member" tooltip

#### 3.1.5 Admin Panel

In `src/pages/admin/`:
- Create `founding-members.tsx` page listing all founding members
- Show count, join date, business name, owner name, email
- Allow admin to manually add/remove founding status

#### 3.1.6 Homepage Update

In `src/pages/index.tsx` Founding Program section:
- Add dynamic counter: "X / 100 spots claimed" (fetch from API)
- When 100 reached, change CTA to "Join Waitlist"

---

### Phase 2: Customer Referral Program Fixes (CRITICAL)

**Estimated Effort:** < 1 day

#### 3.2.1 Fix Reward Amount Bug

In `src/pages/api/customer-referrals/track.ts` line 28:
- Change `const rewardCents = 5000` to `const rewardCents = 100000`

#### 3.2.2 Add Referral Code Field to Signup

In `src/pages/signup.tsx`:
- Add `referralCode: ''` to form state
- Add input field: "Referral code (optional)" after business type selector
- Pass `referralCode` in signup API body

In `src/pages/api/auth/signup.ts`:
- Read `referralCode` from body (in addition to cookie)
- If provided, call `AffiliateService.applyAffiliateCode(business.id, code)` or `BusinessInviteService.attributeInvite(code, business.id)` depending on code format

#### 3.2.3 Integrate Click Tracking

In `src/pages/api/r/[code].ts` (referral redirect handler):
- Call `ReferralTrackingTierService.trackClick()` before redirect
- Pass IP address and user agent from request headers

---

### Phase 3: B2B Affiliate Application (HIGH)

**Estimated Effort:** 1–2 days

#### 3.3.1 Implement Application Submission

In `src/pages/affiliate/program.tsx`:
- Replace `// TODO: Implement application submission` with actual API call
- Create `POST /api/affiliate/apply` endpoint that:
  - Creates a `PendingAffiliateApplication` record (new model or use a JSON field)
  - Sends email notification to admin
  - Returns success confirmation

#### 3.3.2 Admin Approval Flow

In `src/pages/admin/affiliates.tsx`:
- Add "Pending Applications" section
- Allow admin to approve (creates Affiliate record) or reject
- On approval, send email to affiliate with their code and dashboard link

#### 3.3.3 Commission Trigger on Payment

In payment webhook handlers (`/api/webhooks/intouch.ts`, `/api/payments/irembo/webhook.ts`):
- After successful payment, call `AffiliateService.createCommissionForInvoice(invoiceId)`
- This is the missing link between signup attribution and commission creation

---

### Phase 4: Business Invite Program Visibility (MEDIUM)

**Estimated Effort:** < 1 day

#### 3.4.1 Add to Dashboard Sidebar

In `src/components/DashboardLayout.tsx`:
- Add "Growth" section to V1 sidebar with:
  - "Invite & Earn" → `/dashboard/invite`
  - "Referral Leaderboard" → `/dashboard/referrals`

#### 3.4.2 Add Invite Code to Signup

In `src/pages/signup.tsx`:
- The referral code field (from Phase 2) should also accept invite codes (INV-XXXX format)
- In signup API, check code format:
  - `CUST-XXXX` → Customer referral
  - `INV-XXXX` → Business invite
  - `IMB-XXXX` → B2B affiliate
  - `MKT-XXXX` → Professional marketer

#### 3.4.3 Schedule Cron Jobs

Create or update cron endpoint:
- Daily: `BusinessInviteService.unlockDueCredits()`
- Daily: `BusinessInviteService.expireStalePending()`
- Daily: `ReferralTrackingTierService.processLifecycleValidation()`
- Daily: `AffiliateService.approveLockedCommissions()`

---

### Phase 5: Professional Marketer Integration (MEDIUM)

**Estimated Effort:** 1–2 days

#### 3.5.1 Public Registration

- Create `/marketer/program` public page (similar to `/affiliate/program`)
- Create `POST /api/marketer/apply` endpoint for self-application
- Admin approval flow in `/admin/payout-control` or new admin page

#### 3.5.2 Signup Attribution

In `src/pages/api/auth/signup.ts`:
- Check for `MKT-XXXX` code format
- If matched, create `MarketerAttribution` record linking business to marketer

#### 3.5.3 Commission Creation

In payment webhook handlers:
- After successful payment, check if business has marketer attribution
- If yes, create `MarketerCommission` record

---

## 4. Database Changes Summary

| Change | Type | Migration |
|--------|------|-----------|
| `Business.isFoundingMember` | New field | `add_founding_member_fields` |
| `Business.foundingJoinedAt` | New field | Same migration |
| `Business.foundingDiscountPercent` | New field | Same migration |
| `PendingAffiliateApplication` | New model (optional) | `add_affiliate_application` |

---

## 5. Backend Changes Summary

| File | Change |
|------|--------|
| `src/pages/api/auth/signup.ts` | Add referral code parsing, founding member logic |
| `src/pages/api/subscriptions/initiate-payment.ts` | Apply founding discount |
| `src/pages/api/customer-referrals/track.ts` | Fix reward amount (5000 → 100000) |
| `src/pages/api/r/[code].ts` | Add click tracking call |
| `src/pages/api/affiliate/apply.ts` | New: application submission endpoint |
| `src/pages/api/marketer/apply.ts` | New: marketer application endpoint |
| `src/pages/api/webhooks/intouch.ts` | Add commission creation trigger |
| `src/pages/api/payments/irembo/webhook.ts` | Add commission creation trigger |
| `src/pages/api/cron/referral-lifecycle.ts` | New: daily cron for referral/invite processing |

---

## 6. Frontend Changes Summary

| File | Change |
|------|--------|
| `src/pages/signup.tsx` | Add referral code input field |
| `src/pages/affiliate/program.tsx` | Implement application form submission |
| `src/components/DashboardLayout.tsx` | Add "Growth" section to sidebar |
| `src/pages/dashboard/index.tsx` | Add founding member badge |
| `src/pages/admin/founding-members.tsx` | New: founding member admin panel |
| `src/pages/admin/affiliates.tsx` | Add pending applications section |
| `src/pages/index.tsx` | Add dynamic founding member counter |

---

## 7. Testing Checklist

### Founding Restaurant Program
- [ ] Sign up a new business → verify `isFoundingMember = true` when count < 100
- [ ] Initiate subscription payment → verify 50% discount applied
- [ ] Sign up 101th business → verify `isFoundingMember = false`
- [ ] Founding member badge displays on dashboard
- [ ] Admin can view founding members list
- [ ] Homepage counter shows correct count

### Customer Referral Program
- [ ] Generate referral code → verify code created
- [ ] Share link → click tracking fires
- [ ] New customer signs up with code → conversion tracked
- [ ] Reward amount is 1,000 RWF (100,000 cents), not 50 RWF
- [ ] Referral code field on signup form works
- [ ] Leaderboard shows correct data

### B2B Affiliate Program
- [ ] Submit application → admin receives notification
- [ ] Admin approves → affiliate code generated
- [ ] Referred business signs up with affiliate code → attribution recorded
- [ ] Referred business pays subscription → commission created (15%)
- [ ] Commission auto-approves after 7-day lock
- [ ] Affiliate requests payout → admin marks paid
- [ ] Self-referral prevented

### Business Invite Program
- [ ] Generate invite code → code created
- [ ] Invited business signs up with code → attribution recorded
- [ ] Invited business generates 30 slips → status changes to QUALIFYING
- [ ] Invited business pays subscription → credits issued to both sides
- [ ] Credits unlock after 14-day lock period
- [ ] Credits expire after 180 days
- [ ] Self-invite prevented

### Professional Marketer Program
- [ ] Admin registers marketer → wallet and risk profile created
- [ ] Marketer accesses dashboard → stats display correctly
- [ ] Referred business signs up with MKT code → attribution recorded
- [ ] Commission created on payment
- [ ] Marketer requests payout → admin processes via payout control
- [ ] Risk profile updates with payout history

---

## 8. Launch Checklist

### Must Complete Before Launch
- [ ] Founding member database migration applied
- [ ] Founding discount applied in billing logic
- [ ] Referral reward amount bug fixed
- [ ] Referral code field added to signup form
- [ ] Affiliate application form functional
- [ ] Commission creation triggered on payment
- [ ] Cron jobs scheduled for referral lifecycle
- [ ] "Growth" section added to dashboard sidebar
- [ ] Founding member badge on dashboard
- [ ] All tests passing

### Should Complete Before Launch
- [ ] Public marketer program page
- [ ] Admin founding members panel
- [ ] Homepage founding counter
- [ ] Click tracking on referral redirect
- [ ] Email notifications for affiliate applications

### Can Complete Post-Launch
- [ ] Marketing materials for affiliates
- [ ] Public affiliate leaderboard
- [ ] WhatsApp share message localization
- [ ] Credit auto-application to invoices
- [ ] Notification when credits unlock

---

## 9. Effort Summary

| Phase | Description | Effort | Priority |
|-------|-------------|--------|----------|
| Phase 1 | Founding Restaurant Program Backend | 1–3 days | CRITICAL |
| Phase 2 | Customer Referral Program Fixes | < 1 day | CRITICAL |
| Phase 3 | B2B Affiliate Application | 1–2 days | HIGH |
| Phase 4 | Business Invite Visibility | < 1 day | MEDIUM |
| Phase 5 | Professional Marketer Integration | 1–2 days | MEDIUM |

**Total estimated effort:** 4–8 days

**Critical path:** Phase 1 + Phase 2 = 2–4 days minimum before launch

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Founding discount not applied → customer charged full price | HIGH (current state) | CRITICAL — broken promise | Phase 1 must complete before first paying customer |
| Referral reward too low → customer trust damage | HIGH (current state) | HIGH — 50 RWF vs 1,000 RWF | Phase 2 fix is 1 line of code |
| Affiliate commission not created → affiliate trust damage | MEDIUM | HIGH — affiliates won't promote | Phase 3 adds trigger in payment webhook |
| No cron jobs → credits never unlock | MEDIUM | MEDIUM — delayed rewards | Phase 4 schedules cron jobs |
| Self-referral fraud | LOW | MEDIUM | Already prevented in code |

---

*Document generated: July 26, 2026*
