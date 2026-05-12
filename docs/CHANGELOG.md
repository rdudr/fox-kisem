# CHANGELOG

## 2026-05-12

- Rebuilt repository from legacy scaffold to a fresh Next.js + Prisma architecture.
- Added production-focused industrial modules: auth, machines, dynamic data-entry, CSV import/export, OCR pipeline, energy audit, reports, and dashboard.
- Implemented role-protected API surface with session cookie auth and route guarding.
- Added reusable UI system for dark industrial glassmorphism design.
- Added seed flow and free-tier deployment-ready env setup (`.env.example`).
- Migrated edge guard from deprecated `middleware` to `proxy` for Next.js 16 compatibility.
