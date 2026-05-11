# Energy Audit Platform - Complete Project

## 🎯 Overview

A modern, responsive web platform for industrial data acquisition and energy auditing. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS. Fully functional, production-ready, and deployable to Vercel.

## 📁 Project Location

```
📦 energy-audit-platform/
   └── Complete Next.js application with all features
```

## ✨ Features

✅ **Secure Authentication** - Login/register with session tracking  
✅ **Company Management** - Store company info in all exports  
✅ **Machine Selection** - 3-tier dropdown (Plant → Type → Name)  
✅ **Real-Time Calculations** - Auto-calculate kVA, kW, kVAr, Load Factor  
✅ **Data Entry** - Clean, responsive form interface  
✅ **Dashboard** - Statistics and data visualization  
✅ **CSV Export** - Complete audit reports with headers  
✅ **Search & Filter** - Find records quickly  
✅ **Mobile Responsive** - Works on all devices  
✅ **Timestamp Tracking** - Every entry logged with date/time  

## 🚀 Quick Start

```bash
# Navigate to project
cd energy-audit-platform

# Install dependencies
npm install

# Setup MongoDB (local or Atlas)
# Update .env.local with your MongoDB URI

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📚 Documentation

| File | Description |
|------|-------------|
| [README.md](energy-audit-platform/README.md) | Complete project documentation |
| [QUICKSTART.md](energy-audit-platform/QUICKSTART.md) | 5-minute setup guide |
| [DEPLOYMENT.md](energy-audit-platform/DEPLOYMENT.md) | Deployment instructions |
| [FEATURES.md](energy-audit-platform/FEATURES.md) | Feature documentation |
| [SETUP-COMPLETE.md](energy-audit-platform/SETUP-COMPLETE.md) | Complete setup guide |
| [PROJECT-SUMMARY.md](energy-audit-platform/PROJECT-SUMMARY.md) | Technical summary |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB
- **Hosting**: Vercel-ready
- **Libraries**: Papa Parse, date-fns

## 📊 Calculation Logic

Based on the Excel file `Mahadev Silk Mills Motor Load Sheet (1).xlsx`:

```
kVA = √3 × V × I / 1000
kW = √3 × V × I × PF / 1000
kVAr = √(kVA² - kW²)
Load Factor = Calculated Power / Rated kW
```

## 🎨 Screenshots

### Login Page
- Clean authentication interface
- Register new users
- Session tracking

### Company Info
- Company name and address
- Auditor/operator name
- Persistent across sessions

### Dashboard
- Summary statistics
- Data entry form
- Real-time calculations
- Data table with search/filter
- CSV export

### Mobile Responsive
- Fully functional on mobile
- Touch-friendly interface
- Optimized layouts

## 📦 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel login
vercel
```

### MongoDB Atlas
1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Add to Vercel environment variables

See [DEPLOYMENT.md](energy-audit-platform/DEPLOYMENT.md) for details.

## 🔧 Configuration

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/energy-audit
```

### Machine Configuration
Edit `lib/machineConfig.ts` to add plants and machine types.

### Calculations
Edit `lib/calculations.ts` to modify formulas.

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All layouts fully responsive and tested.

## 🎯 Use Cases

- Industrial energy audits
- Machine load monitoring
- Power consumption tracking
- Compliance reporting
- Historical data analysis

## 🔒 Security

- Environment variable protection
- Input validation
- XSS prevention
- CSRF protection
- HTTPS on Vercel

## 🚀 Future Enhancements

- [ ] Charts and graphs
- [ ] PDF report generation
- [ ] IoT sensor integration
- [ ] User roles and permissions
- [ ] AI-powered insights
- [ ] Mobile app

## 📞 Support

For detailed information, see documentation files in `energy-audit-platform/` directory.

## ✅ Project Status

**Status**: ✅ Complete and Production Ready  
**Version**: 1.0.0  
**Build**: Passing ✓  
**Tests**: Manual testing complete  

## 🎉 Getting Started

1. Read [QUICKSTART.md](energy-audit-platform/QUICKSTART.md)
2. Install dependencies
3. Setup MongoDB
4. Run development server
5. Test features
6. Deploy to Vercel

**Ready to use! 🚀**
