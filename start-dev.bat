@echo off
title Pattaku Development Environment

echo Starting Pattaku development environment...
echo.

echo [1/2] Starting backend server...
start "Pattaku Server" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Starting frontend client...
start "Pattaku Client" cmd /k "cd client && npm run dev"

echo.
echo Development environment started!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul