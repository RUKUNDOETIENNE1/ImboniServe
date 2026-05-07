# Imboni Resto - Production Deployment Checklist

**Last Updated:** May 3, 2026  
**Status:** ✅ Ready for Production Deployment

---

## 🎯 Pre-Deployment Verification

### ✅ Code Quality & Testing
- [x] All API tests passing (39/39 tests ✅)
- [x] Auth middleware refactored to `requirePermission` + `resolveBusinessContext`
- [x] Business context isolation enforced across all routes
- [x] Cross-business data access prevented with ownership checks
- [x] TypeScript compilation clean
- [x] No critical linting errors

### ✅ Security Hardening
- [x] MFA/OTP login flow implemented
- [x] Session management with 8-hour maxAge
- [x] Rate limiting on auth endpoints (10/15min pre-login, 5/10min OTP verify)
- [x] Security event logging (LOGIN_SUCCESS, MFA_OTP_SENT, etc.)
- [x] Device fingerprinting enabled
- [x] RBAC permission enforcement on all business routes
- [x] OWNER role bypass + ADMIN cross-business override working
- [x] Trial eligibility checks with disposable email blocking
- [x] Brute-force protection via security event counting

### ✅ Database & Schema
- [x] Prisma schema up-to-date
- [x] All migrations applied successfully
- [x] Indexes optimized for payment health queries
- [x] Business scans migration completed
- [x] Contact Management System schema deployed
- [x] UserLoginOtp, UserDevice, SecurityEvent models active

### ✅ Monitoring & Error Tracking
- [x] Sentry client config created (`sentry.client.config.ts`)
- [x] Sentry server config created (`sentry.server.config.ts`)
- [x] `SENTRY_DSN` documented in `.env.example`
- [x] Error boundaries implemented
- [x] Security event service logging operational

---

## 🔧 Environment Configuration

### Required Environment Variables

#### Core Application
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<32+ char secret>"
NEXTAUTH_URL="https://your-domain.com"
TRIAL_HASH_SECRET="<32+ char secret>"
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD="<app password>"
SMTP_FROM="Your App <your-email@gmail.com>"
SUPPORT_EMAIL=support@your-domain.com
```

#### Payment Gateways
**InTouch (Primary - Mobile Money)**
```bash
INTOUCH_API_URL="https://www.intouchpay.co.rw/api"
INTOUCH_USERNAME="<from InTouch support>"
INTOUCH_ACCOUNT_NO="<your account number>"
INTOUCH_PASSWORD="<partner password>"
PAYMENTS_PROVIDER="intouch"
```

**IremboPay (Fallback - Card Payments)**
```bash
IREMBO_PUBLIC_KEY="<from IremboPay>"
IREMBO_SECRET_KEY="<keep secret!>"
IREMBO_PAYMENT_ACCOUNT="LOYALTECH-RWF"
IREMBO_PAYMENT_ITEM_CODE="<from dashboard>"
IREMBO_API_BASE="https://api.irembopay.com"
IREMBO_API_VERSION="2"
IREMBO_WEBHOOK_TOLERANCE_SECONDS="300"
```

#### Messaging
**Twilio (SMS & WhatsApp)**
```bash
TWILIO_ACCOUNT_SID="<from Twilio console>"
TWILIO_AUTH_TOKEN="<from Twilio console>"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"
TWILIO_PHONE_NUMBER="+1234567890"
```

**Pusher (Real-time)**
```bash
PUSHER_APP_ID="<your app ID>"
PUSHER_KEY="<server key>"
PUSHER_SECRET="<server secret>"
PUSHER_CLUSTER="<e.g., ap2, eu, us2>"
NEXT_PUBLIC_PUSHER_KEY="<same as PUSHER_KEY>"
NEXT_PUBLIC_PUSHER_CLUSTER="<same as PUSHER_CLUSTER>"
```

#### AI & Analytics
**OpenAI**
```bash
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL_PRIMARY="gpt-4o-mini"
OPENAI_MODEL_FALLBACK="gpt-4-turbo"
OPENAI_COST_INPUT_PER_1K_USD="0.00015"
OPENAI_COST_OUTPUT_PER_1K_USD="0.00060"
```

#### Storage
**Supabase (Production)**
```bash
STORAGE_PROVIDER="supabase"
SUPABASE_STORAGE_BUCKET="media-uploads"
SUPABASE_STORAGE_URL="https://xxxxx.supabase.co"
SUPABASE_STORAGE_KEY="<service role key - keep secret!>"
```

**Local (Development)**
```bash
STORAGE_PROVIDER="local"
```

#### Monitoring
**Sentry**
```bash
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="<same as SENTRY_DSN>"
SENTRY_ENVIRONMENT="production"
SENTRY_TRACES_SAMPLE_RATE="0.1"
```

#### Redis (Job Queue)
```bash
REDIS_URL="rediss://default:<password>@<host>:6379"
```

#### Cron Jobs
```bash
CRON_SECRET="<openssl rand -hex 32>"
CRON_WORKER="false"  # Use "false" on Vercel
```

#### Feature Flags
```bash
AI_SRO_ENABLED=true
AI_CPA_ENABLED=true
AI_CREDITS_ENABLED=true
FEATURE_FLAG_AUTO_CHECK_ENABLED=true
CAPTCHA_ENABLED=false
```

#### Security
```bash
IMBONI_QR_SECRET="<32+ char secret for QR HMAC>"
AUTO_APPROVE_THRESHOLD="30"
TRIAL_IP_RANGE_LIMIT="5"
DISPOSABLE_EMAIL_DOMAINS="tempmail.com,guerrillamail.com,10minutemail.com"
```

#### App Settings
```bash
APP_URL="https://your-domain.com"
SUPPORT_PHONE="+250788917126"
SUPPORT_WHATSAPP="+250788917126"
LOG_LEVEL="info"
```

---

## 🚀 Deployment Steps (Vercel)

### 1. Pre-Deployment
```bash
# Ensure all dependencies are installed
npm install

# Run database migrations
npx prisma generate
npx prisma db push

# Run tests
npm test

# Build locally to verify
npm run build
```

### 2. GitHub Integration
```bash
# Commit all changes
git add .
git commit -m "Production-ready deployment"
git push origin main
```

### 3. Vercel Setup
1. **Import Project:** Connect GitHub repository to Vercel
2. **Framework Preset:** Next.js
3. **Build Command:** `npm run build`
4. **Output Directory:** `.next`
5. **Install Command:** `npm install`

### 4. Environment Variables
- Copy all variables from `.env.example`
- Set production values in Vercel dashboard
- **Critical:** Set `STORAGE_PROVIDER="supabase"` for production
- **Critical:** Set `SENTRY_ENVIRONMENT="production"`
- **Critical:** Set `NEXTAUTH_URL` to your production domain

### 5. Database
- Use production PostgreSQL (Vercel Postgres, Supabase, or external)
- Run migrations: `npx prisma db push` (or use Prisma Migrate)
- Verify connection with `DATABASE_URL`

### 6. Supabase Storage Setup
1. Create Supabase project
2. Create public bucket: `media-uploads`
3. Set bucket policies for public read access
4. Copy `SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_KEY`

### 7. Domain & SSL
- Add custom domain in Vercel dashboard
- Vercel auto-provisions SSL certificate
- Update `NEXTAUTH_URL` to match custom domain

### 8. Post-Deployment Verification
```bash
# Test critical flows
- [ ] User signup with MFA
- [ ] Login with OTP
- [ ] Payment processing (InTouch + IremboPay)
- [ ] Order creation
- [ ] Staff management
- [ ] QR code generation
- [ ] Real-time updates (Pusher)
- [ ] File uploads (Supabase Storage)
- [ ] Email delivery (SMTP)
- [ ] WhatsApp notifications (Twilio)
```

---

## 📊 Performance Optimization

### Vercel Configuration
```json
// vercel.json (already configured)
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Database Indexes
- Payment health indexes applied ✅
- Business scans indexes applied ✅
- Contact relationship indexes ready ✅

---

## 🔒 Security Checklist

- [x] All secrets stored in environment variables (not in code)
- [x] `.env` file in `.gitignore`
- [x] HTTPS enforced (Vercel auto-SSL)
- [x] CORS configured properly
- [x] Rate limiting on auth endpoints
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection headers
- [x] CSRF protection (NextAuth)
- [x] Session security (httpOnly cookies, 8h maxAge)
- [x] MFA/OTP login required
- [x] Brute-force protection
- [x] Security event logging
- [x] Device fingerprinting

---

## 📱 PWA Configuration

- [x] Service worker registered
- [x] Manifest.json configured
- [x] Offline fallback page
- [x] Install prompt component
- [x] Icons (192x192, 512x512)

---

## 🌍 Internationalization

- [x] English (en) translations complete
- [x] French (fr) translations complete
- [x] Kinyarwanda (rw) translations complete
- [x] Language switcher in UI
- [x] Locale persistence in localStorage

---

## 📞 Support & Monitoring

### Monitoring Tools
- **Sentry:** Error tracking and performance monitoring
- **Vercel Analytics:** Built-in analytics
- **Prisma Studio:** Database management (`npx prisma studio`)

### Support Channels
- **Email:** support@imboniserve.com
- **WhatsApp:** +250788917126
- **In-app:** Support widget + AI Brand Assistant

---

## 🎉 Go-Live Checklist

### Final Verification
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Supabase Storage bucket created and configured
- [ ] Custom domain configured with SSL
- [ ] Payment gateways tested (sandbox → production)
- [ ] Email delivery tested
- [ ] WhatsApp notifications tested
- [ ] Sentry error tracking verified
- [ ] Test user signup flow end-to-end
- [ ] Test payment flow end-to-end
- [ ] Test staff RBAC permissions
- [ ] Verify business context isolation
- [ ] Monitor Sentry for first 24 hours
- [ ] Set up Vercel deployment notifications

### Post-Launch Monitoring (First 48 Hours)
- Monitor Sentry for errors
- Check Vercel function logs
- Verify payment gateway webhooks
- Monitor email delivery rates
- Check database performance
- Review security events log
- Monitor user signups and trial activations

---

## 📚 Documentation

### Available Guides
- `README.md` - Project overview
- `ENV_SETUP_GUIDE.md` - Environment setup
- `CONTACT_MANAGEMENT_SYSTEM.md` - CMS documentation
- `QUICK_START_CMS.md` - CMS quick start
- `TAP_AND_LEAVE_COMPLETE.md` - Tap & Leave feature
- `SECURITY_HARDENING_SUMMARY.md` - Security features
- `QA_SECURITY_AUDIT_REPORT.md` - Security audit

### API Documentation
- All routes use consistent error handling (200, 201, 400, 403, 405, 500)
- Permission-based access control enforced
- Business context isolation maintained
- Rate limiting on sensitive endpoints

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection Issues**
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:port/database?sslmode=require

# Test connection
npx prisma db pull
```

**Environment Variables Not Loading**
- Verify variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check for typos in variable names

**Payment Gateway Errors**
- Verify API credentials
- Check sandbox vs production URLs
- Review webhook configurations
- Monitor gateway status pages

---

## 📈 Success Metrics

### Key Performance Indicators
- User signup conversion rate
- Payment success rate (target: >95%)
- API response time (target: <500ms p95)
- Error rate (target: <0.1%)
- Uptime (target: 99.9%)

### Business Metrics
- Active businesses
- Monthly recurring revenue
- Average order value
- Customer retention rate
- Trial-to-paid conversion

---

**Deployment Status:** ✅ READY FOR PRODUCTION

**Next Steps:**
1. Set all environment variables in Vercel
2. Deploy to production
3. Run post-deployment verification tests
4. Monitor for 48 hours
5. Celebrate! 🎉
