<#!
Helper: Runs the three concurrent, additive indexes for payment health.
Safe for production: uses CREATE INDEX CONCURRENTLY IF NOT EXISTS and executes each statement separately (no transaction).

Usage:
  1) Ensure psql is installed (see message in script if missing).
  2) Run:
       powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sql\run-add-payment-health-indexes.ps1
  3) Follow prompts for Host, Port, Database, User, and Password.

This script does not store credentials. PGPASSWORD is set for the current process and then cleared.
!#>

$ErrorActionPreference = 'Stop'

function Ensure-PsqlPresent {
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $psql) {
    Write-Host "psql (PostgreSQL client) is not installed." -ForegroundColor Yellow
    Write-Host "Install it via Winget (recommended):" -ForegroundColor Yellow
    Write-Host "  winget install -e --id PostgreSQL.psql" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    throw "psql not found"
  }
}

function Read-Value($prompt, $default) {
  if ($null -ne $default -and $default -ne '') {
    $v = Read-Host "$prompt [$default]"
    if ([string]::IsNullOrWhiteSpace($v)) { return $default }
    return $v
  } else {
    return Read-Host $prompt
  }
}

try {
  Ensure-PsqlPresent

  Write-Host "Enter Supabase/Postgres connection info:" -ForegroundColor Cyan
  $host = Read-Value "Host" "aws-1-eu-west-1.pooler.supabase.com"
  $port = Read-Value "Port" "5432"
  $db   = Read-Value "Database" "postgres"
  $user = Read-Value "User" "postgres"
  $sec  = Read-Host "Password" -AsSecureString

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  $pwd  = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

  $env:PGPASSWORD = $pwd

  Write-Host "Testing connection..." -ForegroundColor Cyan
  & psql -h $host -p $port -U $user -d $db -v ON_ERROR_STOP=1 -c "SELECT current_database(), current_user, version();" | Out-Null
  Write-Host "Connection OK" -ForegroundColor Green

  $cmds = @(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_paymentId_idx" ON "CheckoutEvent"("paymentId");',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_eventType_createdAt_idx" ON "CheckoutEvent"("eventType","createdAt");'
  )

  foreach ($sql in $cmds) {
    Write-Host "Running: $sql" -ForegroundColor Cyan
    & psql -h $host -p $port -U $user -d $db -v ON_ERROR_STOP=1 -c $sql | Out-Null
    Write-Host "  ✔ Done" -ForegroundColor Green
  }

  Write-Host "Verifying indexes..." -ForegroundColor Cyan
  $verify = "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND indexname IN ('PaymentTransaction_updatedAt_idx','CheckoutEvent_paymentId_idx','CheckoutEvent_eventType_createdAt_idx');"
  & psql -h $host -p $port -U $user -d $db -v ON_ERROR_STOP=1 -c $verify

  Write-Host "All indexes ensured successfully." -ForegroundColor Green
}
catch {
  Write-Error $_
}
finally {
  if ($pwd) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
  $env:PGPASSWORD = $null
}
