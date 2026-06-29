# OCR V1 Supplier Memory Design

Date: June 25, 2026
Owner: Document Intelligence Engineer
Status: READY FOR IMPLEMENTATION
Scope: Deterministic supplier recognition without ML

---

## Goals
- Recognize suppliers from receipts after first confirmation
- Deterministic, explainable logic (no ML dependency)
- Business-scoped memory (no cross-tenant leakage)

---

## Data Model
- Supplier (existing)
- SupplierAlias (existing)
  - Fields: id, supplierId, alias (unique per supplier), createdAt

---

## Matching Algorithm
1. Normalize candidate name
   - Lowercase
   - Trim whitespace
   - Collapse multiple spaces
   - Remove punctuation (.,-_/ etc.)

2. Exact match (fast path)
   - Compare normalized candidate with normalized supplier.name for business
   - If equal → confidence = 1.0

3. Alias match
   - Compare with normalized SupplierAlias.alias
   - If equal → confidence = 0.95

4. Fuzzy match (Levenshtein)
   - Compute similarity = 1 - (distance(a,b) / max(len(a), len(b)))
   - If similarity ≥ 0.90 → confidence = similarity (high)
   - Else if ≥ 0.85 → confidence = similarity (medium)
   - Else → no match

5. Tie-breaking
   - Prefer exact > alias > highest similarity

---

## Learning Strategy
- When user confirms supplier on review screen:
  - If extracted name ≠ canonical supplier.name and ≠ any existing alias
  - Create SupplierAlias { supplierId, alias: extractedName }
- Effect:
  - Future uploads auto-link supplierId for same alias

---

## Confidence Policy
- Auto-link if confidence ≥ 0.85
- Require user confirmation if 0.70 ≤ confidence < 0.85
- Treat as unknown if < 0.70

---

## API Hooks
- On intelligence completion:
  - Attempt supplier match and set `ScannedDocument.supplierId`
- On review save or apply:
  - If supplier edited/confirmed, call `learnSupplierAlias`

---

## Edge Cases
- Multiple suppliers with similar names
  - If two matches ≥ 0.85 within 0.05 of each other → require confirmation
- All-caps or abbreviations ("ABC LTD" vs "ABC Limited")
  - Normalization step handles most cases; learn alias once confirmed
- Missing header supplier name
  - Leave null; require manual selection

---

## Non-Goals (V1)
- Cross-business supplier graph or benchmarking
- ML-based entity resolution
- Automatic supplier creation
