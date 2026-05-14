# Fox Kisem - Industrial Data Acquisition and Energy Audit Platform

Production-oriented web platform for machine-wise industrial data capture, energy auditing, OCR extraction, CSV flows, and dashboard analytics.

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL (Neon or Supabase free tier)
- Tailwind + reusable UI components
- Tesseract.js for OCR
- PapaParse for CSV import/export

## Quick Start

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env`
   - set `DATABASE_URL` and `SESSION_SECRET`
3. Initialize schema and seed:
   - `npm run db:push`
   - `npm run db:seed`
4. Run app:
   - `npm run dev`

Login defaults after seed:

- `admin@plant.local` / `ChangeMe!Plant1`
- `operator@plant.local` / `Operator!Plant1`

## Build and Validation

- Lint: `npm run lint`
- Production build: `npm run build`

## Docs

See `docs/`:

- `MASTER_SYSTEM.md`
- `DATABASE_SCHEMA.md`
- `API_REFERENCE.md`
- `WORKFLOW_STATUS.md`
- `CHANGELOG.md`
