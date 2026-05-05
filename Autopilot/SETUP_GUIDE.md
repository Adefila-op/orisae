# Autopilot - Complete Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### 1. Install Dependencies
```bash
cd Autopilot
npm install
```

### 2. Configure Environment
```bash
# Copy example to local config
cp .env.example .env.local

# Edit .env.local (or use defaults for local development)
# Defaults are already in place for:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - API Port: 3001
# - Demo user ID and wallet address
```

### 3. Start Services (Using Docker Compose)

**Option A: Docker Compose (Recommended for local dev)**
```bash
# Start PostgreSQL + Redis in background
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Seed with demo data (optional)
npm run db:seed
```

**Option B: Manual Setup**
```bash
# Make sure PostgreSQL and Redis are running on localhost
# Then run:
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers

**Terminal 1 - Frontend (Next.js)**
```bash
npm run dev
# Opens: http://localhost:3000
```

**Terminal 2 - Backend (Express API)**
```bash
npm run api
# Runs on: http://localhost:3001
```

### 5. Access the Application
- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **API Health**: http://localhost:3001/health
- **API Status**: http://localhost:3001/api/status

## 📋 Complete Setup Instructions

### Step 1: Database Setup

#### Using Docker Compose (Easiest)
```bash
# Start database and cache
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

#### Manual PostgreSQL Setup
```bash
# Create database
createdb -U postgres autopilot

# Create user
createuser -U postgres -P autopilot_user
# Password: changeme

# Grant privileges
psql -U postgres -d autopilot -c "GRANT ALL PRIVILEGES ON DATABASE autopilot TO autopilot_user"
```

#### Manual Redis Setup
```bash
# If using Homebrew (macOS)
brew services start redis

# If using Windows
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL with: sudo apt-get install redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Step 2: Initialize Database

```bash
# Run migrations to create schema
npm run db:migrate

# Seed with demo data (optional - creates test user and links)
npm run db:seed
```

**Expected Output:**
```
✅ Database migration completed successfully
🌱 Seeding database...
✅ Created test user: 550e8400-e29b-41d4-a716-446655440000
✅ Created 2 products
✅ Created 2 smart links
🎉 Database seeding complete!
```

### Step 3: Environment Configuration

**Key Variables:**
```env
# Database
DATABASE_URL=postgresql://autopilot_user:changeme@localhost:5432/autopilot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Demo Authentication (for local development)
DEMO_USER_ID=550e8400-e29b-41d4-a716-446655440000
DEMO_WALLET_ADDRESS=0x1234567890123456789012345678901234567890

# JWT
JWT_SECRET=autopilot_dev_secret_key_change_in_production
```

### Step 4: Start the Application

```bash
# Terminal 1 - Frontend
npm run dev
# ▲ Next.js v14.x.x
# ✓ Ready in XXXms
# ◇ Listening on http://localhost:3000

# Terminal 2 - Backend  
npm run api
# 🚀 Autopilot API Server running on http://localhost:3001
# 📦 Environment: development
# ✅ Database connection verified
# ✅ Redis connection verified
```

### Step 5: Test the Setup

#### Test Database Connection
```bash
curl http://localhost:3001/health

# Response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

#### Test API Endpoints
```bash
# Get dashboard stats
curl http://localhost:3001/api/analytics/dashboard

# List smart links
curl http://localhost:3001/api/links

# Create a test link
curl -X POST http://localhost:3001/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://example.com/product",
    "offer_type": "recovery",
    "offer_value": 15
  }'
```

#### Test Frontend
```bash
# Open in browser
http://localhost:3000

# Dashboard page should load with:
✓ Landing page
✓ Dashboard with stats
✓ Links list
✓ Create link modal
✓ Real data from API (or mock fallback)
```

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U autopilot_user -d autopilot -c "SELECT NOW()"

# If not running:
docker-compose up -d postgres
# or
brew services start postgresql
```

### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# If not running:
docker-compose up -d redis
# or
brew services start redis
```

### Migrations Failed
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Manually run migration file
psql postgresql://autopilot_user:changeme@localhost:5432/autopilot -f db/schema.sql
```

### API Not Starting
```bash
# Check if port 3001 is already in use
lsof -i :3001

# If busy, kill the process
kill -9 <PID>

# Or use different port
API_PORT=3002 npm run api
```

### Frontend Not Connecting to API
```bash
# Verify API is running on 3001
curl http://localhost:3001/api/status

# Check .env.local has correct API URL
cat .env.local | grep NEXT_PUBLIC_API_URL

# Rebuild frontend to pick up env vars
npm run build
npm start
```

## 🧪 Testing Features

### Test Link Creation
1. Open http://localhost:3000/dashboard
2. Click "+ Create Link"
3. Fill in:
   - Product URL: https://example.com/product
   - Offer Type: recovery
   - Offer Value: 15%
4. Click "Create Link"
5. ✓ Link appears in table with code (e.g., ABC123)

### Test Link Management
1. In Links table, click on action buttons:
   - **Eye icon**: View analytics (links to analytics page)
   - **Power icon**: Toggle link enabled/disabled
   - **Trash icon**: Delete link (with confirmation)

### Test Analytics
1. Click "Analytics" in sidebar
2. Should show:
   - Total clicks
   - Conversions
   - Revenue
   - Daily chart
   - Intent score distribution

## 📦 Project Structure

```
Autopilot/
├── api/
│   ├── server.ts           # Express server with queues
│   ├── middleware/auth.ts  # JWT authentication
│   ├── routes/             # API endpoints (5 routers)
│   └── services/           # Business logic
├── src/
│   ├── app/               # Next.js app router
│   │   ├── page.tsx       # Landing page
│   │   ├── dashboard/     # Dashboard pages
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   └── dashboard/     # Dashboard components
│   ├── lib/
│   │   ├── api-client.ts  # Axios wrapper with API methods
│   │   └── demo-auth.ts   # Demo authentication for dev
│   └── app/globals.css    # Tailwind styles
├── db/
│   ├── schema.sql         # PostgreSQL schema (11 tables)
│   └── migrations.ts      # Migration runner
├── scripts/
│   ├── migrate.js         # Run migrations
│   └── seed.js            # Seed demo data
├── types/                 # TypeScript definitions
├── .env.local            # Local environment (Git ignored)
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── next.config.ts        # Next.js config
├── docker-compose.yml    # Docker services
└── README.md             # Documentation
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Push to GitHub (connected to Vercel)
git push origin main

# Or deploy directly:
npm run build
vercel --prod
```

### Backend (Railway/Heroku)
```bash
# Railway
railway up

# Heroku
git push heroku main
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NEXT_PUBLIC_API_URL=https://api.autopilot.app
JWT_SECRET=<strong-random-key>
RESEND_API_KEY=re_...
```

## 📚 API Documentation

### Link Endpoints
- `POST /api/links` - Create link
- `GET /api/links` - List links
- `GET /api/links/code/:code` - Get link by code
- `PATCH /api/links/:id/toggle` - Toggle enabled
- `DELETE /api/links/:id` - Delete link

### Event Tracking
- `POST /api/events/click` - Track click
- `POST /api/events/conversion` - Track conversion
- `POST /api/events/abandon` - Track abandoned cart
- `GET /api/events/:code` - Get link events

### Intent Scoring
- `POST /api/intent/score` - Calculate intent score
- `GET /api/intent/history/:code/:uid` - Intent history

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/link/:id` - Link metrics

## 🔗 Integration with Orisae

To connect Autopilot to Orisae:

1. **Add Autopilot button to Orisae dashboard**
   ```tsx
   <Link href="http://localhost:3000/dashboard" target="_blank">
     Autopilot Recovery Bot
   </Link>
   ```

2. **Share wallet connection**
   - Both platforms use Wagmi + Ethers.js
   - Same Base RPC endpoint

3. **Cross-platform analytics**
   - Autopilot API available for Orisae to query metrics

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] .env.local created with correct DATABASE_URL
- [ ] Database migrations executed (`npm run db:migrate`)
- [ ] Demo data seeded (`npm run db:seed`)
- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:3001
- [ ] Dashboard loads with data
- [ ] Can create a smart link
- [ ] Can view, toggle, and delete links
- [ ] API endpoints responding (test with curl)

## 🆘 Support

**Common Issues:**
1. Database won't start - Check Docker or PostgreSQL status
2. Redis won't connect - Verify Redis is running on correct port
3. API 404 errors - Ensure backend server is running
4. Frontend not updating - Hard refresh browser (Cmd+Shift+R)
5. Port already in use - Kill the process or use different port

**For more help:**
- Check logs: `docker-compose logs postgres redis`
- Test API directly: `curl http://localhost:3001/health`
- Check database: `psql postgresql://autopilot_user:changeme@localhost:5432/autopilot`

---

**Status:** Ready to develop! 🎉
**Last Updated:** May 2026
