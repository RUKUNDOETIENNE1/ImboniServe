# GLP-001 — Operational Playbook Manual

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This manual contains 10 operational playbooks for ImboniServe. Each playbook follows the structure: Trigger → Detection → Response → Communication → Recovery → Verification.

---

## PB-001: Platform Deployment

**Trigger:** New code ready for production deployment
**Detection:** Manual decision after code review and testing

### Response
1. Verify build: `npm run build`
2. Verify tests: `npm test`
3. Verify Prisma: `npx prisma validate`
4. Check migration status: `npx prisma migrate status`
5. Apply migrations if needed: `npx prisma migrate deploy`
6. Push to `main` branch
7. Monitor Vercel deployment dashboard

### Communication
- Notify founder before deployment
- Notify founder after successful deployment
- If deployment fails, notify founder immediately

### Recovery (if deployment fails)
1. Vercel automatically rolls back to previous deployment
2. Investigate failure in Vercel build logs
3. Fix issue locally
4. Re-push to `main`

### Verification
1. Visit production URL — confirm homepage loads
2. Test login flow
3. Test a sample API endpoint (e.g., `/api/business/setup-status`)
4. Check Sentry for new errors
5. Monitor for 30 minutes post-deployment

---

## PB-002: Rollback

**Trigger:** Production deployment caused a critical issue
**Detection:** Sentry alert, user report, or monitoring detection

### Response
1. Go to Vercel dashboard → Deployments
2. Find the last known good deployment
3. Click "Promote to Production"
4. Previous deployment becomes active immediately

### Communication
- Notify founder immediately: "Rolling back production to [date] deployment due to [issue]"
- If Customer #1 is affected, notify them via WhatsApp: "We identified a technical issue and have restored service. We apologize for the inconvenience."

### Recovery
1. If a database migration was applied with the failed deployment, create a new migration to reverse the schema change
2. NEVER use `prisma migrate reset` in production
3. Investigate root cause of the issue
4. Fix locally, test, then redeploy

### Verification
1. Confirm production URL loads correctly
2. Test the specific feature that was broken
3. Check Sentry for error rate returning to baseline
4. Monitor for 1 hour post-rollback

---

## PB-003: Incident Response

**Trigger:** Platform down, data loss, or payment failure
**Detection:** Sentry alert, watchdog alert, user report, or manual observation

### Severity Classification
| Severity | Definition | Response Time |
|----------|-----------|---------------|
| Critical | Platform down, data loss, payment failure | Immediate |
| High | Major feature broken, significant user impact | < 1 hour |
| Medium | Minor feature broken, workaround exists | < 4 hours |
| Low | Cosmetic issue, no user impact | Next business day |

### Response (Critical)
1. Acknowledge incident immediately
2. Assign responder (founder during Customer #1)
3. Assess impact: Which users? Which data? Which revenue?
4. Check Sentry for error details
5. Check Vercel deployment status
6. Check database connectivity: `npx prisma db pull --print | head -5`
7. Check Redis: `/api/admin/queue/health`
8. Check payment gateway status (InTouch/IremboPay dashboards)

### Communication
- **Critical/High:** Notify founder immediately via phone call + WhatsApp
- **Customer #1:** Notify via WhatsApp with estimated resolution time
- **Internal:** Document in incident report within 24 hours

### Recovery
1. Identify root cause
2. Implement minimal fix
3. Test fix locally
4. Deploy fix (follow PB-001)
5. Or rollback (follow PB-002) if fix is complex

### Verification
1. Confirm issue is resolved in production
2. Confirm Customer #1 can perform the affected operation
3. Monitor for 24 hours for recurrence
4. Write incident report (use `docs/templates/TPL-IR-001`)

---

## PB-004: Customer Support Escalation

**Trigger:** Customer #1 reports an issue via support ticket, WhatsApp, or email
**Detection:** Support inbox notification, WhatsApp message, or email alert

### Response
1. Acknowledge receipt within 1 hour (business hours) or 4 hours (after hours)
2. Classify issue: Bug, How-to question, Feature request, or Billing issue
3. If bug: Reproduce locally, assess severity, follow PB-003 if Critical/High
4. If how-to: Provide guidance from documentation or canned replies
5. If feature request: Log in product backlog, inform customer of timeline
6. If billing: Check subscription status, payment history, ledger entries

### Communication
- Respond via the same channel the customer used (WhatsApp, email, in-app support)
- Use professional, warm tone
- Provide clear, actionable guidance
- Set expectations for resolution time

### Recovery
1. Resolve issue or provide workaround
2. Confirm customer is satisfied with resolution
3. Close support ticket
4. Log issue for pattern tracking

### Verification
1. Customer confirms issue is resolved
2. Support ticket marked as RESOLVED
3. No recurrence within 7 days

---

## PB-005: Payment Provider Outage

**Trigger:** InTouch or IremboPay API is unavailable
**Detection:** Payment webhook failures, Sentry errors, customer reports of failed payments

### Response
1. Verify outage: Check InTouch/IremboPay status page or dashboard
2. If InTouch is down: Set `PAYMENTS_PROVIDER=irembo` in Vercel (fallback to cards)
3. If IremboPay is down: Set `PAYMENTS_PROVIDER=intouch` (fallback to mobile money)
4. If both are down: Enable "cash only" mode — inform customers to use cash payments
5. Check for stuck payments: Run `/api/cron/watchdog-payment` manually

### Communication
- Notify founder immediately
- Notify Customer #1: "Our payment provider is experiencing an outage. We have switched to an alternative payment method. You can continue accepting cash payments. We will notify you when electronic payments are restored."
- Update every 30 minutes until resolved

### Recovery
1. Monitor provider status
2. When provider is back, restore original `PAYMENTS_PROVIDER` setting
3. Process any stuck payments manually if needed
4. Reconcile ledger entries for the outage period

### Verification
1. Process a test payment through the restored provider
2. Verify webhook callbacks are received
3. Check ledger entries match payments
4. Run reconciliation: `/api/cron/reconciliation`

---

## PB-006: Messaging Provider Outage

**Trigger:** Twilio (WhatsApp/SMS) or SMTP (Email) is unavailable
**Detection:** Notification failures, Sentry errors, customer reports of missing notifications

### Response
1. Verify outage: Check Twilio status page, test SMTP connection
2. If Twilio is down:
   - WhatsApp notifications will fail gracefully (logged but not blocking)
   - OTP delivery via WhatsApp will fail — users can request email OTP
   - Smart Dining Slips will not be sent — inform customers
3. If SMTP is down:
   - Email notifications will fail gracefully (logged but not blocking)
   - OTP delivery via email will fail — users can request WhatsApp OTP
   - Invoice delivery will fail — provide PDF download from dashboard

### Communication
- Notify founder
- If Customer #1 is affected: "Our messaging provider is experiencing issues. Order notifications may be delayed. You can check orders directly in the dashboard. We will notify you when messaging is restored."

### Recovery
1. Monitor provider status
2. When restored, test notification delivery
3. Check for any missed notifications that need manual resend

### Verification
1. Send a test WhatsApp message
2. Send a test email
3. Process a test order and confirm notification is delivered

---

## PB-007: Database Recovery

**Trigger:** Database corruption, data loss, or catastrophic failure
**Detection:** Prisma connection errors, query failures, Sentry errors

### Response
1. Follow `docs/runbooks/RB-001_DATABASE_RECOVERY.md`
2. Assess database state: `npx prisma db pull --print | head -20`
3. If database is accessible but corrupted:
   - Identify affected tables
   - Restore from Supabase backup (via Supabase dashboard)
4. If database is inaccessible:
   - Check Supabase dashboard for incident
   - If Supabase is down, wait for recovery (managed service)
   - If connection string is wrong, update `DATABASE_URL` in Vercel

### Communication
- Notify founder immediately
- Notify Customer #1: "We are experiencing a database issue. The platform may be temporarily unavailable. We are working to restore service and will notify you as soon as it is resolved."
- Update every 15 minutes until resolved

### Recovery
1. Restore from Supabase backup (if needed)
2. Verify schema: `npx prisma validate`
3. Apply any pending migrations: `npx prisma migrate deploy`
4. Regenerate client: `npx prisma generate`
5. Redeploy application if needed

### Verification
1. Database queries succeed
2. All API endpoints respond correctly
3. Customer #1 can log in and access dashboard
4. Check data integrity: compare record counts with last known good state
5. Run reconciliation: `/api/cron/reconciliation`

---

## PB-008: Service Degradation

**Trigger:** Platform is slow but not down (high latency, partial failures)
**Detection:** Sentry performance alerts, user reports of slowness, Vercel function timeout warnings

### Response
1. Check Vercel function logs for timeout errors
2. Check database query performance (Supabase dashboard → Query Performance)
3. Check Redis connection: `/api/admin/queue/health`
4. Check Pusher connection (realtime features may be degraded)
5. Identify bottleneck: Database? Queue? External API? AI service?

### Communication
- Notify founder
- If Customer #1 is affected: "The platform is experiencing slower than normal response times. We are investigating and working to restore full performance. Your data is safe."

### Recovery
1. If database is the bottleneck: Check for long-running queries, add indexes if needed
2. If queue is backed up: Check for failed jobs, clear DLQ if needed
3. If AI service is slow: AI features will degrade gracefully (cached results or empty)
4. If Pusher is slow: Realtime features fall back to polling (3-second intervals)
5. Redeploy if a code fix is needed

### Verification
1. Page load times return to normal (< 2 seconds)
2. API response times return to normal (< 500ms)
3. No Sentry performance alerts for 1 hour
4. Customer #1 confirms platform is responsive

---

## PB-009: Business Continuity

**Trigger:** Extended outage (> 4 hours) or founder unavailability
**Detection:** Incident duration exceeds 4 hours, or founder is unreachable

### Response
1. If founder is unavailable:
   - Designated backup: [Assign before go-live]
   - Backup has access to: Vercel dashboard, Supabase dashboard, Sentry dashboard
2. If extended outage:
   - Switch Customer #1 to manual mode (cash payments, manual order tracking)
   - Provide Customer #1 with a direct phone number for support
   - Document all orders and payments manually for later reconciliation

### Communication
- Notify Customer #1 with clear instructions for manual operation
- Provide estimated resolution time (even if estimate is "end of day")
- Check in every 2 hours during extended outage

### Recovery
1. Restore platform service
2. Reconcile manual records with system records
3. Process any pending payments electronically
4. Verify all data is consistent

### Verification
1. Platform fully operational
2. All manual records entered into system
3. Ledger reconciled with actual transactions
4. Customer #1 confirms satisfaction with recovery process

---

## PB-010: Cron Job Failure

**Trigger:** A scheduled cron job fails to execute or returns an error
**Detection:** Vercel cron logs, watchdog alerts, missing daily reports

### Response
1. Check Vercel dashboard → Cron Jobs for execution history
2. Identify which cron job failed
3. Check the cron endpoint logs for error details
4. Manually trigger the cron job: `curl -H "Authorization: Bearer $CRON_SECRET" https://imboniserve.com/api/cron/[job-name]`
5. If manual trigger fails, investigate the error

### Communication
- If reconciliation cron fails: Notify founder (financial data may be inconsistent)
- If watchdog cron fails: Notify founder (health monitoring is interrupted)
- If summary cron fails: Low priority — daily summary will be missing

### Recovery
1. Fix the underlying issue causing the cron failure
2. Manually run the cron job to process the missed execution
3. Redeploy if a code fix is needed

### Verification
1. Cron job executes successfully on next scheduled run
2. Check Vercel cron logs for successful execution
3. Verify the cron job's output (e.g., reconciliation report, watchdog alerts)

---

## Playbook Maintenance

- **Review Frequency:** Monthly during Customer #1 onboarding, quarterly thereafter
- **Owner:** Founder (during Customer #1), Operations Lead (post-onboarding)
- **Updates:** Update playbooks after any incident to incorporate lessons learned
- **Testing:** Tabletop exercise each playbook quarterly
