# Imboni Serve - Quick Start Deployment Guide

## 🚀 You're Ready to Launch!

Everything is complete. Follow these steps to go live.

---

## Step 1: Install Dependencies (If Not Done)

```powershell
npm install
```

**Installed:**
- ✅ twilio (WhatsApp)
- ✅ openai (AI features)
- ✅ All other dependencies

---

## Step 2: Configure Environment Variables

Edit `.env` file (already has Supabase configured):

### Required:
```env
# Already configured ✅
DATABASE_URL="postgresql://postgres.dkhnocretmzpskadqhlq:..."
OPENAI_API_KEY="sk-proj-..."

# Add these for WhatsApp ordering:
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### Optional:
```env
# Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

**See:** `WHATSAPP_SETUP_GUIDE.md` for Twilio setup

---

## Step 3: Seed Database

```powershell
npm run seed
```

**This creates:**
- ✅ Subscription plans
- ✅ Demo users (admin, owner, cashier, kitchen)
- ✅ Sample menu items
- ✅ Feature flags with autopilot settings
- ✅ Demo affiliate code

**Login credentials:**
- Admin: `admin@imboni.resto` / `Admin123!`
- Owner: `jean@nyamacafe.rw` / `Owner123!`

---

## Step 4: Build & Start

### Development:
```powershell
npm run dev
```

### Production:
```powershell
npm run build
npm start
```

### With PM2:
```powershell
pm2 start npm --name "imboni-serve" -- start
pm2 save
pm2 startup
```

---

## Step 5: Configure Feature Flags

1. Log in as Admin
2. Go to `/dashboard/admin/feature-flags`
3. Enable Phase 1 flags:
   - ✅ `site_builder_templates_v1`
   - ✅ `site_builder_ai_copy_v1`
   - ✅ `site_builder_custom_domain_v1`
   - ✅ `site_builder_badge_enforcement`
4. Keep Phase 2/3 disabled (autopilot will enable)
5. Keep kill switch disabled

---

## Step 6: Test Everything

### Test QR Ordering:
1. Go to `/dashboard` → Tables
2. Generate QR code for a table
3. Scan QR code
4. Place test order
5. Check `/dashboard/orders/unified`

### Test WhatsApp Ordering:
1. Configure Twilio webhook (see WHATSAPP_SETUP_GUIDE.md)
2. Send: `ORDER T5 2x Brochette, 1x Primus`
3. Check unified dashboard

### Test Site Builder:
1. Go to `/dashboard/site-builder`
2. Choose template
3. Customize branding
4. Generate AI copy
5. Publish site

### Test Analytics:
1. `/dashboard/analytics/menu-performance`
2. `/dashboard/analytics/peak-hours`
3. Verify data displays

---

## Step 7: Configure Twilio Webhook (For WhatsApp)

**Webhook URL:**
```
https://yourdomain.com/api/webhooks/twilio/whatsapp
```

**Set in:** Twilio Console → Messaging → WhatsApp Sandbox Settings

**See:** `WHATSAPP_SETUP_GUIDE.md` for detailed steps

---

## 🎯 What You Get Out of the Box

### 50+ Features Ready:
- ✅ Duo Ordering (WhatsApp + QR + POS)
- ✅ Unified Order Dashboard
- ✅ Smart Menu Builder (OCR + AI)
- ✅ Multi-Language Menus (4 languages)
- ✅ Kitchen Management
- ✅ Service Coordination
- ✅ Customer Loyalty + VIP Tiers
- ✅ Pre-Ordering
- ✅ Reservations
- ✅ Menu Performance Analytics
- ✅ Peak Hours Analysis
- ✅ Site Builder + Custom Domains
- ✅ Referral Program
- ✅ Supplier Marketplace
- ✅ Multi-Currency + Tax
- ✅ And 35 more features...

---

## 📚 Documentation Available

1. **MANUAL_TASKS_NON_PROGRAMMER.md** - For non-technical team
2. **DEPLOYMENT_CHECKLIST.md** - Full deployment guide
3. **WHATSAPP_SETUP_GUIDE.md** - Twilio configuration
4. **COMPLETE_FEATURE_LIST.md** - All 50 features + UVPs
5. **FINAL_COMPLETION_SUMMARY.md** - Completion status
6. **README_DEPLOYMENT.md** - This quick start

---

## 🆘 Troubleshooting

### "Cannot find module 'twilio'"
```powershell
npm install twilio
```

### "Cannot find module 'openai'"
```powershell
npm install openai
```

### Database sync issues:
```powershell
npx prisma db push
npx prisma generate
```

### WhatsApp not working:
- Check `.env` has TWILIO credentials
- Verify webhook URL in Twilio console
- See WHATSAPP_SETUP_GUIDE.md

---

## 💰 Expected Costs

**Monthly (50 businesses):**
- OpenAI: $50-100
- Twilio: $30-50
- Supabase: $25
- **Total: $105-175/month**

**Per Business: $2-3.50/month**

---

## 🎉 You're Done!

Everything is implemented and ready. No optional items remaining.

**Launch checklist:**
- [x] Code complete (50+ features)
- [x] Database synced
- [x] Documentation ready
- [x] Dependencies installed
- [ ] Configure Twilio (optional for WhatsApp)
- [ ] Run seed
- [ ] Enable feature flags
- [ ] Deploy!

---

**Support:** dev@imboni.serve | +250788917126

**Good luck with your launch! 🚀**
