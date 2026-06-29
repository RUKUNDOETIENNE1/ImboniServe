# Broken Window Audit

**Date:** 2026-06-29
**Branch:** `release/v1.0.0-rc1`
**Author:** Senior Hospitality UX Reviewer
**Status:** AUDIT COMPLETE

---

## Overview

This audit identifies small inconsistencies that reduce user trust and professional appearance. Each item is ranked by severity and customer impact.

---

## Severity Levels

| Level | Description | Customer Impact |
|-------|-------------|-----------------|
| HIGH | Immediately noticeable, affects trust | Visible to all users |
| MEDIUM | Noticeable on extended use | Affects power users |
| LOW | Minor inconsistency | Minimal impact |

---

## Category 1: Native Alert/Confirm Usage

**Severity: HIGH**

Native browser dialogs look unprofessional and break the visual design.

### Files Using `alert()`

| File | Line(s) | Context |
|------|---------|---------|
| `qr-builder.tsx` | 133, 137, 150, 154, 255, 259, 298, 318, 470 | Delete, duplicate, save, download |
| `payment-settings.tsx` | 55, 70, 91, 94 | Load/save settings |
| `payout-summary.tsx` | 66 | Load failure |
| `stations.tsx` | 61, 78, 82, 112 | Create station |
| `my-referrals.tsx` | 83 | Phone validation |
| `optimization.tsx` | 104, 108 | Status update |
| `tablet-ordering.tsx` | 97 | Order placed |
| `tables/[id]/seats.tsx` | 80, 84, 88, 100, 104, 108, 125, 129, 143, 147, 160, 164 | Seat management |

### Files Using `confirm()`

| File | Line | Context |
|------|------|---------|
| `tables.tsx` | 71 | Delete table |
| `security.tsx` | 91 | Revoke all sessions |
| `qr-builder.tsx` | 126 | Delete design |
| `campaigns.tsx` | 76 | Send campaign |
| `cms/index.tsx` | 58 | Delete post |
| `die/review/[id].tsx` | 176 | Large quantity |
| `tables/[id]/seats.tsx` | 134 | Deactivate seat |

### Recommendation

Replace all `alert()` with `toast.success/error/info` or `showToast()`.
Replace `confirm()` with custom `ConfirmModal` component (already exists).

---

## Category 2: Page Title Inconsistencies

**Severity: MEDIUM**

Page titles use different font sizes across the platform.

### Pages Using `text-3xl font-bold`

| File | Expected | Actual |
|------|----------|--------|
| `reservations.tsx` | text-2xl | text-3xl |
| `inventory-alerts.tsx` | text-2xl | text-3xl |
| `payout-summary.tsx` | text-2xl | text-3xl |
| `payment-settings.tsx` | text-2xl | text-3xl |
| `staff-performance.tsx` | text-2xl | text-3xl |
| `crm.tsx` | text-2xl | text-3xl |
| `contacts.tsx` | text-2xl | text-3xl |
| `ab-testing.tsx` | text-2xl | text-3xl |
| `campaigns.tsx` | text-2xl | text-3xl |
| `currency-settings.tsx` | text-2xl | text-3xl |

### Recommendation

Standardize all page titles to `text-2xl font-bold text-slate-800`.

---

## Category 3: Toast System Inconsistency

**Severity: LOW**

Two different toast systems are used interchangeably.

### Pattern 1: `useToast` hook

```typescript
const { showToast } = useToast()
showToast('success', 'Message')
```

### Pattern 2: `react-hot-toast`

```typescript
import { toast } from 'react-hot-toast'
toast.success('Message')
```

### Files Using Mixed Patterns

| File | Pattern |
|------|---------|
| `inventory.tsx` | showToast |
| `reservations.tsx` | toast.success |
| `inventory-alerts.tsx` | toast.success |
| `security.tsx` | toast.success |
| `staff.tsx` | showToast |

### Recommendation

Standardize on one toast system across all pages.

---

## Category 4: Empty State Inconsistencies

**Severity: MEDIUM**

Some pages lack proper empty states or have inconsistent styling.

### Pages Missing Empty States

| Page | Current Behavior | Recommendation |
|------|------------------|----------------|
| QR Analytics (no data) | Shows zeros | Add "No scans yet" message |
| Menu Performance (no data) | Shows empty table | Add "No sales data" message |
| Peak Hours (no data) | Shows empty chart | Add "Insufficient data" message |

### Inconsistent Empty State Styling

| Page | Icon | Message | Description |
|------|------|---------|-------------|
| Orders | ShoppingCart | "No orders found" | Yes |
| Tables | Users | "No tables yet" | Yes |
| Inventory | Package | "No items" | No |
| Staff | Users | "No staff" | No |

### Recommendation

Standardize empty states to include: icon + title + description + action button.

---

## Category 5: Button Style Inconsistencies

**Severity: LOW**

Primary action buttons have slight variations.

### Variations Found

| Pattern | Files |
|---------|-------|
| `bg-imboni-blue text-white` | Most pages |
| `bg-gradient-to-r from-imboni-blue to-blue-600` | Dashboard, Settings |
| `bg-gradient-to-r from-imboni-green to-green-600` | Inventory, Reports |
| `bg-gradient-to-r from-imboni-orange to-orange-600` | Dashboard scan |

### Recommendation

Document button hierarchy:
- Primary: `bg-imboni-blue` (solid)
- Secondary: `bg-slate-100`
- Success: `bg-gradient-to-r from-imboni-green to-green-600`
- Danger: `bg-red-600`

---

## Category 6: Loading Indicator Inconsistencies

**Severity: LOW**

Different loading patterns used across pages.

### Patterns Found

| Pattern | Usage |
|---------|-------|
| `animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue` | Most pages |
| `animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue` | Some pages |
| `<RefreshCw className="animate-spin" />` | Refresh buttons |
| Skeleton (`animate-pulse`) | Dashboard, QR Analytics |

### Recommendation

Standardize on:
- Full page: `h-12 w-12` spinner
- Inline: `h-4 w-4` spinner
- Content: Skeleton loading

---

## Category 7: Date/Time Formatting Inconsistencies

**Severity: LOW**

Different date formatting approaches used.

### Patterns Found

| Pattern | Files |
|---------|-------|
| `formatDateTimeRW()` | orders/unified, transactions |
| `toLocaleDateString()` | payout-summary |
| `new Date().toLocaleTimeString()` | kitchen |
| Custom relative time | security |

### Recommendation

Use `formatDateTimeRW()` consistently for all date/time display.

---

## Category 8: Card Component Inconsistencies

**Severity: LOW**

Some pages use raw divs instead of Card component.

### Files Using Raw Divs

| File | Pattern |
|------|---------|
| `payout-summary.tsx` | Uses Card component properly |
| `payment-settings.tsx` | Uses Card component properly |
| `qr-builder.tsx` | Mix of Card and raw divs |

### Recommendation

Use `<Card>` component consistently for all card-like containers.

---

## Category 9: Icon Usage Inconsistencies

**Severity: LOW**

Some icons are used inconsistently for similar actions.

### Observations

| Action | Icons Used |
|--------|------------|
| Delete | Trash2, XCircle |
| Edit | Edit, Edit2, Pencil |
| Refresh | RefreshCw, RotateCcw |
| Add | Plus, PlusCircle |

### Recommendation

Standardize:
- Delete: `Trash2`
- Edit: `Edit`
- Refresh: `RefreshCw`
- Add: `Plus`

---

## Category 10: Hardcoded Strings

**Severity: MEDIUM**

Some strings are not internationalized.

### Examples Found

| File | String |
|------|--------|
| `transactions.tsx` | "Type" column header |
| `transactions.tsx` | "from yesterday" |
| `staff.tsx` | "Total Staff", "Active", "Owners", "Managers" |
| `payout-summary.tsx` | All strings |
| `payment-settings.tsx` | Most strings |

### Recommendation

Wrap all user-visible strings in `t()` function.

---

## Summary by Severity

| Severity | Count | Effort to Fix |
|----------|-------|---------------|
| HIGH | 1 category (41 instances) | 2-3 hours |
| MEDIUM | 4 categories | 3-4 hours |
| LOW | 5 categories | 2-3 hours |

**Total Estimated Effort: 7-10 hours**

---

## Priority Fix Order

1. **Replace native `alert()` calls** - Highest customer impact
2. **Standardize page titles** - Visual consistency
3. **Add missing empty states** - User experience
4. **Internationalize hardcoded strings** - Localization
5. **Standardize toast system** - Code quality
6. **Standardize button styles** - Design system
7. **Standardize loading indicators** - Visual consistency
8. **Standardize date formatting** - Data consistency
9. **Standardize Card usage** - Code quality
10. **Standardize icon usage** - Design system

---

## Conclusion

The broken windows identified are polish items that do not affect core functionality. Fixing these items would elevate the platform from "technically complete" to "professionally polished."

**Recommendation: Address HIGH severity items before production launch.**
