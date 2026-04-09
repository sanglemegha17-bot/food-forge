# Vercel Deployment Setup - REQUIRED STEPS

## 1. Generate NEXTAUTH_SECRET
Run this in PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Copy the output - you'll need it in step 2.

## 2. Set Vercel Environment Variables

Go to: https://vercel.com/dashboard 

### Steps:
1. Select your project: **food-forge** (or your project name)
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)
4. Click **Add New** and fill in each variable below

### Required Variables (ALL 4):

| Variable | Value |
|----------|-------|
| **NEXTAUTH_URL** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **NEXTAUTH_SECRET** | `(paste the Base64 string from step 1)` |
| **NEXT_PUBLIC_APP_URL** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **DATABASE_URL** | `postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

**IMPORTANT:** For each variable:
- Check: ✅ Production
- Check: ✅ Preview  
- Check: ✅ Development
- Click **Save**

### Find Your Vercel Domain:
- Dashboard → Your Project → Deployments
- Click latest deployment → Look for the URL (e.g., `food-forge-xyz.vercel.app`)

## 3. Redeploy on Vercel

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

## 4. Test

Visit: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/health`
Should return: `{"status":"ok"}`

If you see errors, check the **Logs** in Vercel dashboard.

---

## Variables Already Configured Locally:
- ✅ `.env.local` - for development
- ✅ `.env.production` - template for production  
- ✅ Backend Neon connection - ready

## Status:
- ✅ Frontend: Ready
- ✅ Backend: Ready  
- ⏳ Vercel Env Vars: **PENDING** (needs manual setup above)
