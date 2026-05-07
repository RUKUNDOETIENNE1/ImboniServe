@echo off
echo Setting up development environment...

REM Add Node.js to PATH for this session
set PATH=C:\Program Files\nodejs;%PATH%

REM Verify Node.js installation
echo Checking Node.js version...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    exit /b 1
)

REM Verify npm installation
echo Checking npm version...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found!
    exit /b 1
)

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Prisma generate failed!
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now run the development server with:
echo   npm run dev
echo.
