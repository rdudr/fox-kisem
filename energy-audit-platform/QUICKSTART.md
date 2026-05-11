# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB installed locally OR MongoDB Atlas account

### Step 1: Install Dependencies
```bash
cd energy-audit-platform
npm install
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB (Easiest for Testing)**
```bash
# Windows: Download and install from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community && brew services start mongodb-community
# Linux: sudo apt-get install mongodb && sudo systemctl start mongodb

# Your connection string: mongodb://localhost:27017/energy-audit
```

**Option B: MongoDB Atlas (Free Cloud Database)**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Replace password in string

### Step 3: Configure Environment
The `.env.local` file is already created. Update if needed:
```env
MONGODB_URI=mongodb://localhost:27017/energy-audit
```

### Step 4: Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### Step 5: First Login
1. Click "Register" to create account
2. Enter username and password
3. Login with credentials
4. Fill company information
5. Start entering machine data!

## 📊 Sample Data Entry

Try entering this sample data:

**Machine Selection:**
- Plant: Plant A - Dyeing
- Machine Type: Jet Machine
- Machine Name: Jet Machine 1

**Parameters:**
- Frequency: 50 Hz
- Rated kW: 7.5
- Rated HP: 10
- Voltage: 415 V
- Current: 10 A
- Power Factor: 0.98

**Auto-calculated values will appear instantly!**

## 🎯 Key Features to Test

1. **Data Entry**: Submit multiple machine readings
2. **Dashboard Stats**: View total records, avg load factor, total power
3. **Search & Filter**: Use search box and dropdown filters
4. **CSV Export**: Click "Export CSV" to download all data
5. **Responsive Design**: Try on mobile/tablet

## 🔧 Troubleshooting

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac: brew services list
# Linux: sudo systemctl status mongodb
```

**Port 3000 Already in Use:**
```bash
# Use different port
PORT=3001 npm run dev
```

**Build Errors:**
```bash
# Clear and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

## 📦 Deploy to Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy to Vercel:**
```bash
npm i -g vercel
vercel login
vercel
```

## 📱 Mobile Testing

The platform is fully responsive. Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## 🎨 Customization

**Change Theme Colors:**
Edit `tailwind.config.ts` and replace `blue-` classes in components.

**Add More Machine Types:**
Edit `lib/machineConfig.ts` to add plants and machine types.

**Modify Calculations:**
Edit `lib/calculations.ts` to adjust formulas.

## 📚 Next Steps

1. Add more machine types in `machineConfig.ts`
2. Customize company info fields
3. Add more calculated parameters
4. Implement user roles and permissions
5. Add data visualization charts
6. Set up automated backups

## 💡 Tips

- Use Ctrl+F to search in data table
- Export CSV regularly for backups
- Test calculations against Excel file
- Keep MongoDB connection string secure
- Use MongoDB Atlas for production

## 🆘 Need Help?

Check these files:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Deployment guide
- `lib/types.ts` - Data structures
- `lib/calculations.ts` - Calculation logic

## ✅ Success Checklist

- [ ] MongoDB connected
- [ ] Development server running
- [ ] User registered and logged in
- [ ] Company info saved
- [ ] Sample data entered
- [ ] Calculations working
- [ ] CSV export successful
- [ ] Mobile responsive working

You're all set! 🎉
