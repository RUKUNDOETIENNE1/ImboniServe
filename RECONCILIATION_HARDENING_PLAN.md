# Reconciliation Hardening Plan

## Current State (Phase 0.6)

### Invoice Number String Coupling

**Location**: `lib/services/reconciliation.service.ts:88`

```typescript
// Extract order number from invoice (format: INV-ORD-XXX)
const orderNumber = payment.invoiceNumber.replace('INV-', '')
```

**Issue**: String-based parsing couples reconciliation to invoice format

**Risk**: If invoice format changes, reconciliation breaks

---

## String-Based Identifier Analysis

### Invoice Number Format
- **Pattern**: `INV-{orderNumber}`
- **Example**: `INV-ORD-1234567890-ABC123`
- **Usage**: PaymentTransaction.invoiceNumber → Sale.orderNumber mapping

### Order Number Format
- **Pattern**: `ORD-{timestamp}-{random}`
- **Example**: `ORD-1234567890-ABC123`
- **Generation**: Multiple services generate independently

### Order Number Generators (6 locations)

1. **`lib/services/qr-order.service.ts:164`**
   ```typescript
   const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
   ```

2. **`lib/services/sales.service.ts:22`**
   ```typescript
   const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
   ```

3. **`lib/services/whatsapp-order.service.ts:234`**
   ```typescript
   const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
   ```

4. **`pages/api/dev/bootstrap-tap-leave.ts:98`**
   ```typescript
   const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
   ```

5. **`pages/api/marketplace/orders/pay.ts:66`**
   ```typescript
   const orderRef = `ORD-${order.orderNumber}-${Date.now()}`
   ```

6. **`lib/services/payment.service.ts:30`**
   ```typescript
   const reference = `ORD-${request.orderId}-${Date.now()}`
   ```

**Issue**: Inconsistent random suffix length (6, 8, 9 characters)

---

## Current Reconciliation Flow

```
PaymentTransaction (SUCCESS)
  └─ invoiceNumber: "INV-ORD-1234567890-ABC123"
       │
       ▼
  String parsing: .replace('INV-', '')
       │
       ▼
  orderNumber: "ORD-1234567890-ABC123"
       │
       ▼
  Sale.findFirst({ where: { orderNumber } })
       │
       ▼
  Check if Sale.paymentStatus === 'COMPLETED'
       │
       ▼
  Auto-fix if mismatch detected
```

**Fragility Points**:
1. String parsing assumes "INV-" prefix
2. No validation that extracted orderNumber exists
3. No foreign key relationship between PaymentTransaction and Sale
4. Reconciliation runs nightly - delayed detection

---

## Proposed Hardening (Logical Only - No Schema Changes)

### Option 1: Reconciliation Mapping Layer (SAFE)

**Create**: `lib/services/reconciliation-mapper.service.ts`

```typescript
/**
 * Reconciliation Mapping Layer
 * Decouples reconciliation from invoice string format
 * 
 * DESIGN ONLY - No schema changes
 */

export class ReconciliationMapper {
  /**
   * Extract order number from invoice number
   * Handles multiple invoice formats safely
   */
  static extractOrderNumber(invoiceNumber: string): string | null {
    // Current format: INV-{orderNumber}
    if (invoiceNumber.startsWith('INV-')) {
      return invoiceNumber.replace('INV-', '')
    }

    // Future format: could be different
    // Add new format handlers here without breaking existing logic

    // If no format matches, return null
    console.warn('[ReconciliationMapper] Unknown invoice format:', invoiceNumber)
    return null
  }

  /**
   * Find sale by invoice number
   * Tries multiple strategies to locate the sale
   */
  static async findSaleByInvoice(invoiceNumber: string): Promise<Sale | null> {
    // Strategy 1: Extract order number from invoice
    const orderNumber = this.extractOrderNumber(invoiceNumber)
    if (orderNumber) {
      const sale = await prisma.sale.findFirst({
        where: { orderNumber },
        select: { id: true, paymentStatus: true, isPaid: true, totalAmountCents: true }
      })
      if (sale) return sale
    }

    // Strategy 2: Search by invoice number in metadata (future)
    // const sale = await prisma.sale.findFirst({
    //   where: { metadata: { path: ['invoiceNumber'], equals: invoiceNumber } }
    // })
    // if (sale) return sale

    // Strategy 3: Search payment transaction reference (future)
    // const payment = await prisma.paymentTransaction.findFirst({
    //   where: { invoiceNumber },
    //   include: { sale: true }
    // })
    // if (payment?.sale) return payment.sale

    return null
  }

  /**
   * Validate invoice-order consistency
   */
  static async validateInvoiceOrderLink(
    invoiceNumber: string,
    orderNumber: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const extractedOrderNumber = this.extractOrderNumber(invoiceNumber)
    
    if (!extractedOrderNumber) {
      return { valid: false, reason: 'Cannot extract order number from invoice' }
    }

    if (extractedOrderNumber !== orderNumber) {
      return { valid: false, reason: 'Invoice and order number mismatch' }
    }

    return { valid: true }
  }
}
```

**Benefits**:
- No schema changes required
- Backward compatible with existing invoice format
- Easy to add new format handlers
- Centralizes invoice parsing logic
- Testable in isolation

**Migration**: Replace direct string parsing in reconciliation.service.ts

---

### Option 2: Order Number Generator Service (SAFE)

**Create**: `lib/services/order-number.service.ts`

```typescript
/**
 * Order Number Generator Service
 * Centralizes order number generation logic
 * Ensures consistent format across all services
 * 
 * DESIGN ONLY - No schema changes
 */

export class OrderNumberService {
  /**
   * Generate unique order number
   * Format: ORD-{timestamp}-{random6}
   */
  static generate(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `ORD-${timestamp}-${random}`
  }

  /**
   * Validate order number format
   */
  static isValid(orderNumber: string): boolean {
    // Format: ORD-{13 digits}-{6 alphanumeric}
    const pattern = /^ORD-\d{13}-[A-Z0-9]{6}$/
    return pattern.test(orderNumber)
  }

  /**
   * Extract timestamp from order number
   */
  static extractTimestamp(orderNumber: string): Date | null {
    if (!this.isValid(orderNumber)) return null
    
    const parts = orderNumber.split('-')
    const timestamp = parseInt(parts[1], 10)
    return new Date(timestamp)
  }

  /**
   * Generate invoice number from order number
   */
  static toInvoiceNumber(orderNumber: string): string {
    return `INV-${orderNumber}`
  }

  /**
   * Extract order number from invoice number
   */
  static fromInvoiceNumber(invoiceNumber: string): string | null {
    if (!invoiceNumber.startsWith('INV-')) return null
    return invoiceNumber.replace('INV-', '')
  }
}
```

**Benefits**:
- Consistent order number format
- Centralized validation
- Easy to change format in one place
- Testable

**Migration**: Replace inline order number generation in 6 services

---

## Migration Strategy (Future Phase)

### Phase 1: Create Abstraction Layers (No Breaking Changes)
1. Implement `ReconciliationMapper`
2. Implement `OrderNumberService`
3. Add unit tests for both

### Phase 2: Migrate Reconciliation Service
1. Update `reconciliation.service.ts` to use `ReconciliationMapper`
2. Test reconciliation with existing data
3. Verify no regressions

### Phase 3: Migrate Order Number Generators (Incremental)
1. Update `qr-order.service.ts`
2. Update `sales.service.ts`
3. Update `whatsapp-order.service.ts`
4. Update dev/bootstrap scripts
5. Update marketplace payment APIs

### Phase 4: Add Foreign Key (Schema Change - Future)
**Only after** all services migrated and stable

```prisma
model PaymentTransaction {
  id            String   @id @default(cuid())
  invoiceNumber String
  orderNumber   String?  // NEW: Direct reference to Sale.orderNumber
  saleId        String?  // NEW: Foreign key to Sale
  sale          Sale?    @relation(fields: [saleId], references: [id])
  
  @@index([orderNumber])
  @@index([saleId])
}
```

**Benefits**:
- Direct FK relationship eliminates string parsing
- Database enforces referential integrity
- Faster reconciliation queries

**Migration**:
1. Add nullable columns
2. Backfill existing records
3. Make columns required
4. Update reconciliation to use FK

---

## Current Status

### ✅ Completed
- Invoice number string coupling identified
- Order number generators mapped (6 locations)
- Reconciliation flow documented
- Abstraction layer designed

### 🔄 In Progress (Design Phase)
- ReconciliationMapper design complete
- OrderNumberService design complete

### ⏳ Pending (Future Phases)
- Abstraction layer implementation
- Service migration
- Foreign key addition

---

## Risk Assessment

| Component | Risk Level | Impact if Broken | Mitigation |
|-----------|-----------|------------------|------------|
| Invoice parsing | MEDIUM | Reconciliation fails | Abstraction layer with fallbacks |
| Order number generation | LOW | Inconsistent formats | Centralized generator |
| Reconciliation logic | MEDIUM | Payment-order mismatches | Mapping layer with validation |
| Foreign key addition | HIGH | Schema migration risk | Do last, after full migration |

---

## Success Criteria

### Must Be True
- ✅ Invoice parsing logic identified
- ✅ Order number generators mapped
- ⏳ Abstraction layers designed (no implementation yet)
- ⏳ No schema changes introduced

### Should Be True
- ⏳ ReconciliationMapper provides format-agnostic parsing
- ⏳ OrderNumberService ensures consistent format
- ⏳ Migration path clear and safe

---

## Next Steps (Future Phase 1.0)

1. Implement `ReconciliationMapper` (no breaking changes)
2. Implement `OrderNumberService` (no breaking changes)
3. Add unit tests
4. Update reconciliation.service.ts to use mapper
5. Verify reconciliation still works with existing data
6. Incrementally migrate order number generators
