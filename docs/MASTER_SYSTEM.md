# MASTER SYSTEM

Fox Kisen is a production-oriented industrial platform for machine-wise data acquisition, energy auditing, CSV operations, OCR extraction, and dashboard analytics.

## Architecture

- Frontend and backend: Next.js App Router + route handlers
- Database: PostgreSQL via Prisma
- Auth: JWT session cookie with role-based access (Admin, Operator, Viewer)
- OCR: Tesseract.js with post-extraction manual correction
- CSV: Export/import APIs with machine-scoped ingestion
- UI: Reusable glassmorphism component system

## Core Modules

- `auth`: login/register/logout/session + route protection (`proxy.ts`)
- `machines`: asset registry and electrical metadata
- `data acquisition`: dynamic parameter forms by machine kind
- `csv`: export and import pipeline for historical records
- `ocr`: image upload, text extraction, structured field parsing
- `energy audit`: Scope 1/2/3 records, SEC/PAT/PF/emissions fields
- `dashboard`: real DB metrics, trend chart, status cards, recent logs

## Scalability Hooks

- `uploads/` local storage path supports future cloud object storage
- schema and services are ready for MQTT + realtime ingestion extension
- energy tables are ready for carbon tracking and predictive analytics layers
