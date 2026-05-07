@echo off
color 0E
echo ========================================
echo QUICK FIX - Internal Server Error
echo ========================================
echo.
echo This will:
echo  1. Generate Prisma Client
echo  2. Clear Next.js cache
echo  3. Restart the server
echo.
pause
echo.

echo [1/4] Stopping local Node/Next processes for this repo...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $repo = (Get-Location).Path; Get-CimInstance Win32_Process | Where-Object { ($_.Name -in @('node.exe','next.exe')) -and ($_.CommandLine -like \"*${repo}*\") } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host '    ✓ Stopped processes (if any)'; } catch { Write-Host '    ⚠ Could not enumerate processes'; }"
echo.

echo [2/4] Clearing Prisma caches (to avoid EPERM locks)...
if exist "node_modules\.prisma" (
    rmdir /s /q node_modules\.prisma 2>nul
)
if exist "node_modules\@prisma\client" (
    rmdir /s /q node_modules\@prisma\client 2>nul
)
echo     ✓ Prisma caches cleared (if present)
echo.

echo [3/4] Generating Prisma Client (safe mode)...
call npm run prisma:generate:safe
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ✗ Prisma generation failed in safe mode.
    echo.
    echo Trying alternative direct method...
    call npx prisma generate
)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ✗ Prisma generation still failing. Likely a Windows Defender/antivirus file lock.
    echo.
    echo Please add a temporary exclusion for this folder:
    echo     %CD%\node_modules\.prisma
    echo and then re-run this script.
    echo.
    pause
    exit /b 1
)
echo     ✓ Prisma Client generated successfully
echo.

echo [4/4] Clearing Next.js cache and (re)starting dev server...
if exist ".next" (
    rmdir /s /q .next
    echo     ✓ Cache cleared
) else (
    echo     ⚠ No cache to clear
)
echo     Killing port 3000 (if in use)...
call npx kill-port 3000 >nul 2>nul
echo.
echo ========================================
echo SERVER STARTING...
echo ========================================
echo.
echo The server will start in a new window.
echo Keep that window open!
echo.
echo Your browser will open automatically.
echo.

set "NODE_OPTIONS=--max-old-space-size=8192"
start "ImboniResto Dev Server - Keep This Open" cmd /k "npm run dev"

echo Waiting for server to start (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo ✓ DONE!
echo ========================================
echo.
echo If you still see errors:
echo  1. Check the "ImboniResto Dev Server" window for error messages
echo  2. Run: diagnose-error.bat
echo  3. Check your DATABASE_URL in .env file
echo.
pause
