# 🚀 Getting Started - Energy Audit Platform

## Welcome!

You now have a complete, production-ready energy audit platform. This guide will help you get started in minutes.

## 📦 What's Included

```
✅ Complete Next.js 15 application
✅ MongoDB database integration
✅ Responsive UI (mobile, tablet, desktop)
✅ Real-time calculations
✅ CSV export functionality
✅ User authentication
✅ Session tracking
✅ Company management
✅ Machine data entry
✅ Dashboard with statistics
✅ Search and filter
✅ Comprehensive documentation
✅ Deployment ready (Vercel)
```

## 🎯 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd energy-audit-platform
npm install
```

### Step 2: Setup Database

**Option A: Local MongoDB (Fastest)**
```bash
# Already configured in .env.local
# Just make sure MongoDB is running on your system
```

**Option B: MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/energy-audit
```

### Step 3: Run Application
```bash
npm run dev
```

Open http://localhost:3000 🎉

## 📖 Documentation Guide

Start with these files in order:

1. **[QUICKSTART.md](energy-audit-platform/QUICKSTART.md)** ⭐ START HERE
   - 5-minute setup
   - Sample data
   - First login

2. **[README.md](energy-audit-platform/README.md)**
   - Complete documentation
   - All features explained
   - Usage guide

3. **[FEATURES.md](energy-audit-platform/FEATURES.md)**
   - Detailed feature list
   - How each feature works
   - Configuration options

4. **[DEPLOYMENT.md](energy-audit-platform/DEPLOYMENT.md)**
   - Deploy to Vercel
   - Deploy to other platforms
   - Production checklist

5. **[SETUP-COMPLETE.md](energy-audit-platform/SETUP-COMPLETE.md)**
   - Complete setup guide
   - Customization guide
   - Troubleshooting

6. **[PROJECT-SUMMARY.md](energy-audit-platform/PROJECT-SUMMARY.md)**
   - Technical overview
   - Architecture
   - Database schema

## 🎓 First Time User Guide

### 1. Register Account
- Open http://localhost:3000
- Click "Register"
- Enter username and password
- Click "Register"

### 2. Login
- Enter your credentials
- Click "Sign In"

### 3. Enter Company Info
- Company Name: Your company
- Company Address: Your address
- Auditor Name: Your name
- Click "Continue to Dashboard"

### 4. Enter Machine Data
- Select Plant: "Plant A - Dyeing"
- Select Machine Type: "Jet Machine"
- Select Machine Name: "Jet Machine 1"
- Enter parameters:
  - Frequency: 50
  - Rated kW: 7.5
  - Rated HP: 10
  - Voltage: 415
  - Current: 10
  - Power Factor: 0.98
- Watch calculations appear automatically!
- Click "Submit Data"

### 5. View Dashboard
- See statistics update
- View your record in table
- Try search and filters

### 6. Export Data
- Click "Export CSV"
- Open the downloaded file
- See complete audit report

## 🎨 Customization

### Change Colors
Replace `blue` with your color in components:
```tsx
// Example: Change to green
className="bg-green-600 text-white"
```

### Add Machine Types
Edit `lib/machineConfig.ts`:
```typescript
machineTypes: {
  'Plant A - Dyeing': [
    'Jet Machine',
    'Your New Machine',  // Add here
  ],
}
```

### Modify Calculations
Edit `lib/calculations.ts` to change formulas.

## 🚀 Deploy to Production

### Vercel (Easiest)
```bash
npm i -g vercel
vercel login
vercel
```

### Add Environment Variable
In Vercel dashboard:
- Go to Settings → Environment Variables
- Add `MONGODB_URI` with your MongoDB connection string
- Redeploy

Your site is live! 🎉

## 📱 Test on Mobile

1. Open DevTools (F12)
2. Click device toolbar icon
3. Select iPhone or iPad
4. Test all features

## 🔧 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac: brew services list
# Linux: sudo systemctl status mongodb
```

### Port Already in Use
```bash
PORT=3001 npm run dev
```

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📚 Learn More

### Project Structure
```
energy-audit-platform/
├── app/              # Pages and API routes
├── components/       # React components
├── context/          # State management
├── lib/              # Utilities and config
└── scripts/          # Helper scripts
```

### Key Files
- `app/page.tsx` - Main page with routing
- `components/Dashboard.tsx` - Main dashboard
- `lib/calculations.ts` - Calculation logic
- `lib/machineConfig.ts` - Machine configuration

## 🎯 Next Steps

1. ✅ Test all features locally
2. ✅ Customize machine types
3. ✅ Add your company data
4. ✅ Deploy to Vercel
5. ✅ Share with team

## 💡 Tips

- Export CSV regularly for backups
- Test calculations against Excel
- Use search to find records quickly
- Try on mobile devices
- Keep MongoDB URI secure

## 🆘 Need Help?

1. Check documentation files
2. Review code comments
3. Test with sample data
4. Check troubleshooting section

## ✅ Checklist

Before going live:

- [ ] MongoDB connected
- [ ] Test user created
- [ ] Company info entered
- [ ] Sample data entered
- [ ] Calculations verified
- [ ] CSV export tested
- [ ] Mobile tested
- [ ] Deployed to Vercel
- [ ] Production MongoDB configured
- [ ] Environment variables set

## 🎉 You're Ready!

Your platform is complete and ready to use. Start entering real machine data and generating audit reports!

**Happy auditing! ⚡🔋**

---

**Questions?** Check the documentation files in `energy-audit-platform/`

**Issues?** Review the troubleshooting section

**Customization?** See SETUP-COMPLETE.md for guides
