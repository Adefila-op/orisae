# Autopilot

Smart link tracking, intent scoring, and creator analytics built as a single Next.js application.

Autopilot now includes a creator integrations layer so the agent worker can manage normalized data from email, CRM, analytics, storage, scheduling, and sales platforms.

## Main App

Autopilot now uses the Next.js App Router app in `src/app` as the main product surface and `src/app/api` as the only supported backend API.

Removed legacy code:
- Standalone Express backend in `api/`
- External `/api` rewrite proxy
- Separate `npm run api` server flow

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL
- Axios
- Recharts

## Project Structure

```text
src/
  app/
    api/            # Main backend routes
    dashboard/      # Main Autopilot UI
    page.tsx        # Landing page
  components/       # UI components
  lib/              # Client helpers
  server/           # Shared server utilities
db/
  schema.sql
scripts/
  migrate.js
  seed.js
  verify.js
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Start Postgres and initialize the database:

```bash
docker-compose up -d postgres
npm run db:migrate
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

App URLs:
- Landing: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Integrations: `http://localhost:3000/dashboard/integrations`
- API status: `http://localhost:3000/api/status`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run type-check`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:verify`

## Notes

- The frontend client uses `/api`, which now resolves directly to the App Router routes in `src/app/api`.
- If you were previously using a separate backend on port `3001`, that flow is no longer supported in this repo.
- The agent worker can register and sync creator data sources through `creator_integrations`.
- Current provider catalog covers Gmail, Google Calendar, Google Drive, Notion, Airtable, Google Analytics, Metricool, Mailchimp, Kit, Gumroad, and ThriveCart.
