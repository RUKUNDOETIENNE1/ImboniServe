# Deployment Checklist - Imboni Serve

## Pre-Deployment

### Environment Configuration
- [ ] All environment variables set in production `.env`
- [ ] `DATABASE_URL` points to production Supabase
- [ ] `DIRECT_URL` configured for migrations
- [ ] `NEXTAUTH_SECRET` is strong random string (32+ chars)
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] IremboPay credentials configured: `IREMBO_PUBLIC_KEY`, `IREMBO_SECRET_KEY`, `IREMBO_PAYMENT_ACCOUNT`
- [ ] `IREMBO_API_BASE` set (sandbox: https://api.sandbox.irembopay.com / prod: https://api.irembopay.com)
- [ ] `IREMBO_PAYMENT_ITEM_CODE` configured (e.g., PC-2157edb8bd)
- [ ] `IREMBO_API_VERSION=2` confirmed in environment
- [ ] Webhook callback URL configured in Irembo portal and publicly reachable (HTTPS)
- [ ] Webhook HMAC signature verification implemented and tested (timestamp tolerance: 5 min)
- [ ] MoMo push (MTN/AIRTEL) tested in sandbox with valid phone numbers
- [ ] Twilio WhatsApp credentials configured (if using)

### Database
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push` or `npx prisma migrate deploy`
- [ ] Run `npm run plans:update` to sync 6 plans
- [ ] Verify all 6 plans exist in database (STARTER → ENTERPRISE)
- [ ] Run `npm run seed` for demo data (optional)
- [ ] Database backups configured
- [ ] Terminology migration plan prepared: rename `Restaurant`→`Business` and `restaurantId`→`businessId` (Prisma models, DB tables/columns, Supabase RLS policies)
- [ ] Staging dry-run of rename migration completed; data migration and rollback plan documented
- [ ] Verify no hardcoded "restaurant" references remain in UI/code/comments

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.errors in production code
- [ ] All TODO comments addressed or documented
- [ ] Code reviewed and approved
- [ ] Git repository clean (no uncommitted changes)

### Security
- [ ] Rate limiting enabled on all API routes
- [ ] CORS configured properly
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] SQL injection prevention verified (Prisma ORM)
- [ ] XSS prevention verified (React escaping)
- [ ] CSRF protection enabled (NextAuth)

### Performance
- [ ] Build succeeds: `npm run build`
- [ ] Bundle size acceptable (< 500KB first load)
- [ ] Images optimized
- [ ] Lighthouse score > 80 (mobile & desktop)
- [ ] Service worker caches critical routes

### Mobile & PWA
- [ ] PWA manifest configured
- [ ] Favicon 192x192 and 512x512 present
- [ ] Service worker registered
- [ ] Offline mode tested
- [ ] Install prompt tested on iOS/Android
- [ ] Touch targets minimum 44x44px
- [ ] Responsive design tested on mobile devices

### Testing
- [ ] All critical user flows tested
- [ ] IremboPay payment flow tested (sandbox):
  - [ ] Hosted checkout via `paymentLinkUrl` (success/cancel/expired)
  - [ ] MoMo push (MTN/Airtel) with valid/invalid phone numbers
  - [ ] Webhook signature verification and idempotency
  - [ ] Status polling and UI state transitions
- [ ] VAT-inclusive pricing copy verified ("No extra charges")
- [ ] Affiliate commission calculations tested (15% ex-VAT, 12-month window)
- [ ] Welcome bonuses tested (5,000 RWF customer, 2,000 RWF recruiter, 14-day lock)
- [ ] Offline sync tested
- [ ] Multi-user roles tested
- [ ] Mobile testing checklist completed
- [ ] Web testing checklist completed
- [ ] Cross-browser testing done

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   
   # Import to Vercel
   # vercel.com → New Project → Import Git Repository
   ```

2. **Configure Environment**
   - Add all environment variables in Vercel dashboard
   - Set `NEXTAUTH_URL` to production domain
   - Set `DATABASE_URL` and `DIRECT_URL`

3. **Deploy**
   ```bash
   # Automatic deployment on push
   # Or manual: vercel --prod
   ```

4. **Post-Deployment**
   ```bash
   # Run database migrations (if needed)
   # Via Vercel CLI or directly on Supabase
   ```

### Option 2: Docker

1. **Build Image**
   ```bash
   docker build -t imboni-serve:latest .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env.production \
     --name imboni-serve \
     imboni-serve:latest
   ```

3. **Setup Database**
   ```bash
   docker exec -it imboni-serve npx prisma db push
   docker exec -it imboni-serve npm run plans:update
   ```

### Option 3: VPS (Ubuntu)

1. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone & Build**
   ```bash
   git clone <repo>
   cd imboni-serve
   npm install
   npm run build
   ```

3. **Setup PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "imboni-serve" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name serve.imboni.rw;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## Post-Deployment

### Verification
- [ ] Homepage loads correctly
- [ ] Login works with demo accounts
- [ ] Signup creates new accounts
- [ ] Dashboard displays data
- [ ] Sales recording works
- [ ] Inventory management works
- [ ] Reports generate correctly
- [ ] Payments process (test mode)
- [ ] Offline mode works
- [ ] PWA installs successfully

### Monitoring
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Analytics configured (Google Analytics/Plausible)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database monitoring (Supabase dashboard)

### DNS & SSL
- [ ] Domain pointed to deployment
- [ ] SSL certificate active
- [ ] HTTPS redirect configured
- [ ] www redirect configured (if needed)

### Communication
- [ ] Users notified of deployment
- [ ] Support team briefed
- [ ] Documentation updated
- [ ] Changelog published

## Rollback Plan

### If Issues Arise

1. **Vercel**: Revert to previous deployment
   ```bash
   vercel rollback
   ```

2. **Docker**: Revert to previous image
   ```bash
   docker stop imboni-serve
   docker run -d --name imboni-serve imboni-serve:previous
   ```

3. **Database**: Restore from backup
   ```bash
   # Via Supabase dashboard or pg_restore
   ```

## Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates
- [ ] Check server response times
- [ ] Verify database performance
- [ ] Monitor user signups
- [ ] Check payment success rate
- [ ] Review user feedback
- [ ] Monitor offline sync success rate

## Success Criteria

- [ ] Zero critical errors
- [ ] < 1% error rate
- [ ] Average response time < 500ms
- [ ] Successful signups occurring
- [ ] Payments processing successfully
- [ ] Positive user feedback

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: 2.0.0  
**Sign-Off**: _______________
