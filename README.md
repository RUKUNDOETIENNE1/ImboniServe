# 🍽️ Imboni Serve - Hospitality Management Platform

**WhatsApp-first, mobile-friendly hospitality management for Rwanda**

Track sales, manage inventory, monitor profit, and generate reports - all from your phone or web dashboard. Built for restaurants, hotels, bars, and hospitality venues.

## ✨ Features

### Core Modules
- **Sales Tracking** - Record sales, multiple payment methods (Cash, MTN Money, Airtel Money, Pesapal)
- **Inventory Management** - Track stock levels, low-stock alerts, waste tracking
- **Profit Calculation** - Real-time profit margins, daily/weekly/monthly analytics
- **Reports** - Automated daily, weekly, and monthly reports
- **Multi-user Access** - Owner, Cashier, Kitchen Manager roles with permissions
- **WhatsApp Integration** - Bot commands for quick data entry (ready for Twilio)
- **Offline Mode** - Record sales offline, auto-sync when online
- **Supplier Module** - Manage supplier orders, products, and deliveries

### Payment Integration
- Pesapal (Card & Mobile Money)
- MTN Mobile Money (ready)
- Airtel Money (ready)
- Cash tracking

### Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth (Credentials)
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis (optional)
- **Auth**: NextAuth with Prisma adapter
- **Validation**: Zod schemas
- **Deployment**: Docker + Docker Compose

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+ (LTS)
- Docker Desktop (for Postgres + Redis)
- Git

### 1. Clone and Install
```bash
git clone <repository>
cd imboni-serve
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/imboni_serve"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Database
```bash
docker-compose up -d postgres redis
```

### 4. Setup Database Schema
```bash
npx prisma db push
npx prisma generate
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open **http://localhost:3000**

### 6. Login with Demo Accounts
- **Admin**: `admin@imboni.serve` / `Admin123!`
- **Owner**: `jean@nyamacafe.rw` / `Owner123!`
- **Cashier**: `marie@nyamacafe.rw` / `Cashier123!`
- **Kitchen**: `eric@nyamacafe.rw` / `Kitchen123!`

---

## 🐳 Docker Deployment (Full Stack)

### Build and Run All Services
```bash
docker-compose up -d --build
```

This starts:
- **app** (Next.js on port 3000)
- **postgres** (PostgreSQL on port 5432)
- **redis** (Redis on port 6379)

### Run Database Migrations (First Time)
```bash
npx prisma db push
npx prisma generate
npm run seed
```

### View Logs
```bash
docker-compose logs -f app
```

### Stop Services
```bash
docker-compose down
```

---

## 📁 Project Structure

```
imboni-serve/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── services/          # Business logic
│   │   ├── validations/       # Zod schemas
│   │   └── middleware/        # Auth middleware
│   ├── pages/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth + signup
│   │   │   ├── sales/         # Sales CRUD
│   │   │   ├── inventory/     # Inventory CRUD
│   │   │   ├── profit/        # Profit calculations
│   │   │   ├── reports/       # Report generation
│   │   │   ├── menu/          # Menu items
│   │   │   └── supplier/      # Supplier module
│   │   ├── dashboard/         # Restaurant dashboard
│   │   ├── supplier/          # Supplier dashboard
│   │   ├── index.tsx          # Landing page
│   │   ├── login.tsx          # Login page
│   │   ├── signup.tsx         # Signup page
│   │   └── pricing.tsx        # Pricing page
│   ├── styles/
│   │   └── globals.css        # Tailwind CSS
│   └── utils/                 # Utility functions
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Production build
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/[...nextauth]` - Login (NextAuth)

### Sales
- `GET /api/sales` - List sales (with filters)
- `POST /api/sales` - Create sale
- `GET /api/sales/[id]` - Get sale details
- `PUT /api/sales/[id]` - Update sale
- `DELETE /api/sales/[id]` - Delete sale

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/[id]` - Get item details
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Soft delete item
- `POST /api/inventory/updates` - Record stock update
- `GET /api/inventory/alerts` - Get low stock alerts

### Profit & Reports
- `GET /api/profit?period=daily|weekly|monthly` - Calculate profit
- `GET /api/reports/daily?date=YYYY-MM-DD` - Daily report
- `GET /api/reports/weekly?startDate=YYYY-MM-DD` - Weekly report
- `GET /api/reports/monthly?year=YYYY&month=MM` - Monthly report

### Menu
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item

### Supplier (B2B)
- `GET /api/supplier/orders` - List supplier orders
- `POST /api/supplier/orders` - Create supplier order
- `GET /api/supplier/products` - List supplier products
- `POST /api/supplier/products` - Add supplier product

### Payments
- `POST /api/payments/pesapal` - Initiate Pesapal payment

---

## 🔐 Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="random-secret-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional (WhatsApp)
```env
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+250788000000"
```

### Optional (Payments)
```env
PESAPAL_CONSUMER_KEY="your-key"
PESAPAL_CONSUMER_SECRET="your-secret"
PESAPAL_ENVIRONMENT="sandbox"
```

---

## 📊 Database Schema

### Core Models
- **User** - System users (Owner, Cashier, Kitchen Manager, Admin)
- **Restaurant** - Restaurant details and settings
- **Plan** - Subscription plans (6-tier: Starter to Enterprise)
- **MenuItem** - Menu items with pricing and cost
- **Sale** - Sales transactions with payment tracking
- **InventoryItem** - Stock items with quantity tracking
- **Subscription** - Restaurant subscriptions
- **Supplier** - Supplier information
- **SupplierOrder** - Orders from restaurants to suppliers

---

## 🧪 Testing

### Run Tests (when implemented)
```bash
npm test
```

### View Database
```bash
npx prisma studio
```

Opens Prisma Studio at **http://localhost:5555**

---

## 🚢 Production Deployment

### Option 1: Docker (Recommended)

1. **Set production environment variables**
```bash
cp .env.example .env.production
# Edit .env.production with production values
```

2. **Build and deploy**
```bash
docker-compose -f docker-compose.yml up -d --build
```

3. **Run migrations**
```bash
npx prisma migrate deploy
```

### Option 2: Vercel/Netlify

1. **Connect your Git repository**
2. **Set environment variables** in dashboard
3. **Deploy**

**Note**: You'll need a separate PostgreSQL database (e.g., Supabase, Railway, Neon)

---

## 💰 Subscription Plans

| Plan | Monthly Price | Annual Price | Users | Key Features |
|------|---------------|--------------|-------|-------------|
| **Starter** | RWF 10,000 | RWF 7,500/mo | Unlimited | Basic sales, inventory, daily reports |
| **Essentials** | RWF 13,333 | RWF 10,000/mo | Unlimited | Advanced inventory, weekly reports, kitchen display |
| **Professional** | RWF 20,000 | RWF 15,000/mo | Unlimited | Priority support, custom reports, analytics |
| **Growth** | RWF 66,667 | RWF 50,000/mo | Unlimited | AI insights, profit leak detection, advanced analytics |
| **Business** | RWF 133,333 | RWF 100,000/mo | Unlimited | Multi-branch, dedicated support, custom integrations |
| **Enterprise** | RWF 333,333 | RWF 250,000/mo | Unlimited | White-label, SLA, custom onboarding, API access |

*Annual billing saves 25%. All plans include unlimited users and WhatsApp integration.*
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

---

## 📱 WhatsApp Bot Commands (Future)

- `SALES TODAY` - Get today's sales summary
- `SALES WEEK` - Weekly sales report
- `PROFIT TODAY` - Today's profit
- `STOCK` - Check low stock items
- `ADD SALE [item] [qty] [price]` - Record a sale
- `ADD STOCK [item] [qty]` - Add inventory
- `REPORT DAILY` - Daily report
- `MENU` - View menu items

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Email**: support@imboni.serve
- **WhatsApp**: +250788123456
- **Documentation**: [docs/](./docs/)

---

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] Sales tracking
- [x] Inventory management
- [x] Profit calculation
- [x] User roles & permissions
- [x] Reports (daily/weekly/monthly)
- [x] Offline mode
- [x] Supplier module

### Phase 2 (Q1 2026)
- [ ] WhatsApp bot integration (Twilio)
- [ ] Real-time notifications (Pusher)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics & forecasting
- [ ] Multi-restaurant management

### Phase 3 (Q2 2026)
- [ ] USSD menu access
- [ ] AI-powered sales forecasting
- [ ] Integration with CoffeeTrace/CowID.ai
- [ ] Regional expansion (East Africa)

---

**Built with ❤️ for Rwanda's hospitality industry**