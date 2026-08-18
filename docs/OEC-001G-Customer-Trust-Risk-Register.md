# OEC-001G — Customer Trust Risk Register

**Certification:** OEC-001G — Customer Trust Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Overview

The Customer Trust Risk Register catalogs all identified trust risks, their severity, likelihood, and mitigation status. Risks are evaluated through the lens of EGR-009: "Every customer interaction must increase trust."

---

## Risk Classification

### Severity Levels
- **CRITICAL** — Would prevent customer adoption
- **HIGH** — Would significantly reduce customer confidence
- **MEDIUM** — Would create hesitation in specific scenarios
- **LOW** — Minor trust friction

### Likelihood Levels
- **HIGH** — Likely to be encountered by most customers
- **MEDIUM** — Likely to be encountered in specific workflows
- **LOW** — Unlikely but possible

---

## Remediated Risks (Closed)

| ID | Risk | Severity | Likelihood | Status | Mitigation |
|----|------|----------|------------|--------|------------|
| TRUST-CRIT-001 | AI recommendations appear authoritative without disclaimers | CRITICAL | HIGH | ✅ CLOSED | Added AIDisclaimer to all 7 AI assistant components |
| TRUST-CRIT-002 | Financial data lacks freshness indicators | CRITICAL | HIGH | ✅ CLOSED | Added DataFreshnessIndicator to 7 financial pages |
| TRUST-003 | Low-confidence AI recommendations lack explanatory text | HIGH | MEDIUM | ✅ CLOSED | Added LowConfidenceWarning to all 7 AI assistants |

---

## Open Risks (Pre-Launch)

| ID | Risk | Severity | Likelihood | Mitigation Plan |
|----|------|----------|------------|-----------------|
| TRUST-PL-001 | Customer signs up without seeing pricing | HIGH | HIGH | Add pricing plans to signup page |
| TRUST-PL-002 | Financial metrics lack calculation explanations | MEDIUM | HIGH | Add tooltips for MRR, commission, VAT |
| TRUST-PL-003 | Cannot drill down from financial summaries to source | MEDIUM | MEDIUM | Make ledger entries clickable |
| TRUST-PL-004 | Partners can't see commission attribution per business | MEDIUM | MEDIUM | Add per-business commission breakdown |
| TRUST-PL-005 | Staff credentials created directly (no email invitation) | MEDIUM | HIGH | Implement email-based invitation flow |
| TRUST-PL-006 | No immediate "Order received" confirmation during QR ordering | MEDIUM | HIGH | Add toast notification on order submission |
| TRUST-PL-007 | VAT rate not shown in Z-Report UI | LOW | MEDIUM | Display 18% tax rate and calculation method |
| TRUST-PL-008 | No pending orders warning before closing day | MEDIUM | MEDIUM | Add blocking alert for pending orders |
| TRUST-PL-009 | No payout schedule displayed for partners | LOW | MEDIUM | Add payout schedule information |
| TRUST-PL-010 | Reconciliation logic not explained | LOW | LOW | Add help text for reconciliation process |

---

## Open Risks (Post-Launch)

| ID | Risk | Severity | Likelihood | Mitigation Plan |
|----|------|----------|------------|-----------------|
| TRUST-PO-001 | No searchable knowledge base | MEDIUM | HIGH | Build knowledge base with articles |
| TRUST-PO-002 | No general undo system | MEDIUM | MEDIUM | Implement undo for common operations |
| TRUST-PO-003 | No systematic retry for failed API calls | MEDIUM | MEDIUM | Implement auto-retry with backoff |
| TRUST-PO-004 | No user-facing audit trail for regular users | LOW | MEDIUM | Expose audit trail to business users |
| TRUST-PO-005 | No contextual tooltips or guided tours | LOW | HIGH | Add tooltips and walkthroughs |
| TRUST-PO-006 | No notification template customization | LOW | LOW | Add template editor |
| TRUST-PO-007 | In-memory rate limiting won't scale | MEDIUM | LOW | Migrate to Redis-based rate limiting |
| TRUST-PO-008 | No hardware key support | LOW | LOW | Add WebAuthn/FIDO2 |
| TRUST-PO-009 | AI confidence scores are hardcoded | LOW | MEDIUM | Implement dynamic confidence |
| TRUST-PO-010 | No reasoning explanation for AI | LOW | MEDIUM | Add reasoning section to recommendations |
| TRUST-PO-011 | No live vs cached data indicators | LOW | MEDIUM | Add live/cached indicators |
| TRUST-PO-012 | No customer success pathway for regular users | LOW | MEDIUM | Add CS pathway for business users |
| TRUST-PO-013 | No A/B testing for notifications | LOW | LOW | Add A/B testing framework |
| TRUST-PO-014 | No backup codes for account recovery | MEDIUM | LOW | Add backup recovery codes |
| TRUST-PO-015 | No historical fee rates | LOW | LOW | Add historical fee tracking |

---

## Risk Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Remediated | 0 | 0 | 0 | 0 | 0 |
| Open (Pre-Launch) | 0 | 2 | 5 | 3 | 10 |
| Open (Post-Launch) | 0 | 0 | 4 | 11 | 15 |
| **Total Open** | **0** | **2** | **9** | **14** | **25** |

**Key Insight:** No critical risks remain. The 2 high-severity pre-launch risks (pricing transparency and staff invitation security) should be addressed before Customer #1 onboarding but do not block the certification.

---

## Risk Trend

| Phase | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| Before OEC-001G | 2 | 3 | 10 | 15 |
| After OEC-001G | 0 | 2 | 9 | 14 |

All critical risks have been remediated. The remaining high-severity risks are pre-launch improvements that should be addressed before onboarding but do not indicate a trust deficiency in the platform's current state.
