# Comprehensive Feature Testing Checklist

## Testing Overview
This document provides a complete feature-by-feature testing guide with expected behaviors for every page, dashboard, and functionality in Imboni Resto.

---

## 1. Authentication & User Management

### 1.1 Signup Flow (`/signup`)
**Expected Behavior:**
- [ ] Form displays: Name, Email, Password, Business Name, Phone, City, District
- [ ] Password validation: Min 8 chars, requires uppercase, lowercase, number
- [ ] Email validation: Valid email format
- [ ] Phone validation: Rwanda format (+250...)
- [ ] On submit: Creates user + business + default subscription (STARTER, 14-day trial)
- [ ] Redirects to `/dashboard` after successful signup
- [ ] Shows error for duplicate email
- [ ] Creates first user as OWNER role

**Test Cases:**
```
1. Valid signup → Success, redirect to dashboard
2. Duplicate email → Error: "Email already exists"
3. Weak password → Error: "Password must be at least 8 characters"
4. Invalid email → Error: "Invalid email format"
5. Missing required fields → Error: "All fields required"
```

### 1.2 Login Flow (`/login`)
**Expected Behavior:**
- [ ] Form displays: Email, Password
- [ ] On submit: Validates credentials via NextAuth
- [ ] Sets session with user data (id, name, email, businessId, roles)
- [ ] Redirects to `/dashboard` on success
- [ ] Shows error for invalid credentials
- [ ] "Remember me" option persists session

**Test Cases:**
```
1. Valid credentials → Success, redirect to dashboard
2. Invalid email → Error: "Invalid credentials"
3. Invalid password → Error: "Invalid credentials"
4. Empty fields → Error: "Email and password required"
```

### 1.3 Staff Management (`/dashboard/staff`)
**Expected Behavior:**
- [ ] Lists all staff for current business
- [ ] Shows: Name, Email, Role, Status, Actions
- [ ] Roles: OWNER, MANAGER, SUPERVISOR, CASHIER, WAITER
- [ ] Can invite new staff (sends email invitation)
- [ ] Can update staff roles (OWNER only)
- [ ] Can deactivate/reactivate staff
- [ ] Can't delete OWNER
- [ ] Shows staff activity logs

**Test Cases:**
```
1. Invite staff → Email sent, pending status
2. Update role → Role changed, logged
3. Deactivate staff → Status inactive, can't login
4. Delete OWNER → Error: "Cannot delete owner"
5. Non-owner tries to manage → Error: "Unauthorized"
```

---

## 2. Dashboard & Analytics

### 2.1 Main Dashboard (`/dashboard`)
**Expected Behavior:**
- [ ] Shows today's key metrics:
  - Total sales (RWF)
  - Number of transactions
  - Average order value
  - Profit margin
- [ ] Shows recent sales (last 10)
- [ ] Shows low stock alerts (items below min level)
- [ ] Shows quick actions: New Sale, Add Inventory, View Reports
- [ ] Real-time updates (refresh every 30s)
- [ ] Charts: Sales trend (7 days), Top selling items

**Test Cases:**
```
1. No sales today → Shows 0 RWF, empty list
2. Multiple sales → Correct totals, sorted by time
3. Low stock items → Red alert badges
4. Click "New Sale" → Navigates to /dashboard/sales/new
```

### 2.2 AI Dashboard (`/dashboard/ai`)
**Expected Behavior:**
- [ ] **Business Summary Tab:**
  - Weekly/Monthly toggle
  - Generate AI insight button
  - Shows KPIs: Revenue, Transactions, Avg Daily, Peak Hour, Repeat Rate, Pay Success
  - Displays AI-generated insight text (GPT-4)
  - Shows insight history (last 20)
  - Insight metadata: Period, model, tokens, cost, trigger source (AUTO/MANUAL)
  
- [ ] **Operations AI Tab:**
  - Smart Reorder Recommendations table
  - Shows: Item, Current Stock, Min Level, Suggested Qty, Chosen Qty
  - Accept/Dismiss buttons for each suggestion
  - Cost Anomaly Alerts
  - Shows: Product, Supplier, Observed Price, Avg Price, Delta %, Severity
  - Acknowledge/Dismiss/Resolve buttons
  - Test data creation form (PO + GRN)

**Test Cases:**
```
1. Generate weekly insight → GPT-4 analysis, KPIs displayed
2. Accept reorder suggestion → Logged to database
3. Dismiss reorder → Logged as REJECTED
4. Edit suggested qty → Logged as EDITED
5. Acknowledge anomaly → Status updated to ACKNOWLEDGED
6. Create test PO+GRN → Creates records, may trigger anomaly
7. No OpenAI key → Error: "OpenAI API key required"
```

---

## 3. Sales Management

### 3.1 Sales List (`/dashboard/sales`)
**Expected Behavior:**
- [ ] Lists all sales for current business
- [ ] Shows: Order Number, Date, Items, Total, Payment Method, Status
- [ ] Filters: Date range, Payment method, Payment status
- [ ] Pagination: 50 per page
- [ ] Search by order number
- [ ] Click row → View sale details
- [ ] Export to CSV button
- [ ] Shows payment status badges (PENDING, COMPLETED, FAILED, REFUNDED)

**Test Cases:**
```
1. Filter by date → Shows sales in range
2. Filter by payment method → Shows only matching
3. Search order number → Shows matching sale
4. Export CSV → Downloads file with all sales
5. Click sale → Shows detail modal
```

### 3.2 New Sale (`/dashboard/sales/new`)
**Expected Behavior:**
- [ ] Left panel: Menu items grid
- [ ] Right panel: Cart + Payment
- [ ] Click menu item → Adds to cart (qty 1)
- [ ] Cart shows: Item name, Price, Quantity input, Remove button
- [ ] Subtotal calculated automatically
- [ ] Payment method selector:
  - CASH (default)
  - MTN_MOBILE_MONEY
  - AIRTEL_MONEY
  - PESAPAL_CARD
  - BANK_TRANSFER
  - OTHER
- [ ] Digital payments show convenience fee (5%)
- [ ] Customer info (optional): Phone, Email, WhatsApp consent checkbox
- [ ] "Create Sale" button
- [ ] On success: Shows EBM receipt text
- [ ] For CASH: Generates Smart Dining Slip immediately
- [ ] For digital: Slip generated after payment confirmation

**Test Cases:**
```
1. Add items to cart → Cart updates, subtotal correct
2. Change quantity → Subtotal recalculates
3. Remove item → Item removed from cart
4. Select MTN MoMo → Fee added (5%)
5. Create cash sale → Receipt shown, slip generated
6. Create digital sale → Payment pending, slip after confirmation
7. Add customer phone + consent → Slip sent via WhatsApp
8. Empty cart → Error: "Cart is empty"
```

---

## 4. Inventory Management

### 4.1 Inventory List (`/dashboard/inventory`)
**Expected Behavior:**
- [ ] Lists all inventory items for current business
- [ ] Shows: Name, Current Stock, Unit, Min Level, Cost, Supplier, Status
- [ ] Color coding:
  - Red: Stock below min level
  - Yellow: Stock at min level
  - Green: Stock above min level
- [ ] Add new item button
- [ ] Edit item (inline or modal)
- [ ] Delete item (with confirmation)
- [ ] Bulk actions: Update stock, Set min levels
- [ ] Filter by supplier
- [ ] Search by name
- [ ] Shows last updated timestamp

**Test Cases:**
```
1. Add new item → Item created, appears in list
2. Edit item → Changes saved, timestamp updated
3. Delete item → Confirmation modal, item removed
4. Stock below min → Red badge, appears in alerts
5. Update stock → New value shown, logged in updates
6. Filter by supplier → Shows only matching items
```

### 4.2 Inventory Updates (`/dashboard/inventory/updates`)
**Expected Behavior:**
- [ ] Shows all stock updates (history)
- [ ] Columns: Date, Item, Old Stock, New Stock, Change, Reason, Updated By
- [ ] Filter by date range
- [ ] Filter by item
- [ ] Filter by user
- [ ] Shows reason codes: PURCHASE, SALE, ADJUSTMENT, WASTE, TRANSFER
- [ ] Export to CSV
- [ ] Audit trail (can't edit/delete)

**Test Cases:**
```
1. View updates → Shows chronological list
2. Filter by date → Shows updates in range
3. Filter by item → Shows only that item's updates
4. Export CSV → Downloads complete history
```

### 4.3 Stock Alerts (`/dashboard/inventory/alerts`)
**Expected Behavior:**
- [ ] Lists items below minimum stock level
- [ ] Shows: Item, Current Stock, Min Level, Deficit, Suggested Reorder Qty
- [ ] "Reorder" button → Creates purchase order draft
- [ ] "Dismiss" button → Marks alert as acknowledged
- [ ] Auto-refreshes every 5 minutes
- [ ] Email/WhatsApp notification to managers (hourly cron)

**Test Cases:**
```
1. Item below min → Appears in alerts
2. Click reorder → Creates PO draft with suggested qty
3. Dismiss alert → Removed from list
4. Stock updated above min → Alert auto-removed
```

---

## 5. Purchase Orders & Procurement

### 5.1 Purchase Orders (`/dashboard/purchase-orders`)
**Expected Behavior:**
- [ ] Lists all purchase orders
- [ ] Shows: PO Number, Supplier, Date, Total, Status, Actions
- [ ] Statuses: DRAFT, SUBMITTED, ACCEPTED, REJECTED, PACKED, SHIPPED, DELIVERED, COMPLETED, CANCELLED
- [ ] Create new PO button
- [ ] Filter by supplier, status, date
- [ ] Click PO → View details
- [ ] Submit PO → Sends to supplier (if integrated)
- [ ] Cancel PO → Requires reason
- [ ] Shows status history timeline

**Test Cases:**
```
1. Create PO → Status DRAFT, items listed
2. Submit PO → Status SUBMITTED, timestamp logged
3. Supplier accepts → Status ACCEPTED
4. Supplier rejects → Status REJECTED, reason shown
5. Cancel PO → Status CANCELLED, reason required
6. Filter by status → Shows matching POs
```

### 5.2 Goods Received Notes (GRN) (`/dashboard/grn`)
**Expected Behavior:**
- [ ] Lists all GRNs
- [ ] Shows: GRN Number, PO Number, Supplier, Date, Status
- [ ] Create GRN from PO
- [ ] Record received quantities (can be partial)
- [ ] Record item condition: GOOD, DAMAGED, EXPIRED
- [ ] Add discrepancy notes
- [ ] On complete: Updates inventory, marks PO as COMPLETED
- [ ] Triggers cost anomaly check (if price variance > threshold)
- [ ] Generates procurement document (invoice for supplier, slip for buyer)

**Test Cases:**
```
1. Create GRN from PO → Items pre-filled with ordered qty
2. Partial receipt → Status PARTIAL, PO remains open
3. Full receipt → Status COMPLETE, PO marked COMPLETED
4. Damaged items → Condition logged, notes required
5. Price variance → Cost anomaly alert created
6. Complete GRN → Inventory updated, document generated
```

---

## 6. Reports & Analytics

### 6.1 Daily Report (`/dashboard/reports?period=daily`)
**Expected Behavior:**
- [ ] Shows metrics for selected date
- [ ] Metrics:
  - Total sales (RWF)
  - Total transactions
  - Average order value
  - Total cost
  - Gross profit
  - Profit margin %
  - Top 5 selling items
  - Sales by hour (chart)
  - Sales by payment method (pie chart)
- [ ] Date picker for historical reports
- [ ] Export PDF button
- [ ] Send to WhatsApp button (owner only)
- [ ] Auto-generated nightly at 11 PM

**Test Cases:**
```
1. View today's report → Current data shown
2. Select past date → Historical data shown
3. Export PDF → Downloads formatted report
4. Send WhatsApp → Delivered to owner's phone
5. No sales → Shows 0 values, empty charts
```

### 6.2 Weekly Report (`/dashboard/reports?period=weekly`)
**Expected Behavior:**
- [ ] Shows metrics for current week (Mon-Sun)
- [ ] Week selector (previous weeks)
- [ ] Comparison with previous week (% change)
- [ ] Daily breakdown chart
- [ ] Top 10 items
- [ ] Customer repeat rate
- [ ] Peak days and hours

**Test Cases:**
```
1. View current week → Shows Mon-Sun data
2. Select previous week → Historical data
3. Compare weeks → % change indicators (↑↓)
4. Export PDF → Weekly summary report
```

### 6.3 Monthly Report (`/dashboard/reports?period=monthly`)
**Expected Behavior:**
- [ ] Shows metrics for current month
- [ ] Month selector
- [ ] Comparison with previous month
- [ ] Daily trend chart
- [ ] Category breakdown
- [ ] Customer acquisition
- [ ] Inventory turnover
- [ ] Profit trends

**Test Cases:**
```
1. View current month → Shows month-to-date
2. Select previous month → Historical data
3. Compare months → % change indicators
4. Export PDF → Monthly summary report
```

---

## 7. Smart Dining Slip™

### 7.1 Slip Generation
**Expected Behavior:**
- [ ] Auto-generated when sale is completed (CASH) or payment confirmed (digital)
- [ ] Contains:
  - Business name, logo, branch
  - Unique slip ID
  - Order ID
  - Date and time
  - Itemized list (qty, unit price, total)
  - Subtotal
  - VAT (18%)
  - Convenience fee (if digital payment)
  - Grand total
  - Payment method
  - Optional: Table number, served by
  - Footer: "This restaurant uses Imboni Resto"
  - Referral block with QR code and "Share & Earn" CTA
- [ ] Template selection (Minimal, Premium, Local/Casual)
- [ ] WhatsApp delivery (if customer consented)
- [ ] PDF and image formats
- [ ] Stored in database with audit trail

**Test Cases:**
```
1. Cash sale → Slip generated immediately
2. Digital payment → Slip after confirmation
3. Customer consent + phone → Delivered via WhatsApp
4. No consent → Slip stored, not sent
5. Invalid phone → Error logged, slip stored
6. Template selection → Correct format applied
7. Referral link → Unique, trackable
```

### 7.2 Slip Management (`/dashboard/smart-dining-slips`)
**Expected Behavior:**
- [ ] Lists all generated slips
- [ ] Shows: Slip ID, Order ID, Date, Customer, Amount, Status, Delivery Status
- [ ] Filter by date, status, delivery status
- [ ] Search by slip ID or order ID
- [ ] View slip (preview)
- [ ] Resend slip (supervisor/manager only)
- [ ] Download PDF
- [ ] Shows delivery attempts and status

**Test Cases:**
```
1. View slips → Shows all for business
2. Filter by date → Shows range
3. Search slip ID → Shows matching slip
4. Preview slip → Opens in modal/new tab
5. Resend slip → WhatsApp delivery attempted
6. Download PDF → File downloaded
7. Delivery failed → Shows error reason
```

---

## 8. Referral System

### 8.1 Referral Link Generation
**Expected Behavior:**
- [ ] Each business has unique referral code
- [ ] Referral link format: `https://imboniresto.com/signup?ref=ABC123`
- [ ] Link embedded in Smart Dining Slips
- [ ] QR code for easy scanning
- [ ] 30-day cookie window
- [ ] Last-click attribution
- [ ] Tracks: Views, signups, conversions

**Test Cases:**
```
1. Generate link → Unique code created
2. Customer scans QR → Redirects to signup with ref param
3. Customer signs up → Referral tracked
4. Customer subscribes → Commission earned
5. 30 days expired → No commission
6. Multiple referrers → Last click wins
```

### 8.2 Referral Dashboard (`/dashboard/referrals`)
**Expected Behavior:**
- [ ] Shows referral stats:
  - Total referrals
  - Pending (trial)
  - Qualified (paid)
  - Total earnings
  - Pending payout
- [ ] Lists referred businesses
- [ ] Shows: Business name, Signup date, Status, Plan, Commission
- [ ] Referral link with copy button
- [ ] QR code download
- [ ] Commission history
- [ ] Payout requests

**Test Cases:**
```
1. View dashboard → Shows stats
2. Copy referral link → Copied to clipboard
3. Download QR → Image file downloaded
4. Referred business converts → Commission calculated
5. Request payout → Status pending approval
```

---

## 9. Marketplace & Supplier Network

### 9.1 Marketplace Browse (`/store`)
**Expected Behavior:**
- [ ] Lists products from verified suppliers
- [ ] Shows: Product image, name, price, unit, supplier, rating
- [ ] Filter by category
- [ ] Filter by supplier
- [ ] Search by product name
- [ ] Sort by: Price, Rating, Distance
- [ ] Add to cart button
- [ ] View supplier profile
- [ ] Shows nearest suppliers first (geolocation)

**Test Cases:**
```
1. Browse products → Shows available items
2. Filter by category → Shows matching products
3. Search product → Shows results
4. Sort by price → Ascending/descending
5. Add to cart → Cart updated
6. View supplier → Shows profile, products, ratings
7. Location permission → Shows nearest suppliers
```

### 9.2 Marketplace Orders (`/dashboard/marketplace/orders`)
**Expected Behavior:**
- [ ] Lists all marketplace orders
- [ ] Shows: Order number, Supplier, Date, Total, Status
- [ ] Statuses: PENDING, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED
- [ ] Create order from cart
- [ ] Track order status
- [ ] Add delivery address
- [ ] Payment options: Cash on delivery, Digital payment
- [ ] Rate supplier after delivery

**Test Cases:**
```
1. Create order → Status PENDING
2. Supplier confirms → Status CONFIRMED
3. Track order → Shows status updates
4. Delivery completed → Status DELIVERED
5. Rate supplier → Rating saved
6. Cancel order → Requires reason
```

### 9.3 Supplier Portal (`/supplier`)
**Expected Behavior:**
- [ ] Separate login for suppliers
- [ ] Dashboard shows:
  - Pending orders
  - Revenue stats
  - Product performance
  - Ratings and reviews
- [ ] Manage products (add, edit, delete)
- [ ] Manage orders (accept, reject, update status)
- [ ] View payments and payouts
- [ ] Delivery management
- [ ] Analytics and reports

**Test Cases:**
```
1. Supplier login → Access to supplier dashboard
2. View orders → Shows orders for supplier
3. Accept order → Status updated, buyer notified
4. Reject order → Reason required, buyer notified
5. Update product → Changes reflected in marketplace
6. View payouts → Shows payment history
```

---

## 10. Payment & Subscriptions

### 10.1 Subscription Management (`/dashboard/settings?tab=subscription`)
**Expected Behavior:**
- [ ] Shows current plan: STARTER, ESSENTIALS, PROFESSIONAL, GROWTH, BUSINESS, ENTERPRISE
- [ ] Shows: Plan name, Price, Billing cycle, Next billing date, Status
- [ ] Status: TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
- [ ] Trial period: 14 days
- [ ] Upgrade/downgrade buttons
- [ ] Cancel subscription button
- [ ] Payment history
- [ ] Invoice downloads
- [ ] Auto-renewal toggle

**Test Cases:**
```
1. View subscription → Shows current plan details
2. Upgrade plan → Payment flow, plan updated
3. Downgrade plan → Effective next cycle
4. Cancel subscription → Confirmation required
5. Trial expires → Payment required to continue
6. Payment fails → Status PAST_DUE, retry prompt
7. Download invoice → PDF downloaded
```

### 10.2 Payment Flow (IremboPay)
**Expected Behavior:**
- [ ] Select payment method: MTN MoMo, Airtel Money, Card
- [ ] Enter amount (auto-filled for subscriptions)
- [ ] Generate invoice with QR code
- [ ] Payment link opens in new tab
- [ ] Status polling (every 3s for 5 minutes)
- [ ] Success: Redirect to success page
- [ ] Failure: Show error, retry option
- [ ] Expired: Generate new invoice
- [ ] Webhook updates status in background

**Test Cases:**
```
1. Select MTN MoMo → Phone number prompt
2. Generate invoice → QR code displayed
3. Scan QR → Payment page opens
4. Complete payment → Status COMPLETED
5. Cancel payment → Status FAILED
6. Invoice expires → Prompt to retry
7. Webhook received → Status updated
8. Invalid signature → Webhook rejected
```

---

## 11. Settings & Configuration

### 11.1 Business Settings (`/dashboard/settings?tab=business`)
**Expected Behavior:**
- [ ] Edit business info: Name, Phone, Email, Address, City, District
- [ ] Upload logo
- [ ] Set timezone
- [ ] Set currency (RWF)
- [ ] Set language (English, Kinyarwanda)
- [ ] VAT registration toggle
- [ ] TIN number
- [ ] Business hours
- [ ] Save button

**Test Cases:**
```
1. Update business name → Saved, reflected everywhere
2. Upload logo → Appears on slips, dashboard
3. Change timezone → Times displayed correctly
4. Enable VAT → VAT shown on receipts
5. Set business hours → Used for reports
```

### 11.2 WhatsApp Settings (`/dashboard/settings?tab=whatsapp`)
**Expected Behavior:**
- [ ] Enable/disable owner reports
- [ ] Enable/disable client slips
- [ ] Set daily cap (10-500 messages)
- [ ] Set monthly budget (optional, in RWF)
- [ ] Shows current usage: Messages sent today, This month spend
- [ ] Test message button
- [ ] Message template preview

**Test Cases:**
```
1. Enable owner reports → Daily reports sent
2. Disable client slips → Slips not sent via WhatsApp
3. Set daily cap to 50 → Stops at 50 messages
4. Set monthly budget → Stops when exceeded
5. Send test message → Delivered to owner
6. Exceed daily cap → Error: "Daily limit reached"
```

### 11.3 Fee Configuration (`/dashboard/settings?tab=fees`)
**Expected Behavior:**
- [ ] Set convenience fee % (0-10%)
- [ ] Enable/disable fee per payment method
- [ ] Set minimum transaction amount for fee
- [ ] Preview fee calculation
- [ ] Save button
- [ ] Audit log of changes

**Test Cases:**
```
1. Set fee to 5% → Applied to digital payments
2. Disable fee for MTN → No fee for MTN payments
3. Set minimum 1000 RWF → Fee only above 1000
4. Preview calculation → Shows example amounts
5. Save changes → Logged with user and timestamp
```

---

## 12. Mobile PWA Features

### 12.1 Offline Mode
**Expected Behavior:**
- [ ] Service worker caches app shell
- [ ] Offline page shown when no connection
- [ ] Sales can be created offline (queued)
- [ ] Inventory updates queued
- [ ] Sync when connection restored
- [ ] Shows sync status indicator
- [ ] Conflict resolution (server wins)

**Test Cases:**
```
1. Go offline → Offline page shown
2. Create sale offline → Queued locally
3. Go online → Sale synced to server
4. Conflict detected → Server version kept
5. Sync indicator → Shows pending items
```

### 12.2 Install Prompt
**Expected Behavior:**
- [ ] "Add to Home Screen" prompt after 3 visits
- [ ] Custom install UI
- [ ] App icon on home screen
- [ ] Splash screen on launch
- [ ] Runs in standalone mode (no browser chrome)

**Test Cases:**
```
1. Visit 3 times → Install prompt shown
2. Click install → App added to home screen
3. Launch from home → Opens in standalone mode
4. Splash screen → Shows Imboni Resto branding
```

---

## 13. Admin Features (Platform Admin)

### 13.1 Admin Dashboard (`/admin`)
**Expected Behavior:**
- [ ] Platform overview:
  - Total businesses
  - Active subscriptions
  - Total revenue
  - Churn rate
- [ ] Recent signups
- [ ] Failed payments
- [ ] Support tickets
- [ ] System health metrics

**Test Cases:**
```
1. View dashboard → Shows platform stats
2. Click business → View business details
3. View failed payments → Shows retry options
4. System health → All services green
```

### 13.2 Business Management
**Expected Behavior:**
- [ ] List all businesses
- [ ] Search by name, email, phone
- [ ] Filter by plan, status
- [ ] View business details
- [ ] Update subscription
- [ ] Suspend/reactivate business
- [ ] View activity logs
- [ ] Impersonate user (for support)

**Test Cases:**
```
1. Search business → Shows matching results
2. View details → Shows complete info
3. Update subscription → Plan changed
4. Suspend business → Users can't login
5. Reactivate → Access restored
6. Impersonate → Login as user
```

---

## Expected Performance Metrics

### Page Load Times (Target)
- Home page: < 2s
- Dashboard: < 3s
- Sales list: < 2s
- New sale: < 1.5s
- Reports: < 4s (with charts)
- AI insights: < 10s (generation)

### API Response Times (Target)
- GET requests: < 500ms
- POST requests: < 1s
- Payment creation: < 2s
- Report generation: < 5s
- AI insight generation: < 30s

### Database Queries
- Simple queries: < 100ms
- Complex joins: < 500ms
- Aggregations: < 1s
- Full-text search: < 300ms

### External API Calls
- IremboPay invoice: < 3s
- WhatsApp message: < 5s
- Payment webhook: < 1s processing

---

## Browser Compatibility

### Supported Browsers
- [ ] Chrome 90+ ✅
- [ ] Firefox 88+ ✅
- [ ] Safari 14+ ✅
- [ ] Edge 90+ ✅
- [ ] Mobile Safari (iOS 14+) ✅
- [ ] Chrome Mobile (Android 10+) ✅

### PWA Features
- [ ] Service Worker ✅
- [ ] Web App Manifest ✅
- [ ] Offline support ✅
- [ ] Push notifications (future)
- [ ] Background sync ✅

---

## Security Checklist

### Authentication
- [ ] Password hashing (bcrypt)
- [ ] Session management (NextAuth)
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts

### Authorization
- [ ] Role-based access control (RBAC)
- [ ] Business isolation (can't access other businesses)
- [ ] API route protection
- [ ] Sensitive data masking

### Data Protection
- [ ] HTTPS only
- [ ] Encrypted database connections
- [ ] PII encryption at rest
- [ ] Secure cookie flags
- [ ] XSS protection
- [ ] SQL injection prevention (Prisma ORM)

### External APIs
- [ ] API key rotation
- [ ] Webhook signature verification
- [ ] Request timeout limits
- [ ] Error message sanitization

---

## Accessibility (WCAG 2.1 Level AA)

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] Alt text for images
- [ ] ARIA labels
- [ ] Form validation messages
- [ ] Skip navigation links

---

## Next Steps

1. **Run Automated Tests**: Execute test suite for all features
2. **Manual Testing**: Follow this checklist page by page
3. **Performance Testing**: Verify load times and API responses
4. **Security Audit**: Penetration testing and vulnerability scan
5. **User Acceptance Testing**: Real business owners test workflows
6. **Load Testing**: Simulate 100+ concurrent users
7. **Deployment**: Push to production after all checks pass
