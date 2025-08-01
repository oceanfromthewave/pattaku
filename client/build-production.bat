@echo off
echo Starting production build for S3 deployment...

REM Set production environment variables
set NODE_ENV=production
set VITE_API_URL=https://pattaku.onrender.com
set VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
set VITE_WS_URL=wss://pattaku.onrender.com

echo Environment variables:
echo NODE_ENV=%NODE_ENV%
echo VITE_API_URL=%VITE_API_URL%
echo VITE_UPLOADS_URL=%VITE_UPLOADS_URL%
echo VITE_WS_URL=%VITE_WS_URL%

echo Building application...
npm run build

echo Build completed!
echo You can now deploy the 'dist' folder to S3
pause
