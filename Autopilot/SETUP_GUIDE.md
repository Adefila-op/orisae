# Autopilot Setup Guide

## Quick Start

Prerequisites:
- Node.js 18+
- PostgreSQL 14+

### 1. Install

```bash
npm install
```

### 2. Configure env

```bash
cp .env.example .env.local
```

Minimum local env:

```env
DATABASE_URL=postgresql://autopilot_user:changeme@localhost:5432/autopilot
NODE_ENV=development
JWT_SECRET=autopilot_dev_secret_key_change_in_production
NEXT_PUBLIC_API_URL=/api
```

### 3. Start Postgres

Using Docker:

```bash
docker-compose up -d postgres
```

### 4. Initialize the database

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Autopilot

```bash
npm run dev
```

Main endpoints:
- App: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Status: `http://localhost:3000/api/status`

## Verification

Run:

```bash
npm run db:verify
```

Or check status directly:

```bash
curl http://localhost:3000/api/status
```

## Troubleshooting

Database connection:

```bash
psql postgresql://autopilot_user:changeme@localhost:5432/autopilot -c "SELECT NOW()"
```

Migrations:

```bash
npm run db:migrate
```

If the app does not start, make sure nothing else is using port `3000`.

## Architecture Note

This repo no longer uses a separate Express backend. The main Autopilot backend lives in `src/app/api`, and the UI plus API run together in the Next.js app.
