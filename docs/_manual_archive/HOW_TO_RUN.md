# How to Run Imboni Serve Platform

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Supabase) configured in `.env`
- All dependencies installed (`npm install`)

## Quick Start

### 1. First-Time Setup (Already Done)
```bash
# Generate Prisma client, push schema, update plans
.\run_affiliate_setup.bat
```

### 2. Start Development Server
```bash
npm run dev
```

**Expected output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Access the Platform
Open your browser and go to: **http://localhost:3000**

---

## Test Accounts (from seed data)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@imboni.resto | Admin123! | Full platform access |
| **Restaurant Owner** | jean@nyamacafe.rw | Owner123! | Restaurant management |
| **Cashier** | marie@nyamacafe.rw | Cashier123! | POS & sales |
| **Kitchen Manager** | eric@nyamacafe.rw | Kitchen123! | Kitchen & inventory |
| **Supplier** | patrick@freshfoods.rw | Supplier123! | Supplier portal |

---

## Key URLs

### Restaurant Features
- Dashboard: http://localhost:3000/dashboard
- Menu: http://localhost:3000/menu
- Sales/POS: http://localhost:3000/sales
- Inventory: http://localhost:3000/inventory
- Customers: http://localhost:3000/customers
- Tables: http://localhost:3000/tables
- Reports: http://localhost:3000/reports
- Subscription: http://localhost:3000/subscription
- Marketplace: http://localhost:3000/marketplace
- Settings: http://localhost:3000/settings

### Admin Features
- Admin Dashboard: http://localhost:3000/admin
- Affiliates: http://localhost:3000/admin/affiliates
- Fee Config: http://localhost:3000/admin/fee-config

### Affiliate Features
- Affiliate Portal: http://localhost:3000/affiliate

### Public Pages
- Home: http://localhost:3000/
- Signup: http://localhost:3000/signup
- Login: http://localhost:3000/login
- Signup with referral: http://localhost:3000/?ref=IMBONI-DEMO

---

## Testing Affiliate System

### 1. Test Referral Tracking
```
1. Visit: http://localhost:3000/?ref=IMBONI-DEMO
2. Sign up a new restaurant account
3. Login as admin (admin@imboni.resto)
4. Go to /admin/affiliates
5. Verify new restaurant is linked to IMBONI-DEMO affiliate
```

### 2. Test Commission Creation
```
1. Login as the new restaurant owner
2. Go to /subscription
3. Make a payment (test with any payment method)
4. Login as admin
5. Go to /admin/affiliates
6. Verify commission created (20% of payment amount)
7. Status should be "pending" with 7-day lock
```

### 3. Test Commission Approval (Auto)
```
- Commissions auto-approve after 7 days via cron job
- Or manually update DB: UPDATE "AffiliateCommission" SET "lockedUntil" = NOW() - INTERVAL '1 day' WHERE status = 'pending'
- Cron runs hourly to approve unlocked commissions
```

### 4. Test Payout Request
```
1. Login as affiliate user (if linked to user account)
2. Go to /affiliate
3. Wait until approved earnings >= 10,000 RWF
4. Click "Request Payout"
5. Login as admin
6. Go to /admin/affiliates
7. See payout request in "Pending Payouts"
8. Click "Mark Paid", enter method and reference
9. Verify payout marked as paid
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error
```
1. Check .env file has correct DATABASE_URL
2. Verify Supabase database is running
3. Test connection: npx prisma db push
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Missing Dependencies
```bash
npm install
```

### Clear Cache and Restart
```bash
# Delete .next folder
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Push schema changes to DB
npx prisma db push

# Open Prisma Studio (DB GUI)
npx prisma studio

# Seed database
npm run db:seed

# Update plans
npm run plans:update
```

---

## Testing Offline Functionality

### 1. Test Offline Sale
```
1. Login as cashier
2. Go to /sales
3. Disconnect internet (turn off WiFi)
4. Create a sale
5. Sale should save locally
6. Reconnect internet
7. Sale should auto-sync to server
8. Verify sale appears in sales history
```

### 2. Check Sync Status
```
- Look for sync indicator in UI (pending count)
- Check browser console for sync logs
- Verify localStorage has pending items
```

---

## Production Deployment (Future)

### Environment Variables Needed
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-random-secret>
MTN_API_KEY=<your-mtn-key>
AIRTEL_API_KEY=<your-airtel-key>
PESAPAL_CONSUMER_KEY=<your-pesapal-key>
PESAPAL_CONSUMER_SECRET=<your-pesapal-secret>
```

### Build & Deploy
```bash
npm run build
npm start
```

---

## Support

For issues during testing, document:
1. What you were trying to do
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser console errors (F12 → Console tab)

Refer to `FEATURE_TESTING_CHECKLIST.md` for comprehensive testing guide.
