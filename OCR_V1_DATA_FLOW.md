# OCR V1 Data Flow

**Date**: June 25, 2026  
**Author**: Document Intelligence Engineer  
**Status**: ✅ **PRODUCTION SPECIFICATION**

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ RESTAURANT OWNER                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Uploads receipt (PDF/JPG)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: /dashboard/inventory/receipts/upload             │
├─────────────────────────────────────────────────────────────┤
│ • File validation (type, size)                              │
│ • FormData creation                                         │
│ • POST to /api/die/upload                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 2. Upload request
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API: /api/die/upload (EXISTING)                             │
├─────────────────────────────────────────────────────────────┤
│ • resolveBusinessContext(req, res)                          │
│ • Parse multipart form (formidable)                         │
│ • Validate file type (PDF/JPG/PNG/WebP)                     │
│ • Validate file size (<25MB)                                │
│ • Compute SHA-256 hash                                      │
│ • Check duplicate: findFirst({ businessId, sourceHash })    │
│ • If duplicate: return existing scanJobId                   │
│ • Upload to Vercel Blob Storage                             │
│ • Create ScanJob + ScannedDocument (transaction)            │
│ • Enqueue extraction job (BullMQ)                           │
│ • Return: { scanJobId, scannedDocumentId, status }          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 3. Job enqueued
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ QUEUE: die_extract (BullMQ + Redis)                         │
├─────────────────────────────────────────────────────────────┤
│ • Job data: { scanJobId, fileKey, mime, documentType }      │
│ • Priority: 5 (normal)                                      │
│ • Concurrency: 5 workers                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 4. Worker picks up job
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ WORKER: extractWorker (EXISTING)                            │
├─────────────────────────────────────────────────────────────┤
│ • Update ScanJob.status = 'OCR_PROCESSING'                  │
│ • Download file from storage                                │
│ • Try provider chain:                                       │
│   1. OpenAI GPT-4 Vision                                    │
│   2. Azure Document Intelligence (fallback)                 │
│ • Extract:                                                  │
│   - Header fields (invoice#, date, supplier, total)         │
│   - Line items (product, qty, unit, price)                  │
│ • Store ExtractionPayload (rawPayload, pageStructure)       │
│ • Create ScannedDocument skeleton (if not exists)           │
│ • Store ExtractedDocumentHeaderField (batch)                │
│ • Create ScannedDocumentItem placeholders                   │
│ • Store ExtractedDocumentLineField (batch)                  │
│ • Update ScanJob.status = 'EXTRACTED'                       │
│ • Enqueue intelligence job                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 5. Intelligence job enqueued
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ QUEUE: die_intelligence (BullMQ + Redis)                    │
├─────────────────────────────────────────────────────────────┤
│ • Job data: { scannedDocumentId, scanJobId }                │
│ • Job ID: scannedDocumentId (deduplication)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 6. Worker picks up job
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ WORKER: intelligenceWorker (EXISTING)                       │
├─────────────────────────────────────────────────────────────┤
│ STAGE 1: Header Field Promotion                             │
│ • Read ExtractedDocumentHeaderField rows                    │
│ • Map to ScannedDocument columns:                           │
│   - invoiceNumber (aliases: invoice#, inv#, etc.)           │
│   - documentDate (parse: DD/MM/YYYY, ISO, etc.)             │
│   - currency (default: RWF)                                 │
│   - subtotalCents (parse: 1,234.56 → 123456)                │
│   - taxCents (parse money)                                  │
│   - totalCents (parse money)                                │
│ • Update ScannedDocument with promoted fields               │
│                                                             │
│ STAGE 2: Line Item Promotion                                │
│ • For each ScannedDocumentItem:                             │
│   - Read ExtractedDocumentLineField rows                    │
│   - Map to ScannedDocumentItem columns:                     │
│     * quantity (parse: 5.5, handle decimals)                │
│     * unit (normalize: kgs → kg, kilogram → kg)             │
│     * unitPriceCents (parse money)                          │
│     * totalPriceCents (parse money)                         │
│   - Update ScannedDocumentItem                              │
│                                                             │
│ STAGE 3: Confidence Calculation                             │
│ • Calculate overall confidence (avg of field confidences)   │
│ • Update ScannedDocument.confidenceOverall                  │
│                                                             │
│ • Update ScannedDocument.status = 'INTELLIGENCE_DONE'       │
│ • Update lifecycleState = 'INTELLIGENCE_DONE'               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 7. Intelligence complete
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVICE: Product Matching (NEW)                             │
├─────────────────────────────────────────────────────────────┤
│ • For each ScannedDocumentItem:                             │
│   - Get productName                                         │
│   - Call findProductMatch(productName, businessId)          │
│   - Fuzzy search InventoryItem catalog                      │
│   - Check exact match (confidence = 1.0)                    │
│   - Check ProductAlias table (confidence = 0.95)            │
│   - Calculate Levenshtein similarity                        │
│   - If similarity > 0.80: auto-link                         │
│   - Update ScannedDocumentItem.productId                    │
│   - Store confidence in metadata                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 8. Products matched
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVICE: Supplier Matching (NEW)                            │
├─────────────────────────────────────────────────────────────┤
│ • Extract supplier name from header fields                  │
│ • Call findSupplierMatch(supplierName, businessId)          │
│ • Check exact match (confidence = 1.0)                      │
│ • Check SupplierAlias table (confidence = 0.95)             │
│ • Calculate Levenshtein similarity                          │
│ • If similarity > 0.85: auto-link                           │
│ • Update ScannedDocument.supplierId                         │
│ • Store confidence in metadata                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 9. Ready for review
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Polling /api/die/documents/[id]/status            │
├─────────────────────────────────────────────────────────────┤
│ • Poll every 2 seconds                                      │
│ • Check status field                                        │
│ • If status === 'INTELLIGENCE_DONE':                        │
│   - Stop polling                                            │
│   - Redirect to review screen                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 10. Navigate to review
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: /dashboard/inventory/receipts/review/[id]         │
├─────────────────────────────────────────────────────────────┤
│ • GET /api/inventory/receipts/[id]                          │
│ • Fetch ScannedDocument with items                          │
│ • Transform to restaurant-friendly format                   │
│ • Display:                                                  │
│   - Header (invoice#, date, supplier, total)                │
│   - Line items table with match status:                     │
│     ✅ productId exists + confidence > 0.80 → AUTO_MATCHED  │
│     ⚠️  productId exists + confidence 0.60-0.80 → CONFIRM   │
│     ❌ productId null → NOT_MATCHED                         │
│ • Allow editing:                                            │
│   - Change quantity                                         │
│   - Change unit (validated)                                 │
│   - Select different product (dropdown)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 11. User reviews and clicks "Apply"
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Confirmation Modal                                │
├─────────────────────────────────────────────────────────────┤
│ • Show before/after stock levels:                           │
│   - Tomatoes: 50 kg → 55 kg (+5 kg)                         │
│   - Onions: 20 kg → 23 kg (+3 kg)                           │
│ • Show skipped items (if any)                               │
│ • User confirms                                             │
│ • POST /api/inventory/receipts/apply                        │
│ • Body: {                                                   │
│     documentId,                                             │
│     items: [                                                │
│       { itemId, productId, quantity, unit }                 │
│     ]                                                       │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 12. Apply request
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API: /api/inventory/receipts/apply (NEW)                    │
├─────────────────────────────────────────────────────────────┤
│ • resolveBusinessContext(req, res)                          │
│ • Validate request body                                     │
│ • Fetch ScannedDocument (verify ownership)                  │
│ • Validate current status (must be INTELLIGENCE_DONE)       │
│                                                             │
│ SERVER-SIDE VALIDATION:                                     │
│ • For each item:                                            │
│   - Verify productId exists in InventoryItem                │
│   - Verify businessId matches                               │
│   - Validate quantity > 0 and < 10,000                      │
│   - Validate unit matches inventory unit (exact)            │
│   - Reject if any validation fails                          │
│                                                             │
│ START TRANSACTION:                                          │
│   1. For each item:                                         │
│      a. Update InventoryItem:                               │
│         - currentStock += quantity                          │
│         - unitCostCents = unitPriceCents (if provided)      │
│      b. Create InventoryUpdate:                             │
│         - type: 'ADD'                                       │
│         - quantity: quantity                                │
│         - reason: 'Receipt: [invoiceNumber]'                │
│         - notes: 'Supplier: [supplierName]'                 │
│         - userId: ctx.userId                                │
│         - businessId: ctx.businessId                        │
│                                                             │
│   2. Update ScannedDocument:                                │
│      - status = 'APPLIED'                                   │
│      - lifecycleState = 'APPLIED'                           │
│                                                             │
│   3. Create DocumentEventTimeline:                          │
│      - stage: 'application'                                 │
│      - status: 'APPLIED'                                    │
│      - metadata: { itemsUpdated, appliedBy, appliedAt }     │
│                                                             │
│ COMMIT TRANSACTION                                          │
│                                                             │
│ • Return: {                                                 │
│     success: true,                                          │
│     itemsUpdated: 5,                                        │
│     stockLevels: [{ productId, name, oldStock, newStock }]  │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 13. Success response
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Success Feedback                                  │
├─────────────────────────────────────────────────────────────┤
│ • Show success toast                                        │
│ • Display updated stock levels                              │
│ • Options:                                                  │
│   - View Inventory                                          │
│   - Upload Another Receipt                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 14. Optional: Learn aliases
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKGROUND: Alias Learning (ASYNC)                          │
├─────────────────────────────────────────────────────────────┤
│ • If supplier was manually confirmed:                       │
│   - Create SupplierAlias entry                              │
│   - Future receipts will auto-match                         │
│                                                             │
│ • If product was manually matched:                          │
│   - Create ProductAlias entry                               │
│   - Future receipts will auto-match                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Transformations

### 1. Upload → Storage

**Input**: File buffer (PDF/JPG/PNG)  
**Output**: Storage key + hash

```typescript
const fileBuffer = fs.readFileSync(file.filepath)
const sourceHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
const uploaded = await StorageService.uploadPrivateDocument(
  fileBuffer, 
  filename, 
  mimeType, 
  businessId
)
// Returns: { storageKey: 'receipts/business123/abc123.pdf', url: '...' }
```

---

### 2. OCR Extraction → Raw Fields

**Input**: File buffer  
**Output**: Extracted fields with confidence

```typescript
// OpenAI GPT-4V response
{
  fields: [
    { name: 'InvoiceNumber', value: 'INV-2024-001', confidence: 0.95 },
    { name: 'Date', value: '15/01/2024', confidence: 0.92 },
    { name: 'Total', value: 'RWF 45,000', confidence: 0.88 }
  ],
  lines: [
    {
      fields: [
        { name: 'Description', value: 'Tomatoes', confidence: 0.90 },
        { name: 'Quantity', value: '5', confidence: 0.95 },
        { name: 'Unit', value: 'kg', confidence: 0.85 },
        { name: 'UnitPrice', value: '2,500', confidence: 0.88 },
        { name: 'Total', value: '12,500', confidence: 0.90 }
      ]
    }
  ]
}
```

---

### 3. Intelligence Normalization → Structured Data

**Input**: Raw extracted fields  
**Output**: Normalized ScannedDocument

```typescript
// Header normalization
invoiceNumber: 'INV-2024-001'  // Direct copy
documentDate: new Date('2024-01-15')  // Parsed from '15/01/2024'
totalCents: 4500000  // Parsed from 'RWF 45,000' → 45000.00 → 4500000 cents

// Line item normalization
{
  productName: 'Tomatoes',  // Resolved from 'Description' field
  quantity: 5.0,  // Parsed from '5'
  unit: 'kg',  // Normalized from 'kg'
  unitPriceCents: 250000,  // Parsed from '2,500' → 2500.00 → 250000 cents
  totalPriceCents: 1250000  // Parsed from '12,500' → 12500.00 → 1250000 cents
}
```

---

### 4. Product Matching → Linked Items

**Input**: Product name string  
**Output**: InventoryItem match + confidence

```typescript
// Input
productName: 'Tomatoes (Roma)'

// Fuzzy search
const products = await prisma.inventoryItem.findMany({
  where: { businessId, isActive: true }
})

// Matching logic
'Tomatoes (Roma)' vs 'Tomatoes' → similarity = 0.72 (below 0.80 threshold)
'Tomatoes (Roma)' vs 'Tomatoes Roma' → similarity = 0.95 (above 0.80)

// Output
{
  product: { id: 'inv123', name: 'Tomatoes Roma', unit: 'kg', ... },
  confidence: 0.95
}

// Update ScannedDocumentItem
productId: 'inv123'
```

---

### 5. Unit Normalization → Standard Units

**Input**: Raw unit string  
**Output**: Normalized unit

```typescript
// Normalization table
'kgs' → 'kg'
'kilogram' → 'kg'
'KG' → 'kg'
'Kg' → 'kg'
'pieces' → 'pcs'
'liter' → 'l'

// Validation
extractedUnit: 'kgs' → normalized: 'kg'
inventoryUnit: 'kg'
Match: ✅ Valid
```

---

### 6. Apply → Inventory Updates

**Input**: Matched items  
**Output**: Updated inventory + audit trail

```typescript
// Input
items: [
  { itemId: 'item1', productId: 'inv123', quantity: 5, unit: 'kg' }
]

// Transaction
await prisma.$transaction([
  // Update stock
  prisma.inventoryItem.update({
    where: { id: 'inv123' },
    data: { 
      currentStock: { increment: 5 },  // 50 → 55
      unitCostCents: 250000  // Update latest price
    }
  }),
  
  // Create audit record
  prisma.inventoryUpdate.create({
    data: {
      inventoryItemId: 'inv123',
      userId: 'user123',
      businessId: 'biz123',
      type: 'ADD',
      quantity: 5,
      reason: 'Receipt: INV-2024-001',
      notes: 'Supplier: Fresh Foods Ltd'
    }
  }),
  
  // Mark document applied
  prisma.scannedDocument.update({
    where: { id: 'doc123' },
    data: { status: 'APPLIED', lifecycleState: 'APPLIED' }
  })
])

// Output
{
  success: true,
  itemsUpdated: 1,
  stockLevels: [
    { productId: 'inv123', name: 'Tomatoes', oldStock: 50, newStock: 55 }
  ]
}
```

---

## Error Handling Flow

### Scenario 1: OCR Extraction Fails

```
Upload → OCR Worker → Provider Error
                    ↓
            Retry (3 attempts)
                    ↓
            All attempts fail
                    ↓
            Move to DLQ (Dead Letter Queue)
                    ↓
            Send alert (AlertDeliveryService)
                    ↓
            Update ScanJob.status = 'FAILED'
            Update ScanJob.errorMessage = 'OCR extraction failed'
                    ↓
            Frontend polls status
                    ↓
            Show error: "Could not process receipt. Please try again."
            Options: [Retry] [Enter Manually]
```

---

### Scenario 2: Unit Mismatch

```
Review Screen → User clicks "Apply"
                    ↓
            Client-side validation
                    ↓
            Check: extractedUnit === inventoryUnit
                    ↓
            Mismatch detected (kgs ≠ kg)
                    ↓
            Normalize: kgs → kg
                    ↓
            Recheck: kg === kg ✅
                    ↓
            Proceed to apply
```

**If normalization fails**:
```
            Normalize: liters → kg
                    ↓
            No match in alias table
                    ↓
            Block apply
                    ↓
            Show error: "Unit mismatch: Receipt has 'liters', inventory expects 'kg'"
            Action: User must manually correct
```

---

### Scenario 3: Duplicate Receipt

```
Upload → Compute hash
            ↓
      Check database: findFirst({ businessId, sourceHash })
            ↓
      Match found
            ↓
      Return existing: { scanJobId: 'existing123', status: 'APPLIED' }
            ↓
      Frontend shows: "This receipt was already uploaded on Jan 15, 2024"
      Options: [View Receipt] [Upload Different Receipt]
```

---

### Scenario 4: No Products Matched

```
Intelligence Worker → Product Matching
                    ↓
            For each line item: findProductMatch()
                    ↓
            All items return: { product: null, confidence: 0 }
                    ↓
            Review Screen shows:
            ❌ Tomatoes - Not matched [Select Product ▼]
            ❌ Onions - Not matched [Select Product ▼]
            ❌ Rice - Not matched [Select Product ▼]
                    ↓
            User must manually select from inventory dropdown
                    ↓
            After selection: productId populated
                    ↓
            Can proceed to apply
```

---

## Performance Optimization

### Database Queries

**Inefficient** (N+1 problem):
```typescript
for (const item of items) {
  const product = await prisma.inventoryItem.findUnique({ 
    where: { id: item.productId } 
  })
}
```

**Optimized** (single query):
```typescript
const productIds = items.map(i => i.productId)
const products = await prisma.inventoryItem.findMany({
  where: { id: { in: productIds } }
})
const productMap = new Map(products.map(p => [p.id, p]))
```

---

### Caching

**Supplier matching** (cache for 1 hour):
```typescript
const cacheKey = `suppliers:${businessId}`
let suppliers = await redis.get(cacheKey)

if (!suppliers) {
  suppliers = await prisma.supplier.findMany({ 
    where: { businessId },
    include: { SupplierAlias: true }
  })
  await redis.set(cacheKey, JSON.stringify(suppliers), 'EX', 3600)
}
```

---

### Parallel Processing

**Sequential** (slow):
```typescript
await promoteHeaderFields(tx, documentId)
await promoteLineItems(tx, documentId)
await matchProducts(tx, documentId)
await matchSupplier(tx, documentId)
```

**Parallel** (fast):
```typescript
await Promise.all([
  promoteHeaderFields(tx, documentId),
  promoteLineItems(tx, documentId)
])

await Promise.all([
  matchProducts(tx, documentId),
  matchSupplier(tx, documentId)
])
```

---

## Data Retention

### Storage Policy

**Original Files**: Keep forever (audit requirement)  
**Extraction Payloads**: Keep 90 days (debugging)  
**Processing Logs**: Keep 30 days (troubleshooting)  
**Applied Documents**: Keep forever (audit trail)

---

### Cleanup Job

```typescript
// Daily cron job
async function cleanupOldExtractionData() {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)
  
  await prisma.extractionPayload.deleteMany({
    where: { extractedAt: { lt: cutoffDate } }
  })
  
  await prisma.documentProcessingLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  })
}
```

---

**END OF DATA FLOW**
