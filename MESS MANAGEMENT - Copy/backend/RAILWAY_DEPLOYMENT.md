# Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "Create New Project"

## Step 2: Connect to GitHub Repository
1. Click "Deploy from GitHub repo"
2. Select: `sanglemegha17-bot/food-forge`
3. Click "Deploy"

## Step 3: Set Environment Variables in Railway
1. In Railway dashboard, go to your project
2. Click "Variables"
3. Add these variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SUPABASE_URL=https://iakixyprfnyjfiomhqpa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlha2l4eXByZm55amZpb21ocXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzA3NDgsImV4cCI6MjA4NTg0Njc0OH0.r0mLbFlfCf_bAnS8phiYeozuMXWBTTAVooPSqhEgooM
```

## Step 4: Deploy
- Railway will automatically deploy from your GitHub repo
- Watch the deployment logs
- Once complete, you'll get a backend URL like: `https://food-forge-backend-prod.up.railway.app`

## Step 5: Update Frontend
Update your frontend API calls to use the Railway backend URL instead of localhost.

## Test Backend
Visit: `https://your-railway-domain/` 
Should return: `{"status":"ok","service":"Mess Management System"}`

## Status
- Railway automatically deploys when you push to GitHub `main` branch
- Free tier: $5/month credits (usually enough)
- For production: Upgrade to paid plan if needed
