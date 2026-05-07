# Imboni Serve Testing Guide - For Non-Programmers

## 🚀 Quick Start (One-Click Launch)

**Simply double-click `dev-start-simple.bat`**

The script will automatically:
1. ✅ Install everything needed
2. ✅ Connect to your Supabase database
3. ✅ Set up all tables and data
4. ✅ Load demo restaurants, users, and products
5. ✅ Start the platform
6. ✅ Open your browser with 4 tabs

**Wait 2-3 minutes** - you'll see progress messages. When done, your browser opens automatically!

---

## 🔐 Login Credentials (Demo Accounts)

### Admin Account (Full Platform Access)
- **Email:** admin@imboni.resto
- **Password:** Admin123!
- **Can access:** Everything including platform admin

### Restaurant Owner
- **Email:** jean@nyamacafe.rw
- **Password:** Owner123!
- **Can access:** Restaurant dashboard, sales, inventory, reports

### Cashier
- **Email:** marie@nyamacafe.rw
- **Password:** Cashier123!
- **Can access:** Sales, basic reports

---

## ✅ Testing Checklist (What to Test)

### Test 1: Login & Navigation
**Steps:**
1. Go to the Login tab (should open automatically)
2. Enter: `jean@nyamacafe.rw` / `Owner123!`
3. Click "Login"

**Expected Result:**
- ✅ You see a styled login page with Imboni Serve logo
- ✅ After login, you're redirected to a beautiful dashboard
- ✅ Dashboard shows: Today's Sales, Profit, Stock alerts, Staff count
- ✅ All text and buttons are properly styled (not plain HTML)

**If it fails:**
- Wait 10 more seconds (server may still be starting)
- Refresh the page
- Check the "Imboni Serve Dev Server" window for errors

---

### Test 2: Create a Sale
**Steps:**
1. From Dashboard, click "💰 New Sale" button
2. Add menu items (if page exists)
3. Choose payment method: Cash
4. Submit the sale

**Expected Result:**
- ✅ Sale appears in "Recent Sales" table
- ✅ Today's Sales amount increases
- ✅ Profit calculation updates

**Note:** If "New Sale" page doesn't exist yet, this feature is pending implementation.

---

### Test 3: Marketplace (Store)
**Steps:**
1. Click the "Marketplace" or "Store" tab in your browser
2. Browse featured products
3. Click "Add to Cart" on any product

**Expected Result:**
- ✅ Page shows Imboni Store logo at top
- ✅ Products display with images, prices, supplier names
- ✅ Cart icon shows item count
- ✅ No "SessionProvider" errors

---

### Test 4: Admin Dashboard
**Steps:**
1. Logout (if logged in as Owner/Cashier)
2. Login with: `admin@imboni.resto` / `Admin123!`
3. Go to Admin tab or visit: http://localhost:3000/admin

**Expected Result:**
- ✅ Shows Imboni AI Systems logo
- ✅ Platform overview: Total restaurants, users, orders, revenue
- ✅ Buttons to manage restaurants, users, marketplace
- ✅ All styled with Imboni brand colors

---

### Test 5: Multi-Language Support
**Steps:**
1. Look for language switcher (globe icon) on any page
2. Click to switch between English (EN) and Kinyarwanda (RW)

**Expected Result:**
- ✅ UI labels change to selected language
- ✅ Buttons, menus, messages all translate

---

### Test 6: Styling & Branding
**Visual Check - All pages should have:**
- ✅ Imboni Deep Blue (#1B2D65) headers
- ✅ Resto Orange (#E76F51) for highlights and CTAs
- ✅ Imboni logos (Resto, Store, AI Systems) in correct places
- ✅ Clean, modern cards with shadows
- ✅ Proper spacing and typography
- ✅ NO unstyled HTML (like in your screenshots)

---

## 🔧 Troubleshooting

### Problem: Pages show unstyled HTML (plain text)
**Solution:**
1. Check that `src/pages/_app.tsx` exists (not `app.tsx`)
2. Restart the dev server:
   - Close "Imboni Serve Dev Server" window
   - Run `dev-start-simple.bat` again

### Problem: "SessionProvider" error
**Solution:**
- This is fixed by having `_app.tsx` in the right place
- Restart the server if you still see it

### Problem: Can't connect to Supabase
**Solution:**
1. Check your internet connection
2. Verify `.env` file has correct `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://postgres.fvpzgmnqotggopimxrhx:Umugisha1234567890%40%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
   ```
3. Make sure your Supabase project is active (not paused)

### Problem: Logos not showing
**Solution:**
- Logos should be in `public/imgs/` folder
- Refresh your browser (Ctrl + F5)
- Check browser console for 404 errors

### Problem: Server won't start
**Solution:**
1. Check if port 3000 is already in use
2. Close any other Next.js apps
3. Run: `Get-Process -Name "node" | Stop-Process -Force` in PowerShell
4. Run `dev-start-simple.bat` again

---

## 💳 Adding Pesapal Payment Keys

**For non-programmers:**

1. Open the `.env` file (in the project root folder)
2. Find these lines:
   ```
   PESAPAL_CONSUMER_KEY="your-pesapal-consumer-key-here"
   PESAPAL_CONSUMER_SECRET="your-pesapal-consumer-secret-here"
   ```
3. Replace `your-pesapal-consumer-key-here` with your actual key
4. Replace `your-pesapal-consumer-secret-here` with your actual secret
5. Save the file
6. Restart the platform:
   - Close "Imboni Serve Dev Server" window
   - Double-click `dev-start-simple.bat` again

---

## 📊 What to Expect (Feature Checklist)

### ✅ Working Features
- Login with email/password
- Multi-role access (Admin, Owner, Cashier)
- Dashboard with sales metrics
- Marketplace product browsing
- Admin platform overview
- Multi-language (EN/RW)
- Imboni branding and logos
- Supabase cloud database

### 🔄 Features Ready (Need Configuration)
- Pesapal payments (add keys to .env)
- WhatsApp notifications (add Twilio keys to .env)
- Email notifications (add SMTP config to .env)

### 📝 Features Pending Implementation
- Create new sale form
- Inventory management UI
- Reports generation UI
- Real-time dashboard updates
- Table management
- Customer loyalty tracking

---

## 🎯 Success Criteria

**The platform is working correctly if:**

1. ✅ All 4 browser tabs open with styled pages (not plain HTML)
2. ✅ You can login with any demo account
3. ✅ Dashboard shows Imboni Serve logo and blue header
4. ✅ Store shows Imboni Store logo
5. ✅ Admin shows Imboni AI Systems logo
6. ✅ No red error messages about SessionProvider
7. ✅ Colors match Imboni brand (blue, orange, green, gold)

---

## 📞 Need Help?

**If something doesn't work:**
1. Check the "Imboni Serve Dev Server" window for error messages
2. Read the error message carefully
3. Check the troubleshooting section above
4. Make sure you followed all steps in order

**Common mistakes:**
- Not waiting for the script to finish (takes 2-3 minutes)
- Closing the dev server window too early
- Wrong Supabase connection string
- Node.js not installed

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. **Add your Pesapal keys** (see section above)
2. **Add your restaurant data** (replace demo data)
3. **Configure WhatsApp** (optional - for notifications)
4. **Deploy to production** (see DEPLOYMENT_GUIDE.md)

---

## 📝 Testing Notes Template

Use this to track your testing:

```
Date: ___________
Tester: ___________

[ ] Test 1: Login & Navigation - PASS / FAIL
    Notes: _________________________________

[ ] Test 2: Create a Sale - PASS / FAIL
    Notes: _________________________________

[ ] Test 3: Marketplace - PASS / FAIL
    Notes: _________________________________

[ ] Test 4: Admin Dashboard - PASS / FAIL
    Notes: _________________________________

[ ] Test 5: Multi-Language - PASS / FAIL
    Notes: _________________________________

[ ] Test 6: Styling & Branding - PASS / FAIL
    Notes: _________________________________

Overall Status: READY / NEEDS FIXES
```

---

**Remember: Keep the "Imboni Serve Dev Server" window open while testing!**
