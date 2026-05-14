# Task List

- [x] Update Prisma schema
- [x] Push database schema
- [x] Update login redirect to `/company`
- [x] Update Company UI (mandatory fields & renaming)
- [x] Update Zones/Areas UI (adding new fields & renaming)
- [x] Update API routes for entries and CSV export
- [x] Verify CSV filename uses company name
- [x] **Phase 1: Local Offline Database setup**
  - [x] Configure `zustand` with `persist` using IndexedDB.
  - [x] Migrate `CompanyProfile` to Client Side.
  - [x] Migrate `Zones` (Plant Main Input) to Client Side.
  - [x] Migrate `Areas` (MCC/PCC) to Client Side.
  - [x] Migrate `Entries` (Motor Loads) to Client Side.
  - [x] Remove all `fetch('/api/...')` from UI components.
- [x] **Phase 2: Offline Excel Export**
  - [x] Move Excel generation logic from API route to a client-side utility function.
  - [x] Enable native `.xlsx` download directly from the browser/device without network.
- [x] **Phase 3: Cloud Sync Mechanism**
  - [x] Create `/api/sync` endpoint in Next.js to receive offline data payload.
  - [x] Add "Sync to Server" button in the Dashboard UI.
- [x] Add empty default state for starter selection
- [x] Make machine details line-by-line feed use short format + dropdown expansion
- [x] Implement database wipe (clear cache) on new login session
- [x] Fix Prisma provider mismatch (PostgreSQL -> SQLite)
- [x] Implement case-insensitive login validation
- [x] Add user Faizan to database seed
- [x] Update Faizan's password to IITGN5
- [x] Secure git repository by ignoring and untracking sensitive/test files
- [x] Rename UI terminology (Zone -> Plant Main Input, Area -> MCC/PCC, Entry -> Motor Load)
- [x] Update Prisma Schema for new PQ fields (KVAr, V/I phases, Description)
- [x] Implement Auto Rated HP calculation based on Rated kW
- [x] Implement real-time Total Power calculation for Plant Main Input & MCC/PCC
- [x] Convert CSV export to Multi-sheet Excel export using xlsx
- [x] **Phase 4: Static Export & Capacitor Android Integration**
  - [x] Implement client-side AuthGuard & offline user credentials store.
  - [x] Configure static Next.js export (`output: "export"`).
  - [x] Ensure API routes are marked static to prevent build failures.
  - [x] Build static files to `out/` via `npm run build:mobile`.
  - [x] Initialize Capacitor project and sync web assets to Android platform.
  - [x] Resolve JDK 21 / Gradle toolchain error for successful APK build.
- [x] **Phase 5: App Icon, Email & Smart Sync Queue**
  - [x] Generate Android app icon from `APP logo.png` at all mipmap sizes (mdpi → xxxhdpi).
  - [x] Fix Excel download for Capacitor WebView (Blob URL instead of `writeFile`).
  - [x] Add Offline Sync Queue (`SyncJob`) to Zustand store with 50-job cap.
  - [x] Auto-prune synced jobs older than 48 hours (TTL memory management).
  - [x] Create `/api/sync/queue` route: saves to DB + sends Gmail email to hardcoded admins.
  - [x] "Export & Complete" button: exports Excel locally, snapshots data, wipes workspace.
  - [x] "Sync Offline Reports" button: shows red badge with pending count, retries all failed jobs.
  - [x] Align offline user credentials to match production DB (IITGN passwords).
  - [x] Added SMTP env vars to `.env` (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).

## ⚠️ Action Required Before Email Works
1. Go to your Google Account → Security → **App Passwords**
2. Create a new App Password for "Mail" → "Windows Computer"
3. Copy the 16-character password and update `.env`:
   ```
   SMTP_USER=your-actual-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```
4. Update `ADMIN_EMAILS` in `app/api/sync/queue/route.ts` with real recipient addresses.
5. Redeploy to Vercel (env vars must also be set in Vercel dashboard).
