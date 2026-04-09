@echo off
REM Script to generate NEXTAUTH_SECRET for Vercel

REM Using PowerShell to generate 32 bytes random Base64 string
powershell -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))" > nextauth_secret.txt

REM Display the generated secret
echo.
echo ===== NEXTAUTH_SECRET Generated =====
echo.
set /p SECRET=<nextauth_secret.txt
echo %SECRET%
echo.
echo ===== How to use: =====
echo 1. Copy the secret above
echo 2. Go to Vercel dashboard
echo 3. Settings -> Environment Variables
echo 4. Add new variable: NEXTAUTH_SECRET
echo 5. Paste the secret
echo.
pause
