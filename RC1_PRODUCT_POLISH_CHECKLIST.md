# RC1 Product Polish Checklist

**Date:** 2026-06-29
**Branch:** `release/v1.0.0-rc1`
**Author:** SaaS Usability Auditor
**Status:** CHECKLIST COMPLETE

---

## Overview

This checklist prioritizes all recommended polish tasks by customer impact and estimated effort.

---

## Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| P0 | Must fix before production | Immediate |
| P1 | Should fix before production | This week |
| P2 | Nice to have for production | Next sprint |
| P3 | Future improvement | Backlog |

---

## P0: Critical Polish (Must Fix)

### 1. Replace Native `alert()` Calls

**Impact:** High - Unprofessional appearance
**Effort:** 2-3 hours
**Files:** 13 files, 41 instances

| File | Action |
|------|--------|
| `qr-builder.tsx` | Replace 10 alerts with toast |
| `payment-settings.tsx` | Replace 4 alerts with toast |
| `payout-summary.tsx` | Replace 1 alert with toast |
| `stations.tsx` | Replace 4 alerts with toast |
| `my-referrals.tsx` | Replace 1 alert with toast |
| `optimization.tsx` | Replace 2 alerts with toast |
| `tablet-ordering.tsx` | Replace 1 alert with toast |
| `tables/[id]/seats.tsx` | Replace 12 alerts with toast |

**Implementation:**
```typescript
// Before
alert('Failed to save')

// After
import { toast } from 'react-hot-toast'
toast.error('Failed to save')
```

---

### 2. Replace Native `confirm()` Calls

**Impact:** Medium - Inconsistent UX
**Effort:** 1-2 hours
**Files:** 7 files, 8 instances

| File | Action |
|------|--------|
| `tables.tsx` | Use ConfirmModal |
| `security.tsx` | Use ConfirmModal |
| `qr-builder.tsx` | Use ConfirmModal |
| `campaigns.tsx` | Use ConfirmModal |
| `cms/index.tsx` | Use ConfirmModal |
| `die/review/[id].tsx` | Use ConfirmModal |
| `tables/[id]/seats.tsx` | Use ConfirmModal |

**Implementation:**
```typescript
// Before
if (!confirm('Delete this item?')) return

// After
const [showConfirm, setShowConfirm] = useState(false)
// ... render ConfirmModal component
```

---

## P1: High Priority Polish (Should Fix)

### 3. Standardize Page Title Sizes

**Impact:** Medium - Visual inconsistency
**Effort:** 30 minutes
**Files:** 10 files

| File | Change |
|------|--------|
| `reservations.tsx` | text-3xl → text-2xl |
| `inventory-alerts.tsx` | text-3xl → text-2xl |
| `payout-summary.tsx` | text-3xl → text-2xl |
| `payment-settings.tsx` | text-3xl → text-2xl |
| `staff-performance.tsx` | text-3xl → text-2xl |
| `crm.tsx` | text-3xl → text-2xl |
| `contacts.tsx` | text-3xl → text-2xl |
| `ab-testing.tsx` | text-3xl → text-2xl |
| `campaigns.tsx` | text-3xl → text-2xl |
| `currency-settings.tsx` | text-3xl → text-2xl |

---

### 4. Internationalize Hardcoded Strings

**Impact:** Medium - Localization gaps
**Effort:** 2-3 hours
**Files:** Multiple

| File | Strings to Wrap |
|------|-----------------|
| `transactions.tsx` | "Type", "from yesterday" |
| `staff.tsx` | "Total Staff", "Active", "Owners", "Managers" |
| `payout-summary.tsx` | All visible strings |
| `payment-settings.tsx` | Most visible strings |

**Implementation:**
```typescript
// Before
<th>Type</th>

// After
<th>{t('transactions.type', 'Type')}</th>
```

---

### 5. Add Missing Empty States

**Impact:** Medium - User confusion
**Effort:** 1-2 hours
**Files:** 3 files

| Page | Empty State Needed |
|------|-------------------|
| QR Analytics | "No scans recorded yet" |
| Menu Performance | "No sales data available" |
| Peak Hours | "Insufficient data for analysis" |

**Implementation:**
```typescript
{data.length === 0 ? (
  <div className="text-center py-12">
    <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
    <p className="text-slate-600 font-medium">No data yet</p>
    <p className="text-sm text-slate-400 mt-1">Data will appear here once available</p>
  </div>
) : (
  // ... render data
)}
```

---

## P2: Medium Priority Polish (Nice to Have)

### 6. Standardize Toast System

**Impact:** Low - Code consistency
**Effort:** 1-2 hours
**Files:** Multiple

**Decision:** Standardize on `react-hot-toast`

| Pattern | Action |
|---------|--------|
| `showToast('success', msg)` | Convert to `toast.success(msg)` |
| `showToast('error', msg)` | Convert to `toast.error(msg)` |
| `showToast('info', msg)` | Convert to `toast(msg)` |

---

### 7. Standardize Loading Indicators

**Impact:** Low - Visual consistency
**Effort:** 30 minutes
**Files:** Multiple

**Standard:**
- Full page: `h-12 w-12` spinner
- Inline: `h-4 w-4` spinner
- Content: Skeleton loading

---

### 8. Standardize Date Formatting

**Impact:** Low - Data consistency
**Effort:** 1 hour
**Files:** Multiple

**Standard:** Use `formatDateTimeRW()` for all dates

---

### 9. Standardize Button Styles

**Impact:** Low - Design system
**Effort:** 30 minutes

**Document:**
- Primary: `bg-imboni-blue text-white`
- Secondary: `bg-slate-100 text-slate-700`
- Success: `bg-gradient-to-r from-imboni-green to-green-600`
- Danger: `bg-red-600 text-white`

---

### 10. Standardize Icon Usage

**Impact:** Low - Design system
**Effort:** 30 minutes

**Standard:**
- Delete: `Trash2`
- Edit: `Edit`
- Refresh: `RefreshCw`
- Add: `Plus`
- Close: `X`

---

## P3: Future Improvements (Backlog)

### 11. Role-Specific Navigation

**Impact:** Medium - UX improvement
**Effort:** 4-6 hours

Simplify navigation for:
- Cashier (order-focused)
- Waiter (table-focused)
- Kitchen (kitchen-focused)

---

### 12. Role-Specific Dashboards

**Impact:** Medium - UX improvement
**Effort:** 8-12 hours

Create dashboards for:
- Manager (team metrics)
- Admin (platform metrics)
- Kitchen (order queue)

---

### 13. PDF Export Implementation

**Impact:** Medium - Feature completion
**Effort:** 4-6 hours

Implement PDF export for:
- Daily reports
- Weekly reports
- Monthly reports

---

### 14. Accessibility Improvements

**Impact:** Medium - Compliance
**Effort:** 8-12 hours

- Full keyboard navigation
- Screen reader optimization
- ARIA labels
- Focus management

---

## Effort Summary

| Priority | Items | Total Effort |
|----------|-------|--------------|
| P0 | 2 | 3-5 hours |
| P1 | 3 | 4-6 hours |
| P2 | 5 | 3-5 hours |
| P3 | 4 | 24-36 hours |

**Total for Production-Ready:** 10-16 hours (P0 + P1)

---

## Implementation Order

### Phase 1: Pre-Production (P0)

1. Replace all `alert()` calls (2-3 hours)
2. Replace all `confirm()` calls (1-2 hours)

### Phase 2: Production Polish (P1)

3. Standardize page titles (30 min)
4. Internationalize strings (2-3 hours)
5. Add empty states (1-2 hours)

### Phase 3: Post-Production (P2)

6. Standardize toast system (1-2 hours)
7. Standardize loading indicators (30 min)
8. Standardize date formatting (1 hour)
9. Document button styles (30 min)
10. Document icon usage (30 min)

### Phase 4: Future (P3)

11. Role-specific navigation
12. Role-specific dashboards
13. PDF export
14. Accessibility

---

## Verification Checklist

After implementing P0 and P1:

- [ ] No native `alert()` calls in V1 pages
- [ ] No native `confirm()` calls in V1 pages
- [ ] All page titles use `text-2xl font-bold`
- [ ] All user-visible strings internationalized
- [ ] All pages have proper empty states
- [ ] Build passes
- [ ] Tests pass

---

## Conclusion

The platform requires 10-16 hours of polish work to reach production-ready status. The most impactful changes are replacing native browser dialogs with toast notifications and modal confirmations.

**Recommendation:** Complete P0 items before any customer demos or production deployment.
