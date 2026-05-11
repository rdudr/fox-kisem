# Deployment Guide

## Deploy to Vercel (Recommended)

### Step 1: Prepare MongoDB

You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Replace `<password>` with your actual password
7. Add `/energy-audit` at the end: `mongodb+srv://username:password@cluster.mongodb.net/energy-audit`

#### Option B: Local MongoDB (Development Only)

```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
# Windows: Run MongoDB as a service
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongodb

# Connection string: mongodb://localhost:27017/energy-audit
```

### Step 2: Deploy to Vercel

#### Method 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd energy-audit-platform

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? energy-audit-platform
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add MONGODB_URI

# Paste your MongoDB connection string when prompted

# Deploy to production
vercel --prod
```

#### Method 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./energy-audit-platform`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
6. Click "Deploy"

### Step 3: Verify Deployment

1. Visit your deployed URL (e.g., `https://energy-audit-platform.vercel.app`)
2. Register a new account
3. Login and test data entry
4. Export CSV to verify functionality

## Deploy to Other Platforms

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod

# Add environment variables in Netlify dashboard
```

### Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add MongoDB plugin
4. Set environment variable `MONGODB_URI` to Railway MongoDB URL
5. Deploy

### DigitalOcean App Platform

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create new app from GitHub
3. Add MongoDB database
4. Configure environment variables
5. Deploy

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/energy-audit
```

Optional:

```env
NEXT_PUBLIC_APP_NAME=Energy Audit Platform
```

## Post-Deployment Checklist

- [ ] MongoDB connection is working
- [ ] User registration works
- [ ] Login functionality works
- [ ] Data entry saves correctly
- [ ] CSV export includes all data
- [ ] Responsive design works on mobile
- [ ] All calculations are accurate
- [ ] Session persistence works

## Troubleshooting

### MongoDB Connection Issues

```bash
# Test MongoDB connection
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient('YOUR_MONGODB_URI'); client.connect().then(() => console.log('Connected!')).catch(err => console.error(err));"
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Loading

- Ensure `.env.local` is in the root directory
- Restart development server after adding variables
- In production, add variables through hosting platform dashboard

## Performance Optimization

1. **Enable MongoDB Indexes**:
```javascript
// Run in MongoDB shell
db.machineData.createIndex({ username: 1, timestamp: -1 })
db.machineData.createIndex({ plant: 1, machineType: 1 })
```

2. **Enable Vercel Analytics**:
```bash
npm install @vercel/analytics
```

3. **Add Caching Headers** (already configured in Next.js)

## Security Recommendations

1. Use strong passwords for MongoDB
2. Enable MongoDB IP whitelist
3. Use environment variables for all secrets
4. Enable HTTPS (automatic on Vercel)
5. Implement rate limiting for API routes
6. Add password hashing (bcrypt) for production

## Monitoring

- Vercel Dashboard: Monitor deployments and errors
- MongoDB Atlas: Monitor database performance
- Set up error tracking (Sentry, LogRocket)

## Backup Strategy

1. **MongoDB Atlas**: Automatic backups enabled
2. **Manual Backup**:
```bash
mongodump --uri="YOUR_MONGODB_URI" --out=./backup
```

3. **Restore**:
```bash
mongorestore --uri="YOUR_MONGODB_URI" ./backup
```

## Support

For deployment issues:
- Vercel: https://vercel.com/support
- MongoDB: https://www.mongodb.com/support
- Next.js: https://nextjs.org/docs
