# FOUNDER-GPV-001 — Feature Dependency Graph

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-DEPENDENCY-GRAPH |
| Date | 2026-08-14 |
| Source | Actual repository inspection |

## Overview

This document presents the explicit dependency graph for all ImboniServe features. Every dependency was derived from actual source code — not from documentation assumptions.

## Primary Dependency Chain (Critical Path)

```
                    ┌──────────┐
                    │  AUTH    │
                    │ Signup   │
                    │ Login    │
                    │ MFA/OTP  │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │ BUSINESS │
                    │ CONFIG   │
                    │ Profile  │
                    │ Tax      │
                    │ Currency │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │ TEAM   │ │ MENU   │ │ TABLES │
         │ Staff  │ │ Items  │ │ CRUD   │
         │ Roles  │ │ Cats   │ │        │
         └────────┘ └────┬───┘ └───┬────┘
                         │         │
                         │         ▼
                         │    ┌──────────┐
                         │    │   QR     │
                         │    │ Builder  │
                         │    │ HMAC     │
                         │    └────┬─────┘
                         │         │
                         └────┬────┘
                              │
                              ▼
                    ┌──────────────┐
                    │ GUEST ORDER  │
                    │ QR Scan      │
                    │ Token        │
                    │ Menu Browse  │
                    │ Cart         │
                    │ Draft Order  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         ┌─────────┐ ┌──────────┐ ┌──────────────┐
         │ KITCHEN │ │ PROMISE  │ │ SMART DINING │
         │ Display │ │ ENGINE   │ │ SLIP (Live)  │
         │ Status  │ │ Warning  │ │ Running Bill │
         │ Trans.  │ │ Critical │ │              │
         └────┬────┘ └──────────┘ └──────┬───────┘
              │                           │
              └───────────┬───────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  PAYMENT    │
                   │ Tap & Leave │
                   │ InTouch     │
                   │ Webhook     │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ FINANCIAL   │
                   │ TRUTH       │
                   │ Sale=Txn    │
                   │ =Ledger     │
                   └──────┬──────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
         ┌──────────┐ ┌────────┐ ┌──────────┐
         │ CLOSE    │ │ DASH   │ │ EXEC     │
         │ DAY      │ │ REVENUE│ │ CEO/CFO  │
         │ Z-Report │ │        │ │          │
         └──────────┘ └────────┘ └──────────┘
```

## Parallel Branches

### Reservations Branch
```
BUSINESS CONFIG → TABLES → RESERVATIONS
                              │
                   ┌──────────┼──────────┐
                   ▼          ▼          ▼
              CONFIRM     COMPLETE    CANCEL
              (reserve    (release    (release
               table)     table)      table)
                                                  
                   ▼
              NO-SHOW (forfeit + release)
```
**Dependencies**: Business must exist, tables must exist, staff with FRONT_DESK/MANAGER role.
**Can run in parallel with**: Menu, QR, Guest Order (after tables exist).

### Inventory Branch
```
BUSINESS CONFIG → INVENTORY ITEMS
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      STOCK       LOW-STOCK   AUTO-REORDER
      ADJUST      ALERTS      RECOMMEND
                      │
                      ▼
              KITCHEN CONSUMPTION
              (if engine enabled)
```
**Dependencies**: Business must exist. Menu items optional but recommended for consumption tracking.
**Can run in parallel with**: Everything after business config.

### Suppliers Branch
```
BUSINESS CONFIG → [SUPPLIER PORTAL]
                      │
                      ▼
               ⚠️ MOCK DATA
               NOT FUNCTIONAL
```
**Status**: Portal UI exists at `/dashboard/supplier-portal` but uses hardcoded mock data. No real supplier CRUD API exists at `/api/suppliers/`. The marketplace supplier API (`/api/marketplace/suppliers/nearest`) exists but is for discovery, not management.
**Classification**: NOT IMPLEMENTED for founder testing.

### Promise Engine Branch
```
GUEST ORDER (kitchen dispatch) → PROMISE ENGINE
                                      │
                           ┌──────────┼──────────┐
                           ▼          ▼          ▼
                      WARNING     CRITICAL    FULFILLED
                      (8 min)     (15 min)    (kitchen ready)
                           │          │
                           ▼          ▼
                      SERVICE    SERVICE
                      RISKS      REPLAY
                      (dashboard) (dashboard)
```
**Dependencies**: Guest order must be dispatched to kitchen. Promise is auto-created on dispatch.
**Automatic**: No founder action needed to create promises — they are created by KitchenDispatchService.

### Service Replay Branch
```
ANY SERVICE EVENT → TICKET EVENTS → SERVICE REPLAY
                                      │
                                      ▼
                                 TIMELINE
                                 PLAYBACK
```
**Dependencies**: At least one service must have occurred (orders, status transitions, payments).
**Can be used after**: Any session that generates events.

### Security Branch
```
AUTH + ROLES → ROLE ISOLATION TESTS
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   CROSS-BIZ   ROLE ACCESS   QR VALIDATION
   ISOLATION   BOUNDARY      (invalid sig)
```
**Dependencies**: Multiple businesses or multiple roles must exist.
**Can run in parallel with**: Any session after team setup.

### Failure/Recovery Branch
```
PAYMENT → FAILURE BRANCH
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
 FAILED     PENDING     CANCELLED
 (no ledger) (wait)     (no ledger)
```
**Dependencies**: Payment must be initiated. InTouch sandbox must be configured.
**Prerequisite**: FGPV-D002–D005 resolved.

## Dependency Rules

1. **No menu item without a business** — businessId is required
2. **No QR code without a table** — tableId is required for in-venue QR
3. **No guest order without a valid QR token** — HMAC signature validation
4. **No kitchen dispatch without a sale** — KitchenDispatchService requires saleId
5. **No payment without a sale** — PaymentTransaction references saleId or sessionId
6. **No financial truth without payment success** — Ledger entries only on PAYMENT_SUCCESS
7. **No close-day without completed sales** — Z-Report queries COMPLETED sales
8. **No executive metrics without financial data** — CEO/CFO read from FinancialLedgerEntry
9. **No Promise Engine without kitchen dispatch** — Promises auto-created on dispatch
10. **No Service Replay without service events** — Replay reads from TicketEvent log

## Critical Path Definition

The critical path is the minimum sequence of steps that MUST complete for the founder to verify the core business loop:

**AUTH → BUSINESS CONFIG → MENU → TABLES → QR → GUEST ORDER → KITCHEN → PAYMENT → FINANCIAL TRUTH → CLOSE DAY → EXECUTIVE**

Any failure on this path blocks all downstream verification.
