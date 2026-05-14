# Fox Kisem - Deployment Guide

## Latest Updates (May 14, 2026)

### ✅ Completed Updates
1. **Branding**: Rebranded entire application from "Kisen" to "Kisem"
2. **Email Recipients**: Added `iea@iitgn.ac.in` to admin recipients list
3. **Email Logic**: Updated send-report and sync/queue API routes with new recipient
4. **Android Package**: Migrated to `com.kisem.foxkisem` structure
5. **Production Build**: Successfully compiled with Next.js Turbopack
6. **GitHub**: Pushed all changes to `mobile-offline-app` branch

### Email Configuration
**Recipients List (7 total):**
- loriyasagar.b@iitgn.ac.in
- abhay.maurya@iitgn.ac.in
- md.faizan@iitgn.ac.in
- rishabh.dangi@iitgn.ac.in
- dhruvit.patel@iitgn.ac.in
- rahuljayantibhai.p@iitgn.ac.in
- iea@iitgn.ac.in ✨

**Email Signature:**
```
Fox Kisem — Industrial Data Collection System
IITGN Kisem Lab
```

### Updated Files Summary
- `.env.example` - Database URL updated for Kisem
- `capacitor.config.ts` - Web/mobile app configuration
- `app/api/sync/queue/route.ts` - Sync endpoint with mail logic
- `app/api/send-report/route.ts` - Report email endpoint
- `android/app/build.gradle` - Android package namespace
- `android/app/src/main/res/values/strings.xml` - App strings
- `android/app/src/main/java/com/kisem/foxkisem/` - Java package
- `test-email.mjs` - Email verification script
- `.gitignore` - Exclude large Android JDK files

## Vercel Deployment

### Prerequisites
1. PostgreSQL database URL (update in Vercel environment variables)
2. SMTP configuration (already set in `.env`):
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`

### Environment Variables Required on Vercel
```
DATABASE_URL=postgresql://user:password@host:5432/fox_kisem
SESSION_SECRET=<long-random-string-min-32-chars>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASS=<app-password>
ALLOW_REGISTER=false
```

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### API Routes Available
- `POST /api/sync` - Data sync endpoint
- `POST /api/sync/queue` - Automated email to admin recipients
- `POST /api/send-report` - Custom report email with attachment
- `POST /api/auth/login` - User authentication
- `GET /api/auth/session` - Session verification
- `POST /api/auth/logout` - User logout

### Email Testing
Run locally before deployment:
```bash
node test-email.mjs
```

## Build Status

### Production Build (May 14, 2026)
- ✅ TypeScript compilation
- ✅ Next.js optimization
- ✅ Static page generation (22 pages)
- ✅ API route bundling
- ✅ Zero build errors

### Routes Compiled
- Landing page (`/`)
- Login page (`/login`)
- Console pages (dashboard, areas, zones, machines, company, csv)
- API endpoints (all operational)

## Git Repository
- **Branch**: `mobile-offline-app`
- **Remote**: https://github.com/rdudr/fox-kisem
- **Latest Commit**: feat: rebrand Kisen to Kisem and update email recipients

## Mobile App (Android)
- **Package**: `com.kisem.foxkisem`
- **App Name**: Fox Kisem
- **Configuration**: Updated capacitor.config.ts
- **JDK**: Not tracked in git (excluded for size)

## Next Steps
1. Connect PostgreSQL database to Vercel
2. Configure SMTP credentials in Vercel environment
3. Deploy to Vercel (connect GitHub repository)
4. Test email sending from production
5. Build and deploy Android APK with new package structure
