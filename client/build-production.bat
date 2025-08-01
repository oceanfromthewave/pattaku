@echo off
echo Starting production build for S3 deployment...

REM 기존 빌드 폴더 삭제
if exist "dist" (
    echo Cleaning previous build...
    rmdir /s /q dist
)

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
npm run build:production

if %ERRORLEVEL% EQU 0 (
    echo Build completed successfully!
    echo Checking built files...
    
    REM 빌드된 파일에서 URL 확인
    if exist "dist\assets\*.js" (
        echo Searching for API URLs in built files...
        findstr /c:"pattaku.onrender.com" dist\assets\*.js
        findstr /c:"s3-website" dist\assets\*.js
    )
    
    echo.
    echo You can now deploy the 'dist' folder to S3
) else (
    echo Build failed with error code %ERRORLEVEL%
)

pause
