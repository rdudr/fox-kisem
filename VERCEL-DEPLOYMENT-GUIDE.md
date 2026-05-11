# Vercel Deployment Guide - Fix 404 Error

## Problem
Getting 404 error on Vercel because the project is in a subdirectory (`energy-audit-platform/`).

## Solution: Deploy with Correct Root Directory

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository**
   - Select "Import Git Repository"
   - Choose: `rdudr/fox-kisem`
   - Click "Import"

3. **Configure Project Settings** ⚠️ IMPORTANT
   
   **Root Directory:**
   - Click "Edit" next to Root Directory
   - Enter: `energy-audit-platform`
   - This tells Vercel where your Next.js app is located

   **Framework Preset:**
   - Should auto-detect as "Next.js"
   - If not, select "Next.js" manually

   **Build Settings:**
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)
   - Install Command: `npm install` (auto-filled)

4. **Environment Variables**
   - Click "Environment Variables"
   - Add variable:
     - Name: `MONGODB_URI`
     - Value: `mongodb+srv://username:password@cluster.mongodb.net/energy-audit`
     - (Replace with your actual MongoDB connection string)
   - Click "Add"

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your site will be live!

### Method 2: Vercel CLI

```bash
# Navigate to the project directory
cd energy-audit-platform

# Login to Vercel
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? energy-audit-platform
# - Directory? ./ (current directory)
# - Override settings? No

# Add environment variable
vercel env add MONGODB_URI production

# Paste your MongoDB connection string when prompted

# Deploy to production
vercel --prod
```

### Method 3: Update Existing Deployment

If you already deployed and got 404:

1. Go to your project in Vercel Dashboard
2. Click "Settings"
3. Scroll to "Root Directory"
4. Click "Edit"
5. Enter: `energy-audit-platform`
6. Click "Save"
7. Go to "Deployments"
8. Click "..." on latest deployment
9. Click "Redeploy"

## MongoDB Setup for Production

### Option 1: MongoDB Atlas (Recommended)

1. **Create Free Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up / Login
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select region closest to your users
   - Click "Create Cluster"

2. **Create Database User**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `energyaudit`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

3. **Whitelist IP Address**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel)
   - Or add: `0.0.0.0/0`
   - Click "Confirm"

4. **Get Connection String**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Click "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add database name at the end: `/energy-audit`
   
   Example:
   ```
   mongodb+srv://energyaudit:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/energy-audit?retryWrites=true&w=majority
   ```

5. **Add to Vercel**
   - Go to Vercel project settings
   - Click "Environment Variables"
   - Add `MONGODB_URI` with your connection string
   - Click "Save"
   - Redeploy

## Verify Deployment

1. **Check Build Logs**
   - Go to Vercel Dashboard
   - Click on your deployment
   - Check "Building" logs for errors

2. **Test Your Site**
   - Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
   - Should see login page
   - Try registering a user
   - Try logging in

3. **Check Function Logs**
   - Go to Vercel Dashboard
   - Click "Functions" tab
   - Check for any errors

## Common Issues & Fixes

### Issue 1: 404 Error
**Cause:** Root directory not set
**Fix:** Set Root Directory to `energy-audit-platform` in project settings

### Issue 2: Build Failed
**Cause:** Dependencies not installed
**Fix:** 
```bash
cd energy-audit-platform
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue 3: MongoDB Connection Error
**Cause:** Wrong connection string or IP not whitelisted
**Fix:**
- Verify connection string format
- Check MongoDB Atlas Network Access
- Add `0.0.0.0/0` to IP whitelist

### Issue 4: Environment Variables Not Working
**Cause:** Variables not set or deployment not redeployed
**Fix:**
- Go to Settings → Environment Variables
- Verify `MONGODB_URI` is set
- Redeploy the project

### Issue 5: API Routes Return 500
**Cause:** MongoDB connection failed
**Fix:**
- Check Vercel Function logs
- Verify `MONGODB_URI` environment variable
- Test MongoDB connection string locally

## Testing Locally Before Deploy

```bash
# Navigate to project
cd energy-audit-platform

# Install dependencies
npm install

# Create .env.local with production MongoDB URI
echo "MONGODB_URI=your_mongodb_atlas_uri" > .env.local

# Build project
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Vercel project created
- [ ] Root directory set to `energy-audit-platform`
- [ ] Environment variable `MONGODB_URI` added
- [ ] Project deployed successfully
- [ ] Login page loads
- [ ] User registration works
- [ ] Data entry works
- [ ] CSV export works

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically deploy!
```

## Support

If you still face issues:

1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Test locally with production MongoDB URI
4. Contact Vercel support: https://vercel.com/support

## Quick Deploy Command

```bash
cd energy-audit-platform
vercel --prod
```

Your site should now be live without 404 errors! 🎉
