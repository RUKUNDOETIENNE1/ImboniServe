# Canonical Domain Ownership

**Document Type:** Authority Matrix  
**Phase:** Design Only  

---

## Purpose

For every critical business domain, this document identifies exactly one owning service, all consuming services, and services that must stop owning that domain.

---

## Domain Ownership Matrix

### 1. Customer Identity

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `CustomerService` |
| **Database Model** | `Customer` |
| **Consumers** | `GuestRecognitionService`, `LoyaltyService`, `ReservationService`, `ContactService` (bridge), `HotelService`, `PaymentCompletionService`, CRM UI, Waiter Dashboard |
| **Stop Owning** | `GuestRecognitionService` (currently creates customers directly — must delegate to `CustomerService.findOrCreateByPhone`), `ReservationService` (currently stores customer data as strings — must use `CustomerService`) |
| **Key Change** | `CustomerService.findOrCreateByPhone(phone, businessId, name?)` becomes the single entry point for customer creation/lookup. All other services call this method. |

### 2. Loyalty Points

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `LoyaltyService` |
| **Database Model** | `PointsLedger` (source of truth), `Customer.loyaltyPoints` (denormalized cache) |
| **Consumers** | `GuestRecognitionService.onOrderCompleted` (calls `earnPoints`), `/api/loyalty/balance` (reads `getBalance`), `/api/loyalty/issue` (manual issuance), CRM UI (display points) |
| **Stop Owning** | `CustomerService.updateCustomerStats` (currently increments `loyaltyPoints` directly — must stop), `/api/loyalty/issue` (currently bypasses `LoyaltyService` — must delegate) |
| **Key Change** | `CustomerService.updateCustomerStats` is renamed to `updateVisitStats` and no longer touches `loyaltyPoints`. All points mutation goes through `LoyaltyService.earnPoints()` or `LoyaltyService.redeemPoints()`. |

### 3. VIP Tier

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `GuestRecognitionService` |
| **Database Model** | `Customer.vipTier` |
| **Configuration** | Single `VIPTierConfig` object (dual-threshold: visits + spend) |
| **Consumers** | Waiter Dashboard (display), Reservation UI (display), CRM (display), Checkout (future: discount) |
| **Stop Owning** | `LoyaltyService.updateVIPStatus` (dead code — retire), `LoyaltyService.getVIPBenefits` (dead code — retire), `LoyaltyService.applyVIPDiscount` (dead code — retire) |
| **Key Change** | VIP thresholds are defined in one place (`GuestRecognitionService` or extracted to a config table). `LoyaltyService` VIP methods are deleted. |

### 4. Reservations

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `ReservationService` |
| **Database Model** | `Reservation` (with `customerId` FK to `Customer`) |
| **Consumers** | Reservations UI, Waiter Dashboard (upcoming reservations), Hotel module (room reservations), Calendar/Availability UI |
| **Stop Owning** | `/api/reservations/index.ts` and `/api/reservations/[id].ts` (currently use prisma directly — must delegate to `ReservationService`) |
| **Key Change** | API handlers become thin delegates. `ReservationService.createReservation` resolves customer by phone via `CustomerService.findOrCreateByPhone`. `sendConfirmation` delegates to `NotificationService`. |

### 5. Orders / Sales

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `SalesService` |
| **Database Model** | `Sale`, `SaleItem` |
| **Consumers** | `PaymentCompletionService` (updates sale status), Waiter Dashboard (reads queue), KDS (reads items), Smart Dining Slip (reads sale), CRM (customer history), CEO/CFO dashboards (revenue) |
| **Stop Owning** | None — `SalesService` is already canonical |
| **Key Change** | `SalesService.createSale` for CASH orders delegates post-payment side effects to `PaymentCompletionService.onPaymentSuccess()` instead of inline handling. |

### 6. Payments

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `PaymentCompletionService` (new) |
| **Database Model** | `PaymentTransaction` (execution), `FinancialLedgerEntry` (analytics SOT) |
| **Consumers** | All payment provider handlers (MoMo, IremboPay, CASH), CEO/CFO dashboards, PaymentsOpsService |
| **Stop Owning** | `/api/payments/momo/status/[transactionId].ts` `processSuccessfulPayment` (inline — must delegate), `/api/payments/irembo/webhook.ts` inline side effects (must delegate), `/api/webhooks/irembopay.ts` (retire entirely), `SalesService.createSale` CASH handling (must delegate) |
| **Key Change** | `PaymentCompletionService` is the sole orchestrator for all post-payment side effects. All provider handlers call it. Side effects are idempotent. |

### 7. Inventory

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `InventoryService` (existing) |
| **Database Model** | `InventoryItem`, `InventoryConsumption`, `GoodsReceivedNote` |
| **Consumers** | `FinancialTruthService` (cost calculation), KDS (stock status), CEO dashboard (stock health), Procurement module |
| **Stop Owning** | None — already canonical |
| **Key Change** | No changes needed for PIRA. |

### 8. Analytics & Reporting

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `FinancialLedgerEntry` (model as SOT), `PaymentsOpsService` (reader) |
| **Database Model** | `FinancialLedgerEntry` |
| **Consumers** | CEO Dashboard, CFO Dashboard, PaymentsOpsService, AlertDeliveryService |
| **Stop Owning** | Any code reading revenue from `PaymentTransaction` or `Sale.totalAmountCents` directly for aggregation |
| **Key Change** | New `LedgerDomain.SALES` added for order revenue. `PaymentCompletionService` writes SALES entries. All dashboards read from `FinancialLedgerEntry`. |

### 9. Recommendations

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `RecommendationService` (to be formalized from existing `/api/menu/recommendations`) |
| **Database Model** | `CustomerPreference` (learned by `GuestRecognitionService`) |
| **Consumers** | Menu API, New Sale page, Customer-facing menu |
| **Stop Owning** | `/api/menu/recommendations` inline logic (must delegate to service) |
| **Key Change** | Recommendation service reads from `GuestRecognitionService.getGuestIntelligence(customerId)` to personalize recommendations based on learned preferences, allergies, and dietary restrictions. |

### 10. AI Credits

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `CreditWalletService` + `CreditConsumptionEngine` |
| **Database Model** | `AICreditWallet`, `AICreditLedgerEntry`, `AICreditReservation` |
| **Consumers** | AI Scanner, Site Builder, Menu Builder, all AI-powered features |
| **Stop Owning** | `ai-credit.service.ts` legacy adapter (already delegates — keep for backward compat) |
| **Key Change** | No changes needed for PIRA. Architecture is already canonical. |

### 11. Business Profile

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `BusinessService` (implicit, via prisma) |
| **Database Model** | `Business` |
| **Consumers** | All modules (multi-tenant scoping), AdminLayout, DashboardLayout, Notifications |
| **Stop Owning** | None |
| **Key Change** | Formalize `BusinessService` with methods instead of direct prisma calls. Standardize "Business" terminology. |

### 12. Guest Recognition

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `GuestRecognitionService` |
| **Database Model** | `Customer` (vipTier, visitCount, lifetimeSpendCents), `CustomerPreference` |
| **Consumers** | `PaymentCompletionService` (triggers onOrderCompleted), Waiter Dashboard, Reservations, CRM, Recommendation Service |
| **Stop Owning** | `CustomerService.updateCustomerStats` (visit/spend increment moves to `CustomerService.updateVisitStats`, loyalty points move to `LoyaltyService`) |
| **Key Change** | `onOrderCompleted` calls `LoyaltyService.earnPoints` instead of `CustomerService.updateCustomerStats` for points. Visit stats still go through `CustomerService.updateVisitStats`. |

### 13. Reporting

| Aspect | Value |
|--------|-------|
| **Canonical Owner** | `FinancialLedgerEntry` (data SOT) + Dashboard API services (readers) |
| **Database Model** | `FinancialLedgerEntry`, `Sale`, `Customer`, `Reservation` |
| **Consumers** | CEO Dashboard, CFO Dashboard, Reports page, Staff Performance |
| **Stop Owning** | Direct prisma queries in dashboard API handlers (should go through service methods) |
| **Key Change** | Dashboard APIs read from `FinancialLedgerEntry` for financial metrics. Operational metrics read from canonical models via service methods. |

---

## Ownership Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     Customer Identity                             │
│                   CustomerService                                 │
│              (findOrCreateByPhone)                                │
└──────┬───────────┬──────────┬──────────┬────────────────────────┘
       │           │          │          │
       ▼           ▼          ▼          ▼
  Loyalty      Guest       Reservation  Hotel
  LoyaltyService  RecognitionService  ReservationService  HotelService
       │           │          │          │
       │     ┌─────┘          │          │
       ▼     ▼                ▼          ▼
  PointsLedger  VIP Tier   Reservation   HotelRoom
                (Customer.vipTier)  (customerId)   (customerId)
       │
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Payment Completion                             │
│                PaymentCompletionService                           │
│  (sole orchestrator for all post-payment side effects)            │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────────┘
       │      │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼      ▼
    Sale   Dining  Guest  Notif  Ledger  Subs   Affiliate
    Status  Slip   Recog  cation  Entry  Activ  Commission
```
