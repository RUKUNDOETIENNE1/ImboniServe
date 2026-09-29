# Navigation Execution Plan

**Date:** 2026-06-29
**Author:** UX Simplification Lead
**Status:** EXECUTION SPECIFICATION (NOT IMPLEMENTED)

---

## Purpose

This document specifies exactly how the Version 1 navigation will be transformed from 54 items to 22 items, organized into 7 logical sections.

---

## Current State

### Current Navigation Structure (54 items)

```
Dashboard
Unified Orders
Sales
Kitchen
Tables & Seats
Inventory
Analytics
QR Analytics
Menu Performance
Peak Hours
Instruction Insights
[Payments Section]
Payment Analytics
Payment Monitor
Payment Feedback
AI Insights
Optimization Hub
Menu Builder
QR Builder
Site Builder
Templates
Content (CMS)
Video Analytics
Reports
Customer CRM
Contacts
Staff
Staff Performance
Reservations
Inventory Alerts
A/B Testing
Campaigns
Currency Settings
Branches
Outlets
My Referrals
Referrals
Invite & Earn
Loyalty
Promotions
Hotel
Smart Dining Slips
Transactions
Payout Summary
Payment Settings
Discovery Profile
Notifications
Support Inbox
Canned Replies
Security
Feature Flags
Settings
```

### Problems with Current Structure

1. **No logical grouping** - Items appear in arbitrary order
2. **Too many items** - 54 items overwhelm new users
3. **Duplicate functionality** - Sales vs Orders, Kitchen vs KDS
4. **Incomplete features visible** - Staff Performance, Recipe Management
5. **Advanced features prominent** - A/B Testing, Campaigns visible to all
6. **Internal tools exposed** - CEO/CFO dashboards, Support Inbox

---

## Target State

### V1 Navigation Structure (22 items, 7 sections)

```
OPERATIONS (5 items)
├── Dashboard
├── Orders
├── Kitchen
├── Tables
└── Reservations

MENU & INVENTORY (4 items)
├── Menu
├── Inventory
├── Inventory Alerts
└── OCR Documents

QR & DIGITAL (2 items)
├── QR Builder
└── QR Analytics

REPORTS (4 items)
├── Reports
├── Menu Performance
├── Peak Hours
└── Payment Analytics

TEAM (1 item)
└── Staff

FINANCIAL (3 items)
├── Transactions
├── Payout Summary
└── Payment Settings

SETTINGS (3 items)
├── Settings
├── Profile
└── Security
```

---

## Transformation Specification

### Step 1: Define Section Configuration

**File:** `src/components/DashboardLayout.tsx`
**Location:** After imports, before component

```typescript
// V1 Navigation Sections
const V1_SECTIONS = {
  OPERATIONS: { 
    name: 'Operations', 
    order: 1,
    icon: LayoutDashboard,
    description: 'Core restaurant operations'
  },
  MENU_INVENTORY: { 
    name: 'Menu & Inventory', 
    order: 2,
    icon: Package,
    description: 'Menu and stock management'
  },
  QR_DIGITAL: { 
    name: 'QR & Digital', 
    order: 3,
    icon: QrCode,
    description: 'Digital ordering and QR codes'
  },
  REPORTS: { 
    name: 'Reports', 
    order: 4,
    icon: TrendingUp,
    description: 'Business analytics and reports'
  },
  TEAM: { 
    name: 'Team', 
    order: 5,
    icon: Users,
    description: 'Staff management'
  },
  FINANCIAL: { 
    name: 'Financial', 
    order: 6,
    icon: DollarSign,
    description: 'Payments and transactions'
  },
  SETTINGS: { 
    name: 'Settings', 
    order: 7,
    icon: Settings,
    description: 'Configuration and preferences'
  },
} as const
```

### Step 2: Update Navigation Array

**File:** `src/components/DashboardLayout.tsx`
**Location:** Replace existing `navigation` array

```typescript
const navigation = [
  // OPERATIONS
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    i18nKey: 'dashboard.nav.dashboard',
    v1Visible: true,
    v1Section: 'OPERATIONS',
    v1Order: 1
  },
  { 
    name: 'Orders', 
    href: '/dashboard/orders/unified', 
    icon: ShoppingCart, 
    i18nKey: 'dashboard.nav.orders',
    v1Visible: true,
    v1Section: 'OPERATIONS',
    v1Order: 2
  },
  { 
    name: 'Kitchen', 
    href: '/dashboard/kitchen', 
    icon: UtensilsCrossed, 
    i18nKey: 'dashboard.nav.kitchen',
    v1Visible: true,
    v1Section: 'OPERATIONS',
    v1Order: 3
  },
  { 
    name: 'Tables', 
    href: '/dashboard/tables', 
    icon: Home, 
    i18nKey: 'dashboard.nav.tables',
    v1Visible: true,
    v1Section: 'OPERATIONS',
    v1Order: 4
  },
  { 
    name: 'Reservations', 
    href: '/dashboard/reservations', 
    icon: Calendar, 
    i18nKey: 'dashboard.nav.reservations',
    v1Visible: true,
    v1Section: 'OPERATIONS',
    v1Order: 5
  },

  // MENU & INVENTORY
  { 
    name: 'Menu', 
    href: '/dashboard/menu', 
    icon: Flag, 
    i18nKey: 'dashboard.nav.menu',
    v1Visible: true,
    v1Section: 'MENU_INVENTORY',
    v1Order: 1
  },
  { 
    name: 'Inventory', 
    href: '/dashboard/inventory', 
    icon: Package, 
    i18nKey: 'dashboard.nav.inventory',
    v1Visible: true,
    v1Section: 'MENU_INVENTORY',
    v1Order: 2
  },
  { 
    name: 'Inventory Alerts', 
    href: '/dashboard/inventory-alerts', 
    icon: Bell, 
    i18nKey: 'dashboard.nav.inventoryAlerts',
    v1Visible: true,
    v1Section: 'MENU_INVENTORY',
    v1Order: 3
  },
  { 
    name: 'OCR Documents', 
    href: '/dashboard/die', 
    icon: FileText, 
    i18nKey: 'dashboard.nav.ocrDocuments',
    v1Visible: true,
    v1Section: 'MENU_INVENTORY',
    v1Order: 4
  },

  // QR & DIGITAL
  { 
    name: 'QR Builder', 
    href: '/dashboard/qr-builder', 
    icon: QrCode, 
    i18nKey: 'dashboard.nav.qrBuilder',
    v1Visible: true,
    v1Section: 'QR_DIGITAL',
    v1Order: 1
  },
  { 
    name: 'QR Analytics', 
    href: '/dashboard/qr-analytics', 
    icon: QrCode, 
    i18nKey: 'dashboard.nav.qrAnalytics',
    v1Visible: true,
    v1Section: 'QR_DIGITAL',
    v1Order: 2
  },

  // REPORTS
  { 
    name: 'Reports', 
    href: '/dashboard/reports', 
    icon: TrendingUp, 
    i18nKey: 'dashboard.nav.reports',
    v1Visible: true,
    v1Section: 'REPORTS',
    v1Order: 1
  },
  { 
    name: 'Menu Performance', 
    href: '/dashboard/analytics/menu-performance', 
    icon: UtensilsCrossed, 
    i18nKey: 'dashboard.nav.menuPerformance',
    v1Visible: true,
    v1Section: 'REPORTS',
    v1Order: 2
  },
  { 
    name: 'Peak Hours', 
    href: '/dashboard/analytics/peak-hours', 
    icon: Clock, 
    i18nKey: 'dashboard.nav.peakHours',
    v1Visible: true,
    v1Section: 'REPORTS',
    v1Order: 3
  },
  { 
    name: 'Payment Analytics', 
    href: '/dashboard/analytics/payments', 
    icon: DollarSign, 
    i18nKey: 'dashboard.nav.paymentAnalytics',
    v1Visible: true,
    v1Section: 'REPORTS',
    v1Order: 4
  },

  // TEAM
  { 
    name: 'Staff', 
    href: '/dashboard/staff', 
    icon: Users, 
    i18nKey: 'dashboard.nav.staff',
    v1Visible: true,
    v1Section: 'TEAM',
    v1Order: 1
  },

  // FINANCIAL
  { 
    name: 'Transactions', 
    href: '/dashboard/transactions', 
    icon: FileText, 
    i18nKey: 'dashboard.nav.transactions',
    v1Visible: true,
    v1Section: 'FINANCIAL',
    v1Order: 1
  },
  { 
    name: 'Payout Summary', 
    href: '/dashboard/payout-summary', 
    icon: DollarSign, 
    i18nKey: 'dashboard.nav.payoutSummary',
    v1Visible: true,
    v1Section: 'FINANCIAL',
    v1Order: 2
  },
  { 
    name: 'Payment Settings', 
    href: '/dashboard/payment-settings', 
    icon: CreditCard, 
    i18nKey: 'dashboard.nav.paymentSettings',
    v1Visible: true,
    v1Section: 'FINANCIAL',
    v1Order: 3
  },

  // SETTINGS
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings, 
    i18nKey: 'dashboard.nav.settings',
    v1Visible: true,
    v1Section: 'SETTINGS',
    v1Order: 1
  },
  { 
    name: 'Profile', 
    href: '/dashboard/profile', 
    icon: Globe, 
    i18nKey: 'dashboard.nav.profile',
    v1Visible: true,
    v1Section: 'SETTINGS',
    v1Order: 2
  },
  { 
    name: 'Security', 
    href: '/dashboard/security', 
    icon: ShieldCheck, 
    i18nKey: 'dashboard.nav.security',
    v1Visible: true,
    v1Section: 'SETTINGS',
    v1Order: 3
  },

  // ADMIN ONLY (not v1Visible, but v1AdminOnly)
  { 
    name: 'Payment Monitor', 
    href: '/dashboard/payments/monitor', 
    icon: CreditCard, 
    i18nKey: 'dashboard.nav.paymentMonitor',
    v1AdminOnly: true
  },
  { 
    name: 'Payment Feedback', 
    href: '/dashboard/feedback/payments', 
    icon: MessageSquare, 
    i18nKey: 'dashboard.nav.paymentFeedback',
    v1AdminOnly: true
  },
  { 
    name: 'Support Inbox', 
    href: '/dashboard/support/inbox', 
    icon: MessageSquare, 
    i18nKey: 'dashboard.nav.supportInbox',
    v1AdminOnly: true
  },
  { 
    name: 'Canned Replies', 
    href: '/dashboard/support/canned-replies', 
    icon: MessageSquare, 
    i18nKey: 'dashboard.nav.cannedReplies',
    v1AdminOnly: true
  },
  { 
    name: 'Feature Flags', 
    href: '/dashboard/admin/feature-flags', 
    icon: Flag, 
    i18nKey: 'dashboard.nav.featureFlags',
    adminOnly: true,
    v1AdminOnly: true
  },
  { 
    name: 'Instruction Insights', 
    href: '/dashboard/analytics/instruction-insights', 
    icon: Sparkles, 
    i18nKey: 'dashboard.nav.instructionInsights',
    v1AdminOnly: true
  },

  // FEATURE FLAGGED (not v1Visible, controlled by featureFlag)
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart2, 
    i18nKey: 'dashboard.nav.analytics',
    featureFlag: 'advanced_analytics'
  },
  { 
    name: 'Menu Builder', 
    href: '/dashboard/menu-builder', 
    icon: Flag, 
    i18nKey: 'dashboard.nav.menuBuilder',
    featureFlag: 'ai_menu_builder'
  },
  { 
    name: 'Loyalty', 
    href: '/dashboard/loyalty', 
    icon: Gift, 
    i18nKey: 'dashboard.nav.loyalty',
    featureFlag: 'loyalty_system'
  },
  { 
    name: 'Promotions', 
    href: '/dashboard/promotions', 
    icon: Tag, 
    i18nKey: 'dashboard.nav.promotions',
    featureFlag: 'promotions_engine'
  },
  { 
    name: 'Hotel', 
    href: '/dashboard/hotel', 
    icon: Hotel, 
    i18nKey: 'dashboard.nav.hotel',
    featureFlag: 'hotel_mode'
  },
  { 
    name: 'Branches', 
    href: '/dashboard/branches', 
    icon: MapPin, 
    i18nKey: 'dashboard.nav.branches',
    featureFlag: 'multi_branch'
  },
  { 
    name: 'Outlets', 
    href: '/dashboard/outlets', 
    icon: Store, 
    i18nKey: 'dashboard.nav.outlets',
    featureFlag: 'multi_branch'
  },
  { 
    name: 'CRM', 
    href: '/dashboard/crm', 
    icon: Users, 
    i18nKey: 'dashboard.nav.crm',
    featureFlag: 'crm_v1'
  },
  { 
    name: 'Contacts', 
    href: '/dashboard/contacts', 
    icon: UserCircle, 
    i18nKey: 'dashboard.nav.contacts',
    featureFlag: 'crm_v1'
  },
  { 
    name: 'CMS', 
    href: '/dashboard/cms', 
    icon: FileText, 
    i18nKey: 'dashboard.nav.cms',
    featureFlag: 'cms_v1'
  },
  { 
    name: 'Video Analytics', 
    href: '/dashboard/video-analytics', 
    icon: Video, 
    i18nKey: 'dashboard.nav.videoAnalytics',
    featureFlag: 'cms_v1'
  },
  { 
    name: 'AI Insights', 
    href: '/dashboard/ai', 
    icon: Sparkles, 
    i18nKey: 'dashboard.nav.aiInsights',
    featureFlag: 'ai_insights_v1'
  },
  { 
    name: 'Optimization Hub', 
    href: '/dashboard/optimization', 
    icon: Sparkles, 
    i18nKey: 'dashboard.nav.optimization',
    featureFlag: 'ai_insights_v1'
  },

  // REMOVED FROM NAV (no v1Visible, no featureFlag - just not shown)
  { name: 'Sales', href: '/dashboard/sales', icon: Receipt, i18nKey: 'dashboard.nav.sales' },
  { name: 'Staff Performance', href: '/dashboard/staff-performance', icon: TrendingUp, i18nKey: 'dashboard.nav.staffPerformance' },
  { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: Sparkles, i18nKey: 'dashboard.nav.abTesting' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: MessageSquare, i18nKey: 'dashboard.nav.campaigns' },
  { name: 'Currency Settings', href: '/dashboard/currency-settings', icon: DollarSign, i18nKey: 'dashboard.nav.currencySettings' },
  { name: 'My Referrals', href: '/dashboard/my-referrals', icon: Gift, i18nKey: 'dashboard.nav.myReferrals' },
  { name: 'Referrals', href: '/dashboard/referrals', icon: Trophy, i18nKey: 'dashboard.nav.referrals' },
  { name: 'Invite & Earn', href: '/dashboard/invite', icon: UserPlus, i18nKey: 'dashboard.nav.invite' },
  { name: 'Smart Dining Slips', href: '/dashboard/smart-dining-slips', icon: Receipt, i18nKey: 'dashboard.nav.smartDiningSlips' },
  { name: 'Site Builder', href: '/dashboard/site-builder', icon: Palette, i18nKey: 'dashboard.nav.siteBuilder' },
  { name: 'Templates', href: '/dashboard/templates', icon: Flag, i18nKey: 'dashboard.nav.templates' },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, i18nKey: 'dashboard.nav.notifications' },
]
```

### Step 3: Add Navigation Filter Function

**File:** `src/components/DashboardLayout.tsx`
**Location:** After navigation array, before component

```typescript
// V1 Navigation Filter
function getV1Navigation(
  items: typeof navigation,
  isAdmin: boolean,
  isDeveloper: boolean,
  enabledFlags: string[]
) {
  return items
    .filter(item => {
      // V1 Visible items always show
      if ((item as any).v1Visible) return true
      
      // Admin-only items show for admins
      if ((item as any).v1AdminOnly && isAdmin) return true
      
      // Developer-only items show in dev mode
      if ((item as any).v1DeveloperOnly && isDeveloper) return true
      
      // Feature-flagged items show if flag is enabled
      if ((item as any).featureFlag && enabledFlags.includes((item as any).featureFlag)) {
        return true
      }
      
      // Everything else is hidden
      return false
    })
    .sort((a, b) => {
      // Sort by section order, then by item order within section
      const sectionA = V1_SECTIONS[(a as any).v1Section as keyof typeof V1_SECTIONS]?.order || 99
      const sectionB = V1_SECTIONS[(b as any).v1Section as keyof typeof V1_SECTIONS]?.order || 99
      
      if (sectionA !== sectionB) return sectionA - sectionB
      
      return ((a as any).v1Order || 99) - ((b as any).v1Order || 99)
    })
}

// Group navigation by section
function groupBySection(items: typeof navigation) {
  const groups: Record<string, typeof navigation> = {}
  
  items.forEach(item => {
    const section = (item as any).v1Section || 'OTHER'
    if (!groups[section]) groups[section] = []
    groups[section].push(item)
  })
  
  return groups
}
```

### Step 4: Update Render Logic

**File:** `src/components/DashboardLayout.tsx`
**Location:** Replace sidebar navigation render

```tsx
// Inside component, after hooks
const enabledFlags = useFeatureFlags()
const isDeveloper = process.env.NODE_ENV === 'development'

// Get filtered and grouped navigation
const v1Nav = getV1Navigation(navigation, isAdmin, isDeveloper, enabledFlags)
const groupedNav = groupBySection(v1Nav)

// In render, replace flat navigation with sectioned navigation
<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
  {Object.entries(V1_SECTIONS).map(([sectionKey, sectionConfig]) => {
    const sectionItems = groupedNav[sectionKey]
    if (!sectionItems || sectionItems.length === 0) return null
    
    return (
      <div key={sectionKey} className="mb-6">
        {/* Section Header */}
        {sidebarOpen && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {sectionConfig.name}
          </h3>
        )}
        
        {/* Section Items */}
        {sectionItems.map(item => {
          const Icon = (item as any).icon
          const active = isActive((item as any).href)
          
          return (
            <Link
              key={(item as any).href}
              href={(item as any).href}
              className={/* existing classes */}
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span>{(item as any).name}</span>}
            </Link>
          )
        })}
      </div>
    )
  })}
  
  {/* Admin Section (if admin) */}
  {isAdmin && groupedNav['OTHER'] && (
    <div className="mb-6">
      {sidebarOpen && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
          Admin
        </h3>
      )}
      {groupedNav['OTHER'].map(item => (
        // Render admin items
      ))}
    </div>
  )}
</nav>
```

---

## Naming Changes

| Current Name | V1 Name | Rationale |
|--------------|---------|-----------|
| Unified Orders | Orders | Simpler |
| Tables & Seats | Tables | Simpler |
| Discovery Profile | Profile | Simpler |
| Content (CMS) | CMS | Simpler |
| Customer CRM | CRM | Simpler |

---

## i18n Updates Required

**File:** `src/lib/i18n/locales/en.json`

```json
{
  "dashboard": {
    "nav": {
      "orders": "Orders",
      "tables": "Tables",
      "profile": "Profile",
      "ocrDocuments": "OCR Documents"
    }
  }
}
```

---

## Mobile Navigation

The same filter logic applies to mobile navigation. Update the mobile menu render to use `v1Nav` and `groupedNav`.

---

## Collapsed Sidebar

When sidebar is collapsed:
- Section headers are hidden
- Only icons are shown
- Tooltip shows item name on hover

---

## Breadcrumb Impact

Breadcrumbs are generated from route, not navigation. No changes needed.

---

## Deep Link Preservation

All routes remain accessible via direct URL:
- `/dashboard/sales` - Still works
- `/dashboard/staff-performance` - Still works
- `/dashboard/campaigns` - Still works

Users can bookmark and share links. Only navigation visibility changes.

---

## Rollback Procedure

### Immediate Rollback (< 1 minute)

Change the filter function to return all items:

```typescript
function getV1Navigation(items, isAdmin, isDeveloper, enabledFlags) {
  // ROLLBACK: Return all items
  return items.filter(item => !(item as any).section)
}
```

### Full Rollback (< 5 minutes)

1. `git checkout HEAD~1 -- src/components/DashboardLayout.tsx`
2. Deploy

---

## Verification Checklist

After implementation:

- [ ] Restaurant owner sees 22 items
- [ ] Restaurant owner sees 7 sections
- [ ] Admin sees additional admin items
- [ ] Feature-flagged items hidden when flag disabled
- [ ] Feature-flagged items visible when flag enabled
- [ ] Mobile navigation matches desktop
- [ ] Collapsed sidebar shows icons only
- [ ] All routes accessible via direct URL
- [ ] No console errors
- [ ] No TypeScript errors

---

**HARD STOP: This is the execution plan. No code changes have been made.**
