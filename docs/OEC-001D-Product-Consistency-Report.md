# OEC-001D Product Consistency Report

## Area 6: Consistency

---

## 1. Layout Patterns

### Layout Systems (4)

| Layout | Purpose | Sidebar | Mobile Menu | Content Area |
|--------|---------|---------|-------------|--------------|
| AdminLayout | Platform admin | Fixed (w-64/w-20) | Overlay | p-6 |
| DashboardLayout | Business operations | Fixed (w-64/w-20) | Overlay | p-6 |
| PortalLayout | Founder portal | Fixed | Overlay | transition-all |
| PublicLayout | Public pages | Top nav (no sidebar) | Hamburger | Standard |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Layout consistency | ✅ | Similar patterns across layouts |
| Sidebar pattern | ✅ | Consistent fixed sidebar |
| Mobile menu | ✅ | Consistent overlay pattern |
| Content area | ✅ | Consistent padding |

**Score: 8.0/10 — Strong**

---

## 2. Button Styles

### Shared Button Component
- **File**: `src/components/ui/button.tsx`
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default (h-10), sm (h-9), lg (h-11), icon (h-10 w-10)
- **Focus styles**: `focus-visible:ring-2 focus-visible:ring-blue-500`

### Inline Button Styles
- Many pages use inline button styles instead of the shared component
- Examples: portal/businesses.tsx, dashboard/qr-builder.tsx, AdminLayout.tsx

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Shared component exists | ✅ | Well-designed Button component |
| Consistent usage | ⚠️ | Not consistently used (UX-LOW-004) |
| Focus styles | ✅ | Present in shared component |

**Score: 6.0/10 — Moderate**

---

## 3. Table Styles

### Current State
- **No shared Table component**
- Tables implemented inline with similar but not identical patterns
- Common pattern: `overflow-x-auto` with `table w-full`
- Some have accessibility attributes (role, aria-label), others don't

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Shared Table component | ❌ | Not implemented (UX-MED-001) |
| Pattern consistency | ⚠️ | Similar but not identical |
| Accessibility | ⚠️ | Inconsistent ARIA attributes |

**Score: 5.0/10 — Needs Improvement**

---

## 4. Card Styles

### Shared Card Component
- **File**: `src/components/ui/Card.tsx`
- **Props**: shadow (none/sm/md/lg/xl), rounded (lg/xl/2xl), padding (4/6/8/12), border
- **Sub-components**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Styling**: bg-white, border-slate-200/60

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Shared Card component | ✅ | Well-designed with sub-components |
| Variant support | ✅ | Shadow, rounded, padding options |

**Score: 8.0/10 — Strong**

---

## 5. Form Styles

### Current State
- **No shared form component**
- Forms use consistent inline patterns
- Common input pattern: `w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-imboni-blue`
- Shared UI components: Switch (role="switch"), RadioGroup (role="radiogroup")
- Custom toggle switches in settings with sr-only

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Shared form component | ❌ | Not implemented |
| Pattern consistency | ✅ | Similar inline patterns |
| Accessible controls | ✅ | Switch, RadioGroup components |
| Label association | ✅ | htmlFor used consistently |

**Score: 6.5/10 — Good**

---

## 6. Dialog/Modal

### Current State
- **No shared Modal/Dialog component**
- Multiple modal implementations: ConfirmModal, BookDemoModal, FormModal, MenuItemDetailModal, SeatSelectionModal, TableManagementModal, TipSuggestionModal
- **Inconsistent accessibility**: Some lack role="dialog", aria-modal, focus trap, escape handling
- CookieConsentBanner has proper role="dialog" aria-modal="true"

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Shared Modal component | ❌ | Not implemented (UX-MED-002) |
| Accessibility | ⚠️ | Inconsistent across modals (UX-HIGH-003) |
| Focus trap | ⚠️ | Only chat widgets |

**Score: 4.0/10 — Needs Improvement**

---

## 7. Icons

### Current State
- **Icon library**: Lucide React (consistent throughout)
- **Usage**: 30+ files import from 'lucide-react'
- **Consistency**: Very good — same library everywhere
- **Decorative icons**: Properly hidden with aria-hidden

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Icon library | ✅ | Lucide React consistently |
| Decorative icon handling | ✅ | aria-hidden used |
| Visual consistency | ✅ | Same icon style throughout |

**Score: 9.5/10 — Excellent**

---

## 8. Terminology

### Current State
- **Inconsistent terminology**: "business" vs "restaurant" vs "venue"
  - AdminLayout: "Businesses" (href: '/admin/restaurants')
  - Executive components: "restaurant"
  - Portal components: "business"
  - Locales: Mix of "restaurant", "business", "venue"

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Terminology consistency | ⚠️ | Mixed usage (UX-LOW-001) |
| Hospitality terms | ✅ | Kitchen, table, menu, order consistent |
| Entity naming | ⚠️ | business/restaurant/venue mixed |

**Score: 6.0/10 — Moderate**

---

## 9. Design System

### Design Tokens (`src/styles/tokens.ts`)
- **Spacing**: xs (2px) to 4xl (24px)
- **Border Radius**: sm (rounded-lg) to full (rounded-full)
- **Shadows**: none to 2xl
- **Colors**: Full palette for primary, secondary, success, warning, error, neutral

### Theme
- **Dark mode**: Class-based strategy
- **Theme provider**: Custom `useTheme()` hook
- **Branding**: Imboni brand colors

### Typography
- **Font**: Inter, system-ui, sans-serif
- **Headings**: Consistent sizing

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Design tokens | ✅ | Comprehensive spacing, radius, shadow, color |
| Dark mode | ✅ | Class-based with toggle |
| Typography | ✅ | Inter font, consistent headings |
| Color palette | ✅ | Well-defined brand colors |

**Score: 8.5/10 — Strong**

---

## 10. Feedback Consistency

### Toast System (After OEC-001D Fix)
- **Shared Toast component**: `src/components/Toast.tsx` (20 files)
- **UI Toast component**: `src/components/ui/Toast.tsx` (6 files)
- **Globally available**: ToastProvider wraps app in _app.tsx
- **Consistent API**: `showToast(type, message)`

### Loading States
- **Skeleton**: LoadingSkeleton component with variants
- **Spinner**: Loader2 from lucide-react
- **Overlay**: Full-screen overlay for long operations
- **Button loading**: Disabled state with spinner

### Empty States
- **EmptyState component**: With icon, title, description, action
- **UI EmptyState**: Simpler version with onClick

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Toast consistency | ✅ | Fixed in OEC-001D — 0 alert() calls |
| Loading states | ✅ | Good variety |
| Empty states | ✅ | Well-designed with guidance |
| Error messages | ✅ | Inline error banners with retry |

**Score: 8.0/10 — Strong (Improved)**

---

## Overall Consistency Score: 7.0/10 — Good

**Strengths**: Layout consistency, Card component, Lucide icons, design tokens, dark mode, toast system (fixed)  
**Gaps**: No shared Table/Modal components, Button not consistently used, terminology inconsistency, modal accessibility inconsistent
