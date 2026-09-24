# FOUNDER-GPV-001 — Step-by-Step Master Sequence

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-MASTER-SEQUENCE |
| Date | 2026-08-14 |
| Status | THE DEFINITIVE ORDERED JOURNEY |
| Source | Actual repository inspection — every route, API, and flow verified against source code |

## Overview

This is the definitive ordered journey for founder-led guided platform verification. Every step follows this structure:

```
STEP FGPV-XXX — [NAME]
ROLE: who performs it
STARTING STATE: what must already be true
PRECONDITIONS: requirements
ACTION: what the founder will do
EXPECTED RESULT: what should happen
VISIBLE EVIDENCE: what the founder should see
IF PASS: exact next step
IF FAIL: exact immediate response
STOP CONDITION: when the whole session must stop
DEPENDENCIES: what this step depends on
SYSTEMS TOUCHED: systems
EXTERNAL SERVICES: providers
CUSTOMER #1 RELEVANCE: critical / important / optional
```

Do not collapse multiple meaningful actions into one step.

---

## SESSION A: OWNER SETUP

--------------------------------------------------
STEP FGPV-001 — Navigate to Signup

ROLE:
Founder (as prospective business owner)

STARTING STATE:
Application running at http://localhost:3000
Environment configured (SMTP, Twilio, database)

PRECONDITIONS:
- npm run dev is running
- localhost:3000 loads in browser

ACTION:
Open browser and navigate to http://localhost:3000/signup

EXPECTED RESULT:
Signup page loads with form fields: name, email, password, phone, business name, city, country, plan, business type

VISIBLE EVIDENCE:
Signup form displayed with Imboni Serve logo, language selector (EN/FR/RW), trial banner

IF PASS:
FGPV-002

IF FAIL:
STOP — Application not running. Start with `npm run dev` and verify localhost:3000 loads.

STOP CONDITION:
Application cannot start

DEPENDENCIES:
None

SYSTEMS TOUCHED:
Next.js frontend

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-002 — Fill Signup Form

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-001 complete — signup page loaded

PRECONDITIONS:
- Valid email address (not already registered)
- Valid phone number
- Business name chosen

ACTION:
Fill in all required fields:
- Your Name: [founder name]
- Email Address: [valid email]
- Password: [secure password]
- Phone: [phone number]
- Business Name: [test business name]
- City: Kigali (or chosen city)
- Country: RW (or chosen country — EGR-016: geography is configuration)
- Business Type: RESTAURANT
- Plan: STARTER (or chosen plan)
- Agree to terms
Click "Sign Up"

EXPECTED RESULT:
Form submits to POST /api/auth/signup. Business created, user created with OWNER role, trial started. Redirect to /welcome.

VISIBLE EVIDENCE:
Page redirects to /welcome — welcome page displayed

IF PASS:
FGPV-003

IF FAIL:
- If "email already exists" → use a different email or login with existing
- If "invalid data" → check all fields are valid
- If server error → check database connection and server logs

STOP CONDITION:
Cannot create account after 3 attempts

DEPENDENCIES:
FGPV-001

SYSTEMS TOUCHED:
Auth API, Prisma (User, Business creation)

EXTERNAL SERVICES:
None (SMTP used later for OTP)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-003 — Navigate to Login

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-002 complete — account created, redirected to /welcome

PRECONDITIONS:
- Account exists in database
- Email and password known

ACTION:
Navigate to http://localhost:3000/login (or click login link from welcome page)

EXPECTED RESULT:
Login page loads with 2-step flow: Step 1 (credentials) and Step 2 (OTP)

VISIBLE EVIDENCE:
Login form with email + password fields, language selector, "Sign In" button

IF PASS:
FGPV-004

IF FAIL:
STOP — Login page not loading. Check application status.

STOP CONDITION:
Login page cannot load

DEPENDENCIES:
FGPV-002

SYSTEMS TOUCHED:
Next.js frontend, NextAuth

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-004 — Enter Credentials (Step 1 of MFA)

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-003 complete — login page loaded

PRECONDITIONS:
- Email and password from FGPV-002

ACTION:
Enter email and password. Click "Sign In" (or equivalent).

EXPECTED RESULT:
POST /api/auth/pre-login validates credentials. OTP sent to email (and/or WhatsApp). UI transitions to Step 2 (OTP entry).

VISIBLE EVIDENCE:
- 6-digit OTP input boxes appear
- Masked email shown (e.g., "s***e@gmail.com")
- OTP channel indicated (email/WhatsApp)
- "Resend code" option available

IF PASS:
FGPV-005

IF FAIL:
- If "Invalid credentials" → verify email and password match signup
- If "Account not active" → check user.isActive in database
- If no OTP received → check SMTP configuration and logs

STOP CONDITION:
Cannot authenticate after 3 attempts OR OTP delivery system is down

DEPENDENCIES:
FGPV-003, SMTP (for email OTP), Twilio (for WhatsApp OTP)

SYSTEMS TOUCHED:
Auth API (pre-login), AuthOTPService, SMTP/Twilio

EXTERNAL SERVICES:
SMTP (Gmail), Twilio (WhatsApp/SMS)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-005 — Enter OTP Code (Step 2 of MFA)

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-004 complete — OTP sent, OTP input displayed

PRECONDITIONS:
- OTP code received via email or WhatsApp
- Code is 6 digits
- Code has not expired

ACTION:
Enter the 6-digit OTP code in the input boxes. Submit.

EXPECTED RESULT:
POST /api/auth/verify-mfa-otp validates the code. If valid, returns confirmToken. signIn('mfa-confirm') creates session. Redirect based on setup status.

VISIBLE EVIDENCE:
- If setup incomplete: redirect to /setup (setup wizard)
- If setup complete: redirect to /dashboard
- Session cookie set

IF PASS:
FGPV-006

IF FAIL:
- If "Invalid or expired code" → click "Resend code" and try again
- If "Too many attempts" → wait a few minutes, then resend
- If "Code expired" → resend and try again

STOP CONDITION:
OTP system completely non-functional after 3 resend attempts

DEPENDENCIES:
FGPV-004

SYSTEMS TOUCHED:
Auth API (verify-mfa-otp), NextAuth (mfa-confirm provider), AuthOTPService

EXTERNAL SERVICES:
None (OTP already delivered)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-006 — View Setup Wizard

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-005 complete — logged in, redirected to /setup

PRECONDITIONS:
- Session active
- Business exists but setup incomplete

ACTION:
View the setup wizard page at /setup

EXPECTED RESULT:
Setup wizard displays progress:
- hasMenu: false (initially)
- hasTables: false (initially)
- hasPaymentConfig: false (initially)
- hasStaff: false (initially)
- percentComplete: 0%
- Next action highlighted

VISIBLE EVIDENCE:
- Progress bar at 0%
- 4 step cards: Add Menu, Configure Tables, Configure Payment Settings, Add Staff
- "Next Step" highlight box

IF PASS:
FGPV-007

IF FAIL:
- If redirected to /dashboard → setup may already be complete (check /api/business/setup-status)
- If error → check API connectivity

STOP CONDITION:
Setup wizard cannot load

DEPENDENCIES:
FGPV-005

SYSTEMS TOUCHED:
Setup API (/api/business/setup-status), Business model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-007 — Configure Payment Settings

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-006 complete — setup wizard displayed

PRECONDITIONS:
- Business exists
- Owner logged in

ACTION:
1. Click "Continue" on "Configure Payment Settings" step (or navigate to /dashboard/payment-settings)
2. Select Tax Display Mode: INCLUSIVE (recommended for Rwanda) or EXCLUSIVE
3. Set Tax Rate: 18% (Rwanda default)
4. Select Currency: RWF
5. Click "Save Settings"

EXPECTED RESULT:
PUT /api/business/[id]/settings saves tax mode, tax rate, currency. TaxConfiguration synced.

VISIBLE EVIDENCE:
- Success toast: "Settings saved successfully!"
- Settings persist on page reload
- Setup wizard shows hasPaymentConfig: true

IF PASS:
FGPV-008

IF FAIL:
- If "No business associated" → check user.businessId in database
- If save fails → check API logs and database connection

STOP CONDITION:
Cannot configure payment settings

DEPENDENCIES:
FGPV-006

SYSTEMS TOUCHED:
Business Settings API, TaxConfiguration, Business model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-008 — Configure Business Profile

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-007 complete — payment settings saved

PRECONDITIONS:
- Business exists

ACTION:
1. Navigate to /dashboard/profile
2. Fill in business details (name, address, phone, WhatsApp number, description)
3. Save

EXPECTED RESULT:
Business profile updated.

VISIBLE EVIDENCE:
- Profile page shows saved data
- Data persists on reload

IF PASS:
FGPV-009

IF FAIL:
- If save fails → check API logs

STOP CONDITION:
Cannot save business profile

DEPENDENCIES:
FGPV-007

SYSTEMS TOUCHED:
Business Profile API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-009 — Enable QR Ordering

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-008 complete — business profile saved

PRECONDITIONS:
- Business exists

ACTION:
1. Navigate to /dashboard/settings
2. Enable QR In-Venue ordering (enableQRInVenue = true)
3. Optionally enable QR Remote ordering (enableQRRemote = true)
4. Save settings

EXPECTED RESULT:
Business settings updated with QR modes enabled.

VISIBLE EVIDENCE:
- Settings saved confirmation
- QR ordering enabled indicators

IF PASS:
FGPV-010 (Session A complete — proceed to Session B or C)

IF FAIL:
- If settings page doesn't load → check route access
- If save fails → check API logs

STOP CONDITION:
Cannot enable QR ordering

DEPENDENCIES:
FGPV-008

SYSTEMS TOUCHED:
Business Settings API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------

## SESSION B: TEAM & PERMISSIONS

--------------------------------------------------
STEP FGPV-010 — Navigate to Staff Management

ROLE:
Founder (as business owner)

STARTING STATE:
Session A complete — owner logged in, business configured

PRECONDITIONS:
- Owner session active

ACTION:
Navigate to /dashboard/staff

EXPECTED RESULT:
Staff management page loads with empty staff list (or showing only owner).

VISIBLE EVIDENCE:
Staff list page with "Add Staff" or "Invite" button

IF PASS:
FGPV-011

IF FAIL:
- If redirected → check role permissions
- If error → check API connectivity

STOP CONDITION:
Cannot access staff management

DEPENDENCIES:
FGPV-009

SYSTEMS TOUCHED:
Staff API, StaffRole model

EXTERNAL SERVICES:
SMTP (for staff invites)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-011 — Create Manager

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-010 complete — staff page loaded

PRECONDITIONS:
- Owner session active
- Email for test manager account

ACTION:
1. Click "Add Staff" or "Invite"
2. Fill in: Name, Email, Phone
3. Select role: Manager
4. Submit

EXPECTED RESULT:
POST /api/staff creates staff member with 'manager' role. Invitation sent via email.

VISIBLE EVIDENCE:
- New staff member appears in staff list with "Manager" role
- Invitation email sent (check inbox)

IF PASS:
FGPV-012

IF FAIL:
- If "email already exists" → use a different email
- If API error → check logs

STOP CONDITION:
Cannot create staff after 3 attempts

DEPENDENCIES:
FGPV-010

SYSTEMS TOUCHED:
Staff API, User model, StaffRole assignment

EXTERNAL SERVICES:
SMTP (invitation email)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-012 — Create Waiter

ROLE:
Founder (as business owner)

STARTING STATE:
FGPVV-011 complete — manager created

PRECONDITIONS:
- Owner session active
- Email for test waiter account

ACTION:
1. Click "Add Staff"
2. Fill in: Name, Email, Phone
3. Select role: Waiter / Staff
4. Submit

EXPECTED RESULT:
POST /api/staff creates staff member with 'waiter_staff' role.

VISIBLE EVIDENCE:
- New staff member appears in staff list with "Waiter" role

IF PASS:
FGPV-013

IF FAIL:
Same as FGPV-011

STOP CONDITION:
Cannot create waiter

DEPENDENCIES:
FGPV-011

SYSTEMS TOUCHED:
Staff API

EXTERNAL SERVICES:
SMTP

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-013 — Create Kitchen Staff

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-012 complete — waiter created

PRECONDITIONS:
- Owner session active
- Email for test kitchen account

ACTION:
1. Click "Add Staff"
2. Fill in: Name, Email, Phone
3. Select role: Kitchen / Operations
4. Submit

EXPECTED RESULT:
POST /api/staff creates staff member with 'kitchen_operations' role.

VISIBLE EVIDENCE:
- New staff member appears in staff list with "Kitchen" role
- Staff list now shows: Owner, Manager, Waiter, Kitchen

IF PASS:
FGPV-014

IF FAIL:
Same as FGPV-011

STOP CONDITION:
Cannot create kitchen staff

DEPENDENCIES:
FGPV-012

SYSTEMS TOUCHED:
Staff API

EXTERNAL SERVICES:
SMTP

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-014 — Verify Manager Permissions

ROLE:
Founder (logging in as Manager)

STARTING STATE:
FGPV-013 complete — all staff created

PRECONDITIONS:
- Manager account exists with credentials
- Manager can receive OTP

ACTION:
1. Logout as Owner
2. Login as Manager (credentials → OTP → MFA)
3. Navigate dashboard
4. Try to access /dashboard/payment-settings and change settings
5. Try to process a refund

EXPECTED RESULT:
- Manager sees dashboard with operational sections
- Manager CAN view payment settings (read-only)
- Manager CANNOT save payment settings (settings.manage = false)
- Manager CANNOT process refunds (orders.refund = false)

VISIBLE EVIDENCE:
- Manager dashboard loads
- Settings page shows read-only or save button disabled/hidden
- Refund option not available in orders

IF PASS:
FGPV-015

IF FAIL:
- If Manager CAN change settings → STOP (security boundary violated)
- If Manager CAN process refunds → STOP (security boundary violated)

STOP CONDITION:
Manager can access unauthorized functions (settings.manage or orders.refund)

DEPENDENCIES:
FGPV-013

SYSTEMS TOUCHED:
Permission middleware, route guards

EXTERNAL SERVICES:
SMTP/Twilio (OTP for manager login)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-015 — Verify Waiter Permissions

ROLE:
Founder (logging in as Waiter)

STARTING STATE:
FGPV-014 complete — manager permissions verified

PRECONDITIONS:
- Waiter account exists with credentials

ACTION:
1. Logout as Manager
2. Login as Waiter
3. Navigate to /dashboard/waiter — should work
4. Try to access /dashboard/kitchen — should redirect
5. Try to access /dashboard/transactions — should redirect or show no data

EXPECTED RESULT:
- Waiter sees waiter workflow page
- Waiter CANNOT access kitchen display (redirected to /dashboard)
- Waiter CANNOT see payments/transactions

VISIBLE EVIDENCE:
- Waiter dashboard loads with order queue
- Kitchen page redirects to /dashboard
- Transactions page redirects or shows no access

IF PASS:
FGPV-016

IF FAIL:
- If Waiter CAN access kitchen → STOP (security boundary violated)
- If Waiter CAN see payments → STOP (security boundary violated)

STOP CONDITION:
Waiter can access unauthorized functions

DEPENDENCIES:
FGPV-014

SYSTEMS TOUCHED:
Route guards (getServerSideProps), permission middleware

EXTERNAL SERVICES:
SMTP/Twilio

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-016 — Verify Kitchen Permissions

ROLE:
Founder (logging in as Kitchen Staff)

STARTING STATE:
FGPV-015 complete — waiter permissions verified

PRECONDITIONS:
- Kitchen account exists with credentials

ACTION:
1. Logout as Waiter
2. Login as Kitchen Staff
3. Navigate to /dashboard/kitchen — should work
4. Try to access /dashboard/transactions — should redirect
5. Try to access /dashboard/reports — should redirect

EXPECTED RESULT:
- Kitchen sees KDS (kitchen display)
- Kitchen CANNOT see payments/transactions
- Kitchen CANNOT see reports

VISIBLE EVIDENCE:
- Kitchen display loads with 6 columns
- Transactions page redirects
- Reports page redirects

IF PASS:
FGPV-017 (Session B complete — proceed to Session C)

IF FAIL:
- If Kitchen CAN access payments → STOP (security boundary violated)
- If Kitchen CAN access reports → STOP (security boundary violated)

STOP CONDITION:
Kitchen can access unauthorized functions

DEPENDENCIES:
FGPV-015

SYSTEMS TOUCHED:
Route guards, permission middleware

EXTERNAL SERVICES:
SMTP/Twilio

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------

## SESSION C: MENU, TABLES & QR

--------------------------------------------------
STEP FGPV-017 — Create Menu Category

ROLE:
Founder (as business owner)

STARTING STATE:
Session B complete — all roles verified

PRECONDITIONS:
- Owner logged in
- Business configured

ACTION:
1. Login as Owner
2. Navigate to /dashboard/menu/dynamic-edit
3. Create a new category (e.g., "Main Dishes", "Beverages", "Desserts")

EXPECTED RESULT:
Category created in database.

VISIBLE EVIDENCE:
- Category appears in menu editor
- Category can be selected when creating items

IF PASS:
FGPV-018

IF FAIL:
- If menu editor doesn't load → check route
- If category creation fails → check API

STOP CONDITION:
Cannot create menu categories

DEPENDENCIES:
FGPV-009

SYSTEMS TOUCHED:
Menu API, MenuItem model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-018 — Create Menu Items

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-017 complete — category exists

PRECONDITIONS:
- Category exists

ACTION:
1. In menu editor, add new menu items:
   - Item 1: Name (e.g., "Beef Stew"), Price (e.g., 5000 RWF = 500000 cents), Cost (e.g., 3000 RWF), Category, Available
   - Item 2: Name (e.g., "Rice & Beans"), Price, Cost, Category, Available
   - Item 3: Name (e.g., "Fresh Juice"), Price, Cost, Category, Available
2. Save each item

EXPECTED RESULT:
Menu items created with name, priceCents, costCents, category, availability.

VISIBLE EVIDENCE:
- Items appear in menu editor
- Items show correct prices and categories

IF PASS:
FGPV-019

IF FAIL:
- If item creation fails → check API and required fields
- If price not in cents → verify priceCents field

STOP CONDITION:
Cannot create menu items

DEPENDENCIES:
FGPV-017

SYSTEMS TOUCHED:
Menu API, MenuItem model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-019 — Create Tables

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-018 complete — menu items exist

PRECONDITIONS:
- Business configured

ACTION:
1. Navigate to /dashboard/tables
2. Create tables:
   - Table 1: Number "1", Capacity 4, Status AVAILABLE
   - Table 2: Number "2", Capacity 6, Status AVAILABLE
   - Table 3: Number "3", Capacity 2, Status AVAILABLE
3. Save

EXPECTED RESULT:
Tables created in database.

VISIBLE EVIDENCE:
- Tables appear in table list
- Each table shows number, capacity, status

IF PASS:
FGPV-020

IF FAIL:
- If table creation fails → check API
- If tables don't appear → refresh page

STOP CONDITION:
Cannot create tables

DEPENDENCIES:
FGPV-009

SYSTEMS TOUCHED:
Tables API, Table model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-020 — Generate QR Codes

ROLE:
Founder (as business owner)

STARTING STATE:
FGPV-019 complete — tables exist

PRECONDITIONS:
- Tables exist
- QR ordering enabled (FGPV-009)
- IMBONI_QR_SECRET configured

ACTION:
1. Navigate to /dashboard/qr-builder
2. Select a table (e.g., Table 1)
3. Generate QR code (in-venue mode)
4. Repeat for each table
5. Download or display QR codes

EXPECTED RESULT:
HMAC-signed QR codes generated for each table. URL format: /order?branchId=...&tableId=...&version=1&signature=...

VISIBLE EVIDENCE:
- QR code images displayed
- QR codes can be downloaded
- URL contains branchId, tableId, signature

IF PASS:
FGPV-021

IF FAIL:
- If QR generation fails → check IMBONI_QR_SECRET
- If no tables shown → verify FGPV-019

STOP CONDITION:
Cannot generate QR codes

DEPENDENCIES:
FGPV-019, IMBONI_QR_SECRET

SYSTEMS TOUCHED:
QR Builder, QR token service, HMAC signing

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-021 — Test QR Scan

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-020 complete — QR codes generated

PRECONDITIONS:
- QR code accessible (image or URL)
- Phone with camera OR browser to open URL directly

ACTION:
1. Scan QR code with phone camera (OR open the QR URL in browser)
2. URL opens: /order?branchId=...&tableId=...&version=1&signature=...&mode=invenue

EXPECTED RESULT:
- Token exchange: POST /api/public/order/token validates HMAC signature
- accessToken generated (10 min expiry)
- Menu fetched: GET /api/public/menu?branchId=...
- Order page loads with menu items

VISIBLE EVIDENCE:
- /order page loads
- Menu items displayed with names, prices, descriptions
- Cart icon/button visible
- Table number shown (if associated)

IF PASS:
FGPV-022 (Session C complete — proceed to Session D)

IF FAIL:
- If "Invalid QR signature" → verify IMBONI_QR_SECRET matches between generation and validation
- If "Business not found" → verify branchId is correct
- If "In-venue QR ordering not enabled" → verify enableQRInVenue = true (FGPV-009)
- If menu empty → verify menu items exist and are available (FGPV-018)

STOP CONDITION:
QR scan does not load the menu

DEPENDENCIES:
FGPV-020

SYSTEMS TOUCHED:
QR token API, public menu API, order page

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------

## SESSION D: GUEST DINING

--------------------------------------------------
STEP FGPV-022 — Browse Menu and Add to Cart

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-021 complete — order page loaded with menu

PRECONDITIONS:
- accessToken valid (10 min window)
- Menu items visible

ACTION:
1. Browse menu items
2. Click on an item to see details
3. Add item to cart (quantity 1)
4. Add a second item to cart
5. Adjust quantities (increase/decrease)
6. Set participant name (optional for in-venue)

EXPECTED RESULT:
Items added to cart. Cart total calculated. Participant name set.

VISIBLE EVIDENCE:
- Cart shows items with quantities
- Cart total displayed in business currency
- Participant name field visible

IF PASS:
FGPV-023

IF FAIL:
- If cart doesn't update → check JavaScript console for errors
- If prices wrong → verify priceCents in database

STOP CONDITION:
Cart functionality non-functional

DEPENDENCIES:
FGPV-021

SYSTEMS TOUCHED:
Order page (client-side state), public menu API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-023 — Place Order

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-022 complete — cart has items

PRECONDITIONS:
- Cart has at least 1 item
- accessToken valid

ACTION:
1. Click "Place Order" or "Submit Order"
2. POST /api/public/order/draft is called with cart items, accessToken, branchId, tableSessionId

EXPECTED RESULT:
Draft order created. Sale record created with PENDING payment status. Kitchen dispatch triggered automatically.

VISIBLE EVIDENCE:
- Order confirmation page loads (/order/confirmation?orderId=...)
- Order number displayed
- Order status shown (pending/accepted)
- ETA displayed

IF PASS:
FGPV-024

IF FAIL:
- If "Missing access token" → token may have expired, re-scan QR
- If "Cart is empty" → add items first
- If API error → check server logs

STOP CONDITION:
Cannot place order

DEPENDENCIES:
FGPV-022

SYSTEMS TOUCHED:
Order draft API, Sale creation, KitchenDispatchService, DiningSessionSlipService

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-024 — Verify Kitchen Received Order

ROLE:
Founder (as owner/kitchen staff)

STARTING STATE:
FGPV-023 complete — order placed

PRECONDITIONS:
- Order placed successfully
- Kitchen staff or owner can login

ACTION:
1. Open a new browser tab or window
2. Login as Owner (or Kitchen Staff)
3. Navigate to /dashboard/kitchen

EXPECTED RESULT:
Order appears in the "Pending" column of the KDS with:
- Order number
- Table number
- Items with quantities
- Elapsed time
- Order source (QR_IN_VENUE)

VISIBLE EVIDENCE:
- Kitchen display shows the new order in Pending column
- Order details match what was ordered

IF PASS:
FGPV-025

IF FAIL:
- If order not in kitchen → check KitchenDispatchService logs
- If kitchen page empty → refresh or check polling

STOP CONDITION:
Order not reaching kitchen display

DEPENDENCIES:
FGPV-023

SYSTEMS TOUCHED:
Kitchen Display, KitchenDispatchService, Pusher (optional)

EXTERNAL SERVICES:
Pusher (optional — polling fallback)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-025 — Add More Items (Second Order)

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-024 complete — first order in kitchen

PRECONDITIONS:
- Guest session still active (same browser tab)
- Dining session active

ACTION:
1. Return to /order page (same session)
2. Add more items to cart
3. Place a second order

EXPECTED RESULT:
Second order created. Items added to the same DiningSessionSlip. Running bill updated.

VISIBLE EVIDENCE:
- Second order confirmation
- Running bill on checkout page shows both orders
- Kitchen receives second order

IF PASS:
FGPV-026 (Session D complete — proceed to Session E)

IF FAIL:
- If cannot place second order → check session validity
- If running bill not updated → check DiningSessionSlipService

STOP CONDITION:
Cannot place multiple orders in one session

DEPENDENCIES:
FGPV-024

SYSTEMS TOUCHED:
Order draft API, DiningSessionSlipService

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------

## SESSION E: KITCHEN & PROMISE ENGINE

--------------------------------------------------
STEP FGPV-026 — Accept Order in Kitchen

ROLE:
Founder (as kitchen staff)

STARTING STATE:
Session D complete — orders in kitchen pending column

PRECONDITIONS:
- Kitchen display loaded
- Order in Pending column

ACTION:
Click "Accept" on the order in the Pending column.

EXPECTED RESULT:
POST /api/kitchen/update-status updates order to 'accepted'. Order moves to Accepted column.

VISIBLE EVIDENCE:
- Order moves from Pending to Accepted column
- Elapsed timer continues

IF PASS:
FGPV-027

IF FAIL:
- If button doesn't work → check API connectivity
- If order doesn't move → refresh page

STOP CONDITION:
Cannot transition kitchen order status

DEPENDENCIES:
FGPV-024

SYSTEMS TOUCHED:
Kitchen update-status API, Sale model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-027 — Start Preparation

ROLE:
Founder (as kitchen staff)

STARTING STATE:
FGPV-026 complete — order in Accepted column

PRECONDITIONS:
- Order in Accepted column

ACTION:
Click "Start Prep" on the order.

EXPECTED RESULT:
Order moves to Preparing column. If kitchen consumption engine is enabled, inventory is deducted.

VISIBLE EVIDENCE:
- Order moves to Preparing column
- Timer continues

IF PASS:
FGPV-028

IF FAIL:
Same as FGPV-026

STOP CONDITION:
Cannot start preparation

DEPENDENCIES:
FGPV-026

SYSTEMS TOUCHED:
Kitchen update-status API, inventory consumption (if enabled)

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-028 — Mark Almost Ready

ROLE:
Founder (as kitchen staff)

STARTING STATE:
FGPV-027 complete — order in Preparing column

PRECONDITIONS:
- Order in Preparing column

ACTION:
Click "Almost Ready" on the order.

EXPECTED RESULT:
Order moves to Almost Ready column.

VISIBLE EVIDENCE:
- Order moves to Almost Ready column

IF PASS:
FGPV-029

IF FAIL:
Same as FGPV-026

STOP CONDITION:
Cannot mark almost ready

DEPENDENCIES:
FGPV-027

SYSTEMS TOUCHED:
Kitchen update-status API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-029 — Mark Ready (Promise Fulfilled)

ROLE:
Founder (as kitchen staff)

STARTING STATE:
FGPV-028 complete — order in Almost Ready column

PRECONDITIONS:
- Order in Almost Ready column

ACTION:
Click "Mark Ready" on the order.

EXPECTED RESULT:
Order moves to Ready column. Promise Engine marks the service promise as FULFILLED.

VISIBLE EVIDENCE:
- Order moves to Ready column
- Service Risks dashboard shows promise as fulfilled (if it was in WARNING/CRITICAL)

IF PASS:
FGPV-030

IF FAIL:
Same as FGPV-026

STOP CONDITION:
Cannot mark ready

DEPENDENCIES:
FGPV-028

SYSTEMS TOUCHED:
Kitchen update-status API, Promise Engine

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-030 — Mark Served

ROLE:
Founder (as kitchen staff or waiter)

STARTING STATE:
FGPV-029 complete — order in Ready column

PRECONDITIONS:
- Order in Ready column

ACTION:
Click "Serve" on the order.

EXPECTED RESULT:
Order moves to Served column (terminal state).

VISIBLE EVIDENCE:
- Order moves to Served column
- No further actions available on this order

IF PASS:
FGPV-031

IF FAIL:
Same as FGPV-026

STOP CONDITION:
Cannot mark served

DEPENDENCIES:
FGPV-029

SYSTEMS TOUCHED:
Kitchen update-status API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-031 — Check Service Risks Dashboard

ROLE:
Founder (as owner/manager)

STARTING STATE:
FGPV-030 complete — order served

PRECONDITIONS:
- At least one order processed through kitchen

ACTION:
1. Navigate to /dashboard/operations/service-risks
2. View active risks and today's stats

EXPECTED RESULT:
Service Risks dashboard loads. Shows:
- Active risks (if any orders are in WARNING/CRITICAL)
- Today's stats: total promises, fulfilled, failed, recovered, onTimeRate

VISIBLE EVIDENCE:
- Service Risks page loads
- Stats show at least 1 fulfilled promise
- onTimeRate shows percentage

IF PASS:
FGPV-032

IF FAIL:
- If page doesn't load → check role permissions (OWNER, MANAGER, ADMIN, SUPERVISOR, CHEF, KITCHEN_STAFF)
- If no data → verify orders were dispatched to kitchen

STOP CONDITION:
Service Risks dashboard non-functional

DEPENDENCIES:
FGPV-030

SYSTEMS TOUCHED:
Service Risks API, Promise Engine

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-032 — Check Service Replay

ROLE:
Founder (as owner/manager)

STARTING STATE:
FGPV-031 complete — service risks reviewed

PRECONDITIONS:
- Service events exist (from kitchen processing)

ACTION:
1. Navigate to /dashboard/operations/service-replay
2. Select today's time range
3. View timeline of events
4. Use playback controls (play, pause, skip)

EXPECTED RESULT:
Service Replay loads with timeline of events:
- Order created
- Kitchen dispatch
- Status transitions (accepted, preparing, almost_ready, ready, served)
- Promise events (if any warnings/critical)

VISIBLE EVIDENCE:
- Timeline shows events in chronological order
- Events are color-coded by category
- Playback controls work
- Statistics displayed

IF PASS:
FGPV-033 (Session E complete — proceed to Session F)

IF FAIL:
- If page doesn't load → check role permissions (OWNER, MANAGER, ADMIN, SUPERVISOR)
- If no events → verify kitchen processing occurred
- If playback doesn't work → check JavaScript console

STOP CONDITION:
Service Replay non-functional

DEPENDENCIES:
FGPV-031

SYSTEMS TOUCHED:
Service Replay, TicketEvent log

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------

## SESSION F: PAYMENT & TAP & LEAVE

--------------------------------------------------
STEP FGPV-033 — Navigate to Checkout

ROLE:
Founder (as guest)

STARTING STATE:
Session E complete — orders served

PRECONDITIONS:
- Guest session still active
- DiningSessionSlip has items (runningTotalCents > 0)

ACTION:
1. Return to guest browser tab
2. Navigate to /order/checkout?sessionId=... (or click checkout button)

EXPECTED RESULT:
Checkout page loads with:
- LiveOrderSummary (running bill with all items)
- Phone input for Mobile Money
- Fee information (DIGITAL_PAYMENT_FEE %)
- Tap & Leave button

VISIBLE EVIDENCE:
- Checkout page displays
- Running bill shows all items from all orders
- Subtotal, VAT, and total displayed
- Phone input field visible
- Fee percentage and total to pay shown

IF PASS:
FGPV-034

IF FAIL:
- If "No session found" → verify sessionId in URL
- If "No items in order" → verify orders were placed
- If checkout not available → verify slip status is 'active'

STOP CONDITION:
Checkout page cannot load

DEPENDENCIES:
FGPV-025, InTouch config (FGPV-D002–D005 resolved)

SYSTEMS TOUCHED:
Checkout page, DiningSessionSlip API, fee API

EXTERNAL SERVICES:
None (InTouch needed for payment step)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-034 — Enter Phone and Initiate Tap & Leave

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-033 complete — checkout page loaded

PRECONDITIONS:
- Checkout page loaded
- Running bill > 0
- Valid Mobile Money phone number (078/079/072/073 prefix)
- InTouch sandbox configured (PAYMENTS_PROVIDER="intouch", webhook config set, ngrok running)
- Test Mobile Money account with balance

ACTION:
1. Enter Mobile Money phone number (e.g., 078XXXXXXX)
2. Verify phone validation passes
3. Click "Tap & Leave" button

EXPECTED RESULT:
POST /api/checkout/tap-and-leave:
- Fetches Smart Dining Slip
- Freezes session (active → checkout_initiated)
- Finalizes bill (checkout_initiated → bill_finalized)
- Creates PaymentTransaction (PENDING)
- Calls InTouch API to request payment
- Returns payment status (pending or success)

VISIBLE EVIDENCE:
- Button shows loading state
- Success message: "Payment request sent. Please approve via *182# on your phone."
- Payment ID and amount displayed

IF PASS:
FGPV-035

IF FAIL:
- If "Session already closed" → session may have been completed already
- If "No items in order" → verify slip has items
- If InTouch API error → verify INTOUCH_USERNAME, INTOUCH_PASSWORD, INTOUCH_API_URL
- If "PAYMENTS_PROVIDER" error → verify it's set to "intouch"

STOP CONDITION:
Payment cannot be initiated

DEPENDENCIES:
FGPV-033, InTouch sandbox config, ngrok tunnel

SYSTEMS TOUCHED:
Tap & Leave API, DiningSessionSlipService, InTouchService, PaymentTransaction

EXTERNAL SERVICES:
InTouch API

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-035 — Approve Payment via USSD

ROLE:
Founder (as guest with Mobile Money)

STARTING STATE:
FGPV-034 complete — payment request sent

PRECONDITIONS:
- USSD prompt received on phone
- Mobile Money account has sufficient balance

ACTION:
1. Check phone for USSD prompt (*182# for MTN, *185# for Airtel)
2. Approve the payment

EXPECTED RESULT:
Payment approved on Mobile Money. InTouch processes the payment and sends webhook callback.

VISIBLE EVIDENCE:
- USSD prompt appears on phone
- Payment approved confirmation on phone
- (Backend) InTouch sends POST to webhook URL

IF PASS:
FGPV-036

IF FAIL:
- If no USSD prompt → verify phone number is correct and has Mobile Money
- If prompt expires → retry Tap & Leave
- If insufficient balance → add test balance in InTouch sandbox

STOP CONDITION:
Payment cannot be approved (InTouch sandbox issue)

DEPENDENCIES:
FGPV-034, InTouch sandbox, test Mobile Money account

SYSTEMS TOUCHED:
InTouch payment processing, Mobile Money network

EXTERNAL SERVICES:
InTouch, MTN/Airtel Mobile Money

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-036 — Verify Webhook and Payment Completion

ROLE:
Founder (as owner — checking backend result)

STARTING STATE:
FGPV-035 complete — payment approved on phone

PRECONDITIONS:
- ngrok tunnel running
- INTOUCH_WEBHOOK_USERNAME and INTOUCH_WEBHOOK_PASSWORD set
- INTOUCH_CALLBACK_URL set to ngrok URL + /api/webhooks/intouch

ACTION:
1. Wait for webhook callback (should be near-instant)
2. Login as Owner (in dashboard tab)
3. Navigate to /dashboard/transactions
4. Check the payment transaction

EXPECTED RESULT:
- Webhook received: POST /api/webhooks/intouch
- Basic Auth validated
- PaymentCompletionService processes callback
- PaymentTransaction → SUCCESS
- Sale → COMPLETED
- FinancialLedgerEntry created (PAYMENT_SUCCESS)
- DiningSessionSlip → checkout_completed

VISIBLE EVIDENCE:
- Transaction listed in /dashboard/transactions with SUCCESS status
- Amount matches what was paid
- Payment method shown (MTN_MOBILE_MONEY or AIRTEL_MONEY)

IF PASS:
FGPV-037

IF FAIL:
- If transaction shows PENDING → webhook may not have arrived; check ngrok and INTOUCH_CALLBACK_URL
- If transaction shows FAILED → check InTouch response code
- If webhook returns 401 → verify INTOUCH_WEBHOOK_USERNAME/PASSWORD
- If webhook returns 503 → webhook auth config missing (FGPV-D002/D003)

STOP CONDITION:
Payment remains PENDING after 5 minutes AND webhook not received

DEPENDENCIES:
FGPV-035, webhook tunnel, webhook auth config

SYSTEMS TOUCHED:
Webhook handler, PaymentCompletionService, Sale, PaymentTransaction, FinancialLedgerEntry

EXTERNAL SERVICES:
InTouch (webhook sender), ngrok (tunnel)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-037 — Note Receipt Page Defect

ROLE:
Founder (as guest)

STARTING STATE:
FGPV-036 complete — payment successful

PRECONDITIONS:
- Payment success confirmed in dashboard

ACTION:
1. Return to guest browser tab
2. Observe redirect to /order/receipt?sessionId=...

EXPECTED RESULT:
⚠️ KNOWN DEFECT (FGPV-D001): The /order/receipt page does NOT exist. The guest will see a 404 error.

VISIBLE EVIDENCE:
- 404 page or error message
- This is expected — document it as a known defect

IF PASS:
Document the defect and proceed (the payment itself was successful)

IF FAIL:
This step is about documenting a known defect, not a pass/fail

STOP CONDITION:
None (known defect — does not block financial verification)

DEPENDENCIES:
FGPV-036

SYSTEMS TOUCHED:
N/A (page missing)

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL (must be fixed before Customer #1)

--------------------------------------------------

## SESSION G: FINANCIAL TRUTH & CLOSE DAY

--------------------------------------------------
STEP FGPV-038 — Verify Dashboard Revenue

ROLE:
Founder (as owner)

STARTING STATE:
Session F complete — payment successful

PRECONDITIONS:
- Payment SUCCESS
- Sale COMPLETED

ACTION:
1. Navigate to /dashboard
2. Check revenue widget

EXPECTED RESULT:
Dashboard revenue reflects the completed sale amount.

VISIBLE EVIDENCE:
- Revenue amount matches payment amount
- Revenue is non-zero

IF PASS:
FGPV-039

IF FAIL:
- If revenue is 0 → check if Sale is COMPLETED (not PENDING)
- If revenue doesn't match → check FinancialLedgerEntry

STOP CONDITION:
Dashboard revenue does not match payment amount

DEPENDENCIES:
FGPV-036

SYSTEMS TOUCHED:
Dashboard API, Sale aggregation, FinancialLedgerEntry

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-039 — View Z-Report

ROLE:
Founder (as owner)

STARTING STATE:
FGPV-038 complete — dashboard revenue verified

PRECONDITIONS:
- Completed sales exist for the day

ACTION:
1. Navigate to /dashboard/close-day
2. View Z-Report for today

EXPECTED RESULT:
Z-Report displays with:
- totalRevenueCents (from Sales)
- ledgerTotalRevenueCents (from FinancialLedgerEntry)
- ledgerVarianceCents = 0
- Payment breakdown by method
- Order source breakdown
- Tax calculation (VAT)
- Pending orders count
- Reservation counts

VISIBLE EVIDENCE:
- Z-Report loads with all sections
- totalRevenueCents matches payment
- ledgerTotalRevenueCents matches totalRevenueCents
- **ledgerVarianceCents = 0**
- Payment method shows MTN_MOBILE_MONEY or AIRTEL_MONEY with correct amount

IF PASS:
FGPV-040

IF FAIL:
- If ledgerVarianceCents ≠ 0 → STOP (financial truth violated)
- If Z-Report empty → verify sales are COMPLETED and within day boundary
- If tax calculation wrong → verify taxMode and taxRate

STOP CONDITION:
ledgerVarianceCents ≠ 0 (financial truth violation)

DEPENDENCIES:
FGPV-038

SYSTEMS TOUCHED:
Close-day API, Sale aggregation, FinancialLedgerEntry aggregation, timezone-aware day boundary

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-040 — Close the Day

ROLE:
Founder (as owner)

STARTING STATE:
FGPV-039 complete — Z-Report verified, variance = 0

PRECONDITIONS:
- Z-Report shows correct data
- ledgerVarianceCents = 0
- Day not already closed

ACTION:
1. Click "Close Day" button
2. Confirm the action

EXPECTED RESULT:
POST /api/reports/close-day creates audit log entry with action=CLOSE_DAY. Day is marked as closed.

VISIBLE EVIDENCE:
- Success confirmation
- Close-day button disabled or shows "Already Closed"
- Audit log entry created

IF PASS:
FGPV-041

IF FAIL:
- If close fails → check API logs
- If "already closed" → day was closed in a prior attempt

STOP CONDITION:
Cannot close the day

DEPENDENCIES:
FGPV-039

SYSTEMS TOUCHED:
Close-day API, AuditLog

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-041 — Verify Double-Close Prevention

ROLE:
Founder (as owner)

STARTING STATE:
FGPV-040 complete — day closed

PRECONDITIONS:
- Day already closed

ACTION:
1. Try to close the day again
2. Check if the system prevents double-close

EXPECTED RESULT:
System indicates the day is already closed. No second audit log entry created.

VISIBLE EVIDENCE:
- "Already closed" indicator or button disabled
- No duplicate close action

IF PASS:
FGPV-042 (Session G complete — proceed to Session H)

IF FAIL:
- If double-close succeeds → STOP (data integrity issue)

STOP CONDITION:
Double-close is allowed (data integrity violation)

DEPENDENCIES:
FGPV-040

SYSTEMS TOUCHED:
Close-day API, AuditLog

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------

## SESSION H: EXECUTIVE REVIEW

--------------------------------------------------
STEP FGPV-042 — Review CEO Dashboard

ROLE:
Founder (as owner/CEO)

STARTING STATE:
Session G complete — day closed, financial data exists

PRECONDITIONS:
- Financial data from completed sales
- FinancialLedgerEntry records exist

ACTION:
1. Navigate to /dashboard/ceo
2. Review business health score
3. Review revenue metrics (MRR, GMV, growth)
4. Review customer metrics
5. Review operations metrics

EXPECTED RESULT:
CEO dashboard loads with metrics derived from FinancialLedgerEntry:
- Business health score
- Revenue figures matching Z-Report
- Customer health distribution
- Operations health

VISIBLE EVIDENCE:
- CEO dashboard loads
- Revenue metrics match Z-Report total
- Health score displayed
- Insights generated

IF PASS:
FGPV-043

IF FAIL:
- If dashboard empty → verify FinancialLedgerEntry records exist
- If metrics don't match → check CEO API data source
- If page error → check console

STOP CONDITION:
CEO dashboard shows incorrect financial data (mismatch with Z-Report)

DEPENDENCIES:
FGPV-041

SYSTEMS TOUCHED:
CEO Dashboard API, FinancialLedgerEntry

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-043 — Review CFO Dashboard

ROLE:
Founder (as owner/CFO)

STARTING STATE:
FGPV-042 complete — CEO dashboard reviewed

PRECONDITIONS:
- Financial data exists

ACTION:
1. Navigate to /dashboard/cfo
2. Review financial metrics
3. Verify reconciliation status

EXPECTED RESULT:
CFO dashboard loads with financial metrics matching Z-Report.

VISIBLE EVIDENCE:
- CFO dashboard loads
- Financial metrics displayed
- Reconciliation status shown

IF PASS:
FGPV-044

IF FAIL:
- If dashboard empty → verify financial data
- If error → check console

STOP CONDITION:
CFO dashboard shows incorrect financial data

DEPENDENCIES:
FGPV-042

SYSTEMS TOUCHED:
CFO Dashboard API, FinancialLedgerEntry

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-044 — Review Reports and Analytics

ROLE:
Founder (as owner)

STARTING STATE:
FGPV-043 complete — CFO dashboard reviewed

PRECONDITIONS:
- Operational and financial data exist

ACTION:
1. Navigate to /dashboard/reports
2. Review operational reports
3. Navigate to /dashboard/analytics/menu-performance
4. Navigate to /dashboard/analytics/peak-hours
5. Navigate to /dashboard/analytics/payments

EXPECTED RESULT:
Reports and analytics pages load with data from completed operations.

VISIBLE EVIDENCE:
- Reports page shows operational data
- Menu performance shows item-level metrics
- Peak hours show time-based distribution
- Payment analytics show transaction breakdown

IF PASS:
FGPV-045 (Session H complete — proceed to Session I or parallel branches)

IF FAIL:
- If pages empty → verify operational data exists
- If error → check console and API

STOP CONDITION:
Reports show incorrect data

DEPENDENCIES:
FGPV-043

SYSTEMS TOUCHED:
Reports API, Analytics API

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------

## SESSION I: SECURITY & FAILURE (Can run in parallel after Session B)

--------------------------------------------------
STEP FGPV-045 — Test Invalid QR

ROLE:
Founder (as guest)

STARTING STATE:
Session C complete — valid QR codes exist

PRECONDITIONS:
- Valid QR URL known

ACTION:
1. Take a valid QR URL and modify the signature parameter
2. Open the modified URL in browser

EXPECTED RESULT:
POST /api/public/order/token returns 401: "Invalid QR signature"

VISIBLE EVIDENCE:
- Error message: "Invalid QR signature" or "Failed to obtain access token"
- Menu does NOT load
- No access granted

IF PASS:
FGPV-046

IF FAIL:
- If menu loads with invalid signature → STOP (security boundary violated)

STOP CONDITION:
Invalid QR grants access to menu

DEPENDENCIES:
FGPV-021

SYSTEMS TOUCHED:
QR token API, HMAC validation

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-046 — Test Payment Failure

ROLE:
Founder (as guest)

STARTING STATE:
Session F complete — successful payment verified

PRECONDITIONS:
- InTouch sandbox configured
- Can initiate another payment

ACTION:
1. Place a new order (or use existing pending order)
2. Initiate Tap & Leave
3. Do NOT approve the USSD prompt (let it fail or timeout)

EXPECTED RESULT:
Payment remains PENDING or transitions to FAILED. No FinancialLedgerEntry created. Sale remains PENDING.

VISIBLE EVIDENCE:
- Transaction shows PENDING or FAILED in /dashboard/transactions
- No new revenue in dashboard
- No new FinancialLedgerEntry

IF PASS:
FGPV-047

IF FAIL:
- If failed payment creates revenue → STOP (financial truth violated)
- If failed payment creates ledger entry → STOP (financial truth violated)

STOP CONDITION:
Failed payment creates revenue or ledger entry

DEPENDENCIES:
FGPV-036

SYSTEMS TOUCHED:
PaymentTransaction, Sale, FinancialLedgerEntry

EXTERNAL SERVICES:
InTouch (sandbox)

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-047 — Test Reservation Lifecycle

ROLE:
Founder (as manager/owner)

STARTING STATE:
Session C complete — tables exist

PRECONDITIONS:
- Tables exist with AVAILABLE status

ACTION:
1. Navigate to /dashboard/reservations
2. Create a reservation (name, phone, date, time, party size, table)
3. Confirm the reservation
4. Verify table shows RESERVED
5. Complete the reservation
6. Verify table shows AVAILABLE
7. Create another reservation
8. Cancel it
9. Verify table shows AVAILABLE

EXPECTED RESULT:
- Reservation created with confirmation code
- Confirm → table RESERVED
- Complete → table AVAILABLE
- Cancel → table AVAILABLE

VISIBLE EVIDENCE:
- Reservations list shows all statuses
- Table status changes correspond to reservation actions

IF PASS:
FGPV-048

IF FAIL:
- If table not reserved on confirm → check ReservationService.confirmReservation
- If table not released on complete → check ReservationService.completeReservation

STOP CONDITION:
Reservation lifecycle does not manage table status correctly

DEPENDENCIES:
FGPV-019

SYSTEMS TOUCHED:
Reservations API, ReservationService, Table model

EXTERNAL SERVICES:
Twilio (notification — optional)

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-048 — Test Logout

ROLE:
Founder (as any role)

STARTING STATE:
Any session with active login

PRECONDITIONS:
- Session active

ACTION:
1. Click logout
2. Try to navigate back to /dashboard

EXPECTED RESULT:
- Session destroyed
- Redirected to /login
- /dashboard redirects to /login (no access without session)

VISIBLE EVIDENCE:
- Login page displayed after logout
- Dashboard inaccessible after logout

IF PASS:
FGPV-049

IF FAIL:
- If dashboard accessible after logout → STOP (session management failure)

STOP CONDITION:
Session persists after logout

DEPENDENCIES:
Any prior login

SYSTEMS TOUCHED:
NextAuth signOut, session management

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------
STEP FGPV-049 — Test Inventory Management

ROLE:
Founder (as owner)

STARTING STATE:
Session A complete — business configured

PRECONDITIONS:
- Owner logged in

ACTION:
1. Navigate to /dashboard/inventory
2. Create an inventory item (name, category, unit, stock, min level, reorder level, cost)
3. Adjust stock (update quantity)
4. Navigate to /dashboard/inventory-alerts
5. Check for low-stock alerts

EXPECTED RESULT:
- Inventory item created
- Stock adjustment recorded
- Low-stock alerts appear for items below min level

VISIBLE EVIDENCE:
- Item in inventory list
- Updated stock level
- Alert in inventory-alerts page (if item below min)

IF PASS:
FGPV-050

IF FAIL:
- If item creation fails → check API
- If alerts don't appear → verify item is below minStockLevel

STOP CONDITION:
Inventory management non-functional

DEPENDENCIES:
FGPV-009

SYSTEMS TOUCHED:
Inventory API, InventoryItem model, InventoryUpdate model

EXTERNAL SERVICES:
None

CUSTOMER #1 RELEVANCE:
IMPORTANT

--------------------------------------------------
STEP FGPV-050 — Final Verification Summary

ROLE:
Founder (as owner)

STARTING STATE:
All prior steps completed

PRECONDITIONS:
- All sessions A through I completed

ACTION:
Review the complete journey:
1. Auth: Signup → Login → MFA ✅
2. Business: Configured ✅
3. Team: Staff created, permissions verified ✅
4. Menu: Items created ✅
5. Tables: Created ✅
6. QR: Generated and tested ✅
7. Guest: Ordered from QR ✅
8. Kitchen: Processed through all columns ✅
9. Promise Engine: Observed ✅
10. Service Replay: Reviewed ✅
11. Payment: Tap & Leave successful ✅
12. Financial Truth: Variance = 0 ✅
13. Close Day: Z-Report verified, day closed ✅
14. Executive: CEO/CFO reviewed ✅
15. Security: Boundaries verified ✅
16. Failure: Payment failure handled correctly ✅
17. Reservations: Lifecycle verified ✅
18. Inventory: CRUD verified ✅

EXPECTED RESULT:
All verification points pass. Known defects documented.

VISIBLE EVIDENCE:
Complete journey verified end-to-end

IF PASS:
Journey complete — proceed to Customer #1 gate assessment

IF FAIL:
Document failures and determine if they are blockers

STOP CONDITION:
Any CRITICAL stop condition was triggered during the journey

DEPENDENCIES:
All prior steps

SYSTEMS TOUCHED:
All

EXTERNAL SERVICES:
All configured

CUSTOMER #1 RELEVANCE:
CRITICAL

--------------------------------------------------

## PARALLEL BRANCH STEPS

### Reservations (Can run after FGPV-019)

See FGPV-047 above.

### Inventory (Can run after FGPV-009)

See FGPV-049 above.

### Security (Can run after FGPV-016)

See FGPV-045, FGPV-046, FGPV-048 above.

---

## Step Count Summary

| Session | Steps | Range |
|---|---|---|
| A: Owner Setup | 9 | FGPV-001 to FGPV-009 |
| B: Team & Permissions | 7 | FGPV-010 to FGPV-016 |
| C: Menu, Tables & QR | 5 | FGPV-017 to FGPV-021 |
| D: Guest Dining | 4 | FGPV-022 to FGPV-025 |
| E: Kitchen & Promise Engine | 7 | FGPV-026 to FGPV-032 |
| F: Payment & Tap & Leave | 5 | FGPV-033 to FGPV-037 |
| G: Financial Truth & Close Day | 4 | FGPV-038 to FGPV-041 |
| H: Executive Review | 3 | FGPV-042 to FGPV-044 |
| I: Security & Failure | 6 | FGPV-045 to FGPV-050 |
| **Total** | **50** | FGPV-001 to FGPV-050 |
