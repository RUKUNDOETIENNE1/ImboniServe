# CR-001 — Remaining Uncertainty Register

**Review:** CR-001 — Confidence Readiness Review
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

The Remaining Uncertainty Register consolidates all uncertainties discovered during CR-001. Uncertainties are classified by whether they block Customer #1 onboarding (CONFIDENCE CONDITIONS) or are improvements that reduce uncertainty but don't block (CONFIDENCE IMPROVEMENTS).

**Confidence Conditions (must fix before onboarding): 8**
**Confidence Improvements (should fix, reduce uncertainty): 20**
**Long-Term Uncertainties (deferred): 15**

---

## Confidence Conditions (Must Fix Before Onboarding)

These are issues that, if not addressed, would mean Customer #1 cannot onboard with justified confidence.

| ID | Uncertainty | Source | Severity | Effort |
|----|------------|--------|----------|--------|
| UNC-001 | Pending orders warning before closing day NOT IMPLEMENTED (Board Condition 2) | Board Conditions | HIGH | Low |
| UNC-002 | Outstanding liabilities in Z-Report NOT IMPLEMENTED (Board Condition 3) | Board Conditions | HIGH | Medium |
| UNC-003 | No CI pipeline for reliability tests (Board Condition 4) | Board Conditions | HIGH | Medium |
| UNC-004 | Consumption engine env vars NOT in .env.example (Board Condition 1) | Board Conditions | MEDIUM | Low |
| UNC-005 | DIE Plugin Marketplace endpoints have NO authentication | Adversarial | HIGH | Low |
| UNC-006 | Customer referral tracking endpoint has NO authentication | Adversarial | HIGH | Low |
| UNC-007 | Payment completion ledger write is NOT transactional with sale update | Failure Sim | HIGH | Medium |
| UNC-008 | Close-day operation is NOT atomic | Failure Sim | HIGH | Medium |

---

## Confidence Improvements (Should Fix, Reduce Uncertainty)

These are issues that reduce confidence but don't directly block onboarding. They should be addressed before or shortly after onboarding.

### Security
| ID | Uncertainty | Source | Severity |
|----|------------|--------|----------|
| UNC-009 | DELIVERED status has no reversal mechanism (staff mistakes permanent) | Failure Sim | HIGH |
| UNC-010 | AI endpoints mask database errors as empty results | Adversarial | HIGH |
| UNC-011 | Silent failures in kitchen dispatch (routing errors swallowed) | Adversarial | HIGH |
| UNC-012 | Silent failure in admin reconciliation (errors swallowed) | Adversarial | HIGH |
| UNC-013 | Silent failure in unified intelligence kernel | Adversarial | HIGH |
| UNC-014 | AI endpoints lack rate limiting (API credit abuse) | Adversarial | MEDIUM |
| UNC-015 | Dev bootstrap endpoint in production codebase | Adversarial | MEDIUM |

### Data Integrity
| ID | Uncertainty | Source | Severity |
|----|------------|--------|----------|
| UNC-016 | Revenue calculation inconsistent across 3 endpoints | Adversarial | HIGH |
| UNC-017 | Reservation updateStatus/updateTable lack transactions | Adversarial | HIGH |
| UNC-018 | Kitchen dispatch read-then-update race condition | Adversarial | MEDIUM |

### User Experience
| ID | Uncertainty | Source | Severity |
|----|------------|--------|----------|
| UNC-019 | Setup bug: payment config never completes with default 18% VAT | Founder | HIGH |
| UNC-020 | CEO dashboard AI insights lack trust indicators | Founder | HIGH |
| UNC-021 | Platform fee not shown until checkout | Founder | MEDIUM |
| UNC-022 | No kitchen delay watchdog (orders stuck in "preparing") | Failure Sim | MEDIUM |
| UNC-023 | No payment retry mechanism for failed payments | Failure Sim | MEDIUM |
| UNC-024 | No emergency support channel | Founder | MEDIUM |
| UNC-025 | Support widget can be permanently dismissed | Founder | MEDIUM |
| UNC-026 | CFO dashboard shows SaaS metrics not restaurant metrics | Founder | MEDIUM |
| UNC-027 | Executive dashboards lack freshness indicators | Failure Sim | MEDIUM |
| UNC-028 | Export endpoints return 501 Not Implemented | Adversarial | MEDIUM |

---

## Long-Term Uncertainties (Deferred)

These are uncertainties that don't affect Customer #1 onboarding but should be tracked for long-term platform health.

| ID | Uncertainty | Source | Severity |
|----|------------|--------|----------|
| UNC-029 | 155 pre-existing TypeScript errors | Verification | MEDIUM |
| UNC-030 | Hardcoded referral rewards (50K UI vs 100K API — inconsistent) | Adversarial | MEDIUM |
| UNC-031 | In-memory cache without TTL (menu/ask.ts) | Adversarial | MEDIUM |
| UNC-032 | Currency cache without expiry display | Adversarial | MEDIUM |
| UNC-033 | 125 API files without standard auth (some legitimate) | Adversarial | MEDIUM |
| UNC-034 | DIE endpoints use custom auth (resolveBusinessContext) not standard | Adversarial | MEDIUM |
| UNC-035 | Shadow event ingestion silent failures (7+ files) | Adversarial | MEDIUM |
| UNC-036 | 12 silent catch blocks in order page | Adversarial | MEDIUM |
| UNC-037 | Navigation has 22+ items (decision paralysis) | Founder | MEDIUM |
| UNC-038 | "Pricing finalized server-side" alarming language | Founder | MEDIUM |
| UNC-039 | No drill-down from executive metrics | Founder | MEDIUM |
| UNC-040 | Tax mode choice without legal context | Founder | MEDIUM |
| UNC-041 | Inventory alerts misleading when empty | Founder | LOW |
| UNC-042 | "Scan My Business" button cryptic | Founder | LOW |
| UNC-043 | Group order feature appears without explanation | Founder | LOW |

---

## Uncertainty Distribution

| Category | HIGH | MEDIUM | LOW | Total |
|----------|------|--------|-----|-------|
| Confidence Conditions | 7 | 1 | 0 | 8 |
| Confidence Improvements | 8 | 12 | 0 | 20 |
| Long-Term Uncertainties | 0 | 12 | 3 | 15 |
| **Total** | **15** | **25** | **3** | **43** |

---

## Comparison with OEC-001I Risk Register

OEC-001I listed:
- 0 Customer #1 blockers
- 4 Conditions (3 not implemented)
- 40 Pre-Launch improvements
- 62 Post-Launch evolutions

CR-001 found:
- 8 Confidence Conditions (must fix)
- 20 Confidence Improvements (should fix)
- 15 Long-Term Uncertainties (deferred)

**Key Difference:** OEC-001I assessed the platform as having 0 blockers. CR-001 found 8 confidence conditions that must be addressed. The difference is because OEC-001I listed conditions as future work rather than verifying implementation, and did not conduct adversarial, failure simulation, or founder blind reviews.

---

## Board Assessment

The Remaining Uncertainty Register shows that while the platform is engineering-ready and operationally capable, there are 8 confidence conditions that must be addressed before Customer #1 can onboard with justified confidence.

The 8 conditions are all correctable with low-to-medium effort. After correction, the 20 confidence improvements should be addressed to further reduce uncertainty.

**The Board cannot issue HIGH CONFIDENCE until the 8 confidence conditions are resolved.**
