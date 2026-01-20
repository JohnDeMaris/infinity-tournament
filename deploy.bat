@echo off
echo.
echo ============================================================
echo   Infinity Tournament Manager - Quick Deploy
echo ============================================================
echo.

:: Check if Node is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: Run the deploy script
node scripts/deploy.js %*

pause
