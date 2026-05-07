@echo off
echo ========================================
echo AI Procurement Autopilot Migration
echo ========================================
echo.
echo This will create the following tables:
echo - SupplierRecommendationLog
echo - SupplierPerformanceCache
echo.
echo And update relations for:
echo - Business
echo - User
echo - Supplier
echo.
echo Press any key to continue...
pause

echo.
echo Running Prisma DB Push...
npx prisma db push --accept-data-loss

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Test Reorder Autopilot
echo 3. Test AI Recommendations (Best Choice badge)
echo 4. Test Map Actions (Order Now button)
echo.
pause
