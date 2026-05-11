# Energy Audit Platform

A modern, responsive web platform for industrial data acquisition and energy auditing.

## Features

- **Secure Login System**: User authentication with session tracking
- **Company Information Management**: Store and display company details in all exports
- **Machine Selection System**: Three-tier dropdown (Plant → Machine Type → Machine Name)
- **Real-time Data Entry**: Manual parameter input with instant auto-calculations
- **Auto Calculations**: 
  - kVA = √3 × V × I / 1000
  - kW = √3 × V × I × PF / 1000
  - kVAr = √(kVA² - kW²)
  - Load Factor = Calculated Power / Rated kW
- **Timestamp Tracking**: Every entry captures exact date and time
- **CSV Export**: Complete data export with headers including user and company info
- **Responsive Dashboard**: Works on desktop, tablet, and mobile
- **Data Filtering**: Search and filter by plant, machine type, and keywords
- **Summary Statistics**: Total records, average load factor, total power

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Hosting**: Vercel-ready
- **Libraries**: Papa Parse (CSV), date-fns (dates)

## Setup Instructions

### 1. Install MongoDB

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Install Dependencies

```bash
cd energy-audit-platform
npm install
```

### 3. Configure Environment

Update `.env.local` with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/energy-audit
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/energy-audit
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# MONGODB_URI=your_mongodb_connection_string
```

## Usage Guide

### First Time Setup

1. **Register**: Create a new account with username and password
2. **Login**: Sign in with your credentials
3. **Company Info**: Enter company name, address, and auditor name
4. **Dashboard**: Access the main data entry interface

### Data Entry Workflow

1. **Select Machine**:
   - Choose Plant/Department
   - Select Machine Type
   - Pick specific Machine Name

2. **Enter Parameters**:
   - Frequency (Hz)
   - Rated kW
   - Rated HP
   - Voltage (V)
   - Current (I)
   - Power Factor (0-1)

3. **Auto-Calculated Values** (displayed instantly):
   - kVA
   - kW
   - kVAr
   - Calculated Power
   - Load Factor

4. **Submit**: Data is saved with timestamp

### Export Data

Click "Export CSV" to download all records with:
- User login details
- Company information
- All machine data
- Timestamps
- Calculated values

## Database Schema

### Users Collection
```typescript
{
  username: string,
  password: string,
  createdAt: Date
}
```

### Sessions Collection
```typescript
{
  username: string,
  loginDate: string,
  loginTime: string,
  firstActivityTime: string,
  lastActivityTime: string,
  timestamp: Date
}
```

### Machine Data Collection
```typescript
{
  userId: string,
  username: string,
  companyInfo: {
    companyName: string,
    companyAddress: string,
    auditorName: string
  },
  plant: string,
  machineType: string,
  machineName: string,
  frequency: number,
  ratedKW: number,
  ratedHP: number,
  voltage: number,
  current: number,
  kva: number,
  powerFactor: number,
  kvar: number,
  kw: number,
  calculatedPower: number,
  loadFactor: number,
  timestamp: Date,
  notes?: string
}
```

## Calculation Formulas

Based on the Excel file logic:

1. **kVA** = √3 × V × I / 1000
2. **kW** = √3 × V × I × PF / 1000
3. **kVAr** = √(kVA² - kW²)
4. **Calculated Power** = kW
5. **Load Factor** = Calculated Power / Rated kW

## Future Enhancements

- [ ] OCR-based machine data reading
- [ ] IoT live sensor integration
- [ ] PDF report generation
- [ ] Advanced analytics dashboard
- [ ] Graph visualizations (Chart.js/Recharts)
- [ ] Multi-user access with roles
- [ ] Role-based permissions
- [ ] Energy audit reports
- [ ] AI insights and anomaly detection
- [ ] Historical trend analysis
- [ ] Email notifications
- [ ] Mobile app (React Native)

## Project Structure

```
energy-audit-platform/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   └── machine-data/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── LoginForm.tsx
│   ├── CompanyInfoForm.tsx
│   ├── Dashboard.tsx
│   ├── DataEntryForm.tsx
│   └── DataTable.tsx
├── context/
│   └── AppContext.tsx
├── lib/
│   ├── mongodb.ts
│   ├── types.ts
│   ├── calculations.ts
│   └── machineConfig.ts
├── .env.local
├── package.json
└── README.md
```

## Support

For issues or questions, please contact the development team.

## License

Proprietary - All rights reserved
