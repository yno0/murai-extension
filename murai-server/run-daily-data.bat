@echo off
echo ========================================
echo    MURAi Daily Data Generation Script
echo ========================================
echo.
echo Starting daily data generation...
echo This will create today's data including:
echo - New user detection reports
echo - User activities
echo - Reports and notifications
echo - Special data for rblatco@gmail.com
echo.

cd /d "%~dp0"

echo Running daily data generation...
npm run daily-data

echo.
echo ========================================
echo    Daily Data Generation Complete!
echo ========================================
echo.
pause
