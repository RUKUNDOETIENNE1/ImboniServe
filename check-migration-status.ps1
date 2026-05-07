# Check Migration Status
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Procurement Autopilot - Migration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit
}

# Try to run a simple Prisma command
Write-Host ""
Write-Host "Checking Prisma connection..." -ForegroundColor Yellow

try {
    $output = npx prisma db execute --stdin --file=nul 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "⚠ Database connection issue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not verify connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Verification Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Go to your project > Table Editor" -ForegroundColor White
Write-Host ""
Write-Host "3. Look for these NEW tables:" -ForegroundColor White
Write-Host "   ✓ SupplierRecommendationLog" -ForegroundColor Green
Write-Host "   ✓ SupplierPerformanceCache" -ForegroundColor Green
Write-Host ""
Write-Host "4. Check existing tables have new columns:" -ForegroundColor White
Write-Host "   Restaurant (Business):" -ForegroundColor Gray
Write-Host "     - Should have 'supplierRecommendationLogs' relation" -ForegroundColor Gray
Write-Host "   User:" -ForegroundColor Gray
Write-Host "     - Should have 'supplierRecommendationLogs' relation" -ForegroundColor Gray
Write-Host "   Supplier:" -ForegroundColor Gray
Write-Host "     - Should have 'recommendationLogs' relation" -ForegroundColor Gray
Write-Host "     - Should have 'performanceCache' relation" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "If tables DON'T exist:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run this command manually:" -ForegroundColor White
Write-Host "npx prisma db push --accept-data-loss" -ForegroundColor Cyan
Write-Host ""
Write-Host "Watch for output like:" -ForegroundColor White
Write-Host "  'Your database is now in sync with your schema.'" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
