@echo off
echo ========================================
echo Optimization Memory Migration
echo ========================================
echo.
echo This will:
echo 1. Generate Prisma client with new models
echo 2. Create migration for OptimizationMemory tables
echo 3. Sync to Supabase using DATABASE_URL from .env
echo.
pause

echo.
echo [Step 1/3] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)

echo.
echo [Step 2/3] Creating migration...
call npx prisma migrate dev --name add_optimization_memory
if %errorlevel% neq 0 (
    echo ERROR: Migration creation failed
    pause
    exit /b 1
)

echo.
echo [Step 3/3] Migration complete!
echo.
echo New tables created:
echo - OptimizationRecommendation
echo - OptimizationAction
echo - OptimizationOutcome
echo.
echo TypeScript errors should now be resolved.
echo.
pause
