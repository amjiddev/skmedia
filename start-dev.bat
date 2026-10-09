@echo off
REM SK Media Development Server Startup Script
REM یہ سکرپٹ API Server کو شروع کرتا ہے

setlocal enabledelayedexpansion

set "ROOT_PATH=d:\SK Media\skmedia"
set "API_SERVER_PATH=%ROOT_PATH%\artifacts\api-server"

cd /d "%ROOT_PATH%"

echo.
echo ===================================
echo SK Media Development Environment
echo ===================================
echo.

REM Check if node_modules exists
if not exist "%ROOT_PATH%\node_modules" (
    echo Installing dependencies...
    call corepack pnpm@9 install
    if errorlevel 1 (
        echo Error: Dependency installation failed
        pause
        exit /b 1
    )
)

echo Dependencies are ready.
echo.
echo Starting API Server on port 3000...
echo.
echo Note: PostgreSQL must be running on localhost:5432
echo If not started, open another terminal and run:
echo   docker start sk-media-db
echo   or ensure PostgreSQL service is running
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%API_SERVER_PATH%"
set NODE_ENV=development
call corepack pnpm@9 run dev

pause
