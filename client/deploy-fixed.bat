@echo off
chcp 65001 >nul
echo Starting production build and deployment...

echo.
echo [1/5] Cleaning previous build...
if exist "dist" rmdir /s /q dist

echo.
echo [2/5] Setting environment variables...
set NODE_ENV=production
set VITE_API_URL=https://pattaku.onrender.com
set VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
set VITE_WS_URL=wss://pattaku.onrender.com

echo   NODE_ENV: %NODE_ENV%
echo   VITE_API_URL: %VITE_API_URL%

echo.
echo [3/5] Building for production...
npm run build:production

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [4/5] Verifying build results...
if exist "dist\assets\*.js" (
    findstr /c:"pattaku.onrender.com" dist\assets\*.js >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Correct API URL found
    ) else (
        echo   [WARNING] API URL verification failed
    )
    
    findstr /c:"s3-website" dist\assets\*.js >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [ERROR] Wrong S3 URL found!
    ) else (
        echo   [OK] No S3 URLs found - Good
    )
) else (
    echo   [WARNING] No JS files found in dist/assets
)

echo.
echo [5/5] Deployment options...
echo Choose deployment method:
echo   Type 's3' for automatic S3 deployment
echo   Type 'manual' for manual upload instructions
set /p deploy_choice="Your choice (s3/manual): "

if "%deploy_choice%"=="s3" (
    echo.
    echo Deploying to S3...
    aws s3 sync ./dist s3://pattaku --delete --region ap-southeast-2 --cache-control max-age=0
    if %ERRORLEVEL% EQU 0 (
        echo S3 deployment completed!
        echo Site URL: http://pattaku.s3-website-ap-southeast-2.amazonaws.com
    ) else (
        echo S3 deployment failed
    )
) else (
    echo.
    echo Manual deployment instructions:
    echo 1. Go to AWS S3 Console
    echo 2. Open pattaku bucket
    echo 3. Upload all files from dist folder
    echo 4. Select "Overwrite existing files"
    echo 5. Set Cache-Control to max-age=0
)

echo.
echo Build process completed!
echo.
echo Problem fixed:
echo - API client now detects S3 environment automatically
echo - Forces Render URL usage in production
echo - Dynamic URL configuration based on environment
echo.

pause
