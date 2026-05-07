# 🚀 Imboni Serve Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed and running
- [ ] PostgreSQL database ready (local or cloud)
- [ ] Environment variables configured
- [ ] NEXTAUTH_SECRET generated (min 32 characters)
- [ ] Payment gateway credentials (Pesapal) if needed
- [ ] WhatsApp/Twilio credentials if needed

---

## 🔧 Local Development Setup

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Start Database Services
```powershell
docker-compose up -d postgres redis
```

Wait 10 seconds for Postgres to initialize.

### Step 3: Create `.env` File
```powershell
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/imboni_resto"
NEXTAUTH_SECRET="generate-random-32-char-secret-here"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: Initialize Database
```powershell
npx prisma db push
npx prisma generate
npm run seed
```

Expected output:
```
✅ Database seeded successfully!
================================
📋 Login Credentials:
Admin: admin@imboni.resto / Admin123!
Owner: jean@nyamacafe.rw / Owner123!
Cashier: marie@nyamacafe.rw / Cashier123!
Kitchen: eric@nyamacafe.rw / Kitchen123!
================================
```

### Step 5: Start Development Server
```powershell
npm run dev
```

Open: **http://localhost:3000**

---

## 🐳 Docker Production Deployment

### Option A: Full Docker Stack (Recommended)

#### 1. Configure Production Environment
Create `.env.production`:
```env
NODE_ENV=production
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@postgres:5432/imboni_resto"
NEXTAUTH_SECRET="your-production-secret-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
APP_URL="https://yourdomain.com"

# Optional: Payment Integration
PESAPAL_CONSUMER_KEY="your-key"
PESAPAL_CONSUMER_SECRET="your-secret"
PESAPAL_ENVIRONMENT="live"

# Optional: WhatsApp
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+250788000000"
```

#### 2. Build and Deploy
```powershell
docker-compose up -d --build
```

#### 3. Run Database Migrations
```powershell
# From host machine (DB port is exposed)
npx prisma db push
npx prisma generate
npm run seed
```

#### 4. Verify Deployment
```powershell
docker-compose ps
docker-compose logs -f app
```

Visit: **http://localhost:3000**

---

## ☁️ Cloud Deployment (Vercel + Database)

### Step 1: Setup Database
Choose a PostgreSQL provider:
- **Supabase** (Free tier available)
- **Railway** (Free tier available)
- **Neon** (Serverless Postgres)
- **AWS RDS**
- **DigitalOcean Managed Database**

Get your `DATABASE_URL` from the provider.

### Step 2: Deploy to Vercel

#### Via Vercel CLI
```powershell
npm install -g vercel
vercel login
vercel
```

#### Via Vercel Dashboard
1. Import Git repository
2. Framework: **Next.js**
3. Build Command: `npm run build`
4. Output Directory: `.next`

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app
```

### Step 4: Run Database Migrations

From your local machine (with DATABASE_URL pointing to cloud DB):
```powershell
npx prisma db push
npm run seed
```

### Step 5: Deploy
```powershell
vercel --prod
```

---

## 🔐 Security Checklist

### Before Production

- [ ] Change default Postgres password
- [ ] Generate strong NEXTAUTH_SECRET (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie settings
- [ ] Enable CORS only for your domain
- [ ] Remove demo accounts from seed (or change passwords)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable logging and monitoring
- [ ] Review and restrict API permissions

### Recommended `.env.production` Changes
```env
# Change these!
POSTGRES_PASSWORD="use-strong-password-here"
NEXTAUTH_SECRET="use-crypto-random-secret-here"

# Use production URLs
NEXTAUTH_URL="https://Imboni Serve.rw"
APP_URL="https://Imboni Serve.rw"
PESAPAL_ENVIRONMENT="live"
```

---

## 📊 Database Backup

### Manual Backup (Docker)
```powershell
docker exec -t Imboni Serve-postgres-1 pg_dump -U postgres imboni_resto > backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```powershell
docker exec -i Imboni Serve-postgres-1 psql -U postgres imboni_resto < backup_20260117.sql
```

### Automated Backups (Production)
Set up cron job or use managed database automated backups.

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
```powershell
# Check if Postgres is running
docker-compose ps

# View Postgres logs
docker-compose logs postgres

# Restart Postgres
docker-compose restart postgres
```

### Issue: "Prisma Client not generated"
**Solution:**
```powershell
npx prisma generate
```

### Issue: "Module not found" errors
**Solution:**
```powershell
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 already in use"
**Solution:**
```powershell
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### Issue: "NextAuth session not persisting"
**Solution:**
- Ensure `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your domain
- Check browser cookies are enabled

---

## 📈 Monitoring & Logs

### View Application Logs
```powershell
docker-compose logs -f app
```

### View Database Logs
```powershell
docker-compose logs -f postgres
```

### View All Logs
```powershell
docker-compose logs -f
```

### Access Prisma Studio (Database GUI)
```powershell
npx prisma studio
```

Opens at **http://localhost:5555**

---

## 🔄 Updates & Migrations

### Update Dependencies
```powershell
npm update
npm audit fix
```

### Database Schema Changes

1. **Edit** `prisma/schema.prisma`
2. **Push changes:**
```powershell
npx prisma db push
npx prisma generate
```

3. **For production (with migrations):**
```powershell
npx prisma migrate dev --name description_of_change
npx prisma migrate deploy
```

---

## 🌍 Domain & SSL Setup

### Using Cloudflare (Recommended)
1. Add your domain to Cloudflare
2. Enable SSL/TLS (Full mode)
3. Update DNS records to point to your server
4. Update `NEXTAUTH_URL` to `https://yourdomain.com`

### Using Let's Encrypt (Self-hosted)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx config with SSL
```

---

## 💡 Performance Optimization

### Enable Redis Caching
Redis is already in `docker-compose.yml`. To use it:

1. Install Redis client:
```powershell
npm install ioredis
```

2. Create `src/lib/redis.ts`
3. Cache frequently accessed data (menu items, plans, etc.)

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_sales_restaurant_date ON "Sale"("restaurantId", "createdAt");
CREATE INDEX idx_inventory_restaurant ON "InventoryItem"("restaurantId", "isActive");
```

### Next.js Optimization
- Enable image optimization
- Use `next/image` for all images
- Enable compression
- Configure CDN for static assets

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly database backups
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Monitor disk space
- [ ] Review error logs
- [ ] Check API response times

### Getting Help
- **Documentation**: Check `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@imboni.resto
- **WhatsApp**: +250788123456

---

## 🎯 Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] SSL certificate valid
- [ ] Database backups configured
- [ ] Monitoring/logging setup
- [ ] Demo accounts removed or secured
- [ ] Payment gateway tested (sandbox → live)
- [ ] WhatsApp integration tested
- [ ] Mobile responsiveness verified
- [ ] Load testing completed
- [ ] Documentation updated

---

**Ready to deploy? Follow the steps above and you'll have Imboni Serve running in production! 🚀**
