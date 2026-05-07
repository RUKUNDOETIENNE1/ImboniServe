@echo off
echo ========================================
echo Fix Prisma Generate (Windows File Lock)
echo ========================================
echo.
echo This will:
echo 1. Stop any running Node processes
echo 2. Clean Prisma client cache
echo 3. Regenerate Prisma client
echo.
pause

echo.
echo [Step 1/3] Stopping Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [Step 2/3] Cleaning Prisma cache...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo Cache cleaned
) else (
    echo No cache to clean
)

echo.
echo [Step 3/3] Generating Prisma client...
call npx prisma generate

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Prisma client generated
    echo TypeScript errors should now be resolved
    echo ========================================
) else (
    echo.
    echo ========================================
    echo FAILED - Try closing VS Code and running again
    echo ========================================
)

echo.
pause
