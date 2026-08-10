# GLP-001 — Go-Live Master Checklist

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

This is the single authoritative checklist for welcoming Customer #1. Every item has an owner, verification method, and completion status. No item may be checked without evidence.

---

## 1. Technical Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| T1 | Production build succeeds | Founder | `npm run build` exits 0 | ⬜ |
| T2 | All tests pass | Founder | `npm test` — 0 new failures | ⬜ |
| T3 | Prisma schema valid | Founder | `npx prisma validate` — valid | ⬜ |
| T4 | All migrations applied | Founder | `npx prisma migrate status` — no pending | ⬜ |
| T5 | TypeScript no new errors | Founder | `npx tsc --noEmit` — 0 new errors | ⬜ |
| T6 | Reliability tests pass | Founder | `npx jest tests/reliability/` — 300/300 | ⬜ |
| T7 | Production URL accessible | Founder | Visit https://imboniserve.com | ⬜ |
| T8 | Signup flow works end-to-end | Founder | Complete a test signup | ⬜ |
| T9 | Login with MFA works | Founder | Complete a test login with OTP | ⬜ |
| T10 | API health checks respond | Founder | Check all 4 health endpoints | ⬜ |

---

## 2. Operational Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| O1 | All environment variables set | Founder | Review Vercel project settings against .env.example | ⬜ |
| O2 | Database connection verified | Founder | `npx prisma db pull --print \| head -5` | ⬜ |
| O3 | Redis connection verified | Founder | `/api/admin/queue/health` returns healthy | ⬜ |
| O4 | Cron jobs configured | Founder | Check Vercel dashboard → Cron Jobs (9 jobs) | ⬜ |
| O5 | Cron jobs verified (24h) | Founder | Check Vercel cron logs after 24 hours | ⬜ |
| O6 | Sentry monitoring active | Founder | Trigger test error, confirm in Sentry dashboard | ⬜ |
| O7 | Sentry environment = production | Founder | Check `SENTRY_ENVIRONMENT` in Vercel | ⬜ |
| O8 | Slack alerts configured | Founder | Send test alert, confirm Slack receipt | ⬜ |
| O9 | Email alerts configured | Founder | Send test alert, confirm email receipt | ⬜ |
| O10 | `ALLOW_LEGACY_CREDENTIALS=false` | Founder | Check Vercel env vars | ⬜ |
| O11 | `KITCHEN_CONSUMPTION_ENGINE_MODE=off` | Founder | Check Vercel env vars | ⬜ |
| O12 | `CRON_WORKER=false` | Founder | Check Vercel env vars | ⬜ |
| O13 | Pusher realtime working | Founder | Test kitchen display receives updates | ⬜ |
| O14 | OpenAI API key valid | Founder | Test AI insight generation on dashboard | ⬜ |
| O15 | Supabase storage working | Founder | Test file upload (menu image) | ⬜ |

---

## 3. Business Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| B1 | Customer #1 identified | Founder | Business owner name and contact recorded | ⬜ |
| B2 | Customer #1 personally contacted | Founder | WhatsApp/phone conversation logged | ⬜ |
| B3 | Value proposition explained | Founder | Customer confirmed understanding | ⬜ |
| B4 | Signup link shared | Founder | Link sent via WhatsApp | ⬜ |
| B5 | Go-live date agreed | Founder | Date confirmed with customer | ⬜ |
| B6 | Founder available on go-live day | Founder | Calendar blocked for go-live day | ⬜ |
| B7 | Founder available for first 14 days | Founder | Daily check-in schedule confirmed | ⬜ |

---

## 4. Customer Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| C1 | Customer #1 has registered | Founder | Business created in database | ⬜ |
| C2 | Customer #1 has completed MFA | Founder | Successful login with OTP | ⬜ |
| C3 | Setup wizard at 100% | Founder | `/api/business/setup-status` returns 100% | ⬜ |
| C4 | Menu created (at least 1 item) | Founder | MenuItem count > 0 | ⬜ |
| C5 | Tables created (at least 1) | Founder | Table count > 0 | ⬜ |
| C6 | Payment config saved | Founder | hasPaymentConfig = true | ⬜ |
| C7 | Staff invited (at least 1) | Founder | User count > 1 | ⬜ |
| C8 | QR codes generated | Founder | QR codes downloaded and printed | ⬜ |
| C9 | QR codes placed on tables | Founder | Visual confirmation (photo) | ⬜ |
| C10 | Customer trained on daily operations | Founder | Training checklist completed | ⬜ |
| C11 | Customer knows how to contact support | Founder | Customer confirms support channels | ⬜ |

---

## 5. Documentation Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| D1 | Production Readiness Guide complete | Founder | GLP-001-Production-Readiness-Guide.md | ✅ |
| D2 | Operational Playbook Manual complete | Founder | GLP-001-Operational-Playbook-Manual.md | ✅ |
| D3 | Customer Onboarding Playbook complete | Founder | GLP-001-Customer-Onboarding-Playbook.md | ✅ |
| D4 | Customer Success Playbook complete | Founder | GLP-001-Customer-Success-Playbook.md | ✅ |
| D5 | Founder Operations Guide complete | Founder | GLP-001-Founder-Operations-Guide.md | ✅ |
| D6 | Customer Communication Kit complete | Founder | GLP-001-Customer-Communication-Kit.md | ✅ |
| D7 | Go-Live Master Checklist complete | Founder | This document | ✅ |
| D8 | Customer #1 Success Plan complete | Founder | GLP-001-Customer-1-Success-Plan.md | ✅ |
| D9 | .env.example up to date | Founder | All env vars documented | ✅ |
| D10 | CR-001A Production Configuration Guide | Founder | CR-001A-Production-Configuration-Guide.md | ✅ |

---

## 6. Support Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| S1 | Support WhatsApp number active | Founder | Send and receive test message | ⬜ |
| S2 | Support email active | Founder | Send and receive test email | ⬜ |
| S3 | In-app support ticket system working | Founder | Create and resolve test ticket | ⬜ |
| S4 | Support response time < 1 hour | Founder | Confirm monitoring of support channels | ⬜ |
| S5 | Canned replies configured | Founder | Check support dashboard → Canned Replies | ⬜ |
| S6 | Escalation process documented | Founder | PB-004 in Operational Playbook Manual | ✅ |
| S7 | Incident response process documented | Founder | PB-003 in Operational Playbook Manual | ✅ |

---

## 7. Monitoring Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| M1 | Sentry error tracking active | Founder | Errors appear in Sentry dashboard | ⬜ |
| M2 | Sentry performance monitoring active | Founder | `SENTRY_TRACES_SAMPLE_RATE=0.1` | ⬜ |
| M3 | Slack alerts active | Founder | Test alert received in Slack | ⬜ |
| M4 | Email alerts active | Founder | Test alert received via email | ⬜ |
| M5 | Cron watchdogs running | Founder | Check cron logs for 4 watchdog jobs | ⬜ |
| M6 | Daily summary cron running | Founder | Check cron logs for summary-daily | ⬜ |
| M7 | Reconciliation cron running | Founder | Check cron logs for reconciliation | ⬜ |
| M8 | Health check endpoints responding | Founder | All 4 health endpoints return 200 | ⬜ |
| M9 | Daily monitoring routine established | Founder | Founder Operations Guide followed | ✅ |

---

## 8. Rollback Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| R1 | Vercel rollback process documented | Founder | PB-002 in Operational Playbook Manual | ✅ |
| R2 | Database recovery procedure documented | Founder | RB-001 runbook exists | ✅ |
| R3 | Payment provider fallback documented | Founder | PB-005 in Operational Playbook Manual | ✅ |
| R4 | Messaging provider fallback documented | Founder | PB-006 in Operational Playbook Manual | ✅ |
| R5 | Previous deployment available | Founder | Vercel dashboard shows deployment history | ⬜ |
| R6 | Rollback tested | Founder | Perform test rollback in staging (if available) | ⬜ |

---

## 9. Executive Readiness

| # | Item | Owner | Verification Method | Status |
|---|------|-------|---------------------|--------|
| E1 | Founder has read all GLP-001 documents | Founder | Confirm reading | ⬜ |
| E2 | Founder has reviewed all playbooks | Founder | Confirm reading | ⬜ |
| E3 | Founder has reviewed all communication templates | Founder | Confirm reading | ⬜ |
| E4 | Founder's phone number saved by Customer #1 | Founder | Customer confirms | ⬜ |
| E5 | Founder available 7 AM - 9 PM for first 14 days | Founder | Calendar confirmed | ⬜ |
| E6 | Founder available 24/7 for Critical incidents | Founder | Phone on, ringer on | ⬜ |
| E7 | Daily monitoring routine established | Founder | Morning + evening routine planned | ✅ |
| E8 | Go-live decision documented | Founder | GLP-001 Final Report | ✅ |

---

## Completion Summary

| Category | Items | Completed | Pending |
|----------|-------|-----------|---------|
| Technical | 10 | 0 | 10 |
| Operational | 15 | 0 | 15 |
| Business | 7 | 0 | 7 |
| Customer | 11 | 0 | 11 |
| Documentation | 10 | 10 | 0 |
| Support | 7 | 3 | 4 |
| Monitoring | 9 | 1 | 8 |
| Rollback | 6 | 4 | 2 |
| Executive | 8 | 2 | 6 |
| **Total** | **83** | **20** | **63** |

**Note:** Documentation items are complete (prepared during GLP-001). Operational, technical, and customer items must be verified at actual go-live time. Items marked ⬜ require verification before Customer #1 onboarding begins.

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Founder | | | |
| Engineering Lead | (Founder during Customer #1) | | |
| Operations Lead | (Founder during Customer #1) | | |

**Go-Live Authorization:** Only after all Critical items (T1-T10, O1-O15, B1-B7, C1-C11, S1-S7, M1-M9, E1-E8) are verified complete.

---

## Post-Go-Live Verification

Within 24 hours of Customer #1's go-live:
- [ ] First real order processed successfully
- [ ] First real payment completed successfully
- [ ] First Z-Report generated and day closed
- [ ] No Critical Sentry errors
- [ ] All cron jobs ran successfully
- [ ] Customer #1 contacted for feedback
- [ ] Daily check-in conducted
