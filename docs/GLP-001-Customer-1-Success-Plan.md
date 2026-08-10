# GLP-001 — Customer #1 Success Plan

**Phase:** GLP-001 — Go-Live Preparation
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

This plan defines what success looks like for Customer #1 and how it will be achieved. It is not a software deployment plan — it is a customer success plan.

**Success Definition:** Customer #1 independently operates ImboniServe for 30 consecutive days, processes at least 100 orders, completes their first subscription payment, and would recommend ImboniServe to another hospitality business.

---

## Customer #1 Profile

- **Business Type:** Restaurant (hospitality)
- **Location:** Rwanda
- **Currency:** RWF
- **Tax:** 18% VAT (EXCLUSIVE)
- **Plan:** STARTER (with trial)
- **Program:** Founding Hospitality Business (first 100 businesses, lifetime 50% discount)
- **Owner:** [To be filled at onboarding]
- **Contact:** [To be filled at onboarding]

---

## Success Milestones

### Week 1: Onboarding & First Operations

| Milestone | Target Date | Criteria | Status |
|-----------|-------------|----------|--------|
| Registration complete | Day 0 | Business created, auto-approved | ⬜ |
| Setup 100% complete | Day 1 | Menu, tables, payment, staff configured | ⬜ |
| QR codes on tables | Day 1 | QR codes generated, printed, placed | ⬜ |
| First real order | Day 1 | Sale with CONFIRMED status | ⬜ |
| First real payment | Day 1 | Sale with COMPLETED paymentStatus | ⬜ |
| First Z-Report | Day 1 | AuditLog with CLOSE_DAY action | ⬜ |
| First executive review | Day 2 | CEO dashboard reviewed with founder | ⬜ |
| 10 orders processed | Day 7 | Sale count ≥ 10 | ⬜ |
| Staff trained | Day 7 | Training checklist completed | ⬜ |

### Week 2: Stabilization

| Milestone | Target Date | Criteria | Status |
|-----------|-------------|----------|--------|
| 50 orders processed | Day 14 | Sale count ≥ 50 | ⬜ |
| Daily operations independent | Day 14 | Customer operates without founder help | ⬜ |
| Z-Report reconciliation clean | Day 14 | Ledger cross-check matches 7 consecutive days | ⬜ |
| WhatsApp notifications working | Day 14 | Smart Dining Slips sent successfully | ⬜ |

### Month 1: Adoption & Value

| Milestone | Target Date | Criteria | Status |
|-----------|-------------|----------|--------|
| 100 orders processed | Day 30 | Sale count ≥ 100 | ⬜ |
| First subscription payment | Day 30 | PaymentTransaction with SUCCESS for subscription | ⬜ |
| CEO dashboard reviewed weekly | Day 30 | 4 weekly reviews completed | ⬜ |
| Business Health Score ≥ 70 | Day 30 | CEO dashboard shows HEALTHY or better | ⬜ |
| Net Promoter Score ≥ 8 | Day 30 | Customer rates likelihood to recommend ≥ 8/10 | ⬜ |
| First month review conducted | Day 30 | Comprehensive review session completed | ⬜ |

### Month 2+: Independence & Growth

| Milestone | Target Date | Criteria | Status |
|-----------|-------------|----------|--------|
| Independent operation | Day 60 | 1 week without founder check-in, no issues | ⬜ |
| Standard support cadence | Day 60 | Bi-weekly reviews, standard support | ⬜ |
| Feature requests submitted | Day 60 | At least 1 feature request from customer | ⬜ |
| Success story documented | Day 90 | Case study with customer permission | ⬜ |
| Ready for Customer #2 | Day 100 | Onboarding process refined, ready to scale | ⬜ |

---

## Success Metrics

### Operational Metrics

| Metric | Target (Month 1) | Measurement | Frequency |
|--------|------------------|-------------|-----------|
| Total orders | ≥ 100 | Sale count | Daily |
| Total revenue | ≥ [based on AOV] | Sum of completed sales | Daily |
| Average order value | ≥ 5,000 RWF | Revenue / order count | Daily |
| Payment success rate | ≥ 95% | Completed / total payments | Daily |
| Z-Report accuracy | 100% ledger match | Ledger cross-check | Daily |
| Platform uptime | ≥ 99.5% | Sentry + Vercel monitoring | Continuous |

### Customer Success Metrics

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Setup completion | 100% | Setup status API | One-time |
| Daily active usage | ≥ 6 days/week | Login + action tracking | Weekly |
| Support tickets | ≤ 3 in first month | Support ticket count | Weekly |
| Critical incidents | 0 | Incident log | Continuous |
| Customer Satisfaction (CSAT) | ≥ 8/10 | Monthly survey | Monthly |
| Net Promoter Score (NPS) | ≥ 8/10 | Monthly survey | Monthly |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Customer finds setup too complex | Medium | High | Founder on-site for Day 0-1, AI Menu Builder for easy menu creation |
| Payment gateway issues | Low | Critical | Fallback provider (InTouch → IremboPay), cash mode, PB-005 |
| WhatsApp notifications fail | Medium | Medium | Graceful degradation, email fallback, PB-006 |
| Customer doesn't use dashboard | Medium | Medium | Daily check-ins, executive review session, training |
| Staff resistance to new system | Medium | High | Founder training session, simple workflow, QR ordering is intuitive |
| Customer churns before subscription | Low | Critical | First 30 days free trial, daily support, demonstrate value before payment |
| Platform downtime during business hours | Low | Critical | 24/7 incident response, rollback procedure, PB-003 |

---

## Founder's Commitment

1. **Availability:** I will be available via WhatsApp from 7:00 AM to 9:00 PM for the first 14 days.
2. **Response Time:** I will respond to all Customer #1 messages within 1 hour during business hours.
3. **Daily Check-Ins:** I will conduct a 15-minute check-in every day for the first 7 days.
4. **Weekly Reviews:** I will conduct a 30-minute review every week for the first 4 weeks.
5. **Incident Response:** I will respond to Critical incidents immediately, 24/7.
6. **Personal Ownership:** I am personally responsible for Customer #1's success. No delegation.
7. **Feedback Loop:** I will log all feedback, fix bugs within 48 hours, and communicate feature request timelines.
8. **First Month Review:** I will conduct a comprehensive 1-hour review on Day 30.

---

## Success Criteria Summary

Customer #1 onboarding is SUCCESSFUL when ALL of the following are true:

- [ ] Customer has operated independently for 30 consecutive days
- [ ] Customer has processed at least 100 orders
- [ ] Customer has completed their first subscription payment
- [ ] Customer's Business Health Score is ≥ 70 (HEALTHY)
- [ ] Customer would recommend ImboniServe (NPS ≥ 8)
- [ ] No Critical incidents in the last 14 days
- [ ] Z-Report reconciliation has matched for 14 consecutive days
- [ ] Customer has been transitioned to standard support cadence
- [ ] Success story has been documented (with customer permission)
- [ ] Founder has conducted the first-month review

**If all criteria are met, Customer #1 onboarding is declared SUCCESSFUL and the platform is ready for Customer #2.**

---

## Post-Success Actions

After Customer #1 success is declared:

1. **Document the Success Story**
   - Interview Customer #1 for testimonials
   - Document metrics and milestones achieved
   - Create a case study (with permission)

2. **Refine the Onboarding Process**
   - Identify what worked well
   - Identify what could be improved
   - Update onboarding playbook with lessons learned

3. **Prepare for Customer #2**
   - Apply lessons from Customer #1
   - Streamline the onboarding process
   - Begin scaling the support process

4. **Plan for Growth**
   - Evaluate team needs (support, operations, engineering)
   - Plan hiring/assignment of roles
   - Set Customer #2 target date

---

## The Ultimate Question

> "Are we ready to make Customer #1 successful?"

**Answer: YES — with operational discipline, daily commitment, and personal ownership.**

The platform is ready. The operational framework is documented. The founder is committed.

Customer #1 will not just be onboarded. Customer #1 will be successful.
