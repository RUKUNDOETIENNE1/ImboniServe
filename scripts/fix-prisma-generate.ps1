param(
  [switch]$Yes
)

$ErrorActionPreference = 'Continue'
Write-Host "[Prisma Generate Safe] Starting..." -ForegroundColor Cyan

function Invoke-PrismaGenerate {
  param([string]$Stage)
  Write-Host "[Prisma Generate Safe] ($Stage) Generating Prisma client using binary engine..." -ForegroundColor Cyan
  $env:PRISMA_CLI_QUERY_ENGINE_TYPE = "binary"
  $env:PRISMA_CLIENT_ENGINE_TYPE   = "binary"

  $output = & npx prisma generate 2>&1
  $exit   = $LASTEXITCODE
  if ($exit -eq 0) {
    Write-Host "[Prisma Generate Safe] Success ✅" -ForegroundColor Green
    return @{ Success = $true; ExitCode = 0; Output = $output }
  }

  Write-Warning "[Prisma Generate Safe] Generate failed (exit $exit)."
  return @{ Success = $false; ExitCode = $exit; Output = $output }
}

function Clear-PrismaCaches {
  Write-Host "[Prisma Generate Safe] Clearing Prisma caches..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
}

function Stop-RepoNodeProcesses {
  Write-Host "[Prisma Generate Safe] Attempting to stop Node/Next processes for this repository only..." -ForegroundColor Yellow
  try {
    $repo = (Get-Location).Path
    $procs = Get-CimInstance Win32_Process |
      Where-Object { ($_.Name -in @('node.exe','next.exe')) -and ($_.CommandLine -like "*$repo*") }

    if ($procs) {
      $procs | ForEach-Object {
        Write-Host (" - Stopping PID {0}: {1}" -f $_.ProcessId, $_.CommandLine) -ForegroundColor DarkYellow
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
    } else {
      Write-Host "[Prisma Generate Safe] No in-repo Node/Next processes found." -ForegroundColor DarkGray
    }
  } catch {
    Write-Warning "[Prisma Generate Safe] Could not enumerate processes: $_"
  }
}

# Stage A: Quick generate without disruption
Clear-PrismaCaches
$result = Invoke-PrismaGenerate -Stage "A1"
if ($result.Success) { exit 0 }
# Print captured Prisma output for diagnostics
Write-Host "--- Prisma Output (A1) ---" -ForegroundColor DarkGray
Write-Host ($result.Output | Out-String) -ForegroundColor DarkGray

# Detect EPERM rename
$eperm = ($result.Output | Out-String) -match "EPERM: operation not permitted, rename"
if (-not $eperm) {
  Write-Warning "[Prisma Generate Safe] Failure was not a file-lock EPERM. See output above."
  exit $result.ExitCode
}

# Stage B: Try again after safely stopping only Node/Next in this repo
Stop-RepoNodeProcesses
Clear-PrismaCaches
$result2 = Invoke-PrismaGenerate -Stage "B1"
if ($result2.Success) { exit 0 }
Write-Host "--- Prisma Output (B1) ---" -ForegroundColor DarkGray
Write-Host ($result2.Output | Out-String) -ForegroundColor DarkGray

# Optional Stage C: broader cleanup (client folder) but still minimal disruption
Write-Host "[Prisma Generate Safe] Performing deeper cleanup of @prisma/client..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\@prisma\client" -ErrorAction SilentlyContinue
$result3 = Invoke-PrismaGenerate -Stage "C1"
if ($result3.Success) { exit 0 }
Write-Host "--- Prisma Output (C1) ---" -ForegroundColor DarkGray
Write-Host ($result3.Output | Out-String) -ForegroundColor DarkGray

Write-Warning "[Prisma Generate Safe] Prisma generate still failing. Likely an antivirus lock."
Write-Host "Next steps (manual):" -ForegroundColor Yellow
Write-Host "  1) Add a temporary Windows Defender exclusion for:" -ForegroundColor Yellow
Write-Host "     - $(Join-Path (Get-Location) 'node_modules\.prisma')" -ForegroundColor Yellow
Write-Host "     - $(Get-Location)" -ForegroundColor Yellow
Write-Host "  2) Re-run: npx prisma generate" -ForegroundColor Yellow
exit 1
