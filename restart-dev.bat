@echo off
echo ========================================
echo   RESTARTING DEV SERVER
echo ========================================
echo.
echo [1/3] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo     Done!
echo.
echo [2/3] Cleaning build cache...
rd /s /q .next >nul 2>&1
echo     Done!
echo.
echo [3/3] Starting fresh dev server...
echo.
start "Imboni Dev Server" cmd /k "npm run dev"
echo.
echo ========================================
echo   Dev server starting in new window...
echo ========================================
echo.
echo Please wait 10-15 seconds for the server to start
echo Then open: http://localhost:3000
echo.
pause
