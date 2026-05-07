@echo off
echo ========================================
echo Verifying Migration Status
echo ========================================
echo.
echo Checking if tables exist in Supabase...
echo.

npx prisma db execute --stdin < verify-tables.sql

echo.
echo ========================================
echo Alternative: Check manually
echo ========================================
echo.
echo 1. Go to your Supabase dashboard
echo 2. Navigate to Table Editor
echo 3. Look for these tables:
echo    - SupplierRecommendationLog
echo    - SupplierPerformanceCache
echo.
echo If they exist, migration was successful!
echo If not, run migrate-autopilot.bat again
echo.
pause
