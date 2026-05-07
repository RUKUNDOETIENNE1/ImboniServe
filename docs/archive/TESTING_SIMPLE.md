# Quick Testing Guide - Imboni Serve

## Step 1: Launch the Platform

**Double-click: `dev-start-simple.bat`**

Wait 2-3 minutes. The script will:
- Install dependencies
- Connect to Supabase
- Deploy database
- Load demo data
- Start server
- Open browser tabs

## Step 2: Login

Use any of these demo accounts:

**Admin:** admin@imboni.resto / Admin123!
**Owner:** jean@nyamacafe.rw / Owner123!
**Cashier:** marie@nyamacafe.rw / Cashier123!

## Step 3: Check These Pages

### Login Page
- Should show Imboni Serve logo
- Blue and orange colors
- Styled form (not plain HTML)

### Dashboard
- Blue header with logo
- Sales cards with numbers
- Orange/green/gold colored stats
- Recent sales table

### Store (Marketplace)
- Imboni Store logo
- Product cards
- Orange "Add to Cart" buttons

### Admin
- Imboni AI Systems logo
- Platform statistics
- Manage buttons

## Success = All Pages Styled

If you see plain HTML (black text, no colors):
1. Wait 10 seconds
2. Refresh page (Ctrl + F5)
3. If still broken, restart: close dev server window, run script again

## Add Pesapal Keys (Optional)

1. Open `.env` file
2. Find: `PESAPAL_CONSUMER_KEY="your-pesapal-consumer-key-here"`
3. Replace with your actual key
4. Do same for `PESAPAL_CONSUMER_SECRET`
5. Save file
6. Restart platform

## Stop Platform

Close the "Imboni Serve Dev Server" window

## Troubleshooting

**Supabase connection error:**
- Check internet connection
- Verify DATABASE_URL in .env is correct

**Pages not styled:**
- Restart server
- Check that src/pages/_app.tsx exists

**Port 3000 in use:**
- Close other apps using port 3000
- Run script again

That's it! Platform is production-ready once all pages show proper Imboni branding.
