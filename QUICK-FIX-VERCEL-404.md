# 🚨 Quick Fix: Vercel 404 Error

## The Problem
You're getting a 404 error because Vercel is looking in the wrong directory. Your Next.js app is inside `energy-audit-platform/` folder, not at the root.

## ✅ Quick Solution (2 Minutes)

### Step 1: Go to Vercel Dashboard
Open: https://vercel.com/dashboard

### Step 2: Find Your Project
Click on your deployed project

### Step 3: Go to Settings
Click "Settings" tab at the top

### Step 4: Edit Root Directory ⚠️ MOST IMPORTANT
1. Scroll down to "Root Directory"
2. Click "Edit" button
3. Type: `energy-audit-platform`
4. Click "Save"

### Step 5: Redeploy
1. Go to "Deployments" tab
2. Click "..." (three dots) on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to finish

### Step 6: Add MongoDB (If Not Done)
1. Go to "Settings" → "Environment Variables"
2. Click "Add New"
3. Name: `MONGODB_URI`
4. Value: Your MongoDB connection string
   ```
   mongodb+srv://username:password@cluster.mongodb.net/energy-audit
   ```
5. Click "Save"
6. Redeploy again

## 🎉 Done!

Your site should now work at: `https://your-project.vercel.app`

## Still Not Working?

### Option 1: Deploy Fresh

1. Delete the current Vercel project
2. Create new project
3. Import from GitHub: `rdudr/fox-kisem`
4. **IMPORTANT:** Set Root Directory to `energy-audit-platform` BEFORE deploying
5. Add `MONGODB_URI` environment variable
6. Deploy

### Option 2: Use Vercel CLI

```bash
# Navigate to the app folder
cd energy-audit-platform

# Deploy from here
vercel --prod

# Add MongoDB URI when prompted
```

## Need MongoDB?

### Quick MongoDB Atlas Setup (Free)

1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster (M0 Free tier)
4. Create database user
5. Whitelist all IPs: `0.0.0.0/0`
6. Get connection string
7. Add to Vercel environment variables

## Visual Checklist

```
✅ Root Directory = energy-audit-platform
✅ Framework = Next.js
✅ Build Command = npm run build
✅ Environment Variable MONGODB_URI added
✅ Redeployed after changes
```

## Test Your Deployment

1. Visit your Vercel URL
2. Should see login page (not 404)
3. Try registering a user
4. Try logging in
5. Enter some data
6. Export CSV

## Contact

If still having issues, check:
- Vercel build logs
- MongoDB connection string
- Environment variables are saved

---

**Quick Summary:**
The fix is simple - just set **Root Directory** to `energy-audit-platform` in Vercel project settings, then redeploy!
