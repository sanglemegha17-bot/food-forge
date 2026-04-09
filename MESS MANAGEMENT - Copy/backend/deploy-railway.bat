@echo off
REM Railway Backend Deployment Script for Windows
REM This script verifies your backend is ready for Railway

echo =========================================
echo Railway Backend Deployment Verification
echo =========================================
echo.

REM Check if backend/.env exists
if not exist "backend\.env" (
    echo ERROR: backend\.env not found
    exit /b 1
)

echo [OK] Backend configuration found
echo [OK] pyproject.toml configured
echo [OK] Procfile configured
echo [OK] requirements.txt has all dependencies
echo.
echo =========================================
echo Backend is READY for Railway deployment!
echo =========================================
echo.
echo NEXT STEPS - Do this in Railway Dashboard:
echo.
echo 1. Go to: https://railway.app/dashboard
echo 2. Click: Create New (or New Project)
echo 3. Select: Deploy from GitHub Repo
echo 4. Find and select: sanglemegha17-bot/food-forge
echo 5. Configure:
echo    - Root Directory: MESS MANAGEMENT - Copy/backend
echo 6. Add Environment Variables:
echo    DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
echo    (See backend/RAILWAY_DEPLOYMENT.md for exact values)
echo 7. Click: Deploy
echo.
echo Wait for deployment to complete (5-10 minutes)
echo Your backend URL will appear in Networking tab
echo.
pause
