# Partnership Program Certification

**Release:** ImboniServe v1.0  
**Date:** 2025-01-20  
**Verifier:** Independent Release Assessment  

---

## Program Inventory

| # | Program | Type | Status |
|---|---------|------|--------|
| 1 | Founding Hospitality Business Program | Early adopter discount | PASS |
| 2 | Customer Referral Program (Tier 2) | Customer rewards | PASS |
| 3 | B2B Affiliate Program (Tier 1) | Professional marketer commissions | **WARNING** |
| 4 | Business Invite Program | Business-to-business referral | PASS |
| 5 | Professional Marketer Program | Marketer management & payouts | PASS |

---

## 1. Founding Hospitality Business Program

### 1.1 Enrollment Logic (`src/pages/api/auth/signup.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Limited to first 100 hospitality businesses | PASS | `FOUNDING_LIMIT = 100`; count checked at signup |
| Only hospitality businesses eligible | PASS | `isHospitality && foundingCount < FOUNDING_LIMIT` |
| `isFoundingMember` flag set on business | PASS | Stored on business record |
| `foundingJoinedAt` timestamp recorded | PASS | Set to `new Date()` on enrollment |
| Founding status returned to frontend | PASS | `isFoundingMember` in API response |

### 1.2 Lifetime Discount Application (`src/pages/api/subscriptions/initiate-payment.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| 50% discount applied to subscription payments | PASS | `amountCents = Math.round(amountCents * (1 - discountPercent / 100))` |
| Discount percentage configurable per business | PASS | `business.foundingDiscountPercent || 50` |
| Discount flag recorded in transaction | PASS | `foundingDiscountApplied` stored in `rawRequest` |
| Applies to all billing cycles | PASS | Calculated after cycle-based amount determination |

### 1.3 Marketing Claims vs. Implementation

| Claim (Homepage) | Implementation | Match |
|------------------|----------------|-------|
| "50% Lifetime Discount" | 50% applied per payment transaction | YES |
| "No expiration" | Discount checked per transaction, no expiry logic | YES |
| "Limited to first 100 hospitality businesses" | `FOUNDING_LIMIT = 100` enforced | YES |
| "Direct Founder Support" | Not a code-level feature; operational promise | N/A |
| "Early Access to New Capabilities" | Not a code-level feature; operational promise | N/A |
| "Shape Platform Development" | Not a code-level feature; operational promise | N/A |

### Verdict: PASS

---

## 2. Customer Referral Program (Tier 2)

### 2.1 Tracking Service (`src/lib/services/referral-tracking-tier.service.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Referral link click tracking | PASS | `trackClick()` method records click events |
| Welcome bonus (1,000 RWF) on first order | PASS | Tier 2 reward logic in `awardWelcomeBonus()` |
| Table invite rewards (Tier 3) | PASS | `awardTableInviteReward()` method |
| 7-day validation/lock period | PASS | Lifecycle validation with lock period |
| Fraud prevention (self-referral, duplicates) | PASS | Fraud checks in tracking service |
| Dashboard data for referral links | PASS | `getDashboardData()` method |
| Reward lifecycle management | PASS | PENDING → VALIDATED → CREDITED states |

### 2.2 Tracking API (`src/pages/api/customer-referrals/track.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Receives referral code and business ID | PASS | Validated input fields |
| Validates referral code exists | PASS | Code lookup in database |
| Converts referral status to CONVERTED | PASS | Status update on successful tracking |
| Fixed reward amount (1,000 RWF) | PASS | Hardcoded reward amount matches terms |

### 2.3 Public Claims vs. Implementation

| Claim (Referral Page) | Implementation | Match |
|------------------------|----------------|-------|
| "1,000 RWF per friend" | 1,000 RWF fixed reward in tracking API | YES |
| "Both get 1,000 RWF" | Both referrer and referred receive 1,000 RWF | YES |
| "7-day validation period" | 7-day lock period in service | YES |
| "No limits, no caps" | No cap logic found in service | YES |
| "No expiration" | No expiry logic for customer credits | YES |

### 2.4 Service Terms Consistency (`src/pages/service-terms.tsx`)

| Term | Implementation | Match |
|------|----------------|-------|
| 1,000 RWF per qualified referral | 1,000 RWF in API | YES |
| Minimum 5,000 RWF first order | Not verified in tracking API | **WARNING** |
| 7-day lock period | Implemented in service | YES |
| 10,000 RWF minimum withdrawal | Not verified in this audit | NOTE |
| Fraud prevention | Self-referral and duplicate checks | YES |

### Verdict: PASS with note on minimum order value verification

---

## 3. B2B Affiliate Program (Tier 1)

### 3.1 Affiliate Service (`src/lib/services/affiliate.service.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| 15% recurring commission creation | PASS | `createCommission()` calculates 15% of invoice amount |
| 12-month commission window | PASS | Commission creation limited to 12 payments |
| 7-day lock period before approval | PASS | `approveLockedCommissions()` checks 7-day threshold |
| Anti-fraud (self-referral prevention) | PASS | Self-referral check in commission creation |
| Affiliate statistics retrieval | PASS | `getAffiliateStats()` returns total/pending/approved/paid commissions |

### 3.2 Commission Creation via Webhook (`src/pages/api/payments/irembo/webhook.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Commissions generated on successful subscription payment | PASS | `createAffiliateCommissions()` called on payment success |
| Recurring commission (15% for 12 months) | PASS | Logic in webhook handler |
| Welcome bonus for affiliates | PASS | Bonus commission creation logic |
| Self-referral prevention | PASS | Fraud check in webhook handler |

### 3.3 Admin Management (`src/pages/api/admin/affiliates/index.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Admin-only access (ADMIN role) | PASS | Authorization check in handler |
| List affiliates with payouts | PASS | GET handler returns affiliate list |
| Create new affiliates | PASS | POST handler creates affiliate records |

### 3.4 Affiliate Program Page (`src/pages/affiliate/program.tsx`)

| Check | Status | Evidence |
|-------|--------|----------|
| Program details displayed (15%, 12 months) | PASS | Marketing copy matches implementation |
| How it works (apply, get code, refer, qualify, earn) | PASS | Step-by-step guide shown |
| Application form present | PASS | Form with name, email, phone, experience fields |
| **Application form submission** | **FAIL** | `// TODO: Implement application submission` — form fakes success |
| Requirements for professional marketers | PASS | Listed on page |

### 3.5 Public Claims vs. Implementation

| Claim | Implementation | Match |
|-------|----------------|-------|
| "15% recurring commission for 12 months" | 15% for 12 payments in service | YES |
| "Application required" | Form exists but **does not submit** | **NO** |
| "30 Smart Dining Slips in 14 days for qualification" | Qualification logic in business-invite service | YES |

### Verdict: **WARNING** — Affiliate application form is non-functional

---

## 4. Business Invite Program

### 4.1 Invite Service (`src/lib/services/business-invite.service.ts`)

| Check | Status | Evidence |
|-------|--------|----------|
| Invite code generation | PASS | `generateInviteCode()` creates unique codes |
| Attribution tracking | PASS | `attributeInvite()` records invite usage |
| Qualification based on Smart Dining Slips | PASS | `processQualification()` checks slip count |
| Credit issuance to referrer and invitee | PASS | Both receive 1 free month credit |
| Fraud detection | PASS | `flagFraud()` method with suspicious pattern detection |
| Credit unlocking mechanism | PASS | `unlockCredits()` after qualification |
| Credit expiration | PASS | `expireCredits()` for unqualified invites |

### 4.2 Dashboard UI (`src/pages/dashboard/invite.tsx`)

| Check | Status | Evidence |
|-------|--------|----------|
| Invite code generation button | PASS | Calls `/api/business-invite/generate` |
| Invite link and WhatsApp share | PASS | Generated and displayed for sharing |
| Stats display (pending, signed up, qualified, credited) | PASS | Fetched from `/api/business-invite/stats` |
| Status labels for invite lifecycle | PASS | PENDING → SIGNED_UP → QUALIFYING → QUALIFIED → CREDITED |
| Copy link functionality | PASS | Clipboard copy with feedback |

### 4.3 Public Claims vs. Implementation

| Claim (Invite Page) | Implementation | Match |
|----------------------|----------------|-------|
| "Both you and the business you invite get 1 free month" | Both referrer and invitee receive credit | YES |
| Qualification via Smart Dining Slips | Slip count checked in service | YES |

### Verdict: PASS

---

## 5. Professional Marketer Program

### 5.1 Marketer APIs

| Check | Status | Evidence |
|-------|--------|----------|
| Marketer registration | PASS | `/api/marketer/register` endpoint |
| Marketer dashboard | PASS | `/api/marketer/dashboard` endpoint |
| Marketer businesses list | PASS | `/api/marketer/businesses` endpoint |
| Marketer commissions | PASS | `/api/marketer/commissions` endpoint |
| Payout request | PASS | `/api/marketer/payout/request` endpoint |
| Payout history | PASS | `/api/marketer/payout/history` endpoint |
| QR code for marketer | PASS | `/api/marketer/qr-code` endpoint |
| Export (businesses, commissions, payouts) | PASS | Export endpoints for all three |
| Admin marketer management | PASS | `/api/admin/marketers` with suspend capability |
| Cron-based invite maintenance | PASS | `/api/cron/invite-maintenance` endpoint |

### Verdict: PASS

---

## 6. Cross-Program Consistency

### 6.1 Service Terms vs. Implementation

| Program | Terms Section | Implementation | Consistent |
|---------|---------------|----------------|------------|
| Customer Referral (Tier 2) | 7.1 | 1,000 RWF, 7-day lock, fraud prevention | YES |
| B2B Affiliate (Tier 1) | 7.2 | 15% for 12 months, 7-day hold, application required | YES (but form broken) |
| Founding Program | Homepage section | 50% lifetime, first 100 | YES |
| Business Invite | Dashboard page | 1 free month both sides | YES |
| Professional Marketer | API endpoints | Full management system | YES |

### 6.2 Reward Amount Consistency

| Program | Public Claim | Backend Amount | Match |
|---------|-------------|----------------|-------|
| Customer Referral | 1,000 RWF | 1,000 RWF | YES |
| Affiliate Commission | 15% recurring | 15% in service | YES |
| Founding Discount | 50% lifetime | 50% in payment API | YES |
| Business Invite | 1 free month | Credit issuance in service | YES |

---

## 7. Identified Issues

### BLOCKER: Affiliate Application Form Non-Functional

- **File:** `src/pages/affiliate/program.tsx:23`
- **Code:** `// TODO: Implement application submission`
- **Impact:** Users cannot actually apply for the B2B Affiliate Program. The form shows a success message but no data is sent to the backend.
- **Severity:** BLOCKER for affiliate program certification; the program cannot onboard new affiliates through the public form.
- **Workaround:** Admin can manually create affiliates via `/api/admin/affiliates` POST endpoint.
- **Fix Required:** Wire `handleApply` to POST to an application API endpoint.

### WARNING: Minimum Order Value Not Verified in Tracking API

- **File:** `src/pages/api/customer-referrals/track.ts`
- **Issue:** Service terms state "minimum 5,000 RWF first order" but the tracking API does not verify order value before awarding referral reward.
- **Impact:** Referral rewards may be issued for orders below the stated minimum.
- **Recommendation:** Add order value check in the referral reward qualification flow.

---

## 8. Partnership Program Verdict

**CONDITIONALLY CERTIFIED.** Four of five programs are fully functional and consistent with public claims. The B2B Affiliate Program has a non-functional application form (BLOCKER for that program only). The customer referral program has a minor inconsistency with minimum order value verification. All other programs pass verification.
