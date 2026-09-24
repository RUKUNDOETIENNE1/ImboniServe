# PIV Findings Comparison

> **Auditor:** Chief Product Auditor (Independent)  
> **Date:** July 25, 2026  
> **Reference:** PIV_AUDIT_REPORT.md (Original), PIV_V2_AUDIT_REPORT.md

---

## Critical Findings

| # | Original Finding | PIRS Self-Assessment | PIV v2 Independent Verification |
|---|-----------------|---------------------|-------------------------------|
| C1 | Loyalty Points Ledger Desynchronization | ✅ RESOLVED | ✅ FULLY RESOLVED — `CustomerService.updateVisitStats` no longer touches `loyaltyPoints`. `LoyaltyService.earnPoints` is the sole mutation path. Grep confirms no `loyaltyPoints` increment/decrement outside `loyalty.service.ts`. |
| C2 | VIP Tier Threshold Contradiction | ✅ RESOLVED | ✅ FULLY RESOLVED — `updateVIPStatus`, `getVIPBenefits`, `applyVIPDiscount` deleted from `LoyaltyService`. Grep returns zero results. `VIP_TIER_CONFIG` and `calculateVIPTier` are canonical in `GuestRecognitionService`. |
| C3 | Reservation-Customer Disconnect | ✅ RESOLVED | ✅ FULLY RESOLVED — Schema `Reservation.customerId` → `Customer` (not `User`). `ReservationService.createReservation` auto-resolves customer via `CustomerService.findOrCreateByPhone`. |
| C4 | Duplicate IremboPay Webhook Handlers | ✅ RESOLVED | ✅ FULLY RESOLVED — `/api/webhooks/irembopay.ts` returns 410 Gone. Canonical handler at `/api/payments/irembo/webhook.ts`. |
| C5 | 13+ Orphaned Features | ✅ RESOLVED | ⚠️ PARTIALLY RESOLVED — Waiter dashboard added to navigation. CEO, CFO, Sales, Customers, Referrals, Site Builder remain unreachable. |

---

## High-Severity Findings

| # | Original Finding | PIRS Self-Assessment | PIV v2 Independent Verification |
|---|-----------------|---------------------|-------------------------------|
| H1 | Smart Dining Slip missing for MoMo | ✅ RESOLVED (via PaymentCompletionService) | ✅ RESOLVED for MoMo polling path. ❌ NOT RESOLVED for InTouch, manual confirmation, and MTN callback paths. |
| H2 | Smart Dining Slip missing for IremboPay | ✅ RESOLVED (via PaymentCompletionService) | ✅ RESOLVED for IremboPay webhook. `PaymentCompletionService` generates slip. |
| H3 | Reservation API bypasses ReservationService | ✅ RESOLVED | ⚠️ PARTIALLY RESOLVED — POST delegates to service. PATCH delegates status but directly calls `prisma.reservation.update` for `tableId` and `depositStatus`. 6 additional direct `prisma.reservation.update` calls found in cancel endpoint, InTouch webhook, reservation-reminder service, and cron. |
| H4 | CRM Contact vs Customer disconnected | ✅ RESOLVED (ContactCustomerBridge created) | ❌ NOT RESOLVED — `ContactCustomerBridge` exists but is **never called** from any code in the codebase. Grep confirms only self-references. Bridge is dead code. |
| H5 | Hotel module disconnected | ✅ RESOLVED (customer linkage added) | ✅ RESOLVED — Hotel rooms API auto-resolves customer from `guestPhone`. GET includes customer intelligence data. |
| H6 | StaffGuestIntelligence only in sales/new | ✅ RESOLVED (wired into waiter dashboard) | ✅ RESOLVED — `StaffGuestIntelligence` rendered in waiter `OrderCard` when `customerPhone` available. |
| H7 | ReservationService.sendConfirmation is stub | ✅ RESOLVED (sends via NotificationService) | ✅ RESOLVED — `sendConfirmation` calls `NotificationService.sendWhatsApp` at `reservation.service.ts:194`. |
| H8 | Deposit payment flow missing | Not addressed in PIRS | ❌ STILL PRESENT — Deposit amount collected but no payment initiated. |
| H9 | Hotel module no integration | ✅ RESOLVED (customer linkage) | ✅ RESOLVED for customer linkage. No integration with reservations, orders, or payments. |

---

## Medium-Severity Findings

| # | Original Finding | PIRS Self-Assessment | PIV v2 Independent Verification |
|---|-----------------|---------------------|-------------------------------|
| M1 | Waiter dashboard not in navigation | ✅ RESOLVED | ✅ RESOLVED — Added at `DashboardLayout.tsx:107`. |
| M2 | Navigation doesn't filter by role | ✅ RESOLVED | ✅ RESOLVED — `rolesAllowed` checked in `getV1Navigation()`. |
| M3 | ReservationService.sendConfirmation stub | ✅ RESOLVED | ✅ RESOLVED (see H7 above) |
| M4 | Sales not in sidebar | Not addressed | ❌ STILL PRESENT |
| M5 | Terminology "Restaurant" vs "Business" | Not addressed | ❌ STILL PRESENT |
| M6 | Error handling varies across pages | Not addressed | ❌ STILL PRESENT |
| M7 | Menu recommendations not personalized | Not addressed | ❌ STILL PRESENT |
| M8 | No timeout cleanup for stuck PROCESSING | Not addressed | ❌ STILL PRESENT (Tap & Leave has sweeper, but main MoMo path does not) |
| M9 | No user notification on payment failure | Not addressed | ❌ STILL PRESENT |
| M10 | Anonymous sales invisible to guest recognition | Not addressed | ❌ STILL PRESENT |
| M11 | totalSpent unit ambiguity | Not addressed | ❌ STILL PRESENT — `CustomerService.updateVisitStats` increments both `totalSpent` and `lifetimeSpendCents` by `orderAmountCents`, but field names suggest different units |
| M12 | Both "Customers" page and "CRM" page exist | Not addressed | ❌ STILL PRESENT |
| M13 | Loyalty issue endpoint bypasses LoyaltyService | Not addressed | ❌ NOT VERIFIED (not checked in this audit) |

---

## New Findings Introduced by PIRS

| # | Finding | Severity | Description |
|---|---------|----------|-------------|
| N1 | IremboPay double billing event | HIGH | `logBillingEvent` called both in webhook handler (line 98) AND in `PaymentCompletionService.onPaymentSuccess` (line 143). Creates duplicate `FinancialLedgerEntry` records. |
| N2 | InTouch payment path bypasses PaymentCompletionService | HIGH | `payments/intouch/status/[id].ts` inlines side effects without `PaymentCompletionService`. Missing dining slip, notification, broadcast, ledger. |
| N3 | MTN MoMo callback missing sale update | HIGH | `payments/mtn-momo/callback.ts` updates transaction but never updates associated sale or triggers side effects. |
| N4 | Manual payment confirmation bypasses PaymentCompletionService | MEDIUM | `orders/[id]/confirm-payment.ts` inlines side effects. Missing dining slip, ledger. |
| N5 | ContactCustomerBridge is dead code | MEDIUM | Service created but never called from any flow. |
| N6 | Reservation PATCH partial bypass | MEDIUM | `reservations/[id].ts` delegates status to service but directly calls prisma for tableId and depositStatus. |

---

## Summary

| Category | Original Count | Fully Resolved | Partially Resolved | Still Present | New Issues |
|----------|---------------|---------------|-------------------|--------------|------------|
| Critical | 5 | 4 | 1 | 0 | 0 |
| High | 9 | 5 | 2 | 2 | 3 |
| Medium | 13 | 2 | 0 | 10 | 2 |
| **Total** | **27** | **11** | **3** | **12** | **5** |

**Note**: The PIRS self-assessment (`PIV_RESOLUTION_VERIFICATION.md`) claimed 14/14 findings resolved. Independent verification found **11 fully resolved, 3 partially resolved, 12 still present, and 5 new issues introduced**. The self-assessment was over-optimistic and did not account for bypass paths, unwired services, or remaining unreachable pages.
