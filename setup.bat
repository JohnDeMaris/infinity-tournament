@echo off
echo.
echo ============================================================
echo   Infinity Tournament Manager - First Time Setup
echo ============================================================
echo.

:: Check if Node is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if pnpm is available
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo pnpm not found. Installing...
    npm install -g pnpm
)

:: Run the setup script
node scripts/setup.js

pause
