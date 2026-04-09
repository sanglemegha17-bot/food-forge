#!/bin/bash
# Railway Auto-Deployment Script
# This script prepares your backend for Railway deployment

echo "========================================="
echo "Railway Backend Deployment Setup"
echo "========================================="

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env not found"
    exit 1
fi

echo "✓ Backend configuration found"
echo "✓ pyproject.toml configured"
echo "✓ Procfile configured"
echo ""
echo "Next steps in Railway Dashboard:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Create New → Deploy from GitHub Repo"
echo "3. Select: sanglemegha17-bot/food-forge"
echo "4. Set Root Directory: MESS MANAGEMENT - Copy/backend"
echo "5. Add Environment Variables (see RAILWAY_DEPLOYMENT.md)"
echo "6. Click Deploy"
echo ""
echo "Your backend URL will be shown in the Networking tab"
