# Imboni Serve Feature Testing Checklist
**For Non-Programmer Testers**

## 🚀 How to Run the Platform

### Start the Development Server
1. Open PowerShell in the `Imboni Serve` folder
2. Run: `npm run dev`
3. Wait for "Ready on http://localhost:3000"
4. Open browser: http://localhost:3000

### Test Credentials (from seed data)
- **Admin**: admin@imboni.resto / Admin123!
- **Restaurant Owner**: jean@nyamacafe.rw / Owner123!
- **Cashier**: marie@nyamacafe.rw / Cashier123!
- **Kitchen Manager**: eric@nyamacafe.rw / Kitchen123!
- **Supplier**: patrick@freshfoods.rw / Supplier123!

---

## 📋 RESTAURANT OWNER TESTING CHECKLIST

### 1. Authentication & Onboarding
- [ ] Sign up new restaurant account at `/signup`
  - Enter name, email, password, phone, restaurant name, city
  - Select plan (STARTER/GROWTH/PRO)
  - Test with referral link: `http://localhost:3000/?ref=IMBONI-DEMO`
  - Verify account created successfully
- [ ] Login with new credentials
- [ ] Logout and login again
- [ ] Test "Forgot Password" flow (if implemented)

### 2. Dashboard & Overview
- [ ] Access main dashboard after login
- [ ] Verify today's sales summary displays
- [ ] Check revenue, profit, and sales count widgets
- [ ] View recent sales list
- [ ] Check low stock alerts (if any)

### 3. Menu Management (`/menu`)
- [ ] View existing menu items
- [ ] Add new menu item:
  - Name, description, price, cost, category
  - Mark as available/unavailable
- [ ] Edit existing menu item
- [ ] Delete menu item
- [ ] Search/filter menu items by category
- [ ] Verify price and cost are in correct format (RWF)

### 4. Sales/POS (`/sales`)
- [ ] Create new sale:
  - Select menu items
  - Adjust quantities
  - Choose payment method (CASH, MTN, AIRTEL, PESAPAL, BANK)
  - Add customer (optional)
  - Assign table (optional)
  - Add notes
  - Complete sale
- [ ] View sales history
- [ ] Filter sales by date range
- [ ] Filter by payment method
- [ ] View sale details
- [ ] Print/export sale receipt (if available)
- [ ] Test offline sale (disconnect internet, create sale, reconnect, verify sync)

### 5. Inventory Management (`/inventory`)
- [ ] View inventory items list
- [ ] Add new inventory item:
  - Name, category, unit (kg/liters/pieces)
  - Current stock, minimum stock level
  - Unit cost
- [ ] Update stock:
  - Add stock (purchase)
  - Remove stock (usage)
  - Record waste
  - Manual adjustment
- [ ] View stock history/updates
- [ ] Check low stock alerts
- [ ] Verify alerts trigger when stock < minimum level

### 6. Customers (`/customers`)
- [ ] View customer list
- [ ] Add new customer (name, phone, email)
- [ ] View customer details:
  - Purchase history
  - Total spent
  - Visit count
  - Loyalty points (if enabled)
- [ ] Edit customer information
- [ ] Search customers by name/phone

### 7. Tables Management (`/tables`)
- [ ] View table layout
- [ ] Add new table (number, capacity)
- [ ] Update table status (AVAILABLE, OCCUPIED, RESERVED, CLEANING)
- [ ] Assign waiter to table
- [ ] Link sale to table
- [ ] View table history

### 8. Reports (`/reports`)
- [ ] Generate daily report
- [ ] Generate weekly report
- [ ] Generate monthly report
- [ ] View profit breakdown:
  - Revenue vs Cost
  - Profit margin
- [ ] View payment method breakdown
- [ ] View top-selling items
- [ ] Export reports (PDF/CSV if available)

### 9. Subscription & Billing (`/subscription`)
- [ ] View current plan details
- [ ] View plan features and limits
- [ ] Upgrade/downgrade plan
- [ ] View billing history
- [ ] View upcoming invoice
- [ ] Test payment for subscription:
  - MTN Mobile Money
  - Airtel Money
  - Pesapal (card)
  - Bank transfer
- [ ] Verify subscription renewal date

### 10. Supplier Marketplace (`/marketplace`)
- [ ] Browse available products
- [ ] Filter by category (Meat, Beverages, Vegetables)
- [ ] Search products
- [ ] View product details
- [ ] Add products to cart
- [ ] Adjust quantities in cart
- [ ] Checkout:
  - Enter delivery address
  - Select payment method
  - Confirm order
- [ ] View order history
- [ ] Track order status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED)

### 11. Staff Management (`/users` or `/staff`)
- [ ] View staff list
- [ ] Add new staff member:
  - Name, email, phone, password
  - Assign role (CASHIER, KITCHEN_MANAGER)
  - Enable WhatsApp notifications
- [ ] Edit staff details
- [ ] Deactivate staff member
- [ ] Verify role-based access (cashier can't access admin features)

### 12. Settings (`/settings`)
- [ ] Update restaurant profile:
  - Name, description, address
  - Phone, WhatsApp number
  - Location (city, district, coordinates)
- [ ] Update owner profile:
  - Name, email, phone
  - WhatsApp preferences
- [ ] Change password
- [ ] Configure notification preferences

### 13. WhatsApp Integration (if enabled)
- [ ] Enable WhatsApp notifications
- [ ] Test daily report delivery
- [ ] Test low stock alerts
- [ ] Test WhatsApp bot commands (if implemented)

---

## 📦 SUPPLIER TESTING CHECKLIST

### 1. Supplier Authentication
- [ ] Login as supplier (patrick@freshfoods.rw / Supplier123!)
- [ ] Access supplier dashboard

### 2. Product Management
- [ ] View supplier product catalog
- [ ] Add new product:
  - Name, description, category
  - Unit (kg/liters/pieces)
  - Unit price
  - Minimum order quantity
  - Upload image (if available)
- [ ] Edit product details
- [ ] Mark product as available/unavailable
- [ ] Feature product (highlight in marketplace)

### 3. Order Management
- [ ] View incoming orders from restaurants
- [ ] View order details:
  - Restaurant name
  - Items ordered
  - Quantities
  - Total amount
  - Delivery address
- [ ] Update order status:
  - Confirm order
  - Mark as processing
  - Mark as shipped
  - Mark as delivered
- [ ] Add delivery notes
- [ ] View order history

### 4. Deliveries
- [ ] Schedule delivery for order
- [ ] Update delivery status
- [ ] Record delivery completion
- [ ] View delivery history

### 5. Supplier Reports
- [ ] View sales summary
- [ ] View commission breakdown (marketplace fee)
- [ ] View top-selling products
- [ ] View customer restaurants

---

## 👨‍💼 ADMIN TESTING CHECKLIST

### 1. Admin Dashboard
- [ ] Login as admin (admin@imboni.resto / Admin123!)
- [ ] View platform-wide statistics:
  - Total restaurants
  - Total sales
  - Total revenue
  - Active subscriptions

### 2. Restaurant Management
- [ ] View all restaurants
- [ ] View restaurant details
- [ ] Activate/deactivate restaurant
- [ ] View restaurant subscription status

### 3. Subscription Management
- [ ] View all subscriptions
- [ ] View pending invoices
- [ ] Mark invoice as paid
- [ ] View payment history
- [ ] Handle failed payments

### 4. Affiliate Management (`/admin/affiliates`)
- [ ] View all affiliates
- [ ] Create new affiliate:
  - Affiliate code (e.g., PARTNER123)
  - Name
  - Commission rate (default 20%)
- [ ] View affiliate stats:
  - Total referrals
  - Active referrals
  - Total commissions
- [ ] View pending payouts
- [ ] Approve payout:
  - Enter payment method
  - Enter transaction reference
  - Mark as paid
- [ ] Suspend affiliate
- [ ] Test referral attribution:
  - Visit site with `?ref=IMBONI-DEMO`
  - Sign up new restaurant
  - Verify restaurant linked to affiliate
  - Create subscription payment
  - Verify commission created (20% of payment)
  - Wait 7 days (or manually update DB)
  - Verify commission auto-approved

### 5. Supplier Management
- [ ] View all suppliers
- [ ] Verify supplier
- [ ] Activate/deactivate supplier
- [ ] View supplier products
- [ ] View marketplace orders

### 6. Fee Configuration (`/admin/fee-config`)
- [ ] View current fee settings
- [ ] Update digital payment fee:
  - Percentage
  - Minimum fee
  - Maximum fee
- [ ] Update marketplace commission rates:
  - Standard tier
  - Launch tier
  - High-volume tier
- [ ] Update VAT rate
- [ ] Enable/disable WHT (Withholding Tax)
- [ ] Update WHT rate

### 7. Platform Reports
- [ ] View platform-wide revenue
- [ ] View subscription revenue breakdown
- [ ] View marketplace commission revenue
- [ ] View affiliate commission expenses
- [ ] Export platform reports

---

## 🧪 EDGE CASES & ERROR HANDLING

### Data Validation
- [ ] Try creating sale with zero items
- [ ] Try negative quantities
- [ ] Try invalid prices (negative, zero)
- [ ] Try duplicate menu item names
- [ ] Try invalid email formats
- [ ] Try weak passwords
- [ ] Try duplicate phone numbers

### Permissions & Access Control
- [ ] Cashier tries to access admin pages (should fail)
- [ ] Cashier tries to access owner-only features (should fail)
- [ ] Supplier tries to access restaurant features (should fail)
- [ ] Unauthenticated user tries to access protected pages (should redirect to login)

### Offline Functionality
- [ ] Disconnect internet
- [ ] Create sale (should save locally)
- [ ] Reconnect internet
- [ ] Verify sale syncs to server
- [ ] Check pending sync count indicator

### Payment Flows
- [ ] Test each payment method
- [ ] Test payment failure handling
- [ ] Test payment confirmation
- [ ] Verify invoice generation

### Subscription Limits
- [ ] STARTER plan: Try adding 3rd user (should fail or warn)
- [ ] STARTER plan: Try adding 51st menu item (should fail or warn)
- [ ] Verify plan upgrade removes limits

---

## 🐛 BUG REPORTING FORMAT

When you find an issue, report it like this:

**Bug Title**: [Short description]

**Steps to Reproduce**:
1. Go to [page]
2. Click [button]
3. Enter [data]
4. Observe [issue]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**User Role**: [Owner/Cashier/Admin/Supplier]

**Browser**: [Chrome/Firefox/Edge/Safari]

**Screenshots**: [Attach if possible]

---

## ✅ TESTING COMPLETION CHECKLIST

- [ ] All restaurant owner features tested
- [ ] All supplier features tested
- [ ] All admin features tested
- [ ] All payment methods tested
- [ ] Offline functionality verified
- [ ] Affiliate system end-to-end tested
- [ ] Mobile responsiveness checked (resize browser)
- [ ] All bugs documented
- [ ] Critical bugs blocking launch identified

---

## 📝 NOTES FOR TESTER

- Take your time with each feature
- Test as if you're a real restaurant owner/supplier
- Try to break things (enter weird data, click rapidly, etc.)
- Note any confusing UI/UX
- Check if error messages are helpful
- Verify all text is in correct language (English/Kinyarwanda)
- Check if loading states are clear
- Verify success messages appear after actions

**Testing should take 4-6 hours for thorough coverage.**
