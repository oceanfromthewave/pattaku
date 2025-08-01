@echo off
echo Building project for production...

if exist "dist" rmdir /s /q dist

set NODE_ENV=production
set VITE_API_URL=https://pattaku.onrender.com
set VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
set VITE_WS_URL=wss://pattaku.onrender.com

echo Environment: %NODE_ENV%
echo API URL: %VITE_API_URL%

npm run build:production

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo Check dist folder and upload to S3
) else (
    echo Build failed!
)

pause
