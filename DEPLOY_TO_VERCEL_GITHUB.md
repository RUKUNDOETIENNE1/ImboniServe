# Deploy to Vercel via GitHub + Connect Domain (www.imboniserve.com)

This guide walks you through connecting your GitHub repo to Vercel and configuring the domain purchased at your registrar.

---

## 1) Prepare Repository

- Ensure `main` (or `staging`) is green: `npm run build` passes
- Commit all changes and push to GitHub
- Verify `package.json` has `build` script (Next.js already configured)

---

## 2) Create Vercel Project

1. Go to https://vercel.com/new
2. Import GitHub repository (authorize Vercel if asked)
3. Framework preset: Next.js
4. Root Directory: repository root
5. Build Command: `next build` (default)
6. Output Directory: `.next` (default)
7. Environment Variables: add the following for Staging/Production:

```
DATABASE_URL=...
NEXTAUTH_URL=https://staging.imboniserve.com (then https://www.imboniserve.com)
NEXTAUTH_SECRET=... (generate)

# SMTP (emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=noreply@imboniserve.com

# MoMo Sandbox (staging)
MOMO_API_USER=...
MOMO_API_KEY=...
MOMO_SUBSCRIPTION_KEY=...
MOMO_ENVIRONMENT=sandbox
MOMO_CALLBACK_URL=https://staging.imboniserve.com/api/webhooks/momo

# Monitoring (optional)
SENTRY_DSN=...
SENTRY_ENVIRONMENT=staging or production

# Storage (optional, Supabase)
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_URL=...
SUPABASE_STORAGE_KEY=...
```

8. Click Deploy

---

## 3) Set Up Staging Environment (Recommended)

- Create an additional Vercel environment alias: `staging`
- Assign `staging` branch (or use Preview deployments)
- Set `NEXTAUTH_URL` to staging URL
- Use sandbox/test credentials in staging

---

## 4) Connect Domain: www.imboniserve.com

Option A (Recommended): Delegate DNS to Vercel
1. In Vercel Project → Settings → Domains → Add `imboniserve.com`
2. Vercel will show two nameservers (NS):
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. At your domain registrar, change nameservers to the two above
4. Back in Vercel, add both `imboniserve.com` (apex) and `www.imboniserve.com`
5. Set `www.imboniserve.com` as the primary domain (or redirect apex → www)

Option B: Keep registrar DNS (CNAME/A)
1. In Vercel, add `www.imboniserve.com` to your Project → Domains
2. Create a CNAME record at your registrar:
   - Host: `www`
   - Value: `cname.vercel-dns.com.`
3. For apex `imboniserve.com`, add A record:
   - Host: `@`
   - Value: `76.76.21.21` (Vercel edge IP)
4. In Vercel, configure Redirect: `imboniserve.com` → `www.imboniserve.com`

Propagation can take up to 24 hours; usually completes within minutes.

---

## 5) Production Checks

- Project builds successfully on Vercel
- Environment variables set for Production
- NEXTAUTH_URL = https://www.imboniserve.com
- Sentry DSN set with `production` environment
- Health check passes: `/api/health/revenue-ops`
- Admin dashboard loads: `/admin/payout-control`
- Marketer dashboard loads: `/dashboard/marketer`

---

## 6) Post-Deployment

- Enable automatic deployments from GitHub (on every push)
- Protect `main` with PR reviews + status checks
- Monitor logs and alerts (Sentry, Grafana)
- Validate email delivery (SMTP)
- Validate MoMo sandbox/production as applicable

---

## 7) Rollback

- Vercel → Deployments → Promote previous deployment to production
- Or revert merge in GitHub and redeploy

---

## Notes

- You can optionally set `www` as the only public domain and redirect apex to `www` for consistency
- For best caching and performance, keep Next.js default chunking and leverage Vercel CDN
- Ensure GDPR/cookie compliance banners remain active
