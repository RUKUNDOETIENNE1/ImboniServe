# Playbook Volume VII — Incident Management

```yaml
id: PB-V7
title: Incident Management
type: playbook
version: 1.0
status: active
owner: Principal Site Reliability Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, ESC-001, IEOS-FP-001]
implements: [MEP-001 D2]
related_documents: [IEL-001, IEOS-LRN-001]
supersedes: []
tags: [playbook, incident, response, sre]
```

## Purpose

Define how incidents are detected, assessed, resolved, and learned from.

---

## 1. Incident Severity

| Severity | Definition | Response Time | Authorization |
|----------|-----------|---------------|---------------|
| **Critical** | Platform down, data loss, payment failure | Immediate | On-call (pre-authorized) |
| **High** | Major feature broken, significant user impact | < 1 hour | On-call |
| **Medium** | Minor feature broken, workaround exists | < 4 hours | Engineer |
| **Low** | Cosmetic issue, no user impact | Next business day | Engineer |

---

## 2. Incident Response Process

```
Detect → Assess → Communicate → Investigate → Resolve → Verify → Report → Learn
```

### Step 1: Detection
- Alert from monitoring
- User report
- Engineer observation

### Step 2: Assessment
- Classify severity
- Assign responder
- Assess impact (users, data, revenue)

### Step 3: Communication
- Critical/High: Notify founder and engineering lead immediately
- Medium: Notify engineering lead within 1 hour
- Low: Log in issue tracker

### Step 4: Investigation
- Reproduce the issue
- Isolate the cause
- Assess scope of impact
- Document findings with evidence

### Step 5: Resolution
- Plan fix (root cause, not symptom)
- Implement fix (minimal change)
- Test fix
- Deploy fix
- Verify resolution

### Step 6: Verification
- Confirm issue is resolved in production
- Monitor for recurrence
- Verify no new issues introduced

### Step 7: Report
- Create incident report (use TPL-IR-001) within 24 hours for Critical/High
- Document timeline, root cause, resolution, impact
- Identify action items

### Step 8: Learn
- Create learning record (use TPL-LRN-001)
- Update runbooks if needed
- Update standards if needed
- Create ADRs if architectural decisions are needed

---

## 3. Hotfix Process

For Critical/High severity incidents requiring immediate action:

```
Detect → Assess (Critical/High) → Fix → Verify → Deploy → Post-Incident Report (24h)
```

**Rules:**
- Minimal change — fix only the issue, no scope creep
- Test even hotfixes
- Document within 24 hours
- Review by engineering lead within 48 hours

---

## 4. Incident Checklist

### During incident:
- [ ] Severity classified
- [ ] Responder assigned
- [ ] Stakeholders notified (if Critical/High)
- [ ] Investigation documented
- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] Fix deployed
- [ ] Resolution verified

### Post-incident:
- [ ] Incident report created (within 24h for Critical/High)
- [ ] Learning record created
- [ ] Action items assigned with owners and due dates
- [ ] Runbooks updated if needed
- [ ] Standards updated if needed

---

## 5. Decision Tree: Incident Response

```
Is this Critical or High severity?
├── YES → Notify founder/engineering lead immediately
│         → Begin investigation immediately
│         → Target resolution: ASAP
│         → Post-incident report: within 24 hours
└── NO → Is this Medium severity?
    ├── YES → Notify engineering lead within 1 hour
    │         → Begin investigation within 4 hours
    │         → Post-incident report: within 48 hours
    └── NO → Low severity
              → Log in issue tracker
              → Address next business day
```

---

## 6. On-Call Responsibilities

### On-call engineer:
- Respond to Critical/High incidents immediately
- Assess and classify severity
- Implement and deploy hotfixes
- Create incident report within 24 hours
- Notify engineering lead and founder

### Engineering Lead:
- Review hotfixes within 48 hours
- Ensure incident reports are complete
- Track action items to completion
- Identify patterns across incidents
- Update governance if needed

---

## References

| Document | Location |
|----------|----------|
| Safety Charter | `docs/safety/ESC-001_ENGINEERING_SAFETY_CHARTER.md` |
| Incident Report Template | `docs/templates/TPL-IR-001_INCIDENT_REPORT_TEMPLATE.md` |
| Learning Record Template | `docs/templates/TPL-LRN-001_LEARNING_RECORD_TEMPLATE.md` |
| Learning Framework | `docs/learning/IEOS-LRN-001_LEARNING_FRAMEWORK.md` |
| Severity Calibration | `docs/standards/SEVERITY_CALIBRATION_STANDARD.md` |
