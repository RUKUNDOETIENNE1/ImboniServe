# OEC-001G — Trust Journey Assessment

**Certification:** OEC-001G — Customer Trust Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

The Trust Journey Assessment traces the complete customer journey from first contact through daily operations, evaluating whether each interaction increases or decreases trust. Every touchpoint is evaluated through the lens of EGR-009: "Every customer interaction must increase trust."

---

## Journey 1: First Contact → Account Creation

### Touchpoint: Landing Page (`/`)
- **Trust Signal:** Professional branding, clear value proposition
- **Trust Signal:** Feature pages explain AI-generated reports
- **Gap:** Pricing not prominently displayed

### Touchpoint: Signup (`/signup`)
- **Trust Signal:** "14-Day Free Trial" with clear trial length
- **Trust Signal:** "No credit card required. Cancel anytime."
- **Trust Signal:** Referral code benefits shown when valid code detected
- **Trust Signal:** Supplier exception clearly stated
- **Gap (Pre-Launch):** No pricing plans displayed on signup page
- **Gap (Pre-Launch):** No fee disclosure during signup
- **Next Step:** Redirects to `/welcome` (implicit, not explicitly stated)

**Journey Trust Score: 7.5/10** — Good first impression, but pricing transparency needed

---

## Journey 2: Login → Authentication

### Touchpoint: Login (`/login`)
- **Trust Signal:** Lock icon (ShieldCheck) during OTP step
- **Trust Signal:** "Never share this code" warning
- **Trust Signal:** Professional branding with logo
- **Trust Signal:** Specific error messages ("code expired", "too many attempts")
- **Trust Signal:** Generic error for invalid credentials (prevents enumeration)

### Touchpoint: MFA Verification
- **Trust Signal:** 6-digit OTP via email + WhatsApp
- **Trust Signal:** 15-minute OTP expiry
- **Trust Signal:** 5-attempt limit on OTP verification
- **Trust Signal:** Previous OTPs invalidated when new one issued
- **Trust Signal:** All MFA events logged to security events

### Touchpoint: Session Creation
- **Trust Signal:** 8-hour session with hourly refresh
- **Trust Signal:** Session includes roles, businessId, planCode
- **Trust Signal:** LOGIN_SUCCESS event logged

**Journey Trust Score: 9.5/10** — Excellent trust through security

---

## Journey 3: Password Recovery

### Touchpoint: Forgot Password (`/forgot-password`)
- **Trust Signal:** Clear instructions ("No worries! Enter your email")
- **Trust Signal:** "Link will expire in 1 hour" communicated
- **Trust Signal:** "Check spam folder" guidance
- **Trust Signal:** Email enumeration protection (always returns success)
- **Trust Signal:** Rate limited (3 requests/15 min)

### Touchpoint: Reset Password (`/reset-password`)
- **Trust Signal:** Real-time password validation (8+ chars, upper, lower, number)
- **Trust Signal:** Password visibility toggle
- **Trust Signal:** Confirm password matching
- **Trust Signal:** "All sessions logged out for security" message
- **Trust Signal:** Security event logged

**Journey Trust Score: 9.0/10** — Excellent recovery experience

---

## Journey 4: Business Onboarding

### Touchpoint: Setup Wizard (`/setup`)
- **Trust Signal:** "Let's get your business set up in just a few steps"
- **Trust Signal:** Progress indicator with percentage and step count
- **Trust Signal:** Visual progress bar
- **Trust Signal:** "Next Step" banner with action button
- **Trust Signal:** Steps can be completed in any order
- **Trust Signal:** Completed steps show "View & manage" link
- **Trust Signal:** "Congratulations! You've recorded your first sale" celebration

**Journey Trust Score: 9.0/10** — Excellent guided onboarding

---

## Journey 5: QR Ordering

### Touchpoint: Order Page (`/order`)
- **Trust Signal:** Real-time order status via WebSocket
- **Trust Signal:** LiveOrderSummary component
- **Trust Signal:** OrderStatusTracker (pending → preparing → almost_ready → ready)
- **Trust Signal:** MoMo payment with phone verification
- **Gap (Pre-Launch):** No explicit "Order received" message during ordering flow

### Touchpoint: Order Confirmation (`/order/confirmation`)
- **Trust Signal:** Large "Order Confirmed" heading
- **Trust Signal:** Payment status badge ("✅ Paid" / "⏳ Pending Payment")
- **Trust Signal:** Order number in monospace font
- **Trust Signal:** Real-time payment status updates
- **Trust Signal:** ETA for paid orders
- **Trust Signal:** Kitchen preparation status
- **Trust Signal:** Share functionality
- **Trust Signal:** "Continue to Payment" button for pending payments

**Journey Trust Score: 8.0/10** — Good, with minor gap in order received confirmation

---

## Journey 6: Daily Operations

### Touchpoint: Opening
- **Trust Signal:** Dashboard shows current day status
- **Trust Signal:** Staff can see assigned tables and orders

### Touchpoint: Peak Service
- **Trust Signal:** Real-time order updates via WebSocket
- **Trust Signal:** Kitchen display system
- **Trust Signal:** Low stock alerts with WhatsApp notifications
- **Trust Signal:** Waiter call system with offline detection

### Touchpoint: Shift Change
- **Trust Signal:** Staff roles and permissions clearly defined
- **Trust Signal:** Audit trail for sensitive actions

### Touchpoint: Closing
- **Trust Signal:** Z-Report with comprehensive summary
- **Trust Signal:** "Day Open" / "Day Closed" status banners
- **Trust Signal:** Confirmation required before closing
- **Trust Signal:** Immutable after closing (409 error)
- **Trust Signal:** PDF export for external verification
- **Trust Signal (ADDED):** Data freshness indicator on Z-Report

**Journey Trust Score: 8.5/10** — Strong operational trust throughout the day

---

## Journey 7: Financial Reporting

### Touchpoint: Revenue Operations
- **Trust Signal:** Clear summary cards with labels
- **Trust Signal:** Consistent currency formatting (RWF)
- **Trust Signal:** Exception center for operational issues
- **Trust Signal:** Audit timeline
- **Trust Signal (ADDED):** Data freshness indicator

### Touchpoint: Reconciliation
- **Trust Signal:** Clear table with status color coding
- **Trust Signal:** "Run Now" button for on-demand reconciliation
- **Trust Signal:** Resolve action for mismatches
- **Trust Signal (ADDED):** Data freshness indicator

### Touchpoint: Z-Report / Close Day
- **Trust Signal:** Comprehensive summary with payment breakdown
- **Trust Signal:** Transaction log with full details
- **Trust Signal:** Date picker for historical reports
- **Trust Signal (ADDED):** Data freshness indicator

**Journey Trust Score: 8.0/10** — Improved with freshness indicators

---

## Journey 8: AI Recommendations

### Touchpoint: Executive AI Assistants (7 components)
- **Trust Signal:** Evidence displayed for each recommendation
- **Trust Signal:** Confidence scores with color-coded bars
- **Trust Signal:** Expected impact shown
- **Trust Signal:** Suggested actions as navigation links (not auto-execution)
- **Trust Signal (ADDED):** Advisory disclaimer on all 7 components
- **Trust Signal (ADDED):** Low-confidence warning when confidence < 50%/60%

### Touchpoint: Service/Menu/Kitchen Intelligence
- **Trust Signal:** Evidence panels with source data
- **Trust Signal:** Replay links to view original events
- **Trust Signal:** Affected entities shown (orders, staff, stations)

**Journey Trust Score: 8.5/10** — Significantly improved with disclaimers and warnings

---

## Journey 9: Founder Partner Experience

### Touchpoint: Portal Earnings
- **Trust Signal:** Commission breakdown (Pending, Validated, Approved, Paid)
- **Trust Signal:** Current month, lifetime, pending, approved, paid amounts
- **Trust Signal:** Upcoming payout shown
- **Trust Signal:** Payout history with reference IDs
- **Trust Signal (ADDED):** Data freshness indicator

### Touchpoint: Referred Businesses
- **Trust Signal:** Business list with status (On Trial, Subscribed, etc.)
- **Trust Signal:** Code tracking for referrals
- **Trust Signal:** Subscription status shown
- **Gap (Post-Launch):** No commission attribution per business

**Journey Trust Score: 8.0/10** — Good transparency with freshness indicator

---

## Journey 10: Support Experience

### Touchpoint: Support Widget
- **Trust Signal:** Floating chat widget with real-time messaging
- **Trust Signal:** Conversation list with unread counts
- **Trust Signal:** Status tracking (OPEN, PENDING, RESOLVED, CLOSED)
- **Trust Signal:** Priority levels (LOW, NORMAL, HIGH, URGENT)
- **Trust Signal:** File attachment support
- **Trust Signal:** Accessibility features (ARIA, focus management)

### Touchpoint: Partner Support
- **Trust Signal:** Ticket creation with categories
- **Trust Signal:** Ticket history with status badges
- **Trust Signal:** Loading and error states with retry

### Touchpoint: FAQ
- **Trust Signal:** Multilingual (English, French, Kinyarwanda)
- **Trust Signal:** Topics: fees, payments, VAT, receipts, commissions
- **Trust Signal:** Contact info (email, phone)

**Journey Trust Score: 7.5/10** — Good support, knowledge base needed

---

## Journey 11: Security & Audit

### Touchpoint: Security Dashboard
- **Trust Signal:** "Two-factor authentication is active" banner
- **Trust Signal:** Active sessions list with token prefix, expiry, creation
- **Trust Signal:** Security events log with event type, IP, timestamp
- **Trust Signal:** Session revocation (individual and all)
- **Trust Signal:** Color-coded event icons

**Journey Trust Score: 9.0/10** — Excellent security transparency

---

## Trust Journey Summary

| Journey | Score | Key Improvement |
|---------|-------|-----------------|
| Account Creation | 7.5/10 | Pricing transparency needed |
| Login & Authentication | 9.5/10 | None needed |
| Password Recovery | 9.0/10 | None needed |
| Business Onboarding | 9.0/10 | None needed |
| QR Ordering | 8.0/10 | Order received confirmation |
| Daily Operations | 8.5/10 | Freshness indicator added |
| Financial Reporting | 8.0/10 | Freshness indicators added |
| AI Recommendations | 8.5/10 | Disclaimers + warnings added |
| Founder Partner | 8.0/10 | Freshness indicator added |
| Support | 7.5/10 | Knowledge base needed |
| Security & Audit | 9.0/10 | None needed |

**Overall Journey Trust Score: 8.4/10**
