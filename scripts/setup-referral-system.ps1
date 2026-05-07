# Setup script for Referral & Rewards System
# This script sets up the database schema and generates Prisma client

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REFERRAL & REWARDS SYSTEM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "ERROR: prisma\schema.prisma not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Checking Prisma installation..." -ForegroundColor Yellow
$prismaInstalled = Get-Command prisma -ErrorAction SilentlyContinue
if (-not $prismaInstalled) {
    Write-Host "  Installing Prisma CLI..." -ForegroundColor Gray
    npm install -D prisma
}
Write-Host "  ✓ Prisma CLI ready" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Generating Prisma Client..." -ForegroundColor Yellow
Write-Host "  This will generate TypeScript types for the new models" -ForegroundColor Gray
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Prisma generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Prisma Client generated successfully" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Pushing schema to database..." -ForegroundColor Yellow
Write-Host "  This will create the new tables in your database" -ForegroundColor Gray
Write-Host "  Tables to be created:" -ForegroundColor Gray
Write-Host "    - ReferralClick" -ForegroundColor Gray
Write-Host "    - ReferralReward" -ForegroundColor Gray
Write-Host "    - AffiliateEarnings" -ForegroundColor Gray
Write-Host "    - TableSessionInvite" -ForegroundColor Gray
Write-Host "    - FraudDetectionLog" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "  Proceed with database update? (y/n)"
if ($confirm -ne "y") {
    Write-Host "  Aborted by user" -ForegroundColor Yellow
    exit 0
}

npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Database push failed!" -ForegroundColor Red
    Write-Host "  Please check your database connection and try again" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Database schema updated successfully" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Installing required dependencies..." -ForegroundColor Yellow
Write-Host "  Checking for nanoid (for invite code generation)..." -ForegroundColor Gray

$packageJson = Get-Content "package.json" | ConvertFrom-Json
if (-not $packageJson.dependencies.nanoid) {
    Write-Host "  Installing nanoid..." -ForegroundColor Gray
    npm install nanoid
    Write-Host "  ✓ nanoid installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ nanoid already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your development server" -ForegroundColor White
Write-Host "  2. Test the referral link redirect: /api/r/{code}" -ForegroundColor White
Write-Host "  3. Test table invites: /api/session/generate-invite" -ForegroundColor White
Write-Host "  4. Check the referral dashboard: /api/referrals/dashboard?code={code}" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Referral Tracking Service: src/lib/services/referral-tracking.service.ts" -ForegroundColor White
Write-Host "  - Fraud Detection Service: src/lib/services/fraud-detection.service.ts" -ForegroundColor White
Write-Host "  - Table Invite Service: src/lib/services/table-invite.service.ts" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
