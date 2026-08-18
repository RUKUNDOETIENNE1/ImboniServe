# OEC-001D Navigation Experience Review

## Area 2: Navigation

---

## 1. Navigation Architecture

### Three Layout Systems

| Layout | Purpose | Navigation Items | Users |
|--------|---------|-----------------|-------|
| DashboardLayout | Business operations | 22+ items in 9 sections | Restaurant staff |
| AdminLayout | Platform administration | 25 items | Platform admins |
| PortalLayout | Founder partner portal | 11 items | Founder partners |
| PublicLayout | Public-facing pages | Top nav bar | Visitors, customers |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Layout consistency | ✅ | All layouts use similar sidebar/mobile patterns |
| Role-based filtering | ✅ | Each item has rolesAllowed array |
| Feature flag gating | ✅ | Beta features hidden until enabled |
| Mobile navigation | ✅ | Full hamburger menu with overlay |

**Score: 8.0/10 — Strong**

---

## 2. Navigation Hierarchy

### DashboardLayout Sections (9)
1. **Operations** (7 items): Dashboard, Orders, Kitchen, Tables, Reservations, Waiter, Service Replay
2. **Menu & Inventory** (6 items): Menu, AI Menu Builder, Inventory, Inventory Alerts, Auto-Reorder, OCR Documents
3. **QR & Digital** (2 items): QR Builder, QR Analytics
4. **Reports** (5 items): Reports, Close Day/Z-Report, Menu Performance, Peak Hours, Payment Analytics
5. **Team** (1 item): Staff
6. **Financial** (3 items): Transactions, Payout Summary, Payment Settings
7. **Growth** (3 items): Invite & Earn, Referral Leaderboard, Promotions
8. **Settings** (3 items): Settings, Profile, Security
9. **Admin** (6 items, admin-only): Payment Monitor, Payment Feedback, Support Inbox, Canned Replies, Feature Flags, Instruction Insights

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Logical grouping | ✅ | Grouped by functional area |
| Depth | ✅ | 2-3 levels maximum — no deep nesting |
| Clarity | ✅ | Flat structure, easy to scan |
| Role-based visibility | ✅ | Kitchen only for CHEF, KITCHEN_STAFF |

**Score: 8.0/10 — Strong**

---

## 3. Labels & Terminology

### Hospitality-Appropriate Labels
| Label | Industry Standard | Used |
|-------|-------------------|------|
| Kitchen | ✅ | Yes (not "Food Prep") |
| Tables | ✅ | Yes (not "Seating") |
| Reservations | ✅ | Yes (not "Bookings") |
| Menu | ✅ | Yes (not "Products") |
| Staff | ✅ | Yes (not "Employees") |
| Orders | ✅ | Yes (not "Transactions" in operations) |
| Close Day / Z-Report | ✅ | Yes (industry-standard term) |

### i18n Support
- All labels have i18n keys (e.g., `dashboard.nav.kitchen`)
- 3 languages: English, French, Kinyarwanda

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Hospitality terminology | ✅ | Excellent — industry-standard terms |
| i18n support | ✅ | 3 languages with translation keys |
| Label clarity | ✅ | Clear and concise |

**Score: 9.0/10 — Excellent**

---

## 4. Breadcrumbs

### Current State
- ❌ **Very limited breadcrumb implementation**
- Found only in `src/pages/admin/partnership-applications/[id].tsx` (simple "Back to Applications" button)
- No breadcrumb component library
- No systematic implementation

### Impact
- Users navigating to deep pages (Analytics sub-pages, detail views) rely on sidebar and browser back
- Not a Customer #1 Blocker — sidebar is always visible on desktop, mobile menu on mobile
- **Classification: Pre-Launch Improvement (UX-MED-004)**

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Breadcrumb component | ❌ | Not implemented |
| Systematic usage | ❌ | Only one instance found |
| Return paths | ✅ | Sidebar + browser back + mobile menu |

**Score: 5.0/10 — Needs Improvement**

---

## 5. Return Paths

### Available Return Methods
| Method | Desktop | Mobile |
|--------|---------|--------|
| Sidebar navigation | ✅ Always visible | ✅ Hamburger menu |
| Browser back button | ✅ | ✅ |
| "Back to home" links | ✅ Auth pages | ✅ Auth pages |
| Mobile menu close | N/A | ✅ X button + backdrop |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Always can return | ✅ | Multiple methods available |
| Clear return affordance | ✅ | Sidebar, back button, mobile menu |

**Score: 8.0/10 — Strong**

---

## 6. Mobile Navigation

### Implementation
- **Hamburger menu**: Menu icon in top header (DashboardLayout, AdminLayout, PortalLayout, PublicLayout)
- **Full-screen overlay**: Dark backdrop with slide-in sidebar (264px width)
- **Close button**: X icon to dismiss
- **Same navigation**: Sectioned navigation matching desktop
- **Install App CTA**: In mobile menu (DashboardLayout)
- **Logout button**: At bottom of mobile menu

### ARIA Attributes
- `aria-label` on hamburger button
- `aria-expanded` on mobile menu toggle (PublicLayout)
- Proper button semantics

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Hamburger menu | ✅ | All layouts |
| Overlay pattern | ✅ | Consistent across layouts |
| ARIA attributes | ✅ | Proper labeling |
| Same navigation | ✅ | No feature loss on mobile |

**Score: 8.5/10 — Strong**

---

## 7. Quick Actions

### TopbarQuickActions Component
- **File**: `src/components/layout/TopbarQuickActions.tsx`
- **Features**: Dark mode toggle, fullscreen, notifications, QR builder shortcut
- **Available**: In dashboard topbar

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Quick actions | ✅ | Dark mode, fullscreen, notifications |
| Shortcut to key features | ✅ | QR builder shortcut |

**Score: 7.5/10 — Good**

---

## Overall Navigation Score: 7.5/10 — Good

**Strengths**: Well-organized sidebar, role-based filtering, mobile menu, hospitality terminology, i18n support  
**Gaps**: Limited breadcrumbs, no guided tours, no contextual help
