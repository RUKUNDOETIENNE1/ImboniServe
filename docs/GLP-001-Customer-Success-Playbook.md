# GLP-001 — Customer Success Playbook

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This playbook ensures Customer #1 feels accompanied, not abandoned. It covers onboarding checklists, training, success milestones, follow-up cadence, issue escalation, and feedback collection.

**Principle (EGR-015):** Customer success begins before customer onboarding. Every checklist, process, and communication exists so Customer #1 experiences confidence from the first interaction.

---

## 1. Onboarding Checklist

### Pre-Arrival (Before Customer #1 signs up)
- [ ] Founder has personally contacted the business owner
- [ ] Value proposition explained (orders, payments, intelligence in one platform)
- [ ] Signup link shared via WhatsApp
- [ ] Founder's direct contact number shared
- [ ] Expected timeline communicated (Day 0: setup, Day 1: go-live)

### Arrival (Day 0 — Registration)
- [ ] Customer #1 completes signup form
- [ ] Business auto-approved (low-risk hospitality)
- [ ] MFA setup successful (OTP received via email or WhatsApp)
- [ ] First login successful
- [ ] Dashboard loads with setup progress banner
- [ ] Founder confirms: "Welcome! I'll be with you every step of the way."

### Setup (Day 0-1)
- [ ] Payment configuration reviewed (default 18% VAT is valid)
- [ ] First staff member invited
- [ ] Menu created (AI extraction or manual entry)
- [ ] Tables created
- [ ] QR codes generated and printed
- [ ] QR codes placed on tables
- [ ] Setup progress reaches 100%

### Go-Live (Day 1)
- [ ] First real order processed
- [ ] First real payment completed
- [ ] Smart Dining Slip sent (if WhatsApp enabled)
- [ ] Kitchen display receiving orders
- [ ] First Z-Report reviewed and day closed
- [ ] Founder present for first closing day

### Post Go-Live (Day 2+)
- [ ] First executive review conducted (CEO dashboard)
- [ ] Customer can independently create orders
- [ ] Customer can independently close day
- [ ] Customer can independently review dashboard
- [ ] Customer knows how to contact support

---

## 2. Training Checklist

### Module 1: Daily Operations (Day 1)
- [ ] How to log in (MFA/OTP process)
- [ ] How to view incoming orders (kitchen display or dashboard)
- [ ] How to accept and prepare orders
- [ ] How to process cash payments
- [ ] How to process mobile money payments
- [ ] How to send Smart Dining Slips
- [ ] How to close the day (Z-Report)

### Module 2: Menu Management (Day 1-2)
- [ ] How to add menu items manually
- [ ] How to use AI Menu Builder (photo extraction)
- [ ] How to edit prices and descriptions
- [ ] How to organize menu by categories
- [ ] How to mark items as available/unavailable

### Module 3: QR Codes (Day 1)
- [ ] How to generate table QR codes
- [ ] How to customize QR design (logo, colors)
- [ ] How to download and print QR codes
- [ ] How QR ordering works from customer perspective

### Module 4: Staff Management (Day 2)
- [ ] How to create staff accounts
- [ ] How to assign roles (MANAGER, CASHIER, WAITER, KITCHEN_MANAGER)
- [ ] How staff log in with MFA
- [ ] How to remove or deactivate staff

### Module 5: Executive Dashboard (Day 2-3)
- [ ] How to access CEO dashboard
- [ ] How to interpret Business Health Score
- [ ] How to read revenue metrics
- [ ] How to use executive AI insights
- [ ] How to review daily, weekly, monthly performance

### Module 6: Support (Day 2)
- [ ] How to create a support ticket
- [ ] How to contact support via WhatsApp
- [ ] How to contact support via email
- [ ] What to expect: response within 1 hour (business hours)

---

## 3. Implementation Checklist

### Technical Implementation
- [ ] Production environment verified (all env vars set)
- [ ] Database migrations applied
- [ ] Cron jobs running (check Vercel dashboard after 24h)
- [ ] Sentry monitoring active
- [ ] Health check endpoints responding
- [ ] Payment gateways tested (InTouch + IremboPay)
- [ ] WhatsApp notifications tested
- [ ] Email notifications tested
- [ ] Pusher realtime tested (kitchen display updates)

### Business Implementation
- [ ] Business profile complete (name, location, GPS)
- [ ] Tax settings configured (18% VAT, EXCLUSIVE mode)
- [ ] Currency set to RWF
- [ ] Staff accounts created with correct roles
- [ ] Menu items published
- [ ] Tables created with correct numbers
- [ ] QR codes generated, printed, and placed

### Operational Implementation
- [ ] Founder's phone number saved in Customer #1's phone
- [ ] Support WhatsApp number shared
- [ ] Support email shared
- [ ] Daily check-in schedule agreed (first 7 days)
- [ ] Weekly review schedule agreed (first 4 weeks)

---

## 4. Go-Live Checklist

### Day Before Go-Live
- [ ] All setup steps complete
- [ ] Test order processed and verified
- [ ] Test payment processed and verified
- [ ] Test Z-Report generated and verified
- [ ] Founder available for go-live day
- [ ] Customer #1 ready to start operations

### Go-Live Day
- [ ] Founder on-site or available via WhatsApp
- [ ] First real customer order monitored
- [ ] First real payment verified
- [ ] Kitchen display confirmed working
- [ ] WhatsApp notifications confirmed working
- [ ] End-of-day Z-Report reviewed with Customer #1
- [ ] Day closed successfully
- [ ] Founder confirms: "Congratulations on your first day!"

---

## 5. Success Milestones

| Milestone | Target | Measurement | Celebration |
|-----------|--------|-------------|-------------|
| First order | Day 1 | Sale created with CONFIRMED status | WhatsApp message from founder |
| First payment | Day 1 | Sale with COMPLETED paymentStatus | WhatsApp message from founder |
| First Z-Report | Day 1 | AuditLog with CLOSE_DAY action | Review session with founder |
| 10 orders | Week 1 | Sale count ≥ 10 | Check-in call |
| 50 orders | Week 2 | Sale count ≥ 50 | Check-in call + dashboard review |
| 100 orders | Month 1 | Sale count ≥ 100 | First month review |
| First subscription payment | Month 1 | PaymentTransaction with SUCCESS | Customer is now a paying customer |
| Independent operation | Month 1 | Customer performs all tasks without founder help | Graduation from guided onboarding |

---

## 6. Follow-Up Cadence

### First Week (Daily Check-Ins)
**Schedule:** Daily at 5:00 PM (end of business day)
**Duration:** 15 minutes
**Format:** WhatsApp or phone call

**Agenda:**
1. How was today? Any issues?
2. How many orders today?
3. Did the Z-Report work correctly?
4. Any questions about the dashboard?
5. Anything you'd like to change or adjust?

**Documentation:** Log each check-in in the Customer Success Tracker.

### Second Week (Every Other Day)
**Schedule:** Monday, Wednesday, Friday at 5:00 PM
**Duration:** 10 minutes
**Format:** WhatsApp or phone call

### Weeks 3-4 (Weekly)
**Schedule:** Every Monday at 10:00 AM
**Duration:** 30 minutes
**Format:** Video call (Google Meet or WhatsApp Video)

**Agenda:**
1. Review last week's performance (CEO dashboard)
2. Discuss any issues or questions
3. Plan for the coming week
4. Gather feedback on features
5. Identify training needs

### Month 2+ (Bi-Weekly)
**Schedule:** Every other Monday
**Duration:** 30 minutes
**Format:** Video call

---

## 7. First-Month Review

**Schedule:** Day 30 after go-live
**Duration:** 1 hour
**Format:** On-site or video call

### Review Agenda
1. **Performance Review:**
   - Total orders processed
   - Total revenue collected
   - Average order value
   - Payment method breakdown
   - Business Health Score trend

2. **Operational Review:**
   - Daily operations running smoothly?
   - Staff using the system correctly?
   - Any recurring issues?
   - Z-Report reconciliation working?

3. **Training Review:**
   - Any areas where staff need more training?
   - Any features they're not using?
   - Any features they want to learn?

4. **Feedback Collection:**
   - What's working well?
   - What's not working well?
   - What features would they like to see?
   - Would they recommend ImboniServe to other businesses?

5. **Next Steps:**
   - Transition from guided onboarding to standard support
   - Schedule monthly check-ins
   - Discuss subscription conversion (if on trial)

### Review Output
- Customer Success Score (1-10)
- Net Promoter Score (would they recommend?)
- Feature requests logged
- Issues identified and assigned
- Action items with deadlines

---

## 8. Issue Escalation Process

### Level 1: Customer Self-Service
- Customer checks dashboard
- Customer reads any relevant documentation
- Customer attempts to resolve independently

### Level 2: Support Ticket
- Customer creates support ticket via dashboard
- OR customer sends WhatsApp message to support number
- Response time: 1 hour (business hours), 4 hours (after hours)

### Level 3: Founder Direct
- If issue is not resolved within 4 hours
- If issue is Critical (payment failure, data loss, platform down)
- Customer calls founder's direct number
- Founder responds immediately

### Level 4: Engineering
- If issue requires code fix
- Founder escalates to engineering (currently founder is engineering)
- Fix is developed, tested, and deployed
- Customer is notified of resolution

### Escalation Matrix

| Severity | Level | Response Time | Owner |
|----------|-------|---------------|-------|
| Critical | L3-L4 | Immediate | Founder |
| High | L2-L3 | < 1 hour | Founder |
| Medium | L2 | < 4 hours | Founder |
| Low | L1-L2 | Next business day | Founder |

---

## 9. Feedback Collection Process

### Channels
1. **Daily Check-Ins:** Informal feedback during first week
2. **Weekly Reviews:** Structured feedback during weekly calls
3. **Monthly Review:** Comprehensive feedback session
4. **In-App Support:** Feedback via support tickets
5. **Direct WhatsApp:** Anytime feedback via founder's WhatsApp

### Feedback Categories
- **Bug Reports:** Something doesn't work as expected
- **Feature Requests:** Something they want that doesn't exist
- **UX Feedback:** Something is confusing or hard to use
- **Positive Feedback:** Something they love
- **Business Impact:** How the platform is helping their business

### Feedback Processing
1. Log all feedback in the Customer Success Tracker
2. Categorize: Bug, Feature Request, UX, Positive, Business Impact
3. Bugs: Fix within 48 hours (Critical/High) or next sprint (Medium/Low)
4. Feature Requests: Add to product backlog, prioritize for next release
5. UX Feedback: Evaluate for design improvements
6. Positive Feedback: Share with team, use in marketing (with permission)
7. Business Impact: Use as success story, track for case study

---

## 10. Feature Request Process

### Submission
- Customer submits via support ticket, WhatsApp, or during review call
- Founder logs in product backlog

### Triage
- **Impact:** How many customers will benefit?
- **Effort:** How much engineering work?
- **Priority:** High (within 2 weeks), Medium (within 1 month), Low (backlog)

### Communication
- Acknowledge receipt within 24 hours
- Provide timeline for evaluation
- Notify customer when feature is planned
- Notify customer when feature is released

### Post-Release
- Personally notify the customer who requested the feature
- Offer to walk through the new feature
- Gather feedback on the implementation
