# Imboni Serve - Web Deployment Checklist

**Platform:** Next.js Web App + PWA  
**Target:** Production deployment (Vercel, Docker, or VPS)  
**Last Updated:** Feb 17, 2026

---

## Pre-Deployment Verification

### 1. Code Quality
- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] No console errors in browser DevTools
- [ ] All tests pass (if applicable)
- [ ] Linting passes (if configured)

### 2. Database Migration
- [ ] Backup production database
- [ ] Run raw SQL migration for Restaurant→Business:
  ```bash
  psql $DATABASE_URL -f prisma/migrations/20260216_raw_tables_business_migration.sql
  ```
- [ ] Run Prisma migrations:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```
- [ ] Verify migration success (check tables: `Business`, `SlipTemplate`, `FeeConfiguration`)

### 3. Environment Variables
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Strong random secret (32+ chars)
- [ ] `NEXTAUTH_URL` - Production domain (e.g., https://imboni.rw)
- [ ] `APP_URL` - Same as NEXTAUTH_URL
- [ ] `IREMBO_SECRET_KEY` - IremboPay secret key
- [ ] `IREMBO_PUBLIC_KEY` - IremboPay public key
- [ ] `IREMBO_PAYMENT_ACCOUNT` - IremboPay payment account ID
- [ ] `IREMBO_PAYMENT_ITEM_CODE` - IremboPay item code
- [ ] `IREMBO_API_BASE` - (Optional) Default: sandbox
- [ ] `TWILIO_*` - (Optional) WhatsApp integration
- [ ] `SMTP_*` - (Optional) Email notifications

### 4. Pricing & Content Verification
- [ ] Pricing page shows 50% discount with strikethrough
- [ ] All 6 plans displayed correctly (STARTER to ENTERPRISE)
- [ ] Home page uses "business" terminology
- [ ] Signup form uses "Business Name" label
- [ ] Locales updated (en.json, rw.json)

---

## Deployment Options

### Option A: Vercel (Recommended)

#### Setup
1. **Connect Repository**
   - Link GitHub/GitLab repo to Vercel
   - Framework: Next.js (auto-detected)

2. **Configure Environment Variables**
   - Add all variables from `.env` to Vercel dashboard
   - Settings → Environment Variables

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Post-Deploy**
   - Run database migrations (from local with prod DATABASE_URL)
   - Verify deployment at assigned URL
   - Configure custom domain if needed

#### Vercel-Specific Checks
- [ ] Serverless functions deployed correctly
- [ ] API routes respond (test `/api/health` or similar)
- [ ] Static assets served from CDN
- [ ] SSL certificate active

---

### Option B: Docker (Self-Hosted)

#### Build & Deploy
```bash
# Build image
docker build -t imboni-serve:latest .

# Run container
docker run -d \
  --name imboni-serve \
  -p 3000:3000 \
  --env-file .env.production \
  imboni-serve:latest
```

#### Docker Compose
```bash
docker-compose -f docker-compose.yml up -d --build
```

#### Post-Deploy
- [ ] Container running: `docker ps`
- [ ] Logs clean: `docker logs imboni-serve`
- [ ] Health check passes
- [ ] Database connection successful

---

### Option C: VPS (Ubuntu/Debian)

#### Prerequisites
- Node.js 20+ installed
- PM2 for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

#### Deploy Steps
```bash
# Clone repo
git clone <repo-url> /var/www/imboni-serve
cd /var/www/imboni-serve

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "imboni-serve" -- start
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name imboni.rw;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name imboni.rw;

    ssl_certificate /etc/letsencrypt/live/imboni.rw/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/imboni.rw/privkey.pem;

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

#### VPS Checks
- [ ] PM2 process running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate valid
- [ ] Firewall configured (ports 80, 443)

---

## Post-Deployment Testing

### Critical Paths
- [ ] Home page loads (`/`)
- [ ] Pricing page loads with discounts (`/pricing`)
- [ ] Login works (`/login`)
- [ ] Signup creates business (`/signup`)
- [ ] Dashboard loads for authenticated user (`/dashboard`)
- [ ] Payment flow initiates (IremboPay hosted checkout)

### PWA Verification
- [ ] Manifest loads (`/manifest.json`)
- [ ] Service worker registers (`/sw.js`)
- [ ] Offline page accessible (`/offline.html`)
- [ ] Install prompt appears on mobile browsers
- [ ] App installs on Android/iOS home screen

### API Health
- [ ] Test API endpoint: `/api/auth/[...nextauth]`
- [ ] Test payment endpoint: `/api/payments/irembo/create-invoice`
- [ ] Webhook endpoint accessible: `/api/payments/irembo/webhook`

### Performance
- [ ] Lighthouse score > 80 (Performance, PWA, Accessibility)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

---

## Monitoring & Maintenance

### Setup Monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics or similar)
- [ ] Database metrics (connection pool, query performance)

### Backup Strategy
- [ ] Automated daily database backups
- [ ] Backup retention policy (30 days minimum)
- [ ] Test restore procedure

### Security
- [ ] HTTPS enforced (no HTTP access)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] API keys rotated and secured

---

## Rollback Plan

### If Deployment Fails
1. **Revert to previous deployment** (Vercel: instant rollback via dashboard)
2. **Restore database backup** if migration caused issues
3. **Check logs** for specific errors
4. **Fix issues** in staging environment
5. **Re-deploy** after verification

### Emergency Contacts
- Database Admin: _____________
- DevOps Lead: _____________
- IremboPay Support: _____________

---

## Sign-Off

- [ ] All checklist items completed
- [ ] Deployment verified by: _______________
- [ ] Date: _______________
- [ ] Production URL: _______________

---

**Deployment successful! 🚀**
