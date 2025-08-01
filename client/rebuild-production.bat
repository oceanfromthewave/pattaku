@echo off
echo 🔥 긴급 프로덕션 재빌드 시작...

REM 기존 빌드 폴더 완전 삭제
if exist "dist" (
    echo 🗑️ 기존 빌드 폴더 삭제 중...
    rmdir /s /q dist
)

REM Node 모듈 캐시 정리
echo 🧹 캐시 정리 중...
npm run clean

REM 환경변수 명시적 설정
set NODE_ENV=production
set VITE_API_URL=https://pattaku.onrender.com
set VITE_UPLOADS_URL=https://pattaku.onrender.com/uploads
set VITE_WS_URL=wss://pattaku.onrender.com

echo 📦 환경변수 설정:
echo   NODE_ENV=%NODE_ENV%
echo   VITE_API_URL=%VITE_API_URL%
echo   VITE_UPLOADS_URL=%VITE_UPLOADS_URL%
echo   VITE_WS_URL=%VITE_WS_URL%

echo 🏗️ 프로덕션 빌드 실행 중...
npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ 빌드 성공!
    echo 📋 빌드된 파일 확인...
    
    if exist "dist\assets\*.js" (
        echo 🔍 API URL 확인 중...
        findstr /c:"pattaku.onrender.com" dist\assets\*.js
        if %ERRORLEVEL% EQU 0 (
            echo ✅ 올바른 API URL 확인됨
        ) else (
            echo ❌ API URL 문제 발견
        )
        
        findstr /c:"s3-website" dist\assets\*.js
        if %ERRORLEVEL% EQU 0 (
            echo ❌ 잘못된 S3 URL 발견
        ) else (
            echo ✅ S3 URL 없음 - 정상
        )
    )
    
    echo.
    echo 🚀 배포 준비 완료!
    echo 📁 dist 폴더를 S3에 업로드하세요
) else (
    echo ❌ 빌드 실패 (오류 코드: %ERRORLEVEL%)
)

pause
