# Implementation Plan

1. **Schema Update**: Update `prisma/schema.prisma` to add `areaName` and `subSubMachineTag` to the `Entry` model.
2. **Database Push**: Run `npx prisma db push` to sync the changes.
3. **Login Redirect**: Update `app/login/page.tsx` to redirect to `/company` upon successful login.
4. **Company UI**: Ensure `app/(console)/company/page.tsx` enforces Company Name and Zone (previously Area) as mandatory details. Rename Area to Zone in UI.
5. **Areas/Zones UI**: Update `app/(console)/areas/page.tsx` to rename "Area" terminology to "Zone". Add fields for "Area" (`areaName`) and "Sub sub machine tag" (`subSubMachineTag`). Update the table to include these columns.
6. **API Updates**:
    - Update `app/api/areas/route.ts` validation schemas to include `areaName` and `subSubMachineTag`.
    - Update `app/api/csv/export/route.ts` to include `areaName` and `subSubMachineTag` in exports.
    - Set CSV filename to use the entered company name instead of a static name.
    - Added CSV filename to DDMM suffix.
    - Added clearing of the database upon login inside `app/api/auth/login/route.ts`.
7. **Documentation**: Create `task.md` and `design.md`.
8. **UI Separation**: Split Areas into Zones and Machines pages to separate the logic.
10. **Fix Prisma Provider Issue**: Change `provider` from `postgresql` to `sqlite` in `prisma/schema.prisma` to match the local `dev.db` database URL and allow Prisma to function correctly.
11. **Case-Insensitive Login**: Update `app/api/auth/login/route.ts` to perform a case-insensitive search for usernames, ensuring login success regardless of casing.
12. **Add New User**: Added user `Faizan` with password `IITGN5` to `prisma/seed.ts` and seeded the database.
13. **Phase 1: Local Offline Database setup**: Configure `zustand` with `persist` using IndexedDB. Migrate `CompanyProfile`, `Zones`, `Areas`, and `Entries` client side. Remove API-based fetching from UI components.
14. **Phase 2: Offline Excel Export**: Move Excel generation logic to client-side utility using `xlsx` to enable native `.xlsx` download directly from browser/device without network.
15. **Phase 3: Cloud Sync Mechanism**: Create `/api/sync` endpoint in Next.js to receive offline data payload. Add "Sync to Cloud" button in the Dashboard UI.
16. **Phase 4: Static Export & Capacitor Android Integration**: Implement client-side AuthGuard & offline user credentials store. Configure static Next.js export (`output: "export"`). Ensure API routes are marked static to prevent build failures. Build static files to `out/` via `npm run build:mobile`. Initialize Capacitor project and sync web assets to Android platform.
