@echo off
echo ========================================
echo DIAGNOSING SERVER ERROR
echo ========================================
echo.

echo [1/5] Checking if Prisma Client exists...
if exist "node_modules\.prisma\client" (
    echo     ✓ Prisma Client folder exists
) else (
    echo     ✗ Prisma Client NOT FOUND - This is likely the issue!
    echo.
    echo     SOLUTION: Run this command:
    echo     npm run prisma:generate:safe
    echo.
)
echo.

echo [2/5] Checking node_modules...
if exist "node_modules" (
    echo     ✓ node_modules exists
) else (
    echo     ✗ node_modules NOT FOUND
    echo.
    echo     SOLUTION: Run this command:
    echo     npm install
    echo.
)
echo.

echo [3/5] Checking .env file...
if exist ".env" (
    echo     ✓ .env file exists
    findstr /C:"DATABASE_URL" .env >nul
    if %ERRORLEVEL% EQU 0 (
        echo     ✓ DATABASE_URL is set
    ) else (
        echo     ✗ DATABASE_URL not found in .env
    )
) else (
    echo     ✗ .env file NOT FOUND
)
echo.

echo [4/5] Checking Next.js build...
if exist ".next" (
    echo     ✓ .next folder exists
) else (
    echo     ⚠ .next folder not found (will be created on first run)
)
echo.

echo [5/5] Testing Prisma connection...
echo     Running: npx prisma db pull --force
npx prisma db pull --force
if %ERRORLEVEL% EQU 0 (
    echo     ✓ Database connection successful!
) else (
    echo     ✗ Database connection FAILED
    echo.
    echo     Possible issues:
    echo     1. DATABASE_URL is incorrect
    echo     2. Internet connection issue
    echo     3. Supabase project is down
)
echo.

echo ========================================
echo DIAGNOSIS COMPLETE
echo ========================================
echo.
echo RECOMMENDED FIXES:
echo.
echo 1. Generate Prisma Client:
echo    npm run prisma:generate:safe
echo.
echo 2. Clear Next.js cache:
echo    rmdir /s /q .next
echo.
echo 3. Restart dev server:
echo    npm run dev
echo.
echo ========================================
pause
