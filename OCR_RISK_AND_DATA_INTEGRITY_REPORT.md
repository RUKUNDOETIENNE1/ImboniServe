# OCR Risk and Data Integrity Report

**Date**: June 25, 2026  
**Risk Assessor**: Inventory Systems Specialist & Data Integrity Engineer  
**Focus**: Preventing inventory corruption from OCR errors  
**Status**: ✅ **COMPLETE**

---

## Executive Summary

OCR receipt processing introduces **data integrity risks** that must be mitigated before pilot launch. The primary risk is **inventory corruption** from incorrect quantity/unit extraction.

**Risk Level**: 🟡 **MEDIUM** (with proper safeguards)

**Mitigation Strategy**: **Human-in-the-loop** approval required before any inventory changes.

---

## Risk Categories

### 1. Duplicate Receipts

#### Risk Description
Same receipt uploaded multiple times → stock double-counted

#### Probability
🟢 **LOW** (5%)

#### Impact
🟡 **MEDIUM** (inventory inflated, reporting incorrect)

#### Current Mitigation
✅ **IMPLEMENTED**
- SHA-256 hash per document
- Unique constraint: `(sourceHash, businessId)`
- Idempotent uploads return existing document

#### Evidence
```typescript
// From upload.ts
const sourceHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

const existing = await prisma.scanJob.findFirst({ 
  where: { businessId, sourceHash } 
})

if (existing) {
  return res.status(200).json({ 
    scanJobId: existing.id, 
    status: existing.status 
  })
}
```

#### Residual Risk
🟢 **NEGLIGIBLE**

---

### 2. Wrong Quantities

#### Risk Description
OCR extracts incorrect quantity (e.g., "5" read as "8") → stock levels wrong

#### Probability
🟡 **MEDIUM** (15-20%)

#### Impact
🔴 **HIGH** (inventory data corrupted, stock counts wrong)

#### Current Mitigation
⚠️ **PARTIAL**
- Confidence scoring per field
- Human review required

#### Missing Mitigation
❌ **NOT IMPLEMENTED**
- No bounds checking (accepts 0, 10,000, etc.)
- No outlier detection
- No historical comparison

---

#### Example Scenarios

**Scenario 1: Misread Digit**
```
Receipt: "5 kg tomatoes"
OCR extracts: "8 kg tomatoes"
User reviews: Doesn't notice error
Result: +8 kg instead of +5 kg
Impact: Inventory overstated by 3 kg
```

**Scenario 2: Decimal Point Error**
```
Receipt: "2.5 kg onions"
OCR extracts: "25 kg onions"
User reviews: Doesn't notice error
Result: +25 kg instead of +2.5 kg
Impact: Inventory overstated by 22.5 kg
```

**Scenario 3: Unit Confusion**
```
Receipt: "5 boxes (12 units each)"
OCR extracts: "5 units"
User reviews: Doesn't notice error
Result: +5 instead of +60
Impact: Inventory understated by 55 units
```

---

#### Required Mitigation (V1)

**Bounds Checking**:
```typescript
// Validation rules
if (quantity <= 0) {
  throw new Error('Quantity must be greater than 0')
}

if (quantity > 10000) {
  throw new Error('Quantity too large (max 10,000)')
}

if (quantity > 1000) {
  showWarning('Large quantity detected. Please verify.')
}
```

**Outlier Detection** (V1.1):
```typescript
// Compare to historical average
const avgQuantity = await getAverageQuantity(productId, last30Days)

if (quantity > avgQuantity * 3) {
  showWarning(`Quantity is 3x higher than usual (avg: ${avgQuantity})`)
}
```

---

### 3. Wrong Units

#### Risk Description
OCR extracts wrong unit or unit doesn't match inventory → quantity misinterpreted

#### Probability
🔴 **HIGH** (40-60%)

#### Impact
🔴 **CRITICAL** (inventory data corrupted, unusable)

#### Current Mitigation
❌ **NOT IMPLEMENTED**
- No unit normalization
- No unit validation
- Defaults to "UNIT" if not found

---

#### Example Scenarios

**Scenario 1: Unit Variant Mismatch**
```
Receipt: "5 kgs tomatoes"
Inventory unit: "kg"
OCR extracts: unit="kgs"
System: Unit mismatch error
Result: User must manually fix
Impact: Friction, but safe
```

**Scenario 2: Unit Conversion Error**
```
Receipt: "5 kg tomatoes"
Inventory unit: "g"
OCR extracts: quantity=5, unit="kg"
User: Doesn't notice mismatch
System: Adds 5 to currentStock (expecting grams)
Result: Inventory shows 5g instead of 5000g
Impact: CRITICAL DATA CORRUPTION
```

**Scenario 3: Missing Unit**
```
Receipt: "5 tomatoes" (no unit specified)
Inventory unit: "kg"
OCR extracts: unit="UNIT"
System: Unit mismatch error
Result: User must manually fix
Impact: Friction, but safe
```

---

#### Required Mitigation (V1)

**Unit Normalization Table**:
```typescript
const UNIT_ALIASES: Record<string, string> = {
  'kg': 'kg',
  'kgs': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'KG': 'kg',
  'Kg': 'kg',
  
  'g': 'g',
  'grams': 'g',
  'gram': 'g',
  'GM': 'g',
  
  'l': 'l',
  'liter': 'l',
  'litre': 'l',
  'ltr': 'l',
  'L': 'l',
  
  // ... more aliases
}

function normalizeUnit(rawUnit: string): string {
  const normalized = rawUnit.toLowerCase().trim()
  return UNIT_ALIASES[normalized] || rawUnit
}
```

**Unit Validation**:
```typescript
// Before apply
const extractedUnit = normalizeUnit(item.unit)
const inventoryUnit = inventoryItem.unit

if (extractedUnit !== inventoryUnit) {
  throw new Error(
    `Unit mismatch: Receipt has "${extractedUnit}", ` +
    `inventory expects "${inventoryUnit}". ` +
    `Please correct manually.`
  )
}
```

**Unit Conversion** (V1.1 - NOT V1):
```typescript
// DO NOT IMPLEMENT IN V1 (too risky)
// V1.1: Allow explicit user-confirmed conversions
if (extractedUnit === 'kg' && inventoryUnit === 'g') {
  showConfirmation(
    `Convert ${quantity} kg to ${quantity * 1000} g?`
  )
}
```

---

### 4. Wrong Supplier Names

#### Risk Description
OCR extracts supplier name incorrectly → cannot match to existing supplier

#### Probability
🟡 **MEDIUM** (30-40%)

#### Impact
🟢 **LOW** (no data corruption, just missing link)

#### Current Mitigation
⚠️ **PARTIAL**
- Supplier matching exists in DIE
- Fuzzy matching not implemented

#### Missing Mitigation
- No supplier alias table
- No manual supplier selection in V1

---

#### Example Scenarios

**Scenario 1: Name Variant**
```
Receipt: "Fresh Foods Ltd."
Database: "Fresh Foods Limited"
OCR extracts: "Fresh Foods Ltd."
System: No match found
Result: Supplier link missing
Impact: Cannot track supplier performance
```

**Scenario 2: OCR Error**
```
Receipt: "Fresh Foods Ltd"
OCR extracts: "Frcsh Foods Ltd" (misread 'e')
System: No match found
Result: Supplier link missing
Impact: Cannot track supplier performance
```

---

#### Required Mitigation (V1.1)

**Supplier Alias Table**:
```prisma
model SupplierAlias {
  id         String
  supplierId String
  alias      String   // "Fresh Foods Ltd", "Fresh Foods Limited"
  
  supplier   Supplier @relation(...)
  
  @@unique([alias, supplierId])
}
```

**Fuzzy Matching**:
```typescript
import { distance } from 'fastest-levenshtein'

function findSupplierMatch(extractedName: string): Supplier | null {
  const suppliers = await prisma.supplier.findMany({
    include: { SupplierAlias: true }
  })
  
  for (const supplier of suppliers) {
    const names = [
      supplier.name,
      ...supplier.SupplierAlias.map(a => a.alias)
    ]
    
    for (const name of names) {
      const similarity = 1 - (distance(extractedName, name) / Math.max(extractedName.length, name.length))
      
      if (similarity > 0.85) {
        return supplier
      }
    }
  }
  
  return null
}
```

---

### 5. Incorrect Parsing

#### Risk Description
OCR misreads text completely → garbage data extracted

#### Probability
🟢 **LOW** (5-10%)

#### Impact
🟡 **MEDIUM** (user must re-upload or enter manually)

#### Current Mitigation
✅ **IMPLEMENTED**
- Confidence scoring
- Human review required
- Clear error messages

#### Example Scenarios

**Scenario 1: Poor Image Quality**
```
Receipt: Blurry photo, low resolution
OCR result: Gibberish text
System: Low confidence score
User: Sees warning, re-uploads
Impact: Friction, but safe
```

**Scenario 2: Handwritten Receipt**
```
Receipt: Handwritten supplier receipt
OCR result: Cannot extract structured data
System: Extraction fails
User: Must enter manually
Impact: Friction, but safe
```

---

### 6. Missing Line Items

#### Risk Description
OCR skips some line items → incomplete stock update

#### Probability
🟡 **MEDIUM** (10-20%)

#### Impact
🟡 **MEDIUM** (inventory understated)

#### Current Mitigation
⚠️ **PARTIAL**
- Human review shows all extracted items
- User can see if items are missing

#### Missing Mitigation
- No line count validation
- No total amount validation

---

#### Example Scenarios

**Scenario 1: Multi-Page Receipt**
```
Receipt: 2-page PDF
OCR: Only processes first page
Result: Items on page 2 missing
Impact: Inventory understated
```

**Scenario 2: Table Detection Failure**
```
Receipt: Complex table layout
OCR: Misses some rows
Result: Some items not extracted
Impact: Inventory understated
```

---

#### Required Mitigation (V1)

**Line Count Validation**:
```typescript
// Show extracted line count prominently
<div className="alert alert-info">
  📋 Found {items.length} items on receipt
  
  {items.length < 5 && (
    <p className="text-sm text-yellow-600">
      ⚠️ This seems like a small receipt. 
      Please verify all items were extracted.
    </p>
  )}
</div>
```

**Total Amount Validation** (V1.1):
```typescript
// Compare extracted total to sum of line items
const extractedTotal = document.totalCents
const calculatedTotal = items.reduce((sum, item) => 
  sum + (item.totalPriceCents || 0), 0
)

if (Math.abs(extractedTotal - calculatedTotal) > 100) {
  showWarning(
    `Total mismatch: Receipt shows ${extractedTotal/100} RWF, ` +
    `but line items sum to ${calculatedTotal/100} RWF. ` +
    `Some items may be missing.`
  )
}
```

---

## Data Corruption Scenarios

### Scenario Matrix

| Scenario | Probability | Impact | Mitigation | Residual Risk |
|----------|-------------|--------|------------|---------------|
| Duplicate receipt | 5% | Medium | ✅ Hash dedup | 🟢 Negligible |
| Wrong quantity (small error) | 15% | Medium | ⚠️ Human review | 🟡 Low |
| Wrong quantity (large error) | 5% | High | ❌ No bounds check | 🔴 Medium |
| Unit mismatch | 40% | Critical | ❌ No validation | 🔴 High |
| Wrong supplier | 30% | Low | ⚠️ Partial | 🟢 Low |
| Parsing failure | 10% | Medium | ✅ Confidence | 🟢 Low |
| Missing items | 15% | Medium | ⚠️ Human review | 🟡 Medium |

---

### Worst-Case Scenario

**Chain of Failures**:
1. User uploads receipt with poor image quality
2. OCR misreads "2.5 kg" as "25 kg"
3. User doesn't notice error (reviewing quickly)
4. Unit is "kgs" but inventory expects "kg" (no validation)
5. System adds 25 to currentStock
6. Inventory now overstated by 22.5 kg
7. User discovers error days later
8. Cannot easily identify which receipt caused corruption
9. Must manually audit all recent receipts

**Probability**: 🟡 **LOW** (1-2% of uploads)

**Impact**: 🔴 **CRITICAL** (data corruption, loss of trust)

**Mitigation**: **MUST IMPLEMENT**
- Unit validation (blocks apply if mismatch)
- Quantity bounds checking (warns on outliers)
- Audit trail (links inventory changes to receipts)

---

## Prevention Strategies

### Layer 1: Technical Safeguards

**Already Implemented** ✅:
1. Duplicate detection (hash-based)
2. Transactional updates (all-or-nothing)
3. Audit trail (InventoryUpdate records)
4. Confidence scoring (per-field)

**Must Implement** ❌:
1. Unit normalization
2. Unit validation (exact match required)
3. Quantity bounds checking
4. Outlier warnings

---

### Layer 2: Human Review

**Already Implemented** ✅:
1. Review UI shows all extracted data
2. User can edit before applying
3. Confirmation modal before apply

**Must Implement** ❌:
1. Highlight low-confidence fields
2. Show before/after stock levels
3. Require explicit confirmation for warnings

---

### Layer 3: Error Recovery

**Already Implemented** ✅:
1. Audit trail links changes to receipts
2. Can view original receipt document

**Must Implement** ❌:
1. "Undo" function for recent applies
2. Inventory correction workflow
3. Anomaly detection alerts

---

## Safety Checklist

### Pre-Launch Requirements

#### 🔴 **CRITICAL (Must Have)**

- [ ] Unit normalization table implemented
- [ ] Unit validation (exact match) enforced
- [ ] Quantity bounds checking (0 < qty < 10,000)
- [ ] Duplicate detection tested
- [ ] Transactional updates verified
- [ ] Audit trail complete

#### 🟡 **HIGH (Should Have)**

- [ ] Outlier warnings (qty > 1000)
- [ ] Low-confidence field highlighting
- [ ] Before/after stock preview
- [ ] Line count validation
- [ ] Clear error messages

#### 🟢 **MEDIUM (Nice to Have)**

- [ ] Historical quantity comparison
- [ ] Price change alerts
- [ ] Total amount validation
- [ ] Supplier fuzzy matching

---

## Monitoring and Alerts

### Metrics to Track

**OCR Quality**:
- Extraction success rate (target: >90%)
- Average confidence score (target: >0.80)
- Extraction time (target: <15s)

**Data Quality**:
- Auto-match rate (target: >60%)
- Manual intervention rate (target: <40%)
- Unit mismatch rate (target: <10%)
- Quantity outlier rate (target: <5%)

**User Behavior**:
- Review time per receipt (target: <2 min)
- Apply rate (target: >80%)
- Skip rate (target: <20%)
- Re-upload rate (target: <10%)

---

### Alert Triggers

**Immediate Alerts** (Slack/Email):
- Extraction failure rate >20%
- Unit mismatch rate >30%
- Quantity outlier rate >10%
- User skip rate >40%

**Daily Digest**:
- Total receipts processed
- Average confidence score
- Top error types
- User feedback

---

## Rollback Plan

### If Data Corruption Detected

**Step 1: Pause OCR**
- Disable upload button
- Show maintenance message
- Prevent new receipts

**Step 2: Identify Scope**
- Query all receipts applied in last N days
- Check for anomalies (outlier quantities, unit mismatches)
- List affected inventory items

**Step 3: Rollback**
```sql
-- Identify corrupted updates
SELECT * FROM "InventoryUpdate"
WHERE reason LIKE 'Receipt upload:%'
  AND createdAt > '2024-01-01'
  AND quantity > 1000;  -- Outlier threshold

-- Reverse updates
UPDATE "InventoryItem"
SET "currentStock" = "currentStock" - [corrupted_quantity]
WHERE id IN (SELECT "inventoryItemId" FROM [corrupted_updates]);

-- Mark documents as REJECTED
UPDATE "ScannedDocument"
SET status = 'REJECTED', lifecycleState = 'REJECTED'
WHERE id IN (SELECT [corrupted_document_ids]);
```

**Step 4: Fix and Re-deploy**
- Implement missing validations
- Test thoroughly
- Re-enable OCR

**Step 5: Notify Users**
- Explain what happened
- Show corrected inventory
- Offer manual verification

---

## Testing Requirements

### Unit Tests

**Quantity Parsing**:
- Valid quantities (1, 5.5, 1000)
- Invalid quantities (0, -5, 10001)
- Edge cases (0.001, 9999.99)

**Unit Normalization**:
- Common aliases (kg, kgs, kilogram)
- Case variations (KG, Kg, kg)
- Whitespace handling (" kg ", "kg")

**Price Parsing**:
- US format (1,234.56)
- European format (1.234,56)
- Currency symbols (RWF 1234, $50)

---

### Integration Tests

**End-to-End Flow**:
1. Upload receipt
2. Wait for processing
3. Review extracted data
4. Apply to inventory
5. Verify stock updated
6. Verify audit trail created

**Error Scenarios**:
1. Duplicate upload → Returns existing
2. Unit mismatch → Blocks apply
3. Quantity outlier → Shows warning
4. Low confidence → Highlights field

---

### Manual Testing

**Real Receipts**:
- Test with 10 real supplier receipts
- Verify extraction accuracy
- Measure review time
- Check for edge cases

**User Acceptance**:
- Restaurant owner reviews workflow
- Identifies friction points
- Confirms value proposition

---

## Final Risk Assessment

### Overall Risk Level

**Before Mitigation**: 🔴 **HIGH**
- Unit validation missing
- Quantity bounds missing
- High corruption probability

**After V1 Mitigation**: 🟡 **MEDIUM**
- Unit validation implemented
- Quantity bounds implemented
- Human review required
- Audit trail complete

**After V1.1 Mitigation**: 🟢 **LOW**
- Outlier detection
- Historical comparison
- Anomaly alerts
- Undo function

---

### Recommendation

**Launch OCR in Pilot**: ✅ **YES** (with conditions)

**Conditions**:
1. ✅ Implement unit validation (CRITICAL)
2. ✅ Implement quantity bounds (CRITICAL)
3. ✅ Test with real receipts (CRITICAL)
4. ✅ Monitor closely for first 2 weeks
5. ✅ Have rollback plan ready

**Risk Level Post-Mitigation**: 🟡 **ACCEPTABLE**

**Confidence**: **HIGH** (85%)

---

**END OF REPORT**
