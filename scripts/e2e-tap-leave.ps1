$ErrorActionPreference='Stop'
$base='http://localhost:3000'

# Bootstrap a Tap & Leave session + slip with sample items
$boot=Invoke-RestMethod -Method POST -Uri "$base/api/dev/bootstrap-tap-leave" -ContentType 'application/json' -Body '{}'
$sessionId=$boot.data.sessionId
$slipId=$boot.data.slipId
Write-Host "Boot sessionId=$sessionId slipId=$slipId runningTotalCents=$($boot.data.runningTotalCents) itemCount=$($boot.data.itemCount)"

if(($boot.data.runningTotalCents) -eq 0) {
  Write-Host 'Slip runningTotalCents is 0; fetching slip for diagnosis...'
  $slip0=Invoke-RestMethod -Method GET -Uri "$base/api/session/slip/$sessionId"
  $slip0 | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 e2e-slip-before-checkout.json
  Write-Host 'Wrote e2e-slip-before-checkout.json'
}

# Initiate checkout in simulate mode
$checkoutBody = @{ sessionId=$sessionId; phone='0781234567'; tipCents=0; simulate=$true } | ConvertTo-Json
$checkout=Invoke-RestMethod -Method POST -Uri "$base/api/checkout/tap-and-leave?simulate=1" -ContentType 'application/json' -Body $checkoutBody
$paymentId=$checkout.data.paymentId
$requestTransactionId=$checkout.data.requestTransactionId

# Simulate webhook confirmation (mark as PAID)
$webhookBody = @{ requesttransactionid=$requestTransactionId; transactionid='SIM-12345'; responsecode='01'; responsemsg='OK' } | ConvertTo-Json
$webhook=Invoke-RestMethod -Method POST -Uri "$base/api/checkout/tap-and-leave/webhook" -ContentType 'application/json' -Body $webhookBody

Start-Sleep -Seconds 1

# Poll status and fetch slip
$status=Invoke-RestMethod -Method GET -Uri "$base/api/checkout/tap-and-leave/status/$paymentId"
$slip=Invoke-RestMethod -Method GET -Uri "$base/api/session/slip/$sessionId"

# Persist result for inspection
$out=[pscustomobject]@{
  sessionId=$sessionId
  slipId=$slipId
  paymentId=$paymentId
  requestTransactionId=$requestTransactionId
  paymentStatus=$status.data.status
  slipStatus=$slip.data.status
  slipNumber=$slip.data.slipNumber
}
$out | ConvertTo-Json -Depth 3 | Out-File -Encoding utf8 e2e-result.json
