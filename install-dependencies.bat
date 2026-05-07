@echo off
echo ========================================
echo Imboni Resto - Installing Dependencies
echo ========================================
echo.

echo [1/3] Installing micro package for webhook raw body parsing...
call npm install micro
if %errorlevel% neq 0 (
    echo ERROR: Failed to install micro package
    pause
    exit /b 1
)
echo ✓ micro package installed successfully
echo.

echo [2/3] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated successfully
echo.

echo [3/3] Pushing database schema changes...
echo WARNING: This will modify your database schema!
echo Press Ctrl+C to cancel, or
pause
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push database schema
    pause
    exit /b 1
)
echo ✓ Database schema updated successfully
echo.

echo ========================================
echo All dependencies installed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure environment variables in .env file
echo 2. Register webhook URL in IremboPay portal
echo 3. Run the application: npm run dev
echo.
pause
