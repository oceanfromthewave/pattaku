@echo off
echo Building Pattaku client...
npm run build
if %errorlevel% equ 0 (
    echo Build successful!
) else (
    echo Build failed!
    exit /b 1
)