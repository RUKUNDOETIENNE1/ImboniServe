# GLP-001 — Founder Operations Guide

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This guide defines the founder's operational responsibilities during Customer #1 onboarding. The founder is personally responsible for Customer #1's success. No delegation until the first successful onboarding is complete.

**Principle:** The founder is the single point of operational ownership. This is intentional.

---

## 1. Daily Monitoring Routine

### Morning Routine (7:00 AM — 15 minutes)

**Step 1: Check Platform Health (2 minutes)**
- Open production URL: https://imboniserve.com
- Confirm homepage loads
- Check for any Vercel deployment issues (Vercel dashboard)

**Step 2: Check Sentry (3 minutes)**
- Open Sentry dashboard
- Review overnight errors (filter: last 12 hours)
- Check for any Critical or High severity issues
- If errors found: investigate immediately

**Step 3: Check Cron Jobs (3 minutes)**
- Open Vercel dashboard → Cron Jobs
- Verify all 9 cron jobs ran successfully overnight
- Check for any failed executions
- If any failed: manually trigger and investigate

**Step 4: Check Watchdog Alerts (2 minutes)**
- Check Slack for overnight watchdog alerts
- Check email for alert notifications
- If any CRITICAL alerts: follow PB-003 (Incident Response)

**Step 5: Check Customer #1 Status (5 minutes)**
- Open CEO dashboard for Customer #1's business
- Review overnight activity (if any)
- Check for any support tickets from Customer #1
- Check WhatsApp for any messages from Customer #1

### Evening Routine (5:00 PM — 30 minutes, during first 2 weeks)

**Step 1: Daily Check-In with Customer #1 (15 minutes)**
- WhatsApp or phone call
- "How was today? Any issues?"
- Review the day's Z-Report together (if Customer #1 is available)
- Log check-in notes in Customer Success Tracker

**Step 2: Review Daily Summary (5 minutes)**
- Check the daily summary cron output (6:00 AM cron)
- Review Customer #1's daily metrics
- Compare with previous days for trends

**Step 3: End-of-Day Platform Check (5 minutes)**
- Quick Sentry check for new errors during the day
- Quick Vercel check for any deployment issues
- Quick Supabase check for database health

**Step 4: Plan for Tomorrow (5 minutes)**
- Review any open support tickets
- Review any pending feature requests
- Note any items to address tomorrow

---

## 2. Executive Dashboard Review Cadence

### CEO Dashboard (Daily — Morning + Evening)
- **Morning:** Quick scan of Business Health Score, overnight activity
- **Evening:** Full review with Customer #1 during check-in
- **Focus:** Health score trend, revenue, operations health

### CFO Dashboard (Weekly — Monday)
- Review financial metrics: MRR, revenue, ledger integrity
- Check for any financial discrepancies
- Verify reconciliation is running correctly

### Support Inbox (Daily — Morning + Afternoon)
- Check for new support tickets
- Respond within 1 hour (business hours)
- Close resolved tickets

### Cron Job Logs (Daily — Morning)
- Verify all cron jobs succeeded
- Investigate any failures

### Sentry Dashboard (Daily — Morning + Evening)
- Review new errors
- Check error rate trend
- Investigate any Critical/High errors

---

## 3. Incident Response Responsibilities

### The Founder IS the On-Call Responder

During Customer #1 onboarding, the founder is the sole incident responder. There is no on-call rotation.

### Incident Response Priority

| Severity | Founder Action | Time to Response |
|----------|---------------|------------------|
| Critical | Drop everything. Respond immediately. | Immediate |
| High | Pause current work. Respond within 1 hour. | < 1 hour |
| Medium | Address during next work block. | < 4 hours |
| Low | Add to task list. Address next day. | Next business day |

### Incident Response Steps
1. **Acknowledge:** Confirm the issue exists
2. **Assess:** Determine severity and impact
3. **Communicate:** Notify Customer #1 if affected
4. **Investigate:** Use Sentry, logs, and dashboards to find root cause
5. **Resolve:** Fix the issue (code fix or rollback)
6. **Verify:** Confirm the issue is resolved
7. **Document:** Write incident report within 24 hours (for Critical/High)

### Customer Communication During Incidents
- **Critical:** Call Customer #1 immediately. Follow up with WhatsApp.
- **High:** WhatsApp Customer #1 within 30 minutes.
- **Medium:** Mention during next check-in.
- **Low:** No customer communication needed.

---

## 4. Customer Communication Plan

### Channels
1. **WhatsApp (Primary):** Quick questions, daily check-ins, issue notifications
2. **Phone Call (Escalation):** Complex issues, incidents, important discussions
3. **Video Call (Reviews):** Weekly reviews, monthly reviews, training sessions
4. **Email (Formal):** Official communications, launch announcements, invoices
5. **In-Person (Go-Live):** Day 0 and Day 1 on-site presence

### Communication Cadence

| Period | Frequency | Channel | Duration |
|--------|-----------|---------|----------|
| Week 1 | Daily | WhatsApp/Phone | 15 min |
| Week 2 | Every other day | WhatsApp/Phone | 10 min |
| Weeks 3-4 | Weekly | Video call | 30 min |
| Month 2+ | Bi-weekly | Video call | 30 min |
| Month 1 Review | Once | Video call/On-site | 1 hour |

### Communication Principles
1. **Be responsive:** Respond to Customer #1 within 1 hour during business hours
2. **Be proactive:** Don't wait for them to report issues — monitor and reach out
3. **Be honest:** If something is broken, say so. If you don't know, say so.
4. **Be warm:** This is a hospitality business — treat them as you'd want to be treated as a guest
5. **Be concise:** Respect their time. They're running a business.

---

## 5. Feedback Review Process

### Daily (During Check-Ins)
- Listen for informal feedback ("I wish it could...", "It's annoying when...")
- Log in Customer Success Tracker
- Categorize: Bug, Feature Request, UX, Positive

### Weekly (During Review Calls)
- Ask structured feedback questions:
  - "What worked well this week?"
  - "What was frustrating?"
  - "What would make your life easier?"
  - "Would you recommend ImboniServe to another restaurant owner?"

### Monthly (During Monthly Review)
- Comprehensive feedback session
- Net Promoter Score: "On a scale of 0-10, how likely are you to recommend?"
- Customer Success Score: "On a scale of 1-10, how satisfied are you?"
- Open-ended: "What's the one thing we should improve first?"

### Feedback Processing
1. Log all feedback immediately
2. Categorize and prioritize
3. Bugs: Fix within 48 hours (Critical/High)
4. Feature Requests: Add to backlog, communicate timeline
5. UX Issues: Evaluate for next design iteration
6. Share patterns with the team (when team exists)

---

## 6. Product Decision Cadence

### Daily (During First 2 Weeks)
- Evaluate any urgent feature requests
- Make quick decisions on small improvements
- Defer larger decisions to weekly review

### Weekly (Monday Review)
- Review all feedback from the past week
- Prioritize bugs and feature requests
- Decide what to work on this week
- Update Customer #1 on any upcoming changes

### Monthly (Month-End Review)
- Review product roadmap against Customer #1 feedback
- Decide on major features for the next month
- Evaluate if any architectural changes are needed
- Plan for Customer #2 onboarding (when applicable)

### Decision Framework
- **Customer #1 Impact:** Does this directly help Customer #1?
- **Effort:** How much time will this take?
- **Risk:** Could this break something?
- **Urgency:** Does this need to happen now?

**Rule:** During Customer #1 onboarding, only make changes that directly benefit Customer #1. No speculative features. No optimization for scale. No refactoring unless it fixes a bug.

---

## 7. Founder's Availability

### During Customer #1 Onboarding (First 30 Days)
- **Available:** 7:00 AM — 9:00 PM (Rwanda time, GMT+2)
- **Response Time:** Within 1 hour (business hours), within 4 hours (after hours)
- **Critical Incidents:** Available 24/7 via phone
- **Weekend Coverage:** Available for Critical incidents only

### Post-Onboarding (After 30 Days)
- **Available:** 8:00 AM — 6:00 PM (business hours)
- **Response Time:** Within 4 hours (business hours)
- **Critical Incidents:** Available 24/7 via phone
- **Weekend Coverage:** Available for Critical incidents only

---

## 8. Founder's Toolkit

### Dashboards
- **Vercel:** https://vercel.com/dashboard (deployments, cron logs, functions)
- **Supabase:** https://supabase.com/dashboard (database, storage, backups)
- **Sentry:** https://sentry.io (error tracking, performance)
- **Upstash:** https://console.upstash.com (Redis, queue metrics)
- **Pusher:** https://dashboard.pusher.com (realtime channels)
- **InTouch:** InTouch dashboard (payment gateway)
- **IremboPay:** IremboPay dashboard (card payments)
- **Twilio:** https://console.twilio.com (WhatsApp/SMS)
- **OpenAI:** https://platform.openai.com (AI usage, costs)

### Tools
- **Slack:** Alert notifications
- **Email:** Support tickets, alerts, official communication
- **WhatsApp:** Customer #1 communication, support
- **Customer Success Tracker:** Log of all interactions, feedback, issues

### Quick Commands
```bash
# Check platform health
curl https://imboniserve.com

# Check database
npx prisma migrate status

# Check Prisma schema
npx prisma validate

# Run tests
npm test

# Build
npm run build

# Manual cron trigger
curl -H "Authorization: Bearer $CRON_SECRET" https://imboniserve.com/api/cron/summary-daily
```

---

## 9. Transition Plan (Post-Onboarding)

After Customer #1's first successful month:

1. **Day 30:** Conduct first-month review
2. **Day 35:** Begin transitioning daily check-ins to weekly
3. **Day 45:** Customer #1 operates independently for 1 week without founder check-in
4. **Day 60:** Customer #1 is in standard support cadence (bi-weekly)
5. **Day 90:** Customer #1 success story documented
6. **Day 100:** Begin preparing for Customer #2

### Ownership Transition
- **Day 1-30:** Founder owns everything (engineering, support, operations, customer success)
- **Day 30-60:** Founder begins documenting processes for delegation
- **Day 60+:** Begin hiring/assigning support and operations roles
- **Day 90+:** Founder transitions to strategic oversight, not daily operations
