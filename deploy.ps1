Param(
  [ValidateSet('staging','production')]
  [string]$Environment = 'staging',
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$Migrate,
  [switch]$Package,
  # Optional deploy targets
  [switch]$Vercel,
  [string]$VercelProject = '',
  [switch]$Netlify,
  [string]$NetlifySiteId = '',
  [switch]$PM2,
  [string]$PM2Process = '',
  # Optional health check
  [string]$HealthUrl = '',
  [int]$HealthWaitSec = 10,
  [int]$HealthRetries = 12,
  [string]$HealthExpectRegex = ''
)

$ErrorActionPreference = 'Stop'
$script:StartTime = Get-Date

function Write-Section([string]$Text) {
  Write-Host "`n==== $Text ====\n" -ForegroundColor Cyan
}

function Write-Step([string]$Text) {
  Write-Host "[>] $Text" -ForegroundColor Yellow
}

function Write-Ok([string]$Text) {
  Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Fail([string]$Text) {
  Write-Host "[FAIL] $Text" -ForegroundColor Red
}

try {
  Write-Section "ImboniResto Deploy ($Environment)"

  # 1) Prerequisites
  Write-Step "Checking Node.js and npm"
  $nodeVersion = node -v
  $npmVersion = npm -v
  Write-Ok "Node: $nodeVersion | npm: $npmVersion"

  Write-Step "Ensuring working directory"
  $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  Set-Location $repoRoot
  Write-Ok "Repo Root: $repoRoot"

  # 2) Install dependencies
  if (-not $SkipInstall) {
    if (Test-Path "$repoRoot\\package-lock.json") {
      Write-Step "Installing dependencies with npm ci"
      npm ci
    } else {
      Write-Step "Installing dependencies with npm install"
      npm install
    }

    Write-Ok "Dependencies installed"
  } else {
    Write-Step "Skipping install per flag"
  }

  # 3) Prisma generate + migrations (optional)
  Write-Step "Generating Prisma Client"
  npx prisma generate
  Write-Ok "Prisma Client generated"

  if ($Migrate) {
    Write-Step "Applying database migrations (prisma migrate deploy)"
    npx prisma migrate deploy
    Write-Ok "Database migrations applied"
  } else {
    Write-Step "Skipping database migrations (use -Migrate to enable)"
  }

  # 4) Build
  if (-not $SkipBuild) {
    Write-Step "Building Next.js app"
    $env:NODE_ENV = 'production'
    npm run build
    Write-Ok "Build completed"
  } else {
    Write-Step "Skipping build per flag"
  }

  # 5) Package build artifacts (optional)
  if ($Package) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $artifactDir = Join-Path $repoRoot 'artifacts'
    if (-not (Test-Path $artifactDir)) { New-Item -ItemType Directory -Path $artifactDir | Out-Null }

    $zipPath = Join-Path $artifactDir "build-$Environment-$timestamp.zip"
    Write-Step "Packaging build into $zipPath"

    $itemsToPack = @(
      '.next',
      'public',
      'package.json',
      'next.config.js',
      'prisma/schema.prisma',
      'node_modules/.prisma'
    ) | Where-Object { Test-Path $_ }

    if ($itemsToPack.Count -eq 0) {
      throw "Nothing to package. Ensure you have built the app (npm run build)."
    }

    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $itemsToPack -DestinationPath $zipPath -Force
    Write-Ok "Artifacts packaged"
  } else {
    Write-Step "Skipping packaging (use -Package to enable)"
  }

  # 6) Summary
  # 5b) Optional Deploy Providers
  if ($Vercel) {
    Write-Section "Deploying with Vercel CLI"
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
      throw "Vercel CLI not found. Install with: npm i -g vercel"
    }
    $vercelArgs = @('deploy','--prod')
    if ($VercelProject) { $vercelArgs += @('--project', $VercelProject) }
    Write-Step ("Running: vercel {0}" -f ($vercelArgs -join ' '))
    vercel @vercelArgs
    Write-Ok "Vercel deploy triggered"
  } else {
    Write-Step "Skipping Vercel deploy (use -Vercel to enable)"
  }

  if ($Netlify) {
    Write-Section "Deploying with Netlify CLI"
    if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
      throw "Netlify CLI not found. Install with: npm i -g netlify-cli"
    }
    $ntArgs = @('deploy','--prod')
    if ($NetlifySiteId) { $ntArgs += @('--site', $NetlifySiteId) }
    Write-Step ("Running: netlify {0}" -f ($ntArgs -join ' '))
    netlify @ntArgs
    Write-Ok "Netlify deploy triggered"
  } else {
    Write-Step "Skipping Netlify deploy (use -Netlify to enable)"
  }

  if ($PM2) {
    Write-Section "Restarting PM2 process"
    if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
      throw "PM2 not found. Install with: npm i -g pm2"
    }
    if (-not $PM2Process) {
      throw "Please provide -PM2Process <name> to restart"
    }
    Write-Step "pm2 restart $PM2Process"
    pm2 restart $PM2Process
    Write-Ok "PM2 process restarted"
  } else {
    Write-Step "Skipping PM2 restart (use -PM2 -PM2Process <name> to enable)"
  }

  # 5c) Optional Health Check
  if ($HealthUrl) {
    Write-Section "Health Check: $HealthUrl"
    Start-Sleep -Seconds $HealthWaitSec
    $ok = $false
    for ($i = 1; $i -le $HealthRetries; $i++) {
      try {
        Write-Step "Probe #${i}: $HealthUrl"
        $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
        $status = $resp.StatusCode
        $content = $resp.Content
        if ($status -ge 200 -and $status -lt 400) {
          if ([string]::IsNullOrWhiteSpace($HealthExpectRegex) -or ($content -match $HealthExpectRegex)) {
            $ok = $true
            Write-Ok "Health check passed with status $status"
            break
          } else {
            Write-Step "Status $status OK, but content did not match regex: $HealthExpectRegex"
          }
        } else {
          Write-Step "Non-OK status: $status"
        }
      } catch {
        Write-Step "Probe failed: $($_.Exception.Message)"
      }
      Start-Sleep -Seconds 5
    }
    if (-not $ok) { throw "Health check FAILED for $HealthUrl" }
  } else {
    Write-Step "Skipping health check (use -HealthUrl to enable)"
  }

  # 6) Summary
  $elapsed = (Get-Date) - $script:StartTime
  Write-Section "Deployment Completed"
  Write-Ok "Environment: $Environment"
  Write-Ok ("Elapsed: {0:mm\:ss}" -f $elapsed)
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host " - Upload artifacts to your hosting (if packaged)" -ForegroundColor Cyan
  Write-Host " - Configure environment variables on the platform" -ForegroundColor Cyan
  Write-Host " - Start server process (e.g., pm2, systemd) if self-hosting" -ForegroundColor Cyan

} catch {
  Write-Fail $_.Exception.Message
  exit 1
}
