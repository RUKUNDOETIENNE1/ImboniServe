$ErrorActionPreference='Stop'
$base='http://localhost:3000'
$boot=Invoke-RestMethod -Method POST -Uri "$base/api/dev/bootstrap-tap-leave" -ContentType 'application/json' -Body '{}'
$sessionId=$boot.data.sessionId
$slipId=$boot.data.slipId
$slip=Invoke-RestMethod -Method GET -Uri "$base/api/session/slip/$sessionId"
$summary=[pscustomobject]@{
  boot=$boot
  slip=$slip
}
$summary | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 debug-bootstrap.json
Write-Host "Wrote debug-bootstrap.json"
