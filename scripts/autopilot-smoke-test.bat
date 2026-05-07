@echo off
setlocal ENABLEDELAYEDEXPANSION
pushd "%~dp0.."
echo ========================================
echo Imboni Serve - Autopilot Smoke Tests
echo ========================================
echo.

:: Resolve Base URL
set BASE=%1
if "%BASE%"=="" set BASE=%APP_URL%
if "%BASE%"=="" set BASE=http://localhost:3000
echo Using BASE URL: %BASE%

:: Optional test credentials (for protected routes)
if not defined TEST_EMAIL set TEST_EMAIL=jean@nyamacafe.rw
if not defined TEST_PASSWORD set TEST_PASSWORD=Owner123!
echo Test account: %TEST_EMAIL% (override with env TEST_EMAIL/TEST_PASSWORD)

:: Quick readiness check
echo.
echo Checking server readiness at %BASE%/manifest.json ...
where curl >NUL 2>&1
if %errorlevel% NEQ 0 (
  echo WARN: curl not found. Skipping readiness probe.
) else (
  curl -s -o NUL -w "HTTP %%{http_code}" %BASE%/manifest.json
  echo.
)

:: Ensure node modules installed (first time only)
if not exist node_modules\ (
  echo Installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    exit /b %errorlevel%
  )
)

:: Run smoke tests via TSX + Puppeteer
echo.
echo Running smoke tests...
set CMD=npx tsx scripts\smoke-test.ts --base %BASE%
call %CMD%
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% EQU 0 (
  echo ALL SMOKE TESTS PASSED
) else (
  echo SOME TESTS FAILED (exit code %EXITCODE%)
)

exit /b %EXITCODE%
