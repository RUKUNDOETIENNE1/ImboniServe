# FOUNDER-GPV-001 — Final Guided Verification Map

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-FINAL-MAP |
| Date | 2026-08-14 |
| Status | MAP COMPLETE |
| Mission | Build the definitive dependency-aware roadmap for founder-led human verification |

## One-Page Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│              IMBONISERVE FOUNDER-LED VERIFICATION JOURNEY            │
│                                                                     │
│  "Can a real founder operate ImboniServe as a real hospitality      │
│   business, from login to financial reconciliation?"                │
└─────────────────────────────────────────────────────────────────────┘

WHERE DO I START?
  → http://localhost:3000/signup
  → Create a test business owner account

WHAT ROLE DO I USE?
  → Start as OWNER (creates the business)
  → Switch to GUEST (scans QR, orders food)
  → Switch to KITCHEN (processes orders)
  → Switch back to OWNER (verifies money, closes day)
  → Test MANAGER, WAITER, CASHIER for permissions

WHAT DO I DO NEXT?
  A: Setup      → Signup → Login → Configure Business
  B: Team       → Create Staff → Verify Permissions
  C: Menu/QR    → Create Menu → Create Tables → Generate QR
  D: Guest      → Scan QR → Browse Menu → Place Order
  E: Kitchen    → Accept → Prep → Ready → Serve
  F: Payment    → Checkout → Tap & Leave → Approve USSD
  G: Close Day  → Z-Report → Verify Variance = 0 → Close
  H: Executive  → CEO → CFO → Reports
  I: Security   → Invalid QR → Failed Payment → Logout

WHAT HAPPENS IF IT WORKS?
  → Financial truth chain verified: Sale = Ledger = Dashboard = Z-Report
  → Variance = 0
  → Business can operate end-to-end
  → Ready for Customer #1 gate assessment

WHAT HAPPENS IF IT DOESN'T?
  → STOP at the failing step
  → Capture evidence (screenshot, error message)
  → Document in defect register
  → Diagnose root cause
  → Fix or configure
  → Return to last safe checkpoint

WHERE DOES PAYMENT HAPPEN?
  → Session F, Step FGPV-034: Tap & Leave on /order/checkout
  → InTouch sandbox → USSD prompt → approve → webhook → financial records

WHERE DOES TAP & LEAVE HAPPEN?
  → Session F, Step FGPV-034: /order/checkout?sessionId=...
  → Smart Dining Slip (live ledger) → freeze → finalize → pay → close

WHERE DOES PROMISE ENGINE APPEAR?
  → Session E: Auto-created when order dispatched to kitchen
  → WARNING at 8 min, CRITICAL at 15 min
  → Visible in /dashboard/operations/service-risks

WHERE DOES SERVICE REPLAY APPEAR?
  → Session E, Step FGPV-032: /dashboard/operations/service-replay
  → Timeline of all service events with playback controls

WHERE DO I VERIFY THE MONEY?
  → Session G, Step FGPV-039: /dashboard/close-day
  → Z-Report: totalRevenueCents = ledgerTotalRevenueCents
  → ledgerVarianceCents = 0

WHERE DO I CLOSE THE DAY?
  → Session G, Step FGPV-040: /dashboard/close-day
  → Click "Close Day" → audit log created

WHERE DO I KNOW THE BUSINESS IS WORKING?
  → Session H: CEO Dashboard shows revenue
  → Session G: Z-Report shows variance = 0
  → Session F: Payment SUCCESS in transactions
  → Session E: Orders flow through kitchen
  → Session D: Guest can order from QR
  → ALL of the above = the business is working
```

## Customer #1 Final Gate

This phase does NOT make the Customer #1 readiness decision. It defines HOW that decision will later be reached.

### Gate Conditions for 🟢 CUSTOMER #1 READY

All of the following must be true after founder-led verification:

| # | Condition | How Verified |
|---|---|---|
| 1 | All 50 FGPV steps pass | Step-by-Step Master Sequence completed |
| 2 | Financial variance = 0 | Z-Report ledgerVarianceCents = 0 |
| 3 | No P0/P1 defects open | Defect register clear of P0/P1 |
| 4 | Payment works end-to-end | Tap & Leave → webhook → financial records |
| 5 | Receipt page exists | FGPV-D001 fixed |
| 6 | Security boundaries hold | No unauthorized access in Session I |
| 7 | Role permissions correct | Session B passes |
| 8 | QR ordering works | Guest can scan, order, pay |
| 9 | Kitchen workflow complete | All 6 KDS columns exercised |
| 10 | Close day works | Z-Report + double-close prevention |
| 11 | Executive dashboards show data | CEO/CFO populated from real data |
| 12 | InTouch config complete | FGPV-D002–D005 resolved |
| 13 | Webhook tunnel working | ngrok + callback URL configured |
| 14 | No stop conditions triggered | No SC-01 through SC-14 activated |

### Gate Conditions for 🟡 READY WITH EXPLICIT CONDITIONS

All critical conditions met, but some non-critical conditions have documented limitations:

| Condition | Example |
|---|---|
| Supplier portal non-functional | FGPV-D006 — documented, not blocking |
| No remote URL | FGPV-D008 — local testing only |
| Some notifications not configured | Non-critical channels (Slack, email alerts) |

### Gate Conditions for 🔴 NOT READY

Any of the following:

| Condition | Impact |
|---|---|
| Financial variance ≠ 0 | Cannot trust revenue |
| Payment not working | Cannot collect money |
| Security boundary violated | Data breach risk |
| P0 defect open | Critical functionality broken |
| P1 defect open (unfixed) | Key journey blocked |
| InTouch not configured | Payment cannot work |

## Document Index

| # | Document | Purpose |
|---|---|---|
| 1 | Executive Summary | Overview of the entire mission |
| 2 | Platform Journey Map | Complete journey with all routes |
| 3 | Feature Dependency Graph | What depends on what |
| 4 | Role and Permission Journey | Who can do what |
| 5 | Owner Journey | Owner-specific steps |
| 6 | Manager Journey | Manager-specific steps |
| 7 | Staff and Kitchen Journey | Staff-specific steps |
| 8 | Guest Journey | Guest-specific steps |
| 9 | Payment and Tap & Leave Journey | Payment flow details |
| 10 | Financial Truth Journey | Variance = 0 verification |
| 11 | Promise Engine Journey | Service promise tracking |
| 12 | Service Replay Journey | Service timeline review |
| 13 | Reservations, Inventory, Supplier Journey | Parallel branches |
| 14 | Security and Failure Journey | Boundary and failure testing |
| 15 | Environment Prerequisites | What founder must prepare |
| 16 | Feature Readiness Matrix | Master status matrix |
| 17 | Session Plan | How to divide the journey |
| 18 | Step-by-Step Master Sequence | THE definitive ordered journey (50 steps) |
| 19 | Defect and Stop Register | Known issues and stop conditions |
| 20 | Final Guided Verification Map | This document — one-page overview |

## Key Numbers

| Metric | Value |
|---|---|
| Total steps | 50 (FGPV-001 to FGPV-050) |
| Total sessions | 9 (A through I) |
| Total documents | 20 |
| Critical path steps | 41 (A through H) |
| Parallel branch steps | 9 (Session I + parallel) |
| Open defects | 6 (D001–D005, D007) |
| Known limitations | 2 (D006, D008) |
| Stop conditions | 14 (SC-01 through SC-14) |
| Founder-action items | 5 (D002–D005, D007) |
| Engineering fixes needed | 1 (D001 — receipt page) |

## Final Principle

> We are not asking: "Can Devin prove that the code works?"
> 
> That work has already been done extensively.
> 
> We are asking: "Can a real founder sit down with ImboniServe and operate it as a real hospitality business, feature by feature, role by role, from login to financial reconciliation?"
> 
> The answer must eventually be demonstrated by the founder.
> 
> This map makes that demonstration possible.

**The founder is the OPERATOR.**
**The guided verification conductor is the DRIVER.**
**This map is the ROADMAP.**

## No Production Activation

This mission does NOT authorize:
- Production deployment
- Customer #1 activation
- Production payment
- Production credential configuration
- Production DNS
- Production database

The existing production blockers remain in effect.
