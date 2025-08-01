@echo off
echo EMERGENCY BUILD - FORCING RENDER URL

echo Cleaning everything...
if exist "dist" rmdir /s /q dist
if exist "node_modules\.vite" rmdir /s /q node_modules\.vite

echo Setting EMERGENCY environment...
set NODE_ENV=production
set VITE_API_URL=https://pattaku.onrender.com
set VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
set VITE_WS_URL=wss://pattaku.onrender.com

echo EMERGENCY BUILD STARTING...
npm run build:production

if %ERRORLEVEL% EQU 0 (
    echo BUILD SUCCESS!
    echo.
    echo Checking build results...
    findstr /c:"onrender.com" dist\assets\*.js >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Render URL found in build
    ) else (
        echo [ERROR] Render URL NOT found!
    )
    
    findstr /c:"s3-website" dist\assets\*.js >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [CRITICAL] S3 URL still found in build!
    ) else (
        echo [OK] No S3 URLs in build
    )
) else (
    echo BUILD FAILED!
)

echo.
echo UPLOAD dist folder to S3 now!
echo Make sure to:
echo 1. Delete all existing files in S3 bucket first
echo 2. Upload with Cache-Control: max-age=0
echo 3. Clear browser cache after upload

pause
