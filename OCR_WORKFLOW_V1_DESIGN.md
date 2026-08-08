# OCR Workflow V1 Design

**Date**: June 25, 2026  
**Designer**: OCR Workflow Designer & Restaurant Operations Consultant  
**Focus**: Simplified restaurant-facing OCR workflow  
**Status**: ✅ **DESIGN COMPLETE**

---

## Design Principles

1. **Simplicity First**: Hide DIE complexity from restaurant owners
2. **Safety First**: Human review required before inventory changes
3. **Speed Second**: Minimize clicks, maximize automation
4. **Error Tolerance**: Clear guidance when OCR fails
5. **Mobile-Friendly**: Works on phone/tablet (common in restaurants)

---

## V1 Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: UPLOAD                                              │
│ Restaurant owner uploads receipt (PDF/JPG/PNG)              │
│ Time: 10 seconds                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: PROCESSING (Automatic)                              │
│ - OCR extraction (5-10 seconds)                             │
│ - Field normalization (2 seconds)                           │
│ - Product matching (3 seconds)                              │
│ Total: 10-15 seconds                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: REVIEW                                              │
│ Restaurant owner reviews extracted items                    │
│ - Verify product names                                      │
│ - Verify quantities                                         │
│ - Match to inventory items                                  │
│ - Edit if needed                                            │
│ Time: 30-60 seconds                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: APPLY                                               │
│ Click "Add to Inventory"                                    │
│ - Stock levels updated                                      │
│ - Audit trail created                                       │
│ Time: 1 second                                              │
└─────────────────────────────────────────────────────────────┘
```

**Total Time**: **2-3 minutes** (vs 10-15 minutes manual entry)

---

## Step-by-Step Workflow

### STEP 1: Upload Receipt

#### UI Location
**Path**: `/dashboard/inventory/receipts/upload`

**Entry Points**:
1. Main navigation: "Inventory" → "Upload Receipt"
2. Inventory dashboard: "Upload Receipt" button (prominent)
3. Mobile: Bottom nav "+" button → "Upload Receipt"

---

#### Upload Interface

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  📄 Upload Supplier Receipt                                │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │         Drag and drop receipt here                     │ │
│  │                    or                                  │ │
│  │              [Choose File]                             │ │
│  │                                                        │ │
│  │  Supported: PDF, JPG, PNG (max 25MB)                  │ │
│  │                                                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  💡 Tip: Take a clear photo of the receipt or upload      │
│     the PDF from your supplier                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

#### Upload Validation

**Client-Side**:
- File type: PDF, JPG, PNG, WebP
- File size: < 25MB
- Image quality check (optional): Warn if resolution < 300 DPI

**Server-Side** (existing):
- SHA-256 hash deduplication
- Virus scan (if configured)
- Storage upload

---

#### Upload Feedback

**Immediate**:
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Receipt uploaded successfully!                         │
│  🔄 Processing... (10-15 seconds)                          │
│                                                            │
│  [████████████░░░░░░░░░] 60%                               │
│  Extracting line items...                                  │
└────────────────────────────────────────────────────────────┘
```

**On Complete**:
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Receipt processed!                                     │
│  📋 Found 12 items                                         │
│                                                            │
│  [Review Items]                                            │
└────────────────────────────────────────────────────────────┘
```

---

### STEP 2: Processing (Automatic)

**Backend Flow** (existing DIE infrastructure):
1. Upload → `POST /api/die/upload`
2. Create ScanJob + ScannedDocument
3. Enqueue extraction job
4. OCR worker extracts fields
5. Intelligence worker normalizes data
6. Product matching (fuzzy search inventory)
7. Notify frontend via SSE or polling

**Frontend Polling**:
```typescript
// Poll document status every 2 seconds
const pollStatus = async (scanJobId: string) => {
  const res = await fetch(`/api/die/documents/${scanJobId}/status`)
  const { status } = await res.json()
  
  if (status === 'INTELLIGENCE_DONE') {
    // Ready for review
    router.push(`/dashboard/inventory/receipts/review/${scanJobId}`)
  } else if (status === 'FAILED') {
    showError('Failed to process receipt')
  } else {
    // Keep polling
    setTimeout(() => pollStatus(scanJobId), 2000)
  }
}
```

---

### STEP 3: Review Extracted Items

#### Review Interface

```
┌────────────────────────────────────────────────────────────┐
│  📄 Review Receipt                                         │
│  Invoice: INV-2024-001 | Date: Jan 15, 2024               │
│  Supplier: Fresh Foods Ltd                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Item                  Qty    Unit   Price   Inventory│ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ✅ Tomatoes           5      kg     2,500   [Tomatoes]│ │
│  │ ✅ Onions             3      kg     1,800   [Onions]  │ │
│  │ ⚠️  Coca Cola 500ml   24     pcs    12,000  [Select] │ │
│  │ ❌ Cooking Oil        2      ltr    8,000   [Select] │ │
│  │ ✅ Rice (Basmati)     10     kg     15,000  [Rice]   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ✅ 3 items matched automatically                          │
│  ⚠️  1 item needs confirmation                             │
│  ❌ 1 item not matched (select manually)                   │
│                                                            │
│  [Skip Unmatched] [Add to Inventory]                      │
└────────────────────────────────────────────────────────────┘
```

---

#### Line Item States

**✅ Auto-Matched** (Green):
- Product name matched to inventory (confidence > 80%)
- Unit matches inventory unit
- Quantity validated
- Ready to apply

**⚠️ Needs Confirmation** (Yellow):
- Product name matched (confidence 60-80%)
- OR unit mismatch (e.g., "kgs" vs "kg")
- OR quantity outlier (>3x average)
- Requires user click to confirm

**❌ Not Matched** (Red):
- Product name not found in inventory
- Requires manual selection from dropdown

---

#### Edit Line Item Modal

**Trigger**: Click on any line item

```
┌────────────────────────────────────────────────────────────┐
│  Edit Line Item                                            │
│                                                            │
│  Product Name (from receipt):                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Tomatoes (Roma)                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Match to Inventory Item:                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [Tomatoes ▼]                                          │ │
│  │  - Tomatoes (current: 50 kg)                          │ │
│  │  - Tomatoes Cherry (current: 10 kg)                   │ │
│  │  - Tomatoes Paste (current: 20 cans)                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Quantity:                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 5                                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Unit:                                                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ kg ▼                                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Unit Price:                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 2,500 RWF                                             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ⚠️  Unit matches inventory (kg)                           │
│  ℹ️  Previous price: 2,300 RWF (+8.7%)                     │
│                                                            │
│  [Cancel] [Skip This Item] [Save]                         │
└────────────────────────────────────────────────────────────┘
```

---

#### Validation Rules (Client-Side)

**Product Selection**:
- ✅ Required (cannot be empty)
- ✅ Must exist in inventory catalog

**Quantity**:
- ✅ Required
- ✅ Must be > 0
- ✅ Must be < 10,000
- ⚠️ Warn if > 1,000
- ⚠️ Warn if > 3x historical average

**Unit**:
- ✅ Required
- ✅ Must match inventory item unit (exact match in V1)
- ⚠️ Warn if mismatch detected

**Price**:
- ⚠️ Optional (can be 0 for free samples)
- ⚠️ Warn if > 20% change from previous

---

### STEP 4: Apply to Inventory

#### Confirmation Modal

```
┌────────────────────────────────────────────────────────────┐
│  Add to Inventory?                                         │
│                                                            │
│  You are about to add the following items:                 │
│                                                            │
│  ✅ Tomatoes: +5 kg (50 → 55 kg)                           │
│  ✅ Onions: +3 kg (20 → 23 kg)                             │
│  ✅ Rice: +10 kg (100 → 110 kg)                            │
│                                                            │
│  Skipped: 2 items (Coca Cola, Cooking Oil)                │
│                                                            │
│  This action cannot be undone.                             │
│                                                            │
│  [Cancel] [Add to Inventory]                               │
└────────────────────────────────────────────────────────────┘
```

---

#### Backend Processing

**API Call**: `POST /api/die/documents/[id]/apply`

**Transaction**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update inventory for each matched item
  for (const item of matchedItems) {
    await tx.inventoryItem.update({
      where: { id: item.productId },
      data: { 
        currentStock: { increment: item.quantity },
        unitCostCents: item.unitPriceCents  // Update cost
      }
    })
    
    // 2. Create audit record
    await tx.inventoryUpdate.create({
      data: {
        inventoryItemId: item.productId,
        userId: ctx.userId,
        businessId: ctx.businessId,
        type: 'ADD',
        quantity: item.quantity,
        reason: `Receipt upload: ${doc.invoiceNumber}`,
        notes: `Supplier: ${doc.supplier?.name || 'Unknown'}`
      }
    })
  }
  
  // 3. Mark document as APPLIED
  await tx.scannedDocument.update({
    where: { id: documentId },
    data: { 
      status: 'APPLIED',
      lifecycleState: 'APPLIED'
    }
  })
})
```

---

#### Success Feedback

```
┌────────────────────────────────────────────────────────────┐
│  ✅ Inventory Updated!                                     │
│                                                            │
│  3 items added to inventory:                               │
│  • Tomatoes: 50 kg → 55 kg                                 │
│  • Onions: 20 kg → 23 kg                                   │
│  • Rice: 100 kg → 110 kg                                   │
│                                                            │
│  [View Inventory] [Upload Another Receipt]                 │
└────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Error Scenarios

#### 1. OCR Extraction Failed

**Cause**: Poor image quality, unsupported format, OCR provider error

**UI**:
```
┌────────────────────────────────────────────────────────────┐
│  ❌ Could not process receipt                              │
│                                                            │
│  We couldn't extract data from this receipt.               │
│                                                            │
│  Tips:                                                     │
│  • Make sure the image is clear and well-lit               │
│  • Avoid shadows or glare                                  │
│  • Try uploading a PDF instead of a photo                  │
│                                                            │
│  [Try Again] [Enter Manually]                              │
└────────────────────────────────────────────────────────────┘
```

---

#### 2. No Items Matched

**Cause**: Inventory catalog empty or product names don't match

**UI**:
```
┌────────────────────────────────────────────────────────────┐
│  ⚠️  No items matched                                       │
│                                                            │
│  We found 5 items on the receipt, but none match your     │
│  inventory catalog.                                        │
│                                                            │
│  This usually means:                                       │
│  • Your inventory catalog is empty                         │
│  • Product names on receipt don't match your catalog       │
│                                                            │
│  [Add Items to Catalog] [Match Manually]                   │
└────────────────────────────────────────────────────────────┘
```

---

#### 3. Duplicate Receipt

**Cause**: Same receipt uploaded before (hash match)

**UI**:
```
┌────────────────────────────────────────────────────────────┐
│  ℹ️  Receipt already uploaded                              │
│                                                            │
│  This receipt was uploaded on Jan 15, 2024.                │
│                                                            │
│  Status: Applied to inventory                              │
│                                                            │
│  [View Receipt] [Upload Different Receipt]                 │
└────────────────────────────────────────────────────────────┘
```

---

#### 4. Unit Mismatch

**Cause**: Receipt unit ≠ Inventory unit

**UI**:
```
┌────────────────────────────────────────────────────────────┐
│  ⚠️  Unit mismatch detected                                 │
│                                                            │
│  Tomatoes:                                                 │
│  Receipt: 5 kgs                                            │
│  Inventory: kg                                             │
│                                                            │
│  We'll normalize "kgs" to "kg" for you.                    │
│                                                            │
│  [OK] [Edit Manually]                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Mobile Workflow

### Mobile-Specific Optimizations

1. **Camera Integration**:
   - "Take Photo" button launches camera
   - Auto-crop receipt boundaries
   - Auto-enhance contrast

2. **Simplified Review**:
   - One item per screen (swipe to next)
   - Large touch targets
   - Voice input for quantities

3. **Offline Support**:
   - Queue uploads when offline
   - Sync when connection restored

---

### Mobile UI (Simplified)

```
┌─────────────────────────┐
│  📄 Receipt Upload      │
├─────────────────────────┤
│                         │
│  [📷 Take Photo]        │
│                         │
│  [📁 Choose File]       │
│                         │
└─────────────────────────┘

        ↓ (After upload)

┌─────────────────────────┐
│  📋 Review Items        │
├─────────────────────────┤
│  Item 1 of 5            │
│                         │
│  Tomatoes               │
│  5 kg @ 2,500 RWF       │
│                         │
│  Match to:              │
│  [Tomatoes ▼]           │
│                         │
│  ✅ Looks good          │
│                         │
│  [← Skip] [Next →]      │
└─────────────────────────┘
```

---

## Automation Rules

### What Should Be Automatic?

#### ✅ **AUTOMATIC (No User Action)**

1. **OCR Extraction**
   - Field extraction
   - Line item parsing
   - Confidence scoring

2. **Product Matching**
   - Fuzzy search inventory catalog
   - Auto-match if confidence > 80%

3. **Unit Normalization**
   - "kgs" → "kg"
   - "kilogram" → "kg"
   - Case normalization

4. **Price Updates**
   - Update `unitCostCents` in inventory
   - Track price history

5. **Audit Trail**
   - Create `InventoryUpdate` records
   - Link to receipt document

---

### What Requires Human Confirmation?

#### ⚠️ **CONFIRMATION REQUIRED**

1. **Low-Confidence Matches** (60-80%)
   - Show match, require click to confirm

2. **Unit Mismatches**
   - Show warning, require confirmation

3. **Quantity Outliers**
   - Show warning if >3x average

4. **Price Changes**
   - Show warning if >20% change

5. **Final Apply**
   - Always require explicit "Add to Inventory" click

---

### What Is Dangerous to Automate?

#### ❌ **NEVER AUTOMATIC**

1. **Inventory Item Creation**
   - Too risky (catalog pollution)
   - Requires manual product setup

2. **Supplier Creation**
   - Too risky (duplicate suppliers)
   - Requires manual supplier onboarding

3. **Unit Conversion**
   - Too risky (kg → g conversion errors)
   - Requires explicit user confirmation

4. **Stock Removal**
   - Receipts only ADD stock
   - Never remove automatically

5. **Applying to Inventory**
   - Always requires human approval
   - No auto-apply even for 100% confidence

---

## Performance Targets

### Processing Speed

| Stage | Target | Acceptable | Unacceptable |
|-------|--------|------------|--------------|
| Upload | < 2s | < 5s | > 10s |
| OCR Extraction | < 10s | < 20s | > 30s |
| Intelligence | < 5s | < 10s | > 20s |
| Product Matching | < 3s | < 5s | > 10s |
| Apply to Inventory | < 2s | < 5s | > 10s |

**Total**: < 22s ideal, < 45s acceptable

---

### User Time Savings

| Task | Manual | With OCR | Savings |
|------|--------|----------|---------|
| 5-item receipt | 5 min | 1 min | 80% |
| 10-item receipt | 10 min | 2 min | 80% |
| 20-item receipt | 20 min | 3 min | 85% |

---

## Onboarding Flow

### First-Time User Experience

**Step 1**: Inventory Setup Prompt
```
┌────────────────────────────────────────────────────────────┐
│  🎉 Welcome to Smart Receipt Upload!                       │
│                                                            │
│  Before you can upload receipts, you need to add some     │
│  items to your inventory catalog.                          │
│                                                            │
│  This helps us match receipt items to your products.       │
│                                                            │
│  [Add Inventory Items] [Learn More]                        │
└────────────────────────────────────────────────────────────┘
```

**Step 2**: Add Sample Items
```
┌────────────────────────────────────────────────────────────┐
│  Add Inventory Items                                       │
│                                                            │
│  Add your most common items first:                         │
│                                                            │
│  ✅ Tomatoes (kg)                                          │
│  ✅ Onions (kg)                                            │
│  ✅ Rice (kg)                                              │
│  ✅ Cooking Oil (ltr)                                      │
│                                                            │
│  [Add More Items] [I'm Done]                               │
└────────────────────────────────────────────────────────────┘
```

**Step 3**: Upload First Receipt
```
┌────────────────────────────────────────────────────────────┐
│  📄 Upload Your First Receipt                              │
│                                                            │
│  Now upload a supplier receipt to see the magic!           │
│                                                            │
│  We'll extract all items and match them to your catalog.   │
│                                                            │
│  [Upload Receipt]                                          │
└────────────────────────────────────────────────────────────┘
```

---

## V1 Scope Summary

### ✅ **MUST HAVE (V1)**

**Upload**:
- Drag-and-drop file upload
- PDF, JPG, PNG support
- Duplicate detection
- Processing progress indicator

**Processing**:
- OCR extraction (existing DIE)
- Field normalization (existing DIE)
- Product matching (fuzzy search)
- Unit normalization (new)

**Review**:
- Line item table
- Edit quantities/units
- Match to inventory dropdown
- Validation warnings

**Apply**:
- Confirmation modal
- Transactional inventory updates
- Audit trail creation
- Success feedback

---

### 🟡 **SHOULD HAVE (V1.1)**

- Supplier matching
- Price change alerts
- Receipt history view
- Mobile camera integration
- Batch upload (multiple receipts)

---

### ❌ **DO NOT BUILD (V2+)**

- Automatic product creation
- Automatic supplier creation
- Forecasting
- AI recommendations
- Autonomous purchasing
- Benchmark network
- Digital twin

---

**END OF DESIGN**
