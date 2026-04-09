# Fix Railway Deployment Error

## Problem
Railway couldn't find how to start the backend because:
- Procfile wasn't recognized for Python
- `start.sh` script was missing
- Root directory wasn't properly configured

## Solution - REDEPLOY on Railway

### Step 1: Remove Old Deployment
1. Go to https://railway.app/dashboard
2. Find your project (food-forge)
3. Click "Settings"
4. Scroll to bottom and click "Delete Project"
5. Confirm deletion

### Step 2: Create New Deployment
1. Click "Create New" 
2. Select "Deploy from GitHub Repo"
3. Search for: `sanglemegha17-bot/food-forge`
4. Click to select it

### Step 3: Configure Root Directory
1. After selection, Railway will start analyzing
2. Look for the "Settings" tab
3. Find "Root Directory" option
4. Set to: `MESS MANAGEMENT - Copy/backend`
5. Click "Save"

### Step 4: Add Environment Variables
1. Go to "Variables" tab
2. Add these 3 variables:

```
DATABASE_URL
postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

```
SUPABASE_URL
https://iakixyprfnyjfiomhqpa.supabase.co
```

```
SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha2l4eXByZm55amZpb21ocXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzA3NDgsImV4cCI6MjA4NTg0Njc0OH0.r0mLbFlfCf_bAnS8phiYeozuMXWBTTAVooPSqhEgooM
```

### Step 5: Deploy
1. Click "Deploy" button
2. Watch the logs - this time it should work!
3. Wait for green checkmark ✅

### Step 6: Verify
- Check "Logs" tab - should see "Uvicorn running on 0.0.0.0:8000"
- Go to "Deployments" tab
- Get your backend URL from "Networking"
- Test it: `https://YOUR-RAILWAY-URL/`

## What Fixed It
✅ Added `start.sh` - Railway now knows how to start the app
✅ Added `railway.toml` - Explicit Railway configuration
✅ Set correct root directory - Points to backend folder
✅ Added environment variables - Database and API keys

Now Railway will recognize it as a Python app and build correctly!
