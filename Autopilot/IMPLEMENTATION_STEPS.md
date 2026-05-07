# Autopilot Production Launch - Implementation Plan

**Status**: Ready to Execute  
**Estimated Duration**: 3-4 weeks (working 4 hours/day)  
**Start Date**: May 7, 2026

---

## PHASE 1: CRITICAL SETUP (Days 1-2) ⚠️
*Blocking all other work - Must complete first*

### Step 1.1: Choose & Deploy PostgreSQL Database
**Time**: 1-2 hours

**Option A: Railway (Recommended - Easiest)**
1. Go to https://railway.app
2. Sign up with GitHub account
3. Click "New Project" → Add PostgreSQL
4. Generate connection string
5. Copy DATABASE_URL to clipboard

**Option B: Supabase**
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string

**Option C: AWS RDS (Most Expensive)**
1. Go to AWS Console
2. RDS → Create Database
3. Choose PostgreSQL 14+
4. Configure 2 vCPU, 2GB RAM minimum
5. Get connection string

**After Database Created**:
- [ ] Note the DATABASE_URL (looks like: `postgresql://user:password@host:port/dbname`)
- [ ] Test connection locally (optional): `psql "your-database-url"`

---

### Step 1.2: Run Database Schema & Migrations
**Time**: 30 minutes

**The Problem**: No migrations exist yet in the repo

**What To Do**:
1. Create database schema file:
```bash
# File: Autopilot/scripts/init-db.sql
```

2. Check if migrations script exists:
```bash
cd "C:\Users\HomePC\Downloads\orisae-main (2)\orisae-main\Autopilot"
ls scripts/
```

**If migrations don't exist, create them** (See Appendix A for full SQL)

3. Run migrations via psql:
```bash
psql "$DATABASE_URL" -f scripts/schema.sql
```

---

### Step 1.3: Setup Email Service
**Time**: 1-2 hours

**Recommended: Resend (Easiest)**
1. Go to https://resend.com
2. Sign up with email
3. Get API key from dashboard
4. Save as `RESEND_API_KEY`
5. Verify sender email (add your domain or use `noreply@resend.dev`)

**Alternative: SendGrid**
1. Go to https://sendgrid.com
2. Sign up and verify email
3. Create API key (Settings → API Keys)
4. Save as `SENDGRID_API_KEY`

**Store for Later**:
```
EMAIL_PROVIDER=resend  # or sendgrid
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@autopilot.popup.dev
```

---

### Step 1.4: Setup JWT Secret & Cron Token
**Time**: 15 minutes

**Generate Secure Keys**:
```powershell
# In PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString())) -replace '=', ''
```

**Create Three Keys**:
```
JWT_SECRET=<generated-key-1>
CRON_AUTHORIZATION_TOKEN=<generated-key-2>
WEBHOOK_SECRET=<generated-key-3>
```

---

### Step 1.5: Configure Vercel Environment Variables
**Time**: 30 minutes

1. Go to https://vercel.com/dashboard
2. Select "autopilot" project
3. Settings → Environment Variables
4. Add each variable:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `JWT_SECRET` | Generated key | Production, Preview |
| `EMAIL_PROVIDER` | `resend` | Production, Preview |
| `RESEND_API_KEY` | API key | Production, Preview |
| `EMAIL_FROM_ADDRESS` | `noreply@autopilot.popup.dev` | Production, Preview |
| `CRON_AUTHORIZATION_TOKEN` | Generated token | Production, Preview |

5. Redeploy to apply variables:
```bash
cd Autopilot
npm run build
# Push to GitHub to trigger Vercel redeploy
git add .
git commit -m "chore: update vercel env vars"
git push origin main
```

---

### Step 1.6: Test Database & Email Integration
**Time**: 45 minutes

**Test Database Connection**:
```bash
curl https://autopilot-vert.vercel.app/api/status
# Should return: { "ok": true, "database": "connected" }
```

**Test Email Sending** (Manual trigger):
```bash
curl -X GET \
  https://autopilot-vert.vercel.app/api/cron/email \
  -H "Authorization: Bearer $CRON_AUTHORIZATION_TOKEN"
# Should return: { "processed": X, "failed": 0 }
```

**Verify in Dashboard**:
- Go to https://autopilot-vert.vercel.app/dashboard
- Click "Refresh" button - should fetch real data, not mock
- Links should show real counts (if any in DB)

---

## PHASE 2: CORE FEATURES (Days 3-6) 
*Build essential UI pages*

### Step 2.1: Build Link Management Page
**Time**: 4-6 hours

**File to Create**: `src/app/dashboard/links/page.tsx`

**Features**:
- [ ] Table listing all creator's links
- [ ] Create new link button → modal form
- [ ] Edit link details
- [ ] Delete link with confirmation
- [ ] Copy tracking code to clipboard
- [ ] Enable/disable toggle per link
- [ ] Search/filter links

**API Endpoints Used**:
- `GET /api/links` - Fetch all links
- `POST /api/links` - Create new link
- `PATCH /api/links/[linkId]` - Update link
- `DELETE /api/links/[linkId]` - Delete link

**Implementation Checklist**:
- [ ] Create page component
- [ ] Create link table component
- [ ] Create link form component (create/edit)
- [ ] Add delete confirmation dialog
- [ ] Add copy-to-clipboard functionality
- [ ] Style with Tailwind
- [ ] Test with real data

---

### Step 2.2: Build Analytics Dashboard Page
**Time**: 5-8 hours

**File to Create**: `src/app/dashboard/analytics/page.tsx`

**Sections**:
1. **Key Metrics Cards**:
   - Total clicks (30d)
   - Total conversions (30d)
   - Conversion rate (%)
   - Total revenue (30d)
   - Average order value

2. **Charts** (using Recharts already in deps):
   - Daily clicks trend (14-day line chart)
   - Conversion funnel (stacked bar)
   - Top products by revenue (pie chart)
   - Top products by conversion rate (bar chart)

3. **Filters**:
   - Date range picker
   - Product filter
   - Platform filter

4. **Export**:
   - Export to CSV
   - Export to PDF (optional)

**API Endpoints**:
- `GET /api/dashboard` - Get aggregated data
- `GET /api/analytics/link/[linkId]` - Link-specific analytics

**Implementation Checklist**:
- [ ] Create analytics page
- [ ] Create metric cards component
- [ ] Create chart components (using Recharts)
- [ ] Add date range selector
- [ ] Implement filters
- [ ] Add export functionality
- [ ] Test with real data

---

### Step 2.3: Build Integrations Management Page
**Time**: 6-10 hours (depends on integrations needed)

**File to Create**: `src/app/dashboard/integrations/page.tsx`

**MVP Integrations** (Start with these 3):
1. **Google Analytics** - Import traffic data
2. **Notion** - Store tracking data
3. **Airtable** - Sync funnel data

**Features per Integration**:
- [ ] Connect/disconnect button
- [ ] OAuth flow
- [ ] Permission scopes display
- [ ] Last sync timestamp
- [ ] Sync status indicator (synced/pending/error)
- [ ] Configuration panel
- [ ] Manual sync button

**API Endpoints**:
- `GET /api/integrations` - List integrations
- `POST /api/integrations/[provider]/auth` - Start OAuth
- `POST /api/integrations/[provider]/disconnect` - Disconnect

**Implementation Steps**:
1. Build integrations page layout
2. Create integration card component
3. Implement OAuth flow for first provider (Google Analytics)
4. Test end-to-end
5. Add other providers incrementally

---

### Step 2.4: Build Admin Dashboard (Basic)
**Time**: 4-6 hours

**File to Create**: `src/app/admin/page.tsx` 

**Features** (MVP):
- [ ] User management table
- [ ] System health status
- [ ] Recent agent runs
- [ ] Error logs
- [ ] Database stats
- [ ] API health checks

**Admin Routes to Protect**:
- `src/app/admin/route.ts` - Redirect non-admins to dashboard

**Implementation**:
- [ ] Create admin page layout
- [ ] Create admin dashboard components
- [ ] Add authentication check
- [ ] Implement role-based access control (RBAC)

---

## PHASE 3: TESTING & OPTIMIZATION (Days 7-9)

### Step 3.1: End-to-End Testing
**Time**: 3-4 hours

**Test Scenarios**:
- [ ] User creates tracked link
- [ ] Simulate clicks and conversions
- [ ] Verify dashboard updates
- [ ] Verify email notification sent
- [ ] Agent scoring calculates correctly
- [ ] Offer recommendations display
- [ ] Link deletion works
- [ ] Analytics show correct numbers

**Tools**:
- Manual testing in browser
- Postman for API testing
- Database query checks

---

### Step 3.2: Performance Testing
**Time**: 2-3 hours

**Test Points**:
- [ ] Dashboard page loads < 2 seconds
- [ ] API responses < 500ms p99
- [ ] Database queries optimized (add indexes)
- [ ] Large dataset handling (1000+ links)

**Database Indexes to Add**:
```sql
CREATE INDEX idx_smart_links_creator_id ON smart_links(creator_id);
CREATE INDEX idx_user_events_link_id ON user_events(link_id);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);
CREATE INDEX idx_offers_link_id ON offers(link_id);
```

---

### Step 3.3: Security Audit
**Time**: 2-3 hours

**Checklist**:
- [ ] JWT_SECRET is production value
- [ ] API endpoints validate auth correctly
- [ ] CORS is properly configured
- [ ] Rate limiting on event endpoint
- [ ] Input validation on all POST endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Environment variables not exposed in client code

**Add Rate Limiting** to `/api/events`:
```typescript
// Use middleware or library like express-rate-limit
const rateLimit = require('express-rate-limit');
// Max 100 requests per minute per IP
```

---

## PHASE 4: LAUNCH PREP (Day 10)

### Step 4.1: Documentation
**Time**: 2-3 hours

Create these docs:
- [ ] `API_DOCS.md` - All endpoints documented
- [ ] `INTEGRATION_GUIDE.md` - How to connect integrations
- [ ] `USER_GUIDE.md` - Creator onboarding guide
- [ ] `ADMIN_GUIDE.md` - Admin dashboard guide
- [ ] `DEPLOYMENT.md` - How to deploy changes
- [ ] `TROUBLESHOOTING.md` - Common issues & fixes

---

### Step 4.2: Final Verification
**Time**: 1-2 hours

**Pre-launch Checklist**:
- [ ] All pages render without errors
- [ ] Database connections working
- [ ] Emails sending successfully
- [ ] Cron jobs scheduled correctly
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
- [ ] Rollback procedure documented

---

### Step 4.3: Launch!
**Time**: 30 minutes

1. Final deployment to Vercel
2. Monitor system for 24 hours
3. Announce availability
4. Gather initial feedback

---

## QUICK START COMMAND SEQUENCE

```bash
# Day 1: Setup
cd "C:\Users\HomePC\Downloads\orisae-main (2)\orisae-main\Autopilot"

# 1. Get database URL from Railway/Supabase
$env:DATABASE_URL = "postgresql://..."

# 2. Get email API key
$env:RESEND_API_KEY = "re_..."

# 3. Generate secure keys
$JWT_SECRET = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString())) -replace '=', ''
$CRON_TOKEN = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString())) -replace '=', ''

# 4. Create .env.production.local (for local testing)
@"
DATABASE_URL=$env:DATABASE_URL
JWT_SECRET=$JWT_SECRET
EMAIL_PROVIDER=resend
RESEND_API_KEY=$env:RESEND_API_KEY
EMAIL_FROM_ADDRESS=noreply@autopilot.popup.dev
CRON_AUTHORIZATION_TOKEN=$CRON_TOKEN
"@ | Out-File .env.production.local

# 5. Build and test
npm run build
npm run dev

# 6. Test endpoints
curl http://localhost:3000/api/status
curl http://localhost:3000/api/dashboard
```

---

## Priority Issues to Fix (In Order)

### 🔴 CRITICAL (Fix Today)
1. [ ] Deploy database
2. [ ] Setup email service
3. [ ] Configure Vercel env vars
4. [ ] Test API connectivity

### 🟠 HIGH (Fix This Week)
1. [ ] Build link management page
2. [ ] Build analytics dashboard
3. [ ] Add database indexes
4. [ ] Full end-to-end testing

### 🟡 MEDIUM (Fix Next Week)
1. [ ] Integrations management
2. [ ] Admin dashboard
3. [ ] Advanced monitoring
4. [ ] Performance optimization

### 🟢 LOW (After Launch)
1. [ ] WebSocket real-time updates
2. [ ] ML intent scoring
3. [ ] Multi-language support
4. [ ] Advanced analytics

---

## Files You'll Need to Create

| Path | Purpose | Estimated LOC |
|------|---------|---------------|
| `scripts/schema.sql` | Database schema | 300-400 |
| `scripts/seed.sql` | Sample data | 50-100 |
| `src/app/dashboard/links/page.tsx` | Link management | 200-300 |
| `src/app/dashboard/analytics/page.tsx` | Analytics | 300-400 |
| `src/app/dashboard/integrations/page.tsx` | Integrations | 250-350 |
| `src/app/admin/page.tsx` | Admin dashboard | 200-250 |
| `src/app/api/cron/email/implementation.ts` | Email sender | 150-200 |
| Various docs | Documentation | 500+ |

---

## Success Criteria

✅ **Phase 1 Complete When**:
- Database is deployed and accessible
- Environment variables configured in Vercel
- API /status endpoint returns live database status
- Email test sends successfully

✅ **Phase 2 Complete When**:
- All 4 dashboard pages are live and functional
- Real data displays (not mock)
- CRUD operations work end-to-end
- Analytics show real metrics

✅ **Phase 3 Complete When**:
- All test scenarios pass
- Performance metrics met (<500ms API, <2s pages)
- Security audit cleared
- Documentation complete

✅ **Phase 4 Complete When**:
- System monitoring active
- Rollback procedure tested
- Launch announcement ready

---

## Resources & Links

- **Railway**: https://railway.app
- **Supabase**: https://supabase.com
- **Resend**: https://resend.com
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Vercel**: https://vercel.com/dashboard

---

**Estimated Total Time**: 30-40 hours  
**Recommended Pace**: 4 hours/day = 1 week  
**Target Launch Date**: May 14, 2026

Next Step: Start with **Step 1.1** (Deploy Database)
