# GPV API Test Helper - does full MFA flow then calls target API
# Usage: .\scripts\gpv-api-test.ps1 -Method GET -Path "/api/menu" [-Body '{"key":"value"}"]

param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Path,
    [string]$Body = "",
    [string]$ContentType = "application/json"
)

$email = "gpv-test@imboniserve-test.com"
$password = "GPV-Test-2026!"
$baseUrl = "http://localhost:3000"

# Step 1: Get CSRF token
$csrfResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf" -UseBasicParsing -TimeoutSec 30 -SessionVariable session
$csrfToken = ($csrfResp.Content | ConvertFrom-Json).csrfToken

# Step 2: Pre-login
$preBody = "{`"email`":`"$email`",`"password`":`"$password`",`"debugRequestId`":`"GPV-API`"}"
$preResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/pre-login" -Method POST -Body $preBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 60 -WebSession $session

# Step 3: Extract OTP
$otpOutput = Invoke-Expression "node scripts/gpv-extract-otp.js 2>&1"
$otp = (($otpOutput | Select-String "FOUND OTP:") -replace "FOUND OTP: ", "").Trim()

# Step 4: Verify OTP
$verifyBody = "{`"email`":`"$email`",`"otp`":`"$otp`",`"debugRequestId`":`"GPV-API`"}"
$verifyResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/verify-mfa-otp" -Method POST -Body $verifyBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 60 -WebSession $session
$confirmToken = ($verifyResp.Content | ConvertFrom-Json).confirmToken

# Step 5: Create session
$callbackBody = "csrfToken=$csrfToken&email=$email&confirmToken=$confirmToken&json=true"
Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/mfa-confirm" -Method POST -Body $callbackBody -ContentType "application/x-www-form-urlencoded" -UseBasicParsing -TimeoutSec 30 -WebSession $session | Out-Null

Start-Sleep -Seconds 1

# Step 6: Call target API
try {
    if ($Method -eq "GET") {
        $resp = Invoke-WebRequest -Uri "$baseUrl$Path" -UseBasicParsing -TimeoutSec 30 -WebSession $session
    } else {
        $resp = Invoke-WebRequest -Uri "$baseUrl$Path" -Method $Method -Body $Body -ContentType $ContentType -UseBasicParsing -TimeoutSec 30 -WebSession $session
    }
    Write-Output "STATUS: $($resp.StatusCode)"
    Write-Output "RESPONSE: $($resp.Content)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output "BODY: $($sr.ReadToEnd())"
    }
}
