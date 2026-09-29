# SUBSCRIPTION_LIFECYCLE_AUDIT

**Date:** 2026-07-02  
**Scope:** Trial, upgrade, downgrade, renewal, and cancellation flows  
**Purpose:** Verify subscription lifecycle behaves correctly and safely

---

## LIFECYCLE STAGES

1. **Trial** — Free 14-day trial period
2. **Activation** — First paid subscription
3. **Renewal** — Recurring subscription payment
4. **Upgrade** — Move to higher-tier plan
5. **Downgrade** — Move to lower-tier plan
6. **Cancellation** — End subscription
7. **Expiry** — Subscription ends (grace period)
8. **Reactivation** — Resume after expiry/cancellation

---

## 1. TRIAL EXPERIENCE

### Current Implementation

**File:** `src/pages/api/auth/signup.ts`

**Trial Creation:**
```typescript
const shouldAutoApprove = riskAssessment.autoApprove && isHospitality
const trialStartDate = shouldAutoApprove && isHospitality ? new Date() : null
const trialEndDate = shouldAutoApprove && isHospitality 
  ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
  : null
```

**Trial Plan:**
```typescript
planCode: 'ESSENTIALS', // Default entry plan for trial
```

**Trial Duration:** 14 days

**Trial Eligibility:**
- ✅ One trial per email (tracked via `TrialEligibilityService`)
- ✅ Risk assessment (fraud prevention)
- ✅ Auto-approval for low-risk businesses
- ⚠️ Pending approval for high-risk businesses (no trial until approved)

### Issues

#### ❌ P0: Trial Plan Mismatch
- **Issue:** Trial defaults to `ESSENTIALS` plan (12,500/month, wrong name)
- **Should Be:** Trial should use `STARTER` plan (15,000/month, correct name)
- **Impact:** Trial users get wrong entitlements, pricing confusion

#### ❌ P0: Trial Entitlements Undefined
- **Issue:** What features should trial users receive?
- **Current:** Trial receives ESSENTIALS/STARTER features (basic)
- **Problem:** Trial may not showcase enough value to convert

#### ⚠️ P1: No Trial Conversion Flow
- **Issue:** No automated prompt to convert trial to paid
- **Impact:** Trials expire without conversion opportunity

#### ⚠️ P1: No Trial Expiry Warning
- **Issue:** No email/notification before trial ends
- **Impact:** Users surprised by trial expiry

#### ⚠️ P1: Pending Approval Businesses Get No Trial
- **Issue:** High-risk businesses wait for manual approval before trial starts
- **Impact:** Slow onboarding, poor first experience

### Recommendations

**P0: Fix Trial Plan**
```typescript
// Change from:
planCode: 'ESSENTIALS'

// Change to:
planCode: 'STARTER'
```

**P0: Define Trial Entitlements**
- **Recommendation:** Trial should receive **Professional** plan features
- **Rationale:** 
  - Showcase value beyond basic Starter features
  - Drive conversions to Professional or higher
  - Industry standard (show premium experience in trial)
- **Implementation:**
  ```typescript
  // In withSubscriptionCheck.ts or similar
  if (business.trialEndDate && new Date() < business.trialEndDate) {
    // Grant Professional entitlements during trial
    return getPlanEntitlements('PROFESSIONAL')
  }
  ```

**P1: Add Trial Conversion Flow**
- 7 days before expiry: Email reminder with upgrade link
- 3 days before expiry: In-app banner "Trial ending soon"
- 1 day before expiry: Push notification + email
- On expiry: Redirect to pricing page with "Trial ended" message

**P1: Add Trial Expiry Warnings**
- Email notifications at 7, 3, 1 days before expiry
- In-app countdown in topbar: "7 days left in trial"
- Upgrade prompts in dashboard

**P1: Improve Pending Approval Experience**
- Option 1: Grant limited trial immediately, full trial after approval
- Option 2: Faster manual approval process (< 24 hours)
- Option 3: Show clear timeline and status in dashboard

---

## 2. ACTIVATION (First Paid Subscription)

### Current Implementation

**File:** `src/lib/payments/subscription.engine.ts`

**Activation Flow:**
1. User completes payment transaction
2. `SubscriptionEngine.activateSubscription()` called
3. Verify payment transaction is successful
4. Create subscription record
5. Link transaction to subscription
6. Update business plan
7. Log audit event

**Code:**
```typescript
static async activateSubscription(request: SubscriptionActivationRequest) {
  // Verify payment
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentTransactionId }
  })
  
  if (transaction.status !== PaymentTransactionStatus.SUCCESS) {
    throw new Error('Payment transaction not completed')
  }
  
  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      businessId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      amountCents: transaction.amountCents,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      startDate: start,
      endDate,
      nextBillingDate,
      isAutoRenew: true,
    }
  })
  
  // Update business plan
  await prisma.business.update({
    where: { id: businessId },
    data: { planId }
  })
  
  return { success: true, subscription }
}
```

### Issues

#### ✅ Strengths
- Payment verification before activation
- Atomic transaction (subscription + business update)
- Audit logging
- Auto-renew enabled by default

#### ⚠️ P1: No Welcome Experience
- **Issue:** No post-activation onboarding or welcome message
- **Impact:** Users don't know what features they unlocked

#### ⚠️ P1: No Feature Unlock Celebration
- **Issue:** No indication of newly available features
- **Impact:** Users may not discover paid features

#### ⚠️ P2: No Activation Email
- **Issue:** No confirmation email after successful activation
- **Impact:** No receipt, no next steps guidance

### Recommendations

**P1: Add Welcome Experience**
- Redirect to welcome page after activation
- Show "Welcome to [Plan Name]" message
- Highlight newly unlocked features
- Offer guided tour or onboarding checklist

**P1: Add Feature Unlock Celebration**
- Show "New" badges on unlocked features
- Dashboard banner: "You now have access to [X] new features"
- Feature discovery prompts

**P2: Send Activation Email**
- Confirmation of plan and pricing
- Receipt/invoice
- Next steps and getting started guide
- Support contact information

---

## 3. RENEWAL (Recurring Payment)

### Current Implementation

**File:** `src/lib/payments/subscription.engine.ts`

**Renewal Flow:**
1. Subscription approaches end date
2. Payment processed (external system)
3. `SubscriptionEngine.renewSubscription()` called
4. Verify payment transaction
5. Extend subscription end date
6. Log audit event and billing ledger entry

**Code:**
```typescript
static async renewSubscription(request: SubscriptionRenewalRequest) {
  // Verify payment
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentTransactionId }
  })
  
  // Calculate new dates
  const cycle = billingCycle || this.inferBillingCycle(subscription)
  const { endDate, nextBillingDate } = this.calculateSubscriptionDates(
    subscription.endDate, 
    cycle
  )
  
  // Update subscription
  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      endDate,
      nextBillingDate,
    }
  })
  
  return { success: true, subscription: updatedSubscription }
}
```

### Issues

#### ✅ Strengths
- Extends from current end date (no gaps)
- Billing ledger entry for financial tracking
- Audit logging

#### ⚠️ P1: No Renewal Reminders
- **Issue:** No notification before renewal charge
- **Impact:** Users surprised by charge, potential chargebacks

#### ⚠️ P1: No Failed Renewal Handling
- **Issue:** What happens if renewal payment fails?
- **Impact:** Subscription may expire without user awareness

#### ⚠️ P2: No Renewal Confirmation
- **Issue:** No email after successful renewal
- **Impact:** No receipt, no confirmation

### Recommendations

**P1: Add Renewal Reminders**
- 7 days before renewal: Email reminder of upcoming charge
- Include amount, date, payment method
- Offer option to update payment method or cancel

**P1: Add Failed Renewal Handling**
- Retry payment 3 times over 7 days
- Email notification after each failed attempt
- Grace period (3 days) after final failure
- Downgrade to free tier or suspend after grace period

**P2: Send Renewal Confirmation**
- Email confirmation after successful renewal
- Receipt/invoice
- Next renewal date
- Thank you message

---

## 4. UPGRADE (Move to Higher Tier)

### Current Implementation

**Status:** ❌ **NOT IMPLEMENTED**

**What Exists:**
- Subscription creation (activation)
- Subscription renewal
- No upgrade flow

**What's Missing:**
- No API endpoint for plan changes
- No UI for upgrading
- No proration logic
- No feature access changes
- No data migration

### Issues

#### ❌ P0: No Upgrade Flow
- **Issue:** Users cannot upgrade their plan
- **Impact:** Revenue loss, manual workarounds required

#### ❌ P0: No Proration Logic
- **Issue:** How to handle mid-cycle upgrades?
- **Examples:**
  - User on Professional (35,000/month) upgrades to Business (75,000/month) on day 15 of 30
  - Should charge: (75,000 - 35,000) × (15/30) = 20,000 RWF prorated
- **Impact:** Unclear pricing, potential disputes

#### ❌ P0: No Feature Access Changes
- **Issue:** When do upgraded features become available?
- **Options:**
  - Immediately after payment
  - At next billing cycle
  - After manual approval
- **Impact:** User confusion

#### ⚠️ P1: No Data Migration
- **Issue:** What happens to existing data on upgrade?
- **Examples:**
  - QR codes: Starter (5) → Professional (20) — existing codes preserved?
  - Branches: Professional (1) → Business (3) — can add branches immediately?
- **Impact:** Data loss risk

### Recommendations

**P0: Implement Upgrade Flow**

**API Endpoint:**
```typescript
// POST /api/subscriptions/upgrade
{
  newPlanCode: 'BUSINESS',
  billingCycle: 'monthly' | 'annual'
}

// Response:
{
  proratedAmount: 20000, // RWF
  newPlanPrice: 75000,
  effectiveDate: '2026-07-02',
  nextBillingDate: '2026-08-01',
  nextBillingAmount: 75000
}
```

**Proration Logic:**
```typescript
function calculateProration(currentPlan, newPlan, daysRemaining, totalDays) {
  const currentDailyRate = currentPlan.monthlyPrice / totalDays
  const newDailyRate = newPlan.monthlyPrice / totalDays
  const dailyDifference = newDailyRate - currentDailyRate
  return dailyDifference * daysRemaining
}
```

**Feature Access:**
- **Recommendation:** Grant immediately after payment
- **Rationale:** Best user experience, immediate value
- **Implementation:** Update business plan, refresh entitlements

**Data Migration:**
- **Recommendation:** Preserve all existing data
- **Rationale:** No data loss, seamless upgrade
- **Implementation:** No migration needed (limits increase, data stays)

**P1: Add Upgrade UI**
- "Upgrade" button in topbar
- Upgrade modal with plan comparison
- Show proration calculation
- One-click upgrade flow

**P1: Add Upgrade Confirmation**
- Email confirmation after upgrade
- Receipt for prorated charge
- Welcome to new plan message
- Feature unlock celebration

---

## 5. DOWNGRADE (Move to Lower Tier)

### Current Implementation

**Status:** ❌ **NOT IMPLEMENTED**

**What Exists:**
- Subscription cancellation
- No downgrade flow

**What's Missing:**
- No API endpoint for plan downgrades
- No UI for downgrading
- No data retention policy
- No feature access changes
- No refund logic

### Issues

#### ❌ P0: No Downgrade Flow
- **Issue:** Users cannot downgrade their plan
- **Impact:** Users cancel instead of downgrading (revenue loss)

#### ❌ P0: No Data Retention Policy
- **Issue:** What happens to data that exceeds new plan limits?
- **Examples:**
  - Business (3 branches) → Professional (1 branch) — which branches are kept?
  - Professional (20 QR codes) → Starter (5 QR codes) — which codes are kept?
  - Business (unlimited outlets) → Professional (unlimited outlets) — no issue
- **Impact:** Data loss risk, user confusion

#### ❌ P0: No Feature Access Changes
- **Issue:** When do downgraded features become unavailable?
- **Options:**
  - Immediately
  - At next billing cycle (recommended)
  - After grace period
- **Impact:** User experience, data access

#### ⚠️ P1: No Refund Logic
- **Issue:** Should users receive prorated refunds for downgrades?
- **Industry Standard:** No refunds, downgrade takes effect at next billing cycle
- **Impact:** Revenue, user satisfaction

### Recommendations

**P0: Implement Downgrade Flow**

**API Endpoint:**
```typescript
// POST /api/subscriptions/downgrade
{
  newPlanCode: 'PROFESSIONAL',
  billingCycle: 'monthly' | 'annual'
}

// Response:
{
  effectiveDate: '2026-08-01', // Next billing cycle
  newPlanPrice: 35000,
  currentPlanExpiryDate: '2026-08-01',
  dataRetentionWarnings: [
    'You have 3 branches. Professional plan includes 1 branch. Please select which branch to keep.',
    'You have 15 QR codes. Professional plan includes 20 QR codes. All codes will be preserved.'
  ]
}
```

**Data Retention Policy:**
```typescript
// Recommended policy:
{
  branches: 'User selects which to keep (before downgrade)',
  qrCodes: 'Keep all if under new limit, user selects which to keep if over',
  aiCredits: 'Reset to new plan limit at next billing cycle',
  storage: 'Keep all data, prevent new uploads if over limit',
  staff: 'Keep all staff, prevent new additions if over limit'
}
```

**Feature Access:**
- **Recommendation:** Downgrade takes effect at next billing cycle
- **Rationale:** User paid for current cycle, should receive full value
- **Implementation:** 
  - Show "Downgrade scheduled for [date]" message
  - Allow cancellation of scheduled downgrade
  - Apply downgrade at next billing date

**Refund Policy:**
- **Recommendation:** No refunds for downgrades
- **Rationale:** Industry standard, user received service
- **Exception:** Allow refund within 7 days of upgrade (buyer's remorse)

**P1: Add Downgrade UI**
- "Change Plan" button in settings
- Downgrade modal with warnings
- Show data retention impact
- Confirm downgrade

**P1: Add Downgrade Confirmation**
- Email confirmation of scheduled downgrade
- Reminder 7 days before downgrade
- Confirmation email after downgrade takes effect

---

## 6. CANCELLATION

### Current Implementation

**File:** `src/lib/payments/subscription.engine.ts`

**Cancellation Flow:**
```typescript
static async cancelSubscription(subscriptionId, userId, reason) {
  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      isAutoRenew: false,
    }
  })
  
  await this.logAuditEvent({
    eventType: AuditEventType.SUBSCRIPTION_CANCELLED,
    businessId: subscription.businessId,
    subscriptionId,
    userId,
    metadata: { reason },
  })
  
  await logBillingEvent({
    businessId: subscription.businessId,
    subscriptionId,
    eventType: BillingEventType.SUBSCRIPTION_CANCELLED,
    metadata: { reason },
  })
  
  return { success: true, subscription: updatedSubscription }
}
```

### Issues

#### ✅ Strengths
- Disables auto-renew
- Audit logging
- Billing ledger entry
- Captures cancellation reason

#### ⚠️ P1: No Cancellation Flow UI
- **Issue:** No UI for cancelling subscription
- **Impact:** Users must contact support (poor UX)

#### ⚠️ P1: No Retention Attempt
- **Issue:** No attempt to retain customer before cancellation
- **Impact:** Lost revenue, no feedback

#### ⚠️ P1: Immediate Cancellation vs End of Billing Cycle
- **Issue:** Does cancellation take effect immediately or at end of cycle?
- **Current:** Unclear from code
- **Recommendation:** Cancel at end of current billing cycle (user paid for full cycle)

#### ⚠️ P2: No Cancellation Confirmation
- **Issue:** No email confirmation after cancellation
- **Impact:** No confirmation, no feedback opportunity

### Recommendations

**P1: Add Cancellation UI**
- "Cancel Subscription" button in settings
- Cancellation modal with retention offer
- Capture cancellation reason (dropdown + text)
- Confirm cancellation

**P1: Add Retention Flow**
- Before cancellation: "What can we do to keep you?"
- Offer discount (e.g., "Stay for 50% off next 3 months")
- Offer downgrade instead of cancellation
- Offer pause subscription (1-3 months)

**P1: Clarify Cancellation Timing**
- **Recommendation:** Cancel at end of current billing cycle
- **Implementation:**
  ```typescript
  data: {
    status: SubscriptionStatus.CANCELLED,
    isAutoRenew: false,
    cancelledAt: new Date(),
    effectiveCancellationDate: subscription.endDate, // End of current cycle
  }
  ```
- **UI:** Show "Subscription active until [date]"

**P2: Send Cancellation Confirmation**
- Email confirmation of cancellation
- Subscription active until [date]
- Data retention policy (how long data is kept)
- Reactivation link
- Feedback survey

---

## 7. EXPIRY (Subscription Ends)

### Current Implementation

**File:** `src/lib/middleware/withSubscriptionCheck.ts`

**Expiry Handling:**
```typescript
const now = new Date()
const graceCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

const activeSub = business.subscriptions[0]
if (activeSub) {
  const expiry = new Date(activeSub.endDate)
  if (expiry > graceCutoff) {
    return handler(req, res) // Valid (including grace period)
  }
  // Subscription expired beyond grace period
  return res.status(402).json({
    error: 'subscription_expired',
    message: 'Your subscription has expired. Please renew to continue.',
    renewUrl: '/pricing',
    expiredAt: activeSub.endDate,
  })
}
```

**Grace Period:** 3 days after expiry

### Issues

#### ✅ Strengths
- Grace period (3 days)
- Clear error message with renewal link
- Applies to API requests

#### ⚠️ P1: No Expiry Warnings
- **Issue:** No notification before expiry
- **Impact:** Users surprised by expiry

#### ⚠️ P1: No Dashboard Expiry Banner
- **Issue:** No in-app warning of upcoming expiry
- **Impact:** Users may not see email warnings

#### ⚠️ P1: No Data Retention Policy
- **Issue:** How long is data kept after expiry?
- **Impact:** User uncertainty, potential data loss

#### ⚠️ P2: Grace Period Not Configurable
- **Issue:** Hard-coded 3-day grace period
- **Impact:** Cannot adjust for different customer segments

### Recommendations

**P1: Add Expiry Warnings**
- 7 days before expiry: Email reminder
- 3 days before expiry: Email + in-app banner
- 1 day before expiry: Email + push notification
- On expiry: Email with grace period notice

**P1: Add Dashboard Expiry Banner**
- Red banner at top of dashboard
- "Your subscription expires in [X] days"
- "Renew Now" button
- Dismiss option (shows again next day)

**P1: Define Data Retention Policy**
- **Recommendation:**
  - Grace period (3 days): Full access
  - 30 days after expiry: Read-only access
  - 90 days after expiry: Data archived
  - 1 year after expiry: Data deleted
- **Implementation:** Document in terms of service, communicate to users

**P2: Make Grace Period Configurable**
- Different grace periods for different plans
- Example: Enterprise gets 7 days, Starter gets 1 day
- Store in plan configuration

---

## 8. REACTIVATION (Resume After Expiry/Cancellation)

### Current Implementation

**Status:** ⚠️ **PARTIAL**

**What Exists:**
- Users can create new subscription (same as activation)
- No specific reactivation flow

**What's Missing:**
- No "Reactivate" button for expired subscriptions
- No data restoration confirmation
- No reactivation discount/incentive

### Issues

#### ⚠️ P1: No Reactivation Flow
- **Issue:** Users must go through full signup/payment flow again
- **Impact:** Friction, potential loss of returning customers

#### ⚠️ P1: No Data Restoration Confirmation
- **Issue:** Users unsure if their data will be restored
- **Impact:** Hesitation to reactivate

#### ⚠️ P2: No Reactivation Incentive
- **Issue:** No discount or incentive to reactivate
- **Impact:** Missed opportunity to win back customers

### Recommendations

**P1: Add Reactivation Flow**
- "Reactivate Subscription" button in dashboard (if expired)
- One-click reactivation (use saved payment method)
- Show data restoration confirmation
- Immediate access after payment

**P1: Add Data Restoration Confirmation**
- "Your data is safe and will be restored immediately"
- Show last activity date
- Confirm no data loss

**P2: Add Reactivation Incentive**
- "Welcome back! Get 25% off your first month"
- "Reactivate within 7 days and get 1 month free"
- Time-limited offers to encourage quick reactivation

---

## LIFECYCLE SUMMARY

| Stage | Status | Issues | Priority |
|-------|--------|--------|----------|
| **Trial** | ⚠️ Partial | Wrong plan, undefined entitlements, no conversion flow | P0 |
| **Activation** | ✅ Complete | No welcome experience, no celebration | P1 |
| **Renewal** | ✅ Complete | No reminders, no failed renewal handling | P1 |
| **Upgrade** | ❌ Missing | No upgrade flow, no proration, no UI | P0 |
| **Downgrade** | ❌ Missing | No downgrade flow, no data retention policy | P0 |
| **Cancellation** | ⚠️ Partial | No UI, no retention, unclear timing | P1 |
| **Expiry** | ✅ Complete | No warnings, no dashboard banner | P1 |
| **Reactivation** | ⚠️ Partial | No reactivation flow, no incentives | P1 |

---

## CRITICAL GAPS

### P0 (Must Fix)

1. **Trial Plan Mismatch** — Trial uses wrong plan name and pricing
2. **Trial Entitlements Undefined** — Unclear what features trial receives
3. **No Upgrade Flow** — Users cannot upgrade their plan
4. **No Downgrade Flow** — Users cannot downgrade (cancel instead)
5. **No Data Retention Policy** — Unclear what happens to data on downgrade/expiry

### P1 (Should Fix)

1. **No Trial Conversion Flow** — Trials expire without conversion prompts
2. **No Renewal Reminders** — Users surprised by renewal charges
3. **No Failed Renewal Handling** — Unclear what happens if payment fails
4. **No Cancellation UI** — Users must contact support to cancel
5. **No Retention Flow** — No attempt to retain cancelling customers
6. **No Expiry Warnings** — Users surprised by expiry
7. **No Reactivation Flow** — Friction for returning customers

### P2 (Nice to Have)

1. **No Activation Email** — No confirmation after first payment
2. **No Renewal Confirmation** — No receipt after renewal
3. **No Cancellation Confirmation** — No confirmation after cancellation
4. **Grace Period Not Configurable** — Hard-coded 3 days
5. **No Reactivation Incentive** — Missed win-back opportunity

---

## RECOMMENDATIONS SUMMARY

### Immediate Actions (P0)

1. **Fix Trial Plan** — Change ESSENTIALS → STARTER, update pricing
2. **Define Trial Entitlements** — Grant Professional features during trial
3. **Implement Upgrade Flow** — API + UI + proration logic
4. **Implement Downgrade Flow** — API + UI + data retention policy
5. **Document Data Retention** — Clear policy for downgrades and expiry

### Strategic Improvements (P1)

1. **Add Trial Conversion Flow** — Email reminders, in-app prompts, countdown
2. **Add Renewal Reminders** — Email before renewal, failed payment handling
3. **Add Cancellation UI** — Self-service cancellation with retention offers
4. **Add Expiry Warnings** — Email + in-app banners before expiry
5. **Add Reactivation Flow** — One-click reactivation for expired subscriptions

### Enhancements (P2)

1. **Add Lifecycle Emails** — Confirmation emails for all lifecycle events
2. **Add Celebration Moments** — Welcome messages, feature unlocks, milestones
3. **Add Incentives** — Reactivation discounts, retention offers, referral bonuses
4. **Add Configurability** — Grace periods, trial duration, proration rules

---

## ESTIMATED EFFORT

- **P0 Fixes:** 2-3 weeks (upgrade/downgrade flows, trial fixes, data retention)
- **P1 Improvements:** 1-2 weeks (conversion flow, reminders, cancellation UI)
- **P2 Enhancements:** 1 week (emails, celebrations, incentives)

**Total:** 4-6 weeks to complete subscription lifecycle

---

**Next Steps:** Review `COMMERCIAL_RECOMMENDATIONS.md` for prioritized implementation roadmap.
