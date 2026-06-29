# Payment Schema Truth — ImboniServe

## AUDIT DATE
**Generated**: Phase 0.7A Infrastructure Audit  
**Purpose**: Document payment-related schema as defined in Prisma  
**Status**: READ-ONLY DOCUMENTATION

---

## CRITICAL PAYMENT TABLES

### 1. `PaymentTransaction` ⚠️ **EXECUTION LAYER**

**Purpose**: Track individual payment transactions  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `invoiceNumber`, `transactionId`

**Columns**:
```prisma
id                       String                   @id @default(cuid())
businessId               String
invoiceNumber            String                   @unique
transactionId            String                   @unique
referenceId              String?
amountCents              Int
currency                 String                   @default("RWF")
vatAmountCents           Int
exVatAmountCents         Int
gatewayFeeEstimatedCents Int
gatewayFeeActualCents    Int?
platformFeeCents         Int                      @default(0)
netToBusinessCents       Int
paymentLinkUrl           String?
callbackUrl              String?
payerName                String?
payerEmail               String?
payerPhone               String?
createdAt                DateTime                 @default(now())
updatedAt                DateTime                 @updatedAt
paidAt                   DateTime?
status                   PaymentTransactionStatus
gateway                  PaymentGateway
paymentMethod            PaymentMethod
rawStatus                Json?
webhookSignature         String?
webhookTimestamp         BigInt?
webhookVerified          Boolean?
```

**Relationships**:
- `business`: Business (FK: businessId)
- `billingEvents`: BillingEvent[] (1:N)
- `salePayment`: SalePayment? (1:1)
- `financialLedgerEntries`: FinancialLedgerEntry[] (1:N)

**Indexes**:
- `businessId`
- `status`
- `gateway`
- `createdAt`
- `paidAt`

**Enums Used**:
- `PaymentTransactionStatus`: PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REFUNDED
- `PaymentGateway`: IREMBO_PAY, PESAPAL, INTOUCH, CASH, MOBILE_MONEY, CARD, BANK_TRANSFER
- `PaymentMethod`: CASH, MOBILE_MONEY, CARD, BANK_TRANSFER

**Critical Fields**:
- ✅ `invoiceNumber`: UNIQUE - Used for reconciliation with Sale.orderNumber
- ✅ `transactionId`: UNIQUE - Provider reference
- ✅ `status`: Enum - Canonical payment state
- ✅ `paidAt`: Timestamp - When payment succeeded
- ⚠️ `rawStatus`: Json - Provider-specific status (unstructured)

---

### 2. `FinancialLedgerEntry` ⚠️ **SINGLE SOURCE OF TRUTH FOR FINANCE**

**Purpose**: Immutable financial ledger (append-only)  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `idempotencyKey` ⚠️ **CRITICAL**

**Columns**:
```prisma
id                   String                    @id @default(cuid())
businessId           String
domain               LedgerDomain
eventType            BillingEventType
amountCents          Int
currency             String                    @default("RWF")
vatAmountCents       Int?
exVatAmountCents     Int?
gatewayFeeCents      Int?
platformFeeCents     Int?
netAmountCents       Int?
gateway              PaymentGateway?
paymentMethod        PaymentMethod?
status               PaymentTransactionStatus?
paymentTransactionId String?
subscriptionId       String?
marketplaceOrderId   String?
invoiceNumber        String?
providerReference    String?
idempotencyKey       String?                   @unique
occurredAt           DateTime                  @default(now())
createdAt            DateTime                  @default(now())
```

**Relationships**:
- `business`: Business (FK: businessId)
- `paymentTransaction`: PaymentTransaction? (FK: paymentTransactionId)
- `subscription`: Subscription? (FK: subscriptionId)
- `marketplaceOrder`: MarketplaceOrder? (FK: marketplaceOrderId)

**Indexes**:
- `businessId + occurredAt` (composite)
- `eventType + occurredAt` (composite)
- `domain + occurredAt` (composite)
- `gateway + occurredAt` (composite)
- `paymentTransactionId`
- `subscriptionId`
- `marketplaceOrderId`
- `invoiceNumber`

**Enums Used**:
- `LedgerDomain`: SUBSCRIPTION, MARKETPLACE, PLATFORM, OTHER
- `BillingEventType`: PAYMENT_INITIATED, PAYMENT_PROCESSING, PAYMENT_SUCCESS, PAYMENT_FAILED, PAYMENT_CANCELLED, PAYMENT_REFUNDED, SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_RENEWED, SUBSCRIPTION_EXPIRED, SUBSCRIPTION_CANCELLED, REMINDER_SENT

**Critical Fields**:
- ✅ `idempotencyKey`: UNIQUE - Prevents duplicate ledger entries
- ✅ `eventType`: Enum - Maps payment status to billing event
- ✅ `occurredAt`: Timestamp - When event actually occurred
- ✅ `createdAt`: Timestamp - When ledger entry was written
- ⚠️ `paymentTransactionId`: Optional FK - Links to execution layer

**Idempotency Pattern**:
```typescript
const idempotencyKey = `${transactionId}:${eventType}:${Math.floor(occurredAt.getTime() / 1000)}`
```

---

### 3. `BillingEvent` ⚠️ **AUDIT LAYER**

**Purpose**: Track billing-related events (audit trail)  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: None

**Columns**:
```prisma
id                   String           @id @default(cuid())
businessId           String
subscriptionId       String?
paymentTransactionId String?
eventType            BillingEventType
message              String?
metadata             Json?
occurredAt           DateTime         @default(now())
createdAt            DateTime         @default(now())
```

**Relationships**:
- `business`: Business (FK: businessId, onDelete: Cascade)
- `subscription`: Subscription? (FK: subscriptionId)
- `paymentTransaction`: PaymentTransaction? (FK: paymentTransactionId)

**Indexes**:
- `businessId + occurredAt` (composite)
- `subscriptionId`
- `paymentTransactionId`
- `eventType + occurredAt` (composite)

**Purpose**: Audit trail, NOT financial source of truth

---

### 4. `Sale` ⚠️ **ORDER LAYER**

**Purpose**: Restaurant orders/sales  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `orderNumber`

**Columns**:
```prisma
id                   String        @id @default(cuid())
orderNumber          String        @unique
userId               String
customerId           String?
tableId              String?
totalAmountCents     Int
paymentMethod        PaymentMethod
paymentStatus        PaymentStatus @default(PENDING)
paymentReference     String?
notes                String?
isPaid               Boolean       @default(false)
status               String        @default("ACTIVE")
kitchenStatus        String?       @default("pending")
createdAt            DateTime      @default(now())
updatedAt            DateTime      @updatedAt
businessId           String
customerName         String?
customerPhone        String?
depositCents         Int           @default(0)
kitchenReleasedAt    DateTime?
kitchenDispatchedAt  DateTime?
// ... kitchen execution fields
```

**Relationships**:
- `business`: Business (FK: businessId)
- `user`: User (FK: userId)
- `customer`: Customer? (FK: customerId)
- `table`: Table? (FK: tableId)
- `items`: SaleItem[] (1:N)
- `salePayments`: SalePayment[] (1:N)

**Enums Used**:
- `PaymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED
- `PaymentMethod`: CASH, MOBILE_MONEY, CARD, BANK_TRANSFER

**Critical Fields**:
- ✅ `orderNumber`: UNIQUE - Format: `ORD-{timestamp}-{random}`
- ✅ `paymentStatus`: Enum - Order payment state (NOT transaction state)
- ✅ `isPaid`: Boolean - Quick check for paid orders
- ⚠️ `paymentReference`: String - Links to PaymentTransaction.invoiceNumber (via `INV-{orderNumber}`)

**Reconciliation Pattern**:
```typescript
// PaymentTransaction.invoiceNumber = "INV-ORD-1234567890-ABC123"
// Sale.orderNumber = "ORD-1234567890-ABC123"
const orderNumber = invoiceNumber.replace('INV-', '')
```

---

### 5. `SalePayment` ⚠️ **SPLIT PAYMENT LAYER**

**Purpose**: Track individual payers in split bills  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `paymentTransactionId`

**Columns**:
```prisma
id                   String            @id @default(cuid())
saleId               String
payerName            String?
payerPhone           String?
payerEmail           String?
amountCents          Int
itemIds              String[] // Array of SaleItem IDs
status               SalePaymentStatus @default(PENDING)
paymentTransactionId String?           @unique
paidAt               DateTime?
createdAt            DateTime          @default(now())
updatedAt            DateTime          @updatedAt
```

**Relationships**:
- `sale`: Sale (FK: saleId, onDelete: Cascade)
- `paymentTransaction`: PaymentTransaction? (FK: paymentTransactionId)

**Indexes**:
- `saleId`
- `status`

**Enums Used**:
- `SalePaymentStatus`: PENDING, PROCESSING, PAID, FAILED, CANCELLED

**Critical Fields**:
- ✅ `paymentTransactionId`: UNIQUE - 1:1 link to PaymentTransaction
- ✅ `itemIds`: String[] - Which items this payer is responsible for
- ✅ `status`: Enum - Split payment state

---

### 6. `Subscription` ⚠️ **SUBSCRIPTION LAYER**

**Purpose**: Track subscription billing  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: None

**Columns**:
```prisma
id                      String                   @id @default(cuid())
planId                  String
status                  SubscriptionStatus       @default(ACTIVE)
amountCents             Int
currency                String                   @default("RWF")
paymentMethod           PaymentMethod
paymentReference        String?
startDate               DateTime
endDate                 DateTime
nextBillingDate         DateTime
isAutoRenew             Boolean                  @default(true)
createdAt               DateTime                 @default(now())
updatedAt               DateTime                 @updatedAt
businessId              String
```

**Relationships**:
- `business`: Business (FK: businessId)
- `plan`: Plan (FK: planId)
- `invoices`: Invoice[] (1:N)
- `paymentTransactions`: PaymentTransaction[] (1:N)
- `billingEvents`: BillingEvent[] (1:N)
- `financialLedgerEntries`: FinancialLedgerEntry[] (1:N)

**Enums Used**:
- `SubscriptionStatus`: TRIAL, ACTIVE, GRACE_PERIOD, EXPIRED, SUSPENDED, CANCELLED

**Critical Fields**:
- ✅ `status`: Enum - Subscription lifecycle state
- ✅ `nextBillingDate`: DateTime - When next payment is due
- ✅ `isAutoRenew`: Boolean - Auto-renewal enabled

---

### 7. `Invoice` ⚠️ **INVOICE LAYER**

**Purpose**: Track subscription invoices  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `invoiceNumber`

**Columns**:
```prisma
id                   String                @id @default(cuid())
subscriptionId       String
invoiceNumber        String                @unique
amountCents          Int
currency             String                @default("RWF")
status               String                @default("PENDING")
paymentMethod        PaymentMethod?
paymentReference     String?
dueDate              DateTime
paidAt               DateTime?
createdAt            DateTime              @default(now())
updatedAt            DateTime              @updatedAt
```

**Relationships**:
- `subscription`: Subscription (FK: subscriptionId)
- `affiliateCommissions`: AffiliateCommission[] (1:N)

**Critical Fields**:
- ✅ `invoiceNumber`: UNIQUE - Invoice identifier
- ⚠️ `status`: String (NOT enum) - "PENDING", "PAID", "FAILED", etc.
- ✅ `paidAt`: DateTime - When invoice was paid

---

### 8. `Reservation` ⚠️ **RESERVATION LAYER**

**Purpose**: Track table reservations with deposits  
**Primary Key**: `id` (cuid)  
**Unique Constraints**: `confirmationCode`

**Columns**:
```prisma
id                   String              @id @default(cuid())
businessId           String
customerId           String?
customerName         String
customerPhone        String
customerEmail        String?
reservationDate      DateTime
reservationTime      String
reservedAt           DateTime
partySize            Int
tableId              String?
specialRequests      String?
status               ReservationStatus   @default(PENDING)
confirmationCode     String              @unique
reminderSent         Boolean             @default(false)
reminderSentAt       DateTime?
confirmedAt          DateTime?
completedAt          DateTime?
forfeitCents         Int                 @default(0)
noShowReason         String?
depositStatus        PaymentTransactionStatus?
depositPaidAt        DateTime?
paymentTransactionId String?
```

**Relationships**:
- `business`: Business (FK: businessId)
- `customer`: Customer? (FK: customerId)
- `table`: Table? (FK: tableId)
- `paymentTransaction`: PaymentTransaction? (FK: paymentTransactionId)

**Enums Used**:
- `ReservationStatus`: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- `PaymentTransactionStatus`: (for depositStatus)

**Critical Fields**:
- ✅ `depositStatus`: Enum - Deposit payment state
- ✅ `depositPaidAt`: DateTime - When deposit was paid
- ✅ `paymentTransactionId`: String - Links to PaymentTransaction

---

## PAYMENT FLOW ARCHITECTURE

### Standard Payment Flow

```
1. User initiates payment
   ↓
2. PaymentTransaction created (status: PENDING)
   ↓
3. BillingEvent logged (PAYMENT_INITIATED)
   ↓
4. Provider processes payment
   ↓
5. Webhook received
   ↓
6. PaymentTransaction updated (status: SUCCESS, paidAt set)
   ↓
7. BillingEvent logged (PAYMENT_SUCCESS)
   ↓
8. FinancialLedgerEntry created (eventType: PAYMENT_SUCCESS, idempotencyKey set)
   ↓
9. Sale updated (paymentStatus: COMPLETED, isPaid: true)
```

### Ledger Writing Rules

**ONLY** `billing-ledger.service.ts` writes to `FinancialLedgerEntry`

**Idempotency Pattern**:
```typescript
const idempotencyKey = `${transactionId}:${eventType}:${Math.floor(occurredAt.getTime() / 1000)}`

// Unique constraint prevents duplicates
await prisma.financialLedgerEntry.create({
  data: { ...ledgerData, idempotencyKey }
})
```

**Backfill Service** (`ledger-integrity.service.ts`):
- Marked as BACKFILL-ONLY
- Creates missing entries for historical data
- Uses same idempotency pattern

---

## RECONCILIATION ARCHITECTURE

### Payment → Order Reconciliation

**Pattern**:
```typescript
// PaymentTransaction
invoiceNumber: "INV-ORD-1234567890-ABC123"

// Sale
orderNumber: "ORD-1234567890-ABC123"

// Reconciliation
const orderNumber = paymentTransaction.invoiceNumber.replace('INV-', '')
const sale = await prisma.sale.findFirst({ where: { orderNumber } })
```

**Fragility**: String-based parsing (see RECONCILIATION_HARDENING_PLAN.md)

---

## FOREIGN KEY RELATIONSHIPS

### PaymentTransaction Relationships
- `businessId` → Business.id
- `paymentTransactionId` ← SalePayment.paymentTransactionId (1:1)
- `paymentTransactionId` ← FinancialLedgerEntry.paymentTransactionId (1:N)
- `paymentTransactionId` ← BillingEvent.paymentTransactionId (1:N)
- `paymentTransactionId` ← Reservation.paymentTransactionId (1:1)

### FinancialLedgerEntry Relationships
- `businessId` → Business.id
- `paymentTransactionId` → PaymentTransaction.id (optional)
- `subscriptionId` → Subscription.id (optional)
- `marketplaceOrderId` → MarketplaceOrder.id (optional)

### Sale Relationships
- `businessId` → Business.id
- `userId` → User.id
- `customerId` → Customer.id (optional)
- `tableId` → Table.id (optional)
- `saleId` ← SalePayment.saleId (1:N)
- `saleId` ← SaleItem.saleId (1:N)

---

## INDEXES FOR OBSERVATION QUERIES

### PaymentTransaction Indexes
- `businessId` - For business-specific queries
- `status` - For status filtering
- `gateway` - For provider comparison
- `createdAt` - For time-based queries
- `paidAt` - For success time analysis

### FinancialLedgerEntry Indexes
- `businessId + occurredAt` - For business financial reports
- `eventType + occurredAt` - For event-based analysis
- `domain + occurredAt` - For domain-based reports
- `gateway + occurredAt` - For provider-based reports
- `paymentTransactionId` - For transaction lookup
- `subscriptionId` - For subscription lookup
- `marketplaceOrderId` - For marketplace lookup
- `invoiceNumber` - For invoice lookup

### BillingEvent Indexes
- `businessId + occurredAt` - For business audit trail
- `subscriptionId` - For subscription events
- `paymentTransactionId` - For payment events
- `eventType + occurredAt` - For event-based audit

---

## ENUM DEFINITIONS

### PaymentTransactionStatus
```prisma
enum PaymentTransactionStatus {
  PENDING      // Payment initiated, awaiting provider
  PROCESSING   // Provider processing payment
  SUCCESS      // Payment successful
  FAILED       // Payment failed
  CANCELLED    // Payment cancelled
  REFUNDED     // Payment refunded
}
```

### PaymentStatus (Sale)
```prisma
enum PaymentStatus {
  PENDING    // Order created, payment not started
  COMPLETED  // Order paid
  FAILED     // Payment failed
  REFUNDED   // Payment refunded
}
```

### SubscriptionStatus
```prisma
enum SubscriptionStatus {
  TRIAL         // Trial period
  ACTIVE        // Active subscription
  GRACE_PERIOD  // Payment failed, grace period
  EXPIRED       // Subscription expired
  SUSPENDED     // Suspended by admin
  CANCELLED     // Cancelled by user
}
```

### LedgerDomain
```prisma
enum LedgerDomain {
  SUBSCRIPTION  // Subscription billing
  MARKETPLACE   // Marketplace orders
  PLATFORM      // Platform fees
  OTHER         // Other financial events
}
```

### BillingEventType
```prisma
enum BillingEventType {
  PAYMENT_INITIATED
  PAYMENT_PROCESSING
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  PAYMENT_CANCELLED
  PAYMENT_REFUNDED
  SUBSCRIPTION_ACTIVATED
  SUBSCRIPTION_RENEWED
  SUBSCRIPTION_EXPIRED
  SUBSCRIPTION_CANCELLED
  REMINDER_SENT
}
```

---

## CRITICAL OBSERVATIONS

### ✅ WELL-DESIGNED
1. **FinancialLedgerEntry**:
   - Unique idempotency key prevents duplicates
   - Comprehensive indexes for performance
   - Proper foreign key relationships
   - Immutable append-only design

2. **PaymentTransaction**:
   - Unique constraints on invoiceNumber and transactionId
   - Enum-based status (canonical)
   - Proper timestamp tracking (createdAt, updatedAt, paidAt)

### ⚠️ FRAGILITY POINTS
1. **Reconciliation**:
   - String-based invoice → order mapping
   - No direct FK between PaymentTransaction and Sale
   - Relies on `invoiceNumber.replace('INV-', '')` pattern

2. **Invoice.status**:
   - Uses String instead of enum
   - Inconsistent with PaymentTransactionStatus

3. **Sale.paymentStatus**:
   - Uses PaymentStatus enum (PENDING, COMPLETED, FAILED, REFUNDED)
   - Different from PaymentTransactionStatus
   - Can cause confusion in analytics

### 🚨 CRITICAL DEPENDENCIES
1. **Observation Queries**:
   - MUST use `PaymentTransactionStatus` enum values
   - MUST use `PaymentStatus` enum for Sale queries
   - MUST use `SubscriptionStatus` enum for Subscription queries

2. **Ledger Integrity**:
   - DEPENDS on `idempotencyKey` uniqueness
   - DEPENDS on `billing-ledger.service.ts` as single writer
   - DEPENDS on `ledger-integrity.service.ts` for backfill only

---

## SCHEMA HEALTH ASSESSMENT

| Aspect | Status | Notes |
|--------|--------|-------|
| **Unique Constraints** | ✅ GOOD | invoiceNumber, transactionId, idempotencyKey |
| **Indexes** | ✅ GOOD | Comprehensive coverage for queries |
| **Foreign Keys** | ⚠️ PARTIAL | Some relationships missing direct FKs |
| **Enums** | ✅ GOOD | Canonical status values enforced |
| **Idempotency** | ✅ EXCELLENT | Unique idempotencyKey on ledger |
| **Reconciliation** | ⚠️ FRAGILE | String-based invoice parsing |

---

**Schema Truth Status**: ✅ DOCUMENTED  
**Critical Tables**: 8 (PaymentTransaction, FinancialLedgerEntry, BillingEvent, Sale, SalePayment, Subscription, Invoice, Reservation)  
**Next Step**: Compare against actual Supabase schema
