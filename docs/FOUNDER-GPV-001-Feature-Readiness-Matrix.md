# FOUNDER-GPV-001 — Feature Readiness Matrix

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-FEATURE-MATRIX |
| Date | 2026-08-14 |
| Source | Actual repository inspection |

## Overview

This is the master matrix covering every major platform capability with honest status assessment. No feature is silently upgraded because documentation says it exists.

## Feature Readiness Matrix

| Feature | Implementation Status | Engineering Status | Founder-Testable? | Prerequisites | Required Role | Dependencies | External Services | Test Session | Expected Evidence | Known Limitation | Customer #1 Relevance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Authentication — Signup | CERTIFIED | GPV-001 GREEN | YES | None | Guest | None | SMTP (email) | A | Account created, welcome page | OTP delivery requires SMTP | CRITICAL |
| Authentication — Login (MFA) | CERTIFIED | GPV-001 GREEN | YES | Account exists | Guest | Signup | SMTP/Twilio | A | OTP received, session created | OTP delivery requires SMTP/Twilio | CRITICAL |
| Authentication — Logout | CERTIFIED | GPV-001 GREEN | YES | Session active | Any staff | Login | None | Any | Redirect to /login | None | CRITICAL |
| Business Onboarding | CERTIFIED | GPV-001 GREEN | YES | Account created | Owner | Signup | None | A | Setup wizard shows progress | None | CRITICAL |
| Business Profile | IMPLEMENTED | — | YES | Business exists | Owner | Onboarding | None | A | Profile page with data | None | IMPORTANT |
| Payment Settings (Tax/Currency) | CERTIFIED | GPV-001 GREEN | YES | Business exists | Owner | Onboarding | None | A | Settings saved, reflected in orders | None | CRITICAL |
| Business Settings (QR enable) | IMPLEMENTED | — | YES | Business exists | Owner | Onboarding | None | A | QR modes enabled | None | CRITICAL |
| Team — Staff Creation | CERTIFIED | GPV-001 GREEN | YES | Business exists | Owner | Onboarding | SMTP (invites) | B | Staff list shows members | Invite delivery requires SMTP | CRITICAL |
| Team — Role Assignment | CERTIFIED | GPV-001 GREEN | YES | Staff exists | Owner | Staff creation | None | B | Staff with correct roles | None | CRITICAL |
| Team — Permission Boundaries | CERTIFIED | GPV-001 GREEN | YES | Multiple roles | Owner | Staff creation | None | B | Role-based access verified | None | CRITICAL |
| Menu — Category Creation | IMPLEMENTED | — | YES | Business exists | Owner/Manager | Onboarding | None | C | Categories in menu editor | None | CRITICAL |
| Menu — Item Creation | CERTIFIED | GPV-001 GREEN | YES | Category exists | Owner/Manager | Categories | None | C | Items in menu list | None | CRITICAL |
| Menu — Pricing | CERTIFIED | GPV-001 GREEN | YES | Item exists | Owner/Manager | Items | None | C | Prices in cents | None | CRITICAL |
| Menu — Availability Toggle | IMPLEMENTED | — | YES | Item exists | Owner/Manager | Items | None | C | Item available/unavailable | None | IMPORTANT |
| Menu — Translations | IMPLEMENTED | GR-001A | YES | Item exists | Owner/Manager | Items | None | C | Translated names/descriptions | Only en/rw/fr supported | IMPORTANT |
| Menu — Public Menu API | CERTIFIED | GPV-001 GREEN | YES | Items exist | Guest | QR token | None | D | Menu loads on /order page | None | CRITICAL |
| Tables — CRUD | CERTIFIED | GPV-001 GREEN | YES | Business exists | Owner/Manager | Onboarding | None | C | Tables in table list | None | CRITICAL |
| Tables — Status Management | IMPLEMENTED | — | YES | Tables exist | Owner/Manager/Waiter | Tables | None | C/D | Table status updates | None | IMPORTANT |
| QR — Builder | CERTIFIED | GPV-001 GREEN | YES | Tables exist | Owner | Tables | None | C | QR codes generated | None | CRITICAL |
| QR — HMAC Security | CERTIFIED | GPV-001 GREEN | YES | QR generated | Guest | QR builder | None | D/S | Invalid QR rejected | None | CRITICAL |
| QR — In-Venue Mode | CERTIFIED | GPV-001 GREEN | YES | QR + table | Guest | QR builder | None | D | Guest can order | None | CRITICAL |
| QR — Remote Mode (Pre-order) | IMPLEMENTED | — | YES | QR + phone OTP | Guest | QR builder | Twilio (OTP) | D | Remote order placed | OTP required | IMPORTANT |
| Guest — Menu Browsing | CERTIFIED | GPV-001 GREEN | YES | QR scanned | Guest | QR | None | D | Menu displayed | None | CRITICAL |
| Guest — Cart | CERTIFIED | GPV-001 GREEN | YES | Menu loaded | Guest | Menu | None | D | Cart with items | None | CRITICAL |
| Guest — Order Submission | CERTIFIED | GPV-001 GREEN | YES | Cart has items | Guest | Cart | None | D | Draft order created | None | CRITICAL |
| Guest — Order Confirmation | IMPLEMENTED | — | YES | Order submitted | Guest | Order | None | D | Confirmation page | None | CRITICAL |
| Guest — Order Status Tracking | IMPLEMENTED | — | YES | Order confirmed | Guest | Order | Pusher (optional) | D | Status updates | Polling fallback if no Pusher | IMPORTANT |
| Guest — Kitchen Messages | IMPLEMENTED | — | YES | Order in kitchen | Guest/Kitchen | Order | None | D/E | Messages received | None | IMPORTANT |
| Guest — Multiple Orders | IMPLEMENTED | — | YES | Session active | Guest | Session | None | D | Multiple orders in session | None | IMPORTANT |
| Smart Dining Slip (Live) | IMPLEMENTED | — | YES | Session active | Guest | Order | None | D/F | Running bill visible | None | CRITICAL |
| Tap & Leave — Checkout | PARTIALLY IMPLEMENTED | PAY-001 YELLOW | YES (with defect) | Slip active | Guest | Session | InTouch | F | Payment initiated | Receipt page missing (FGPV-D001) | CRITICAL |
| Tap & Leave — Receipt | NOT IMPLEMENTED | — | NO | Payment success | Guest | Payment | None | F | ⚠️ 404 error | Page does not exist | CRITICAL |
| Kitchen — Display (KDS) | CERTIFIED | GPV-001 GREEN | YES | Orders exist | Kitchen/Manager | Orders | Pusher (optional) | E | 6-column KDS | Polling fallback | CRITICAL |
| Kitchen — Status Transitions | CERTIFIED | GPV-001 GREEN | YES | Order in kitchen | Kitchen | KDS | None | E | Status progresses through columns | None | CRITICAL |
| Kitchen — Manual Payment | IMPLEMENTED | — | YES | Order awaiting payment | Cashier/Kitchen | KDS | None | E/F | Payment confirmed | None | IMPORTANT |
| Kitchen — Customer Messages | IMPLEMENTED | — | YES | Order in kitchen | Kitchen | KDS | None | E | Messages sent | None | IMPORTANT |
| Promise Engine | CERTIFIED GREEN | PROMISE-001 | YES | Order dispatched | Manager/Owner | Kitchen | Pusher/Twilio | E | Warning/Critical alerts | None | IMPORTANT |
| Service Risks Dashboard | IMPLEMENTED | PROMISE-001 | YES | Promises exist | Manager/Owner | Promise Engine | None | E | Active risks visible | None | IMPORTANT |
| Service Replay | IMPLEMENTED | — | YES | Service events exist | Manager/Owner | Events | None | E/H | Timeline replay | Empty on first use | IMPORTANT |
| Reservations — Create | CERTIFIED | GPV-001 GREEN | YES | Tables exist | Manager/Front Desk | Tables | None | Parallel | Reservation with code | None | IMPORTANT |
| Reservations — Confirm | CERTIFIED | GPV-001 GREEN | YES | Reservation pending | Manager/Front Desk | Reservation | None | Parallel | Table auto-reserved | None | IMPORTANT |
| Reservations — Complete | CERTIFIED | GPV-001 GREEN | YES | Reservation confirmed | Manager/Front Desk | Reservation | None | Parallel | Table released | None | IMPORTANT |
| Reservations — Cancel | CERTIFIED | GPV-001 GREEN | YES | Reservation exists | Manager/Front Desk | Reservation | None | Parallel | Table released | None | IMPORTANT |
| Reservations — No-Show | CERTIFIED | GPV-001 GREEN | YES | Reservation confirmed | Manager/Front Desk | Reservation | None | Parallel | Deposit forfeited | None | IMPORTANT |
| Inventory — CRUD | CERTIFIED | GPV-001 GREEN | YES | Business exists | Owner/Manager | None | None | Parallel | Items in inventory | None | IMPORTANT |
| Inventory — Stock Adjustments | CERTIFIED | GPV-001 GREEN | YES | Items exist | Owner/Manager/Kitchen | Items | None | Parallel | Stock updated | None | IMPORTANT |
| Inventory — Low-Stock Alerts | IMPLEMENTED | — | YES | Items exist | Owner/Manager | Items | None | Parallel | Alerts displayed | None | IMPORTANT |
| Inventory — Auto-Reorder | IMPLEMENTED | — | YES | Items exist | Owner/Manager | Items | None | Parallel | Recommendations shown | None | OPTIONAL |
| Inventory — Kitchen Consumption | IMPLEMENTED | — | YES (if enabled) | Items + kitchen | Kitchen | Items | None | E | Stock deducted on prep | Off by default | OPTIONAL |
| Suppliers — Portal | NOT IMPLEMENTED | — | NO | — | — | — | — | — | Mock data only | Hardcoded mock data | OPTIONAL |
| Suppliers — CRUD API | NOT IMPLEMENTED | — | NO | — | — | — | — | — | No API exists | No /api/suppliers/ | OPTIONAL |
| Payment — InTouch Sandbox | CERTIFIED YELLOW | PAY-001 | YES (with config) | Config fixed | Guest | Order | InTouch | F | Payment success | Webhook config missing | CRITICAL |
| Payment — Webhook | CERTIFIED YELLOW | PAY-001 | YES (with tunnel) | Config + ngrok | InTouch | Payment | InTouch | F | Callback processed | Requires ngrok | CRITICAL |
| Payment — Failure Handling | CERTIFIED | PAY-001 | YES | Payment initiated | Guest | Payment | InTouch | F/I | Failed payment no revenue | None | CRITICAL |
| Payment — Idempotency | CERTIFIED | PAY-001 | YES | Webhook active | InTouch | Payment | InTouch | F/I | No duplicate effects | None | CRITICAL |
| Financial Truth Chain | CERTIFIED | PAY-001/MPCA | YES | Payment success | Owner | Payment | None | G | Variance = 0 | None | CRITICAL |
| Close Day — Z-Report | CERTIFIED | GPV-001 GREEN | YES | Sales exist | Owner/Manager | Sales | None | G | Z-Report with data | None | CRITICAL |
| Close Day — Ledger Cross-Check | CERTIFIED | GPV-001 GREEN | YES | Z-Report open | Owner/Manager | Ledger | None | G | ledgerVariance = 0 | None | CRITICAL |
| Close Day — Post Close | CERTIFIED | GPV-001 GREEN | YES | Z-Report verified | Owner/Manager | Audit | None | G | Audit log created | None | CRITICAL |
| Executive — CEO Dashboard | IMPLEMENTED | — | YES | Financial data | Owner | Ledger | None | H | CEO metrics | Empty without data | IMPORTANT |
| Executive — CFO Dashboard | IMPLEMENTED | — | YES | Financial data | Owner | Ledger | None | H | CFO metrics | Empty without data | IMPORTANT |
| Executive — Reports | IMPLEMENTED | — | YES | Operational data | Owner/Manager | Various | None | H | Reports generated | None | IMPORTANT |
| Executive — Analytics | IMPLEMENTED | — | YES | Operational data | Owner/Manager | Various | None | H | Analytics displayed | Feature-flagged | OPTIONAL |
| Notifications — Email OTP | IMPLEMENTED | — | YES | SMTP configured | Guest/Staff | Auth | SMTP | A/B | OTP email received | None | CRITICAL |
| Notifications — WhatsApp OTP | IMPLEMENTED | — | YES | Twilio configured | Guest/Staff | Auth | Twilio | A/B/D | OTP WhatsApp received | None | IMPORTANT |
| Notifications — Staff Alerts | IMPLEMENTED | — | YES | Twilio configured | Staff | Promise Engine | Twilio | E | WhatsApp alert | None | IMPORTANT |
| Notifications — Pusher Real-Time | IMPLEMENTED | — | YES | Pusher configured | Staff | Various | Pusher | E | Real-time updates | Polling fallback | IMPORTANT |
| Mobile / PWA | IMPLEMENTED | — | SECONDARY | App running | Guest/Staff | Various | None | Secondary | PWA installable | Not primary journey | OPTIONAL |
| Security — Business Isolation | CERTIFIED | Multiple | YES | Multiple businesses | Owner | Auth | None | I | No cross-business access | None | CRITICAL |
| Security — Role Boundaries | CERTIFIED | Multiple | YES | Multiple roles | Owner | Auth | None | I | Role access enforced | None | CRITICAL |
| Security — QR Validation | CERTIFIED | GPV-001 | YES | QR generated | Guest | QR | None | I | Invalid QR rejected | None | CRITICAL |
| Security — Session Management | CERTIFIED | — | YES | Session active | Any | Auth | None | I | Logout works | None | CRITICAL |

## Status Definitions

| Status | Meaning |
|---|---|
| CERTIFIED | Engineering-verified with automated tests, no known defects |
| CERTIFIED GREEN | Fully certified with no reservations |
| CERTIFIED YELLOW | Certified with explicit conditions/limitations |
| IMPLEMENTED | Code exists and functions, but not formally certified with tests |
| PARTIALLY IMPLEMENTED | Some components exist but key parts are missing |
| NOT IMPLEMENTED | No functional code exists (may have mock/stub) |
| BLOCKED | Cannot proceed due to external dependency |
| UNKNOWN | Status has not been verified |
| LONG-TERM | Future roadmap item, not current scope |

## Customer #1 Relevance Definitions

| Relevance | Meaning |
|---|---|
| CRITICAL | Must work for Customer #1 to use the platform |
| IMPORTANT | Should work for a good Customer #1 experience |
| OPTIONAL | Nice to have, not blocking for Customer #1 |
