# COMMERCIAL_CAPABILITY_MATRIX

**Document:** Business Capability Coverage (Customer View)  
**Date:** 2026-07-04  
**Purpose:** Track Commercial Truth from customer capability perspective  
**Status:** 🔄 Live (Updated Continuously)

---

## EXECUTIVE DASHBOARD

**Last Updated:** 2026-07-05 08:30 UTC

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Business Domains** | 4 / 19 | 19 | 🔄 In Progress |
| **Business Capabilities** | 15 / 92 | 92 | 🔄 In Progress |
| **Commercial Endpoints** | 20 / 103 | 103 | 🔄 In Progress |
| **Capability Coverage** | 16.3% | 100% | 🔄 In Progress |
| **Endpoint Coverage** | 19.4% | 100% | 🔄 In Progress |
| **Constitution Compliance** | ✅ PASS | PASS | ✅ Pass |
| **Commercial Truth** | ✅ Maintained | Maintained | ✅ Pass |

---

## CAPABILITY COVERAGE BY DOMAIN

### DOMAIN 1: ORDERS (0/8 Capabilities)

**Constitutional Authority:** Section 6.2 (Starter - Core Operations)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Create Order | Customer can place orders | STARTER | `/api/orders` (POST) | ❌ | ⏳ | ❌ |
| View Orders | Customer can view order history | STARTER | `/api/orders` (GET) | ❌ | ⏳ | ❌ |
| Update Order | Customer can modify orders | STARTER | `/api/orders/[id]` (PUT) | ❌ | ⏳ | ❌ |
| Cancel Order | Customer can cancel orders | STARTER | `/api/orders/[id]/cancel` | ❌ | ⏳ | ❌ |
| Refund Order | Customer can request refunds | STARTER | `/api/orders/[id]/refund` | ❌ | ⏳ | ❌ |
| Order Analytics | Customer can view order stats | STARTER | `/api/orders/stats`, `/api/orders/analytics` | ❌ | ⏳ | ❌ |
| Export Orders | Customer can export order data | STARTER | `/api/orders/export` | ❌ | ⏳ | ❌ |
| Print Orders | Customer can print orders | STARTER | `/api/orders/print` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/8 (0%)

---

### DOMAIN 2: KITCHEN OPERATIONS (0/5 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Kitchen Tickets)
- Section 6.4 (Business - KDS)
- Section 6.5 (Premium - KDS Advanced, Prep Plans, Forecasting)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Kitchen Tickets | Basic kitchen order management | STARTER | `/api/kitchen/tickets` | ❌ | ⏳ | ❌ |
| Kitchen Display System | Real-time kitchen display | BUSINESS | `/api/kitchen/kds` | ❌ | ⏳ | ❌ |
| KDS Advanced | Advanced kitchen workflow | PREMIUM | `/api/kitchen/kds/advanced` | ❌ | ⏳ | ❌ |
| Prep Plans | Kitchen preparation planning | PREMIUM | `/api/kitchen/prep-plans` | ❌ | ⏳ | ❌ |
| Forecasting | Demand forecasting | PREMIUM | `/api/kitchen/forecasting` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/5 (0%)

---

### DOMAIN 3: TABLES (1/1 Capabilities) ✅

**Constitutional Authority:** Section 6.2 (Starter - Tables)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Table Management | Create and manage tables | STARTER | `/api/tables`, `/api/tables/list`, `/api/tables/lookup`, `/api/tables/[id]`, `/api/tables/[id]/seats` | ✅ | ✅ | ✅ |

**Domain Status:** ✅ CERTIFIED  
**Capability Coverage:** 1/1 (100%)

**Note:** This domain represents production capabilities only. Future capabilities (Table Status, Table Layout, Table Merging) are not yet implemented and are excluded from coverage metrics per Engineering Rule: Production-First Certification.

---

### DOMAIN 4: RESERVATIONS (5/5 Capabilities) ✅

**Constitutional Authority:** Section 6.3 (Professional - Reservations)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Create Reservation | Customer can book tables | PROFESSIONAL | `/api/reservations` (POST) | ✅ | ✅ | ✅ |
| View Reservations | Customer can view bookings | PROFESSIONAL | `/api/reservations` (GET) | ✅ | ✅ | ✅ |
| Edit Reservation | Customer can modify bookings | PROFESSIONAL | `/api/reservations/[id]` | ✅ | ✅ | ✅ |
| Cancel Reservation | Customer can cancel bookings | PROFESSIONAL | `/api/reservations/[id]/cancel` | ✅ | ✅ | ✅ |
| Reservation Deposits | Customer can pay deposits | PROFESSIONAL | `/api/reservations/[id]/deposit/initiate` | ✅ | ✅ | ✅ |

**Domain Status:** ✅ CERTIFIED  
**Capability Coverage:** 5/5 (100%)

---

### DOMAIN 5: MENU MANAGEMENT (0/7 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Menu)
- Section 6.3 (Professional - Menu Performance, AI Menu Builder)
- Section 6.4 (Business - Menu Performance by Branch)
- Section 6.5 (Premium - Recipe Management)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Menu Management | Create and manage menu items | STARTER | `/api/menu`, `/api/menu/items` | ❌ | ⏳ | ❌ |
| Menu Categories | Organize menu structure | STARTER | `/api/menu/categories` | ❌ | ⏳ | ❌ |
| Menu Pricing | Set and update prices | STARTER | `/api/menu/pricing` | ❌ | ⏳ | ❌ |
| Menu Performance | Track item performance | PROFESSIONAL | `/api/menu/performance` | ❌ | ⏳ | ❌ |
| Branch Performance | Performance by location | BUSINESS | `/api/menu/performance/branch` | ❌ | ⏳ | ❌ |
| AI Menu Builder | AI-powered menu creation | PROFESSIONAL | `/api/ai/menu-builder` | ❌ | ⏳ | ❌ |
| Recipe Management | Manage recipes and ingredients | PREMIUM | `/api/menu/recipes` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/7 (0%)

---

### DOMAIN 6: INVENTORY (0/6 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Basic Inventory)
- Section 6.3 (Professional - Inventory Alerts)
- Section 6.5 (Premium - Inventory Auto-Reorder)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Inventory Tracking | Track stock levels | STARTER | `/api/inventory`, `/api/inventory/items` | ❌ | ⏳ | ❌ |
| Stock Counting | Perform inventory counts | STARTER | `/api/inventory/count` | ❌ | ⏳ | ❌ |
| Inventory Alerts | Low stock notifications | PROFESSIONAL | `/api/inventory/alerts` | ❌ | ⏳ | ❌ |
| Auto-Reorder | Automatic reorder suggestions | PREMIUM | `/api/inventory/auto-reorder` | ❌ | ⏳ | ❌ |
| Stock Transfers | Transfer between locations | STARTER | `/api/inventory/transfers` | ❌ | ⏳ | ❌ |
| Inventory Valuation | Track inventory value | STARTER | `/api/inventory/valuation` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/6 (0%)

---

### DOMAIN 7: PROCUREMENT (0/4 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Basic Supplier Orders)
- Section 6.3 (Professional - Procurement Workflow)
- Section 6.4 (Business - Supplier Portal, Delivery Confirmation)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Supplier Orders | Create purchase orders | STARTER | `/api/procurement` | ❌ | ⏳ | ❌ |
| Procurement Workflow | Approval workflow | PROFESSIONAL | `/api/procurement/workflow` | ❌ | ⏳ | ❌ |
| Supplier Portal | Supplier collaboration | BUSINESS | `/api/procurement/supplier-portal` | ❌ | ⏳ | ❌ |
| Delivery Confirmation | Confirm deliveries | BUSINESS | `/api/procurement/delivery-confirmation` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/4 (0%)

---

### DOMAIN 8: QR ORDERING (0/3 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - QR Codes, 5 limit)
- Section 6.3 (Professional - 20 QR codes)
- Section 6.4 (Business - Unlimited QR codes, QR Analytics)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| QR Code Generation | Create QR codes for tables | STARTER | `/api/qr`, `/api/qr/generate` | ❌ | ⏳ | ❌ |
| QR Analytics | Track QR code usage | BUSINESS | `/api/qr/analytics` | ❌ | ⏳ | ❌ |
| QR Deep-Dive | Detailed QR analytics | BUSINESS | `/api/qr/analytics/deep-dive` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/3 (0%)

---

### DOMAIN 9: PAYMENTS (0/6 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Payments)
- Section 6.3 (Professional - Payment Monitor, Payment Analytics)
- Section 6.4 (Business - Payment Analytics Pro, Payout Reconciliation)
- Section 6.5 (Premium - Revenue Intelligence)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Payment Processing | Accept payments | STARTER | `/api/payments` | ❌ | ⏳ | ❌ |
| Payment Monitor | Real-time payment tracking | PROFESSIONAL | `/api/payments/monitor` | ❌ | ⏳ | ❌ |
| Payment Analytics | Payment insights | PROFESSIONAL | `/api/payments/analytics` | ❌ | ⏳ | ❌ |
| Payment Analytics Pro | Advanced payment insights | BUSINESS | `/api/payments/analytics/pro` | ❌ | ⏳ | ❌ |
| Payout Reconciliation | Reconcile payouts | BUSINESS | `/api/payments/payout-reconciliation` | ❌ | ⏳ | ❌ |
| Revenue Intelligence | AI-powered revenue insights | PREMIUM | `/api/payments/revenue-intelligence` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/6 (0%)

---

### DOMAIN 10: REPORTS & ANALYTICS (0/6 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Basic Reports)
- Section 6.3 (Professional - Peak Hours, Menu Performance, Payment Analytics)
- Section 6.4 (Business - QR Analytics)
- Section 6.5 (Premium - Advanced Reports)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Basic Reports | Standard reporting | STARTER | `/api/analytics/dashboard`, `/api/analytics/insights` | ❌ | ⏳ | ❌ |
| Peak Hours Analytics | Identify busy periods | PROFESSIONAL | `/api/analytics/peak-hours` | ❌ | ⏳ | ❌ |
| Menu Performance | Menu item analytics | PROFESSIONAL | `/api/analytics/menu-performance` | ❌ | ⏳ | ❌ |
| Payment Analytics | Payment insights | PROFESSIONAL | `/api/analytics/payments` | ❌ | ⏳ | ❌ |
| QR Analytics | QR code analytics | BUSINESS | `/api/analytics/qr` | ❌ | ⏳ | ❌ |
| Advanced Reports | Comprehensive analytics | PREMIUM | `/api/analytics/advanced` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/6 (0%)

---

### DOMAIN 11: AI FEATURES (0/4 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - 20 AI credits/month)
- Section 6.3 (Professional - 50 AI credits/month, AI Menu Builder)
- Section 6.4 (Business - 200 AI credits/month)
- Section 6.5 (Premium - Unlimited AI credits)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| AI Menu Builder | AI-powered menu creation | PROFESSIONAL | `/api/ai/menu-builder` | ❌ | ⏳ | ❌ |
| AI Brand Assistant | Brand content generation | STARTER | `/api/ai/brand-assistant` | ❌ | ⏳ | ❌ |
| AI Cost Anomalies | Detect cost anomalies | STARTER | `/api/ai/cost-anomalies` | ❌ | ⏳ | ❌ |
| AI Reorder Suggestions | Smart reorder recommendations | STARTER | `/api/ai/reorder` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/4 (0%)

---

### DOMAIN 12: STAFF & ROLES (0/3 Capabilities)

**Constitutional Authority:**
- Section 6.3 (Professional - Staff Management, Role-Based Access)
- Section 6.6 (Enterprise - Custom Roles)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Staff Management | Manage team members | PROFESSIONAL | `/api/staff` | ❌ | ⏳ | ❌ |
| Role-Based Access | Permission management | PROFESSIONAL | `/api/staff/roles` | ❌ | ⏳ | ❌ |
| Custom Roles | Custom permission sets | ENTERPRISE | `/api/staff/custom-roles` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/3 (0%)

---

### DOMAIN 13: BUSINESS SETTINGS (0/5 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - 1 branch, 1 outlet)
- Section 6.3 (Professional - 1 branch, unlimited outlets)
- Section 6.4 (Business - 3 branches, Multi-Branch Dashboard)
- Section 6.5 (Premium - Unlimited branches, White-Label, API Access)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Business Profile | Manage business info | STARTER | `/api/business` | ❌ | ⏳ | ❌ |
| Branch Management | Manage locations | STARTER | `/api/business/branches` | ❌ | ⏳ | ❌ |
| Multi-Branch Dashboard | Cross-location insights | BUSINESS | `/api/business/multi-branch-dashboard` | ❌ | ⏳ | ❌ |
| White-Label Options | Custom branding | PREMIUM | `/api/business/white-label` | ❌ | ⏳ | ❌ |
| API Access | Programmatic access | PREMIUM | `/api/business/api-access` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/5 (0%)

---

### DOMAIN 14: ADMINISTRATION (0/3 Capabilities)

**Constitutional Authority:** Section 6.6 (Enterprise - Audit Exports, SSO)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Admin Dashboard | Platform administration | ADMIN | `/api/admin/*` | ❌ | ⏳ | ❌ |
| Audit Exports | Export audit logs | ENTERPRISE | `/api/audit-logs` | ❌ | ⏳ | ❌ |
| SSO | Single sign-on | ENTERPRISE | `/api/sso` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/3 (0%)

---

### DOMAIN 15: SUPPLIER MARKETPLACE (0/2 Capabilities)

**Constitutional Authority:** Section 6.2 (Starter - Marketplace)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Browse Marketplace | View supplier products | STARTER | `/api/marketplace/products` | ❌ | ⏳ | ❌ |
| Marketplace Orders | Order from suppliers | STARTER | `/api/marketplace/orders` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/2 (0%)

---

### DOMAIN 16: IMBONI PARTNER PROGRAM (0/2 Capabilities)

**Constitutional Authority:** Separate affiliate program (not plan-based)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Affiliate Dashboard | Track referrals | AFFILIATE | `/api/affiliate/dashboard` | ❌ | ⏳ | ❌ |
| Affiliate Payouts | Request payouts | AFFILIATE | `/api/affiliate/payout` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/2 (0%)

---

### DOMAIN 17: BUSINESS DISCOVERY (0/2 Capabilities)

**Constitutional Authority:**
- Section 6.2 (Starter - Discovery Listing)
- Section 6.4 (Business - Discovery Featured)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Discovery Listing | Basic directory listing | STARTER | `/api/discovery/listing` | ❌ | ⏳ | ❌ |
| Discovery Featured | Premium placement | BUSINESS | `/api/discovery/featured` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/2 (0%)

---

### DOMAIN 18: TRAVEL INTEGRATION (0/1 Capability)

**Constitutional Authority:** Section 6.6 (Enterprise - Travel Integration)

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| Travel Integration | Connect with travel platforms | ENTERPRISE | `/api/travel/*` | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/1 (0%)

---

### DOMAIN 19: REMAINING COMMERCIAL APIs (0/TBD Capabilities)

**Constitutional Authority:** Various sections

| Capability | Description | Plan Required | Endpoints | Coverage | Regression | Certified |
|------------|-------------|---------------|-----------|----------|------------|-----------|
| TBD | To be discovered | TBD | TBD | ❌ | ⏳ | ❌ |

**Domain Status:** ⏳ Not Started  
**Capability Coverage:** 0/TBD (0%)

---

## CAPABILITY SUMMARY

**Total Business Capabilities:** 92  
**Capabilities Covered:** 0  
**Capabilities Partially Covered:** 2 (Reservations: Create, View)  
**Capabilities Not Covered:** 90

**Coverage Percentage:** 0% (2.2% partial)

---

## CERTIFICATION STATUS

### Certified Capabilities
None yet

### In Progress
- Reservations: Create Reservation (endpoint protected, not tested)
- Reservations: View Reservations (endpoint protected, not tested)

### Pending
- All other 90 capabilities

---

## NOTES

**Last Updated:** 2026-07-04 09:00 UTC  
**Next Update:** After each capability completion  
**Maintained By:** Engineering

**Purpose:** This matrix provides the **business view** of Commercial Truth. While the Coverage Matrix tracks endpoints (engineering view), this matrix tracks customer capabilities (business view).

---

**END OF CAPABILITY MATRIX**
