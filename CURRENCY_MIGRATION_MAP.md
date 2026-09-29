# Currency System Migration Map

## Current State (Phase 0.6)

### Active Currency Systems
1. **currency-exchange.service.ts** (PRIMARY - DB-backed)
2. **utils/currency.ts** (DEPRECATED - static rates)
3. **services/currency.service.ts** (DEPRECATED - EBM only)
4. **services/currency-conversion.service.ts** (DEPRECATED - external API)

---

## Usage Categorization

### 🔴 PAYMENT-CRITICAL (DO NOT TOUCH)
**Status**: Already verified safe in Phase 0.5
- No payment APIs use deprecated currency systems
- No webhook handlers use currency formatting
- No ledger writers use currency conversion

**Files**: NONE (verified clean)

---

### 🟡 UI DISPLAY (Safe to migrate incrementally)

**Components using CurrencyDisplay**: 24 files
**Pages using formatCurrency directly**: 5 files

**Risk**: LOW - Display only, no financial logic
**Migration**: Can be done incrementally without breaking changes

---

### 🟠 EMAIL/NOTIFICATION TEMPLATES (Safe to migrate)

**Services using formatCurrency**: 6 files

**Risk**: LOW - Message formatting only
**Migration**: Can be done incrementally, test message output

---

### 🟢 ANALYTICS/REPORTING (Safe to migrate)

**Services**: 4 files

**Risk**: VERY LOW - Read-only reporting
**Migration**: Can be done anytime, verify report accuracy

---

### 🔵 ADMIN/BACKEND (Safe to migrate)

**EBM Integration**: 1 file (uses CurrencyService)

**Risk**: MEDIUM - EBM receipts must match exact format
**Migration**: Test EBM receipt format before deploying

---

## Migration Strategy

### Phase 1: Create Currency Facade (SAFE ABSTRACTION)
Route all new code to currency-exchange.service.ts without breaking old code

### Phase 2: Migrate UI Components (Incremental)
### Phase 3: Migrate Services (Incremental)
### Phase 4: Remove Legacy Systems (After full migration)

---

## Success Criteria

✅ No payment APIs use deprecated currency
✅ No ledger writes use currency conversion
✅ No webhook handlers use currency formatting
⏳ Currency facade routes to currency-exchange.service.ts
⏳ All new code uses facade only
