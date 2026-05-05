# Autopilot - Conversion Recovery Bot

> Smart link tracking, intent scoring, and automated offer system for digital creators

![Status](https://img.shields.io/badge/status-MVP-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

Autopilot is a conversion recovery bot designed for digital creators on the Base blockchain. It tracks user behavior on product links, scores purchase intent using AI-powered analytics, and automatically offers personalized incentives to convert abandoned carts into sales.

### Key Features

- **Smart Link Generation** - Create trackable links with embedded offer logic
- **Intent Scoring Engine** - AI-powered behavior analysis (0-100 probability)
- **Automated Offer System** - Agent-driven decisions that adjust discounts based on intent
- **Real-Time Analytics** - Deep insights into link performance and revenue
- **Notification System** - Alerts for conversions, abandoned carts, and hot leads
- **Wallet-Connected** - Web3-ready authentication integrated with Orisae
- **Desktop-Only Bot** - Operates as a standalone app for efficiency

## Tech Stack

### Frontend
- **Next.js 14** - React app framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Recharts** - Analytics visualization
- **Framer Motion** - Smooth animations
- **Wagmi + Viem** - Web3 wallet integration

### Backend
- **Express.js** - Node.js HTTP server
- **Hono.js** - Lightweight API framework (optional)
- **PostgreSQL** - Main database
- **Redis** - Caching & session store
- **BullMQ** - Job queue for async tasks
- **Resend** - Email notification service

### Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Base Blockchain** - Smart contract deployment
- **Vercel** - Frontend hosting
- **Heroku/Railway** - Backend hosting

## Project Structure

```
autopilot/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Landing page
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx        # Dashboard shell
│   │       ├── links/          # Smart links management
│   │       ├── analytics/      # Performance analytics
│   │       └── settings/       # User preferences
│   └── components/
│       ├── dashboard/
│       │   ├── DashboardMain.tsx
│       │   ├── StatCard.tsx
│       │   ├── LinksList.tsx
│       │   ├── AnalyticsChart.tsx
│       │   ├── CreateLinkModal.tsx
│       │   └── Sidebar.tsx
│       └── shared/             # Reusable components
├── api/
│   ├── server.ts               # Express app setup
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   └── validation.ts       # Request validation
│   ├── routes/
│   │   ├── links.ts            # Link CRUD operations
│   │   ├── events.ts           # User behavior tracking
│   │   ├── intent.ts           # Intent scoring
│   │   ├── notifications.ts    # Notification management
│   │   └── analytics.ts        # Analytics endpoints
│   └── services/
│       ├── link-service.ts     # Link business logic
│       ├── intent-service.ts   # Intent scoring engine
│       ├── notification-service.ts
│       └── analytics-service.ts
├── db/
│   ├── schema.sql              # PostgreSQL schema
│   ├── migrations.ts           # Migration runner
│   └── seed.ts                 # Sample data
├── scripts/
│   ├── migrate.js              # Database setup
│   └── seed.js                 # Initial data
├── types/
│   ├── index.ts                # Global types
│   ├── api.ts                  # API types
│   └── db.ts                   # Database types
├── public/
│   └── manifest.json           # PWA manifest
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.example
└── README.md                   # This file
```

## Database Schema

### Core Tables
- **users** - Creator accounts with wallet address, profile, sales metrics
- **products** - Digital products for sale
- **smart_links** - Trackable links with offer configurations
- **user_events** - Click, view, conversion, and abandoned events
- **intent_scores** - Purchase probability and offer recommendations
- **offers** - Agent-generated offers with acceptance tracking
- **notifications** - System notifications and alerts
- **email_queue** - BullMQ email queue for Resend integration
- **daily_analytics** - Aggregated performance metrics

See [db/schema.sql](db/schema.sql) for detailed schema definition.

## API Endpoints

### Links
```
POST   /api/links              Create smart link
GET    /api/links              List creator's links
GET    /api/links/code/:code   Get link details
PATCH  /api/links/:id/toggle   Enable/disable link
DELETE /api/links/:id          Delete link
```

### Events & Tracking
```
POST   /api/events/click       Track link click
POST   /api/events/conversion  Track conversion
POST   /api/events/abandon     Track abandoned cart
GET    /api/events/:code       Get link events
```

### Intent Scoring
```
POST   /api/intent/score              Score user intent
GET    /api/intent/history/:code/:uid Intent history
```

### Notifications
```
GET    /api/notifications             Get notifications
GET    /api/notifications/unread/count Unread count
PATCH  /api/notifications/:id/read    Mark as read
PATCH  /api/notifications/all/read    Mark all as read
```

### Analytics
```
GET    /api/analytics/dashboard       Dashboard stats
GET    /api/analytics/link/:id        Link-specific metrics
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone repository**
```bash
cd autopilot
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. **Set up database**
```bash
npm run db:migrate
npm run db:seed
```

4. **Start development servers**

Terminal 1 - Frontend:
```bash
npm run dev
# http://localhost:3000
```

Terminal 2 - Backend:
```bash
npm run api
# http://localhost:3001
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/autopilot
POSTGRES_USER=autopilot_user
POSTGRES_PASSWORD=changeme

# Redis
REDIS_URL=redis://localhost:6379

# API
API_PORT=3001
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email
RESEND_API_KEY=re_xxx

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRY=7d

# Base Blockchain
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
BASE_CONTRACT_ADDRESS=0x...

# Orisae Integration
NEXT_PUBLIC_ORISAE_URL=https://orisae-main.vercel.app
```

## Smart Link Features

### Link Generation
```typescript
// Create a smart link with offer logic
POST /api/links
{
  "target_url": "https://example.com/product",
  "product_id": "uuid-123",
  "offer_type": "recovery",    // recovery, discount, upsell, bundle
  "offer_value": 15             // discount percentage
}
```

### Intent Scoring
The system scores user intent (0-100) based on:
- **Engagement** (40%) - Page time, scroll depth, repeat visits
- **Urgency** (35%) - Recent activity, frequency of visits
- **Price Sensitivity** (-25%) - Price checks, comparison behavior

### Offer Recommendations
Agent decision logic:
- **High Intent (70+)** → Upsell (0% discount)
- **Medium Intent (50-70)** → Bundle/Small discount (10-15%)
- **Low Intent + High Urgency** → Recovery discount (20%)
- **Price Sensitive** → Recovery discount (25-30%)

### Notifications
- **Conversions** - Immediate alert with sale details
- **Abandoned Carts** - 24-hour delayed notification
- **New Leads** - High-intent users without conversion
- **Offer Accepted** - When agent offer is successful

## Deployment

### Frontend (Vercel)
```bash
git push origin main
# Auto-deploys to Vercel
```

### Backend (Railway/Heroku)
```bash
# Push to Railway
railway up

# Or Heroku
git push heroku main
```

### Database (PostgreSQL)
```bash
# Use managed service (Railway, Supabase, AWS RDS)
# Run migrations in production:
npm run db:migrate -- --prod
```

## Integration with Orisae

Autopilot integrates with the Orisae creator platform:

1. **Wallet Connection** - Share Web3 wallet between platforms
2. **Creator Dashboard** - Link to Autopilot from Orisae dashboard
3. **Smart Links** - Generate recovery links for Orisae products
4. **Analytics** - View conversions from Autopilot within Orisae
5. **Notifications** - Unified notification system

## Architecture

### Intent Scoring Engine
```
User Events (clicks, views) 
    ↓
Event Analysis (engagement, urgency, sensitivity)
    ↓
Intent Score Calculation (weighted scoring)
    ↓
Offer Recommendation (agent decision)
    ↓
Notification & Tracking
```

### Job Queue (BullMQ)
- **Email Queue** - Async email sending via Resend
- **Notification Queue** - Real-time push notifications
- **Analytics Queue** - Daily aggregation jobs
- **Recovery Queue** - Scheduled recovery emails

## Testing

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## Security

- ✅ JWT authentication with expiry
- ✅ Environment variable encryption
- ✅ PostgreSQL parameterized queries (prevent SQL injection)
- ✅ Rate limiting on API endpoints
- ✅ HTTPS enforcement in production
- ✅ CORS configuration by domain
- ✅ Input validation on all endpoints

## Performance

- ✅ Redis caching for intent scores (1 hour TTL)
- ✅ Link analytics aggregation (daily batches)
- ✅ Async email processing (BullMQ)
- ✅ Database indexes on hot columns
- ✅ Frontend code splitting & lazy loading
- ✅ Edge caching for static assets

## Roadmap

- [ ] Smart contract integration for Base blockchain
- [ ] Advanced offer A/B testing
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Webhook notifications
- [ ] Stripe/payment integration
- [ ] Advanced ML intent scoring
- [ ] Creator marketplace

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@autopilot.app
- 🐙 GitHub Issues: Report bugs
- 📖 Docs: [Full documentation](https://docs.autopilot.app)

## Acknowledgments

Built for digital creators by the Orisae team.

Powered by:
- Base Blockchain
- Resend (email)
- BullMQ (job queue)
- Wagmi (Web3)

---

**Status**: MVP ready for testing (May 2026)
