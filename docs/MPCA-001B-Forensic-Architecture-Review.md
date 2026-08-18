# MPCA-001B — Forensic Architecture Review

**Date:** 2026-08-12
**Phase:** MPCA-001B (Provider-Neutral Money Movement & Settlement Intelligence)
**Predecessor:** MPCA-001A (BLK-004 InTouch Webhook Financial Integrity)
**Status:** COMPLETE — findings documented before any code changes

---

## 1. Purpose

This document records the forensic findings from inspecting the current ImboniServe repository to determine what already exists that can support settlement intelligence, and what gaps must be filled.

**No code was modified during this review.**

---

## 2. Existing Architecture — What Exists

### 2.1 PaymentTransaction Model (`prisma/schema.prisma:1391`)

**Fields relevant to money movement:**
- `amountCents`, `currency` (default "RWF")
- `vatAmountCents`, `exVatAmountCents`
- `gatewayFeeEstimatedCents`, `gatewayFeeActualCents`
- `platformFeeCents` (default 0)
- `netToBusinessCents`
- `status`: PaymentTransactionStatus enum (PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REFUNDED)
- `gateway`: PaymentGateway enum (IREMBO_PAY, PESAPAL, INTOUCH, CASH, MOBILE_MONEY, CARD, BANK_TRANSFER)
- `paymentProvider`: PaymentProvider enum (MTN, AIRTEL)
- `paidAt`, `expiryAt`
- `webhookSignature`, `webhookTimestamp`, `webhookVerified`
- `subscriptionId`, `marketplaceOrderId` (links to non-sale payment contexts)
- `rawRequest`, `rawCallback`, `rawStatus` (Json — provider payloads)

**What's MISSING:**
- No settlement status field
- No funds availability field
- No withdrawal reference
- No settlement/withdrawal timestamp
- No provider settlement ID
- No reconciliation status

**Assessment:** PaymentTransaction captures **payment** state well. It does NOT capture **settlement**, **funds availability**, or **withdrawal** state. These are conflated into `status=SUCCESS` which means "payment succeeded" but tells us nothing about where the money is.

---

### 2.2 Sale Model (`prisma/schema.prisma:354`)

**Fields relevant to money movement:**
- `totalAmountCents`
- `paymentMethod`, `paymentStatus` (PENDING, COMPLETED, FAILED, REFUNDED, INITIATED, PAID, EXPIRED, CANCELLED)
- `isPaid` (boolean)
- `paymentTransactionId` (unique link to PaymentTransaction)
- `depositCents` (for reservations)

**Assessment:** Sale tracks whether the customer paid. It does NOT track merchant fund availability or settlement. `paymentStatus=COMPLETED` means "the customer's payment was confirmed," not "the merchant received the money."

---

### 2.3 FinancialLedgerEntry Model (`prisma/schema.prisma:9`)

**The canonical financial source of truth.**

**Fields:**
- `domain`: LedgerDomain (SUBSCRIPTION, MARKETPLACE, PLATFORM, SALES, OTHER)
- `eventType`: BillingEventType (PAYMENT_INITIATED, PAYMENT_PROCESSING, PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_CANCELLED, PAYMENT_REFUNDED, SUBSCRIPTION_*, MARKETPLACE_SALE, REMINDER_SENT)
- `amountCents`, `currency`
- `vatAmountCents`, `exVatAmountCents`
- `gatewayFeeCents`, `platformFeeCents`, `netAmountCents`
- `gateway`, `paymentMethod`, `status`
- `paymentTransactionId`, `subscriptionId`, `marketplaceOrderId`
- `invoiceNumber`, `providerReference`
- `idempotencyKey` (unique)
- `occurredAt`, `createdAt`

**Assessment:** FinancialLedgerEntry already separates:
- Gross amount (`amountCents`)
- Gateway fee (`gatewayFeeCents`)
- Platform fee (`platformFeeCents`)
- Net to business (`netAmountCents`)

This is the **fee separation** the mission requires. It already exists. The architecture should extend this, not duplicate it.

**What's MISSING:**
- No settlement reference
- No settlement status
- No withdrawal reference
- No reconciliation status field
- No "funds available" or "funds received" event types

---

### 2.4 IPaymentProvider Interface (`src/lib/payments/types.ts:120`)

**Methods:**
- `createPayment(request)` — initiate payment
- `verifyPayment(request)` — verify payment status
- `handleWebhook(payload, signature)` — parse webhook
- `validateWebhook(payload, signature)` — validate webhook signature
- `getTransactionStatus(transactionId)` — check status
- `refundPayment?(transactionId, amount?)` — optional refund

**Assessment:** IPaymentProvider is a **payment-only** abstraction. It has no settlement, withdrawal, or funds availability concepts. This is the correct separation — settlement should be a separate concern, not crammed into IPaymentProvider.

**What's MISSING:**
- No `getMerchantBalance()` method
- No `getSettlementStatus()` method
- No `requestWithdrawal()` method
- No `getSettlementReport()` method
- No `handleSettlementWebhook()` method
- No capability declaration

---

### 2.5 PaymentProviderFactory (`src/lib/payments/providers/index.ts:13`)

**Current providers:**
- InTouchProvider (PaymentProviderType.INTOUCH)
- IremboPayProvider (PaymentProviderType.IREMBO_PAY)
- Future: MTN_DIRECT, AIRTEL_DIRECT, PESAPAL, STRIPE, FLUTTERWAVE (declared but not implemented)

**Assessment:** Factory pattern is clean. Can be extended to return settlement-capable providers.

---

### 2.6 InTouch Provider (`src/lib/payments/providers/intouch.provider.ts`)

**What it does:**
- Initiates mobile money payments via InTouch aggregator
- Maps InTouch statuses to unified TransactionStatus
- Parses webhooks (requesttransactionid, transactionid, responsecode, status, statusdesc, referenceno)
- Webhook payload does NOT include amount (explicitly noted: `amount: undefined`)
- Currency hardcoded to 'RWF' in webhook parsing
- No settlement API, no withdrawal API, no balance API
- `verifyPayment` returns PROCESSING — "InTouch uses webhook callbacks for status updates"

**What it does NOT do:**
- No settlement concept
- No withdrawal concept
- No merchant balance concept
- No funds availability concept

**Assessment:** InTouch provider is payment-only. Settlement behavior is UNKNOWN — not verified through production API. Verbal support information ("business can withdraw same day, every day") is NOT a production API contract.

---

### 2.7 IremboPay Provider (`src/lib/payments/providers/irembopay.provider.ts`)

**What it does:**
- Initiates card payments (Visa/Mastercard) via IremboPay
- HMAC-SHA256 signature verification
- Maps IremboPay statuses to unified TransactionStatus
- Webhook includes amount, currency, cardBrand, cardLast4
- `verifyPayment` calls IremboPay API directly (GET /v1/payments/{transactionId})
- `refundPayment` returns NOT_IMPLEMENTED

**What it does NOT do:**
- No settlement concept
- No withdrawal concept
- No merchant balance concept

**Assessment:** IremboPay provider is payment-only. Settlement behavior is UNKNOWN.

---

### 2.8 PaymentCompletionService (`src/lib/services/payment-completion.service.ts`)

**The canonical orchestrator for post-payment side effects.**

**Architectural Invariant:** "No code outside this service may orchestrate post-payment side effects."

**onPaymentSuccess flow:**
1. Atomic core (Prisma transaction): Sale → COMPLETED + PaymentTransaction → SUCCESS + FinancialLedgerEntry → created
2. Smart Dining Slip generation
3. Guest Recognition update
4. Notification (WhatsApp/SMS)
5. Real-time broadcast
6. Kitchen dispatch
7. BillingEvent log (skipLedgerMirror=true — ledger already created atomically)
8. Audit log
9. Order token usage

**onPaymentFailure flow:**
1. Sale → FAILED
2. PaymentTransaction → FAILED
3. BillingEvent + FinancialLedgerEntry
4. Audit log

**Assessment:** PaymentCompletionService correctly handles the **payment → financial truth** chain. It does NOT handle settlement because settlement is a separate concept. The service should be extended to **emit** settlement-intelligence events (e.g., "payment succeeded, settlement status UNKNOWN") without breaking the existing atomic core.

**MPCA-001A fix is intact:** InTouch webhook now routes through PaymentCompletionService for sales. This must NOT be undone.

---

### 2.9 ReconciliationService (`src/lib/services/reconciliation.service.ts`)

**What it does:**
- Nightly reconciliation at 02:00 Africa/Kigali
- Expires pending transactions older than 24h
- Detects payment-order mismatches (payment SUCCESS but sale not COMPLETED)
- Auto-fixes mismatches
- Records findings in ReconciliationLog

**Assessment:** ReconciliationService handles **payment-vs-sale** reconciliation. It does NOT handle **settlement-vs-payment** reconciliation because settlement data doesn't exist yet. This is the correct place to extend settlement reconciliation.

---

### 2.10 ReconciliationLog (`prisma/schema.prisma:1960`)

**Fields:** businessId, transactionId, invoiceNumber, status, expectedAmountCents, actualAmountCents, discrepancyCents, resolvedAt, notes

**Assessment:** ReconciliationLog is payment-focused. Can be extended for settlement reconciliation or a separate SettlementReconciliationLog can be created.

---

### 2.11 ReconciliationWatchdogService (`src/lib/services/watchdog/reconciliation-watchdog.service.ts`)

**What it does:**
- Monitors unreconciled ledger entries (count + age)
- Alerts on backlog (WARN at 10, ERROR at 50, CRITICAL at 48h SLA breach)
- `checkLedgerMismatches()` is a placeholder — "requires reconciliation metadata"

**Assessment:** Watchdog infrastructure exists. Can be extended with settlement-specific checks once settlement data exists.

---

### 2.12 LedgerIntegrityService (`src/lib/services/ledger-integrity.service.ts`)

**BACKFILL-ONLY service.** Repairs missing FinancialLedgerEntry records after the fact.

**Assessment:** This is a repair tool, not a primary path. Settlement integrity backfill can follow the same pattern.

---

### 2.13 BillingLedgerService (`src/lib/services/billing-ledger.service.ts`)

**The single writer for FinancialLedgerEntry.**

**Key logic:**
- Domain selection: `marketplaceOrderId → MARKETPLACE, subscriptionId → SUBSCRIPTION, else → SALES`
- Idempotency key: `${tx.id}:${eventType}:${seconds}`
- P2002 (duplicate key) is safely ignored
- `skipLedgerMirror` flag for callers that already created the ledger entry atomically

**Assessment:** This service correctly separates PLATFORM MONEY (SUBSCRIPTION domain) from MERCHANT MONEY (SALES domain). The domain selection logic is the existing platform-vs-merchant money separation. It should be preserved and extended.

---

### 2.14 Z-Report / Close Day (`src/pages/api/reports/close-day.ts`)

**What it does:**
- Timezone-aware day boundary (getBusinessDayBoundary)
- Sale-based revenue totals
- Payment method breakdown
- **Ledger cross-check:** compares Sale-based total vs FinancialLedgerEntry total
- Outstanding liabilities (commissions, payouts, refunds)
- Atomic close-day in Prisma transaction

**Assessment:** Z-Report already does **payment-vs-ledger reconciliation**. It does NOT show settlement/withdrawal/funds-available because that data doesn't exist. The eventual settlement dashboard should follow the same cross-check pattern.

---

### 2.15 Subscription Engine (`src/lib/payments/subscription.engine.ts`)

**What it does:**
- Activates subscriptions after successful payment
- Renews subscriptions
- Cancels/suspends subscriptions
- Logs audit events and billing events

**Assessment:** Subscription payments are PLATFORM MONEY (business → ImboniServe). The engine correctly routes these through PaymentTransaction and logs them with SUBSCRIPTION domain. Settlement of subscription payments (ImboniServe receiving the money) is a separate concern that applies to ImboniServe as a platform, not to the hospitality business.

---

### 2.16 FeeConfiguration (`prisma/schema.prisma:1121`)

**Fields:** digitalFeeEnabled, digitalFeePercent (5.0), digitalFeeMin, digitalFeeMax, marketplaceCommStd (7.0), marketplaceCommLaunch (10.0), marketplaceCommHV (5.0), vatRate (18.0), whtEnabled, whtRate (15.0)

**Assessment:** Fee configuration exists and is configurable per business. This is the existing fee model. Settlement architecture should reference these, not hardcode fees.

---

### 2.17 Existing Payout Models

**AffiliatePayout, SupplierPayout, MarketerPayout, FounderPartnerPayout, PartnershipPayout**

These are all **partner/affiliate payout** models — money ImboniServe pays TO partners. They are NOT merchant settlement models — money payment providers pay TO hospitality businesses.

**Assessment:** These are a different concept. Merchant settlement (provider → business) should be a separate model, not conflated with partner payouts (ImboniServe → partner).

---

### 2.18 Heart Pulse (`src/lib/heart-pulse/event-catalog.ts`)

**Payment events:**
- `payment.confirmed` (PAYMENT_CONFIRMED)
- `payment.failed` (PAYMENT_FAILED)

**Assessment:** Heart Pulse has payment events but NO settlement events. Should be extended with:
- `settlement.created`
- `settlement.processing`
- `settlement.completed`
- `settlement.failed`
- `withdrawal.requested`
- `withdrawal.completed`
- `withdrawal.failed`
- `funds.available`

---

### 2.19 Service Replay (`src/lib/service-replay/types.ts`)

**Payment events:**
- `PAYMENT_STARTED`
- `PAYMENT_COMPLETED`
- `PAYMENT_FAILED`

**Assessment:** Service Replay can represent payment lifecycle on the timeline. Should be extended with settlement/withdrawal event types so the replay can show the full money movement story.

---

### 2.20 PaymentMetricsService (`src/lib/services/payment-metrics.service.ts`)

**What it tracks:**
- Daily payment metrics (totalPaidToday, failedToday, pendingOver10)
- Average finalize delay
- Finalization source breakdown (webhook, poll, cron, sweeper)
- Stuck payments
- Recent failures

**Assessment:** Payment metrics exist. Settlement metrics (funds available, pending settlement, withdrawn) should follow the same pattern once settlement data exists.

---

## 3. Summary: What Exists vs What's Missing

### EXISTS (can be extended):
| Concept | Location | Status |
|---|---|---|
| Payment state tracking | PaymentTransaction.status | Complete |
| Canonical financial truth | FinancialLedgerEntry | Complete |
| Fee separation (gross/gateway/platform/net) | FinancialLedgerEntry fields | Complete |
| Platform vs Merchant money separation | LedgerDomain (SUBSCRIPTION vs SALES) | Complete |
| Payment completion orchestration | PaymentCompletionService | Complete (MPCA-001A verified) |
| Provider abstraction | IPaymentProvider | Payment-only |
| Provider factory | PaymentProviderFactory | Works for payments |
| Payment reconciliation | ReconciliationService | Payment-vs-sale only |
| Reconciliation logging | ReconciliationLog | Payment-focused |
| Reconciliation watchdog | ReconciliationWatchdogService | Infrastructure exists |
| Z-Report ledger cross-check | close-day.ts | Payment-vs-ledger only |
| Event infrastructure | Heart Pulse | Payment events only |
| Timeline replay | Service Replay | Payment events only |
| Idempotency | idempotencyKey pattern | Established |
| Fee configuration | FeeConfiguration | Configurable |
| Partner payouts | AffiliatePayout, etc. | Different concept (ImboniServe→partner) |

### MISSING (must be created):
| Concept | Priority |
|---|---|
| Settlement entity/model | CRITICAL |
| Withdrawal entity/model | CRITICAL |
| Provider capability abstraction | CRITICAL |
| Provider capability matrix | CRITICAL |
| Funds availability tracking | HIGH |
| Settlement lifecycle states | CRITICAL |
| Withdrawal lifecycle states | CRITICAL |
| Settlement-vs-payment reconciliation | HIGH |
| Settlement events (Heart Pulse) | MEDIUM |
| Settlement events (Service Replay) | MEDIUM |
| Settlement metrics | LOW (defer to dashboard phase) |
| InTouch verification questionnaire | CRITICAL (for founder) |

---

## 4. Key Architectural Decisions from Forensic Review

1. **Do NOT duplicate FinancialLedgerEntry.** It already separates fees. Extend it with settlement linkage.

2. **Do NOT modify PaymentCompletionService's atomic core.** MPCA-001A is verified. Add settlement event emission AFTER the atomic core, as a non-blocking side effect.

3. **Do NOT cram settlement into IPaymentProvider.** Create a separate `ISettlementProvider` interface. Providers that support settlement implement both; providers that don't only implement IPaymentProvider.

4. **Do NOT conflate partner payouts with merchant settlement.** AffiliatePayout/SupplierPayout are ImboniServe→partner. Merchant settlement is provider→business. Different models.

5. **DO extend Heart Pulse and Service Replay.** They already have payment events. Add settlement events to the same infrastructure.

6. **DO extend ReconciliationService.** It already does payment-vs-sale reconciliation. Add settlement-vs-payment reconciliation using the same ReconciliationLog (or a parallel SettlementReconciliationLog).

7. **DO use the existing idempotencyKey pattern.** Every new entity (SettlementRecord, WithdrawalRecord) must have idempotencyKey with unique constraint.

8. **DO preserve LedgerDomain as the platform-vs-merchant money separation.** SALES = merchant money. SUBSCRIPTION/PLATFORM = platform money. This already works.

---

## 5. Conclusion

The existing architecture has a **solid payment foundation** with canonical financial truth (FinancialLedgerEntry), atomic payment completion (PaymentCompletionService), and reconciliation infrastructure. What it lacks is the **post-payment money movement layer** — settlement, funds availability, withdrawal, and settlement reconciliation.

The architecture should be **extended, not replaced**. New entities (SettlementRecord, WithdrawalRecord) sit alongside the existing payment truth chain. New interfaces (ISettlementProvider) sit alongside IPaymentProvider. New events extend Heart Pulse and Service Replay.

**No existing behavior should break.** MPCA-001A's fix remains intact. The financial truth chain remains canonical. Settlement intelligence is additive.

---

*Forensic review complete. Proceeding to architecture design and implementation.*
