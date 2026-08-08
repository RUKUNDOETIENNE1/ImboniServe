# OCR V1 Production Design

**Date**: June 25, 2026  
**Designer**: Principal Product Architect  
**Status**: ✅ **PRODUCTION SPECIFICATION**  
**Target**: Restaurant Pilot Launch

---

## Executive Summary

**What**: Single-receipt OCR upload that auto-updates inventory in 30 seconds  
**Why**: Eliminate 80% of manual inventory data entry  
**How**: Reuse 90% of existing DIE infrastructure + build simplified restaurant UI  
**Effort**: 6 days  
**ROI**: Highest-value feature available

---

## Design Philosophy

**Minimum Viable Wow**:
- One receipt upload
- Instant extraction
- Simple review
- One-click inventory update

**NOT Building**:
- Batch upload
- Forecasting
- Recommendations
- Autonomous ordering
- Advanced analytics

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ EXISTING DIE INFRASTRUCTURE (Reuse 90%)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ /api/die/upload          (document upload)             │
│  ✅ OCR Workers              (extraction pipeline)          │
│  ✅ Intelligence Worker      (field normalization)          │
│  ✅ ScannedDocument model    (data storage)                 │
│  ✅ /api/die/documents/[id]  (document retrieval)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ NEW RESTAURANT LAYER (Build 10%)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🆕 /dashboard/inventory/receipts/upload                    │
│  🆕 /dashboard/inventory/receipts/review/[id]               │
│  🆕 /api/inventory/receipts/apply                           │
│  🆕 Unit normalization service                              │
│  🆕 Supplier memory service                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Reuse Analysis

### ✅ **REUSE IMMEDIATELY** (No Changes)

**1. Document Upload API**
- Path: `/api/die/upload`
- Status: Production-ready
- Supports: PDF, JPG, PNG, WebP
- Features: Hash deduplication, business scoping
- Action: **Use as-is**

**2. OCR Extraction Workers**
- Path: `src/lib/die/orchestrator/worker.ts`
- Status: Production-ready
- Providers: OpenAI GPT-4V, Azure Document Intelligence
- Features: Multi-provider fallback, confidence scoring
- Action: **Use as-is**

**3. Intelligence Worker**
- Path: `src/lib/die/orchestrator/intelligence-worker.ts`
- Status: Production-ready
- Features: Field normalization, money parsing, date parsing
- Action: **Use as-is**

**4. Data Models**
- Models: `ScanJob`, `ScannedDocument`, `ScannedDocumentItem`
- Status: Production-ready
- Features: Complete schema, foreign keys, indexes
- Action: **Use as-is**

**5. Storage Service**
- Path: `src/lib/services/storage.service.ts`
- Status: Production-ready
- Provider: Vercel Blob Storage
- Action: **Use as-is**

---

### 🔧 **ADAPT** (Minor Changes)

**1. Document Retrieval API**
- Path: `/api/die/documents/[id]`
- Current: Returns full DIE document structure
- Needed: Simplified restaurant-friendly format
- Action: **Add transformation layer**

**2. Inventory Service**
- Path: `src/lib/services/inventory.service.ts`
- Current: Manual stock updates
- Needed: Receipt-triggered updates with validation
- Action: **Add receipt application method**

---

### ❌ **DO NOT REUSE**

**1. DIE Review Workbench**
- Path: `/dashboard/die/review/[id]`
- Reason: Too complex, enterprise-focused
- Action: **Build new simplified UI**

**2. DIE Dashboard**
- Path: `/dashboard/die`
- Reason: Not accessible to restaurant users
- Action: **Build new restaurant UI**

**3. DIE Reconciliation**
- Path: `src/lib/die/business-as-plugin/procurement`
- Reason: Enterprise feature, overkill for V1
- Action: **Skip for V1**

---

## V1 Exact Workflow

### User Journey (2 minutes total)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: UPLOAD (10 seconds)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User Action:                                                │
│  • Navigate to Inventory → Upload Receipt                   │
│  • Drag-and-drop PDF/photo OR click "Choose File"          │
│  • File uploads instantly                                   │
│                                                             │
│ Backend Action:                                             │
│  • POST /api/die/upload                                     │
│  • Compute SHA-256 hash                                     │
│  • Check for duplicate (return existing if found)           │
│  • Upload to Vercel Blob Storage                            │
│  • Create ScanJob + ScannedDocument records                 │
│  • Enqueue extraction job (BullMQ)                          │
│  • Return scanJobId                                         │
│                                                             │
│ UI Feedback:                                                │
│  • "Uploading..." → "Processing..." (with progress)         │
│  • Poll /api/die/documents/[id]/status every 2s             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: PROCESSING (10-15 seconds, automatic)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ AI Action (OCR Worker):                                     │
│  • Download file from storage                               │
│  • Send to OpenAI GPT-4V (fallback to Azure)                │
│  • Extract header fields (invoice#, date, supplier, total)  │
│  • Extract line items (product, qty, unit, price)           │
│  • Store in ExtractionPayload                               │
│  • Update ScanJob status to EXTRACTED                       │
│                                                             │
│ AI Action (Intelligence Worker):                            │
│  • Normalize header fields (invoice# → invoiceNumber)       │
│  • Parse money values (1,234.56 → 123456 cents)             │
│  • Parse dates (15/01/2024 → 2024-01-15)                    │
│  • Normalize units (kgs → kg, kilogram → kg)                │
│  • Parse quantities (5.5 → 5.5)                             │
│  • Update ScannedDocument with normalized data              │
│  • Update status to INTELLIGENCE_DONE                       │
│                                                             │
│ Backend Action (NEW - Product Matching):                    │
│  • For each line item:                                      │
│    - Fuzzy search inventory catalog by product name         │
│    - Calculate confidence score (0.0-1.0)                   │
│    - Auto-link if confidence > 0.80                         │
│    - Store productId in ScannedDocumentItem                 │
│                                                             │
│ Backend Action (NEW - Supplier Matching):                   │
│  • Extract supplier name from header                        │
│  • Search existing suppliers (exact + fuzzy)                │
│  • Auto-link if confidence > 0.85                           │
│  • Store supplierId in ScannedDocument                      │
│                                                             │
│ UI Feedback:                                                │
│  • Progress bar: Extracting... → Analyzing... → Ready!      │
│  • Auto-redirect to review screen                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: REVIEW (30-60 seconds, human)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User Sees:                                                  │
│  • Receipt header (invoice#, date, supplier, total)         │
│  • Line items table with 3 states:                          │
│    ✅ Auto-matched (green) - ready to apply                 │
│    ⚠️  Needs confirmation (yellow) - click to confirm       │
│    ❌ Not matched (red) - select manually                   │
│                                                             │
│ User Actions:                                               │
│  • Review auto-matched items (quick scan)                   │
│  • Click yellow items to confirm or edit                    │
│  • Click red items to select from inventory dropdown        │
│  • Edit quantities/units if needed                          │
│  • Click "Add to Inventory" button                          │
│                                                             │
│ Validation (Client-Side):                                   │
│  • All items must have productId (matched or selected)      │
│  • Quantities must be > 0 and < 10,000                      │
│  • Units must match inventory item units                    │
│  • Show warnings for outliers (qty > 1,000)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: APPLY (1 second)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User Action:                                                │
│  • Click "Add to Inventory"                                 │
│  • Confirm in modal (shows before/after stock levels)       │
│                                                             │
│ Backend Action (NEW):                                       │
│  • POST /api/inventory/receipts/apply                       │
│  • Validate all items (server-side)                         │
│  • Start transaction:                                       │
│    1. For each matched item:                                │
│       - Update InventoryItem.currentStock (+quantity)       │
│       - Update InventoryItem.unitCostCents (latest price)   │
│       - Create InventoryUpdate record (audit trail)         │
│    2. Link supplier to document (if matched)                │
│    3. Mark ScannedDocument as APPLIED                       │
│    4. Create DocumentEventTimeline entry                    │
│  • Commit transaction                                       │
│  • Return success                                           │
│                                                             │
│ UI Feedback:                                                │
│  • Success toast: "Inventory updated! 5 items added."       │
│  • Show updated stock levels                                │
│  • Option to upload another receipt                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Specifications

### New API Endpoints

**1. GET /api/inventory/receipts**
```typescript
// List uploaded receipts for restaurant
// Returns: Array of ScannedDocument (simplified)
```

**2. GET /api/inventory/receipts/[id]**
```typescript
// Get single receipt with extracted data
// Returns: Receipt with line items, matching status
```

**3. POST /api/inventory/receipts/apply**
```typescript
// Apply receipt to inventory
// Body: { documentId, items: [{ itemId, productId, quantity, unit }] }
// Returns: { success, itemsUpdated, stockLevels }
```

---

### New Services

**1. Unit Normalization Service**
```typescript
// src/lib/services/unit-normalization.service.ts

const UNIT_ALIASES: Record<string, string> = {
  'kg': 'kg', 'kgs': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  'g': 'g', 'grams': 'g', 'gram': 'g',
  'l': 'l', 'liter': 'l', 'litre': 'l', 'ltr': 'l',
  'ml': 'ml', 'milliliter': 'ml',
  'pcs': 'pcs', 'pieces': 'pcs', 'piece': 'pcs', 'pc': 'pcs',
  // ... more
}

export function normalizeUnit(raw: string): string {
  const key = raw.toLowerCase().trim()
  return UNIT_ALIASES[key] || raw
}

export function validateUnitMatch(
  extractedUnit: string, 
  inventoryUnit: string
): { valid: boolean; message?: string } {
  const normalized = normalizeUnit(extractedUnit)
  
  if (normalized === inventoryUnit) {
    return { valid: true }
  }
  
  return { 
    valid: false, 
    message: `Unit mismatch: Receipt has "${extractedUnit}", inventory expects "${inventoryUnit}"`
  }
}
```

**2. Supplier Memory Service**
```typescript
// src/lib/services/supplier-memory.service.ts

import { distance } from 'fastest-levenshtein'

export async function findSupplierMatch(
  extractedName: string,
  businessId: string
): Promise<{ supplier: Supplier | null; confidence: number }> {
  const suppliers = await prisma.supplier.findMany({
    where: { businessId }, // Scope to business
    include: { SupplierAlias: true }
  })
  
  let bestMatch: Supplier | null = null
  let bestScore = 0
  
  for (const supplier of suppliers) {
    // Check exact match first
    if (supplier.name.toLowerCase() === extractedName.toLowerCase()) {
      return { supplier, confidence: 1.0 }
    }
    
    // Check aliases
    for (const alias of supplier.SupplierAlias) {
      if (alias.alias.toLowerCase() === extractedName.toLowerCase()) {
        return { supplier, confidence: 0.95 }
      }
    }
    
    // Fuzzy match
    const similarity = 1 - (
      distance(extractedName.toLowerCase(), supplier.name.toLowerCase()) / 
      Math.max(extractedName.length, supplier.name.length)
    )
    
    if (similarity > bestScore) {
      bestScore = similarity
      bestMatch = supplier
    }
  }
  
  return { 
    supplier: bestScore > 0.85 ? bestMatch : null, 
    confidence: bestScore 
  }
}

export async function learnSupplierAlias(
  supplierId: string,
  alias: string
): Promise<void> {
  await prisma.supplierAlias.upsert({
    where: { alias_supplierId: { alias, supplierId } },
    create: { supplierId, alias },
    update: {}
  })
}
```

**3. Product Matching Service**
```typescript
// src/lib/services/product-matching.service.ts

import { distance } from 'fastest-levenshtein'

export async function findProductMatch(
  extractedName: string,
  businessId: string
): Promise<{ product: InventoryItem | null; confidence: number }> {
  const products = await prisma.inventoryItem.findMany({
    where: { businessId, isActive: true },
    include: { ProductAlias: true }
  })
  
  let bestMatch: InventoryItem | null = null
  let bestScore = 0
  
  for (const product of products) {
    // Exact match
    if (product.name.toLowerCase() === extractedName.toLowerCase()) {
      return { product, confidence: 1.0 }
    }
    
    // Alias match
    for (const alias of product.ProductAlias) {
      if (alias.alias.toLowerCase() === extractedName.toLowerCase()) {
        return { product, confidence: 0.95 }
      }
    }
    
    // Fuzzy match
    const similarity = 1 - (
      distance(extractedName.toLowerCase(), product.name.toLowerCase()) / 
      Math.max(extractedName.length, product.name.length)
    )
    
    if (similarity > bestScore) {
      bestScore = similarity
      bestMatch = product
    }
  }
  
  return { 
    product: bestScore > 0.80 ? bestMatch : null, 
    confidence: bestScore 
  }
}
```

---

### Database Schema Additions

**1. SupplierAlias (NEW)**
```prisma
model SupplierAlias {
  id         String   @id @default(cuid())
  supplierId String
  alias      String   // "Fresh Foods Ltd", "Fresh Foods Limited"
  createdAt  DateTime @default(now())
  
  supplier   Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  
  @@unique([alias, supplierId])
  @@index([supplierId])
}
```

**2. ProductAlias (NEW)**
```prisma
model ProductAlias {
  id              String        @id @default(cuid())
  inventoryItemId String
  alias           String        // "Tomatoes (Roma)", "Roma Tomatoes"
  createdAt       DateTime      @default(now())
  
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  
  @@unique([alias, inventoryItemId])
  @@index([inventoryItemId])
}
```

**Note**: Both models already exist in schema (confirmed in audit)

---

## Build Breakdown

### Day 1: Unit Normalization + Validation
- [ ] Create `unit-normalization.service.ts`
- [ ] Build alias table (30+ common units)
- [ ] Add validation logic
- [ ] Write unit tests
- [ ] Integration test with existing extraction

### Day 2: Supplier Memory
- [ ] Create `supplier-memory.service.ts`
- [ ] Implement fuzzy matching (Levenshtein)
- [ ] Add alias learning
- [ ] Write unit tests
- [ ] Integration test with ScannedDocument

### Day 3: Product Matching
- [ ] Create `product-matching.service.ts`
- [ ] Implement fuzzy matching
- [ ] Add confidence scoring
- [ ] Write unit tests
- [ ] Integration test with inventory

### Day 4: Backend APIs
- [ ] Create `/api/inventory/receipts` (list)
- [ ] Create `/api/inventory/receipts/[id]` (get)
- [ ] Create `/api/inventory/receipts/apply` (apply)
- [ ] Add validation middleware
- [ ] Write API tests

### Day 5: Upload UI
- [ ] Create `/dashboard/inventory/receipts/upload` page
- [ ] Drag-and-drop component
- [ ] Progress indicator
- [ ] Status polling
- [ ] Error handling

### Day 6: Review UI
- [ ] Create `/dashboard/inventory/receipts/review/[id]` page
- [ ] Line items table with 3 states
- [ ] Edit modal
- [ ] Product dropdown search
- [ ] Apply confirmation modal
- [ ] Success feedback

---

## Quality Gates

### Before Merge
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual test with 5 real receipts
- [ ] Unit normalization covers 95% of common units
- [ ] Product matching achieves >70% auto-match rate
- [ ] Review UI works on mobile
- [ ] Error messages are clear
- [ ] Loading states are smooth

### Before Pilot Launch
- [ ] End-to-end test: Upload → Review → Apply → Verify inventory
- [ ] Test duplicate upload (should return existing)
- [ ] Test unit mismatch (should block apply)
- [ ] Test quantity outlier (should warn)
- [ ] Test with poor quality image (should show clear error)
- [ ] Performance: Upload to apply < 30 seconds
- [ ] Demo script validated with real receipt

---

## Success Metrics

### Technical
- Extraction success rate: >90%
- Auto-match rate: >60%
- Processing time: <15 seconds
- User review time: <2 minutes

### Business
- Time savings: 80% (10 min → 2 min)
- Demo "wow" score: >80/100
- Pilot retention impact: +20%
- Feature adoption: >80% of restaurants use it

---

**END OF PRODUCTION DESIGN**
