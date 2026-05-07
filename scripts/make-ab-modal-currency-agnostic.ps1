$ErrorActionPreference = 'Stop'
$path = "C:\Dev\ImboniResto\src\pages\dashboard\ab-testing.tsx"
if (-not (Test-Path $path)) { throw "File not found: $path" }

$text = [System.IO.File]::ReadAllText($path)
# Replace label 'New price (RWF)' with generic 'New price'
$text = $text -replace 'New price \(RWF\)', 'New price'
# Note: Keeping option list prices 'RWF' as-is for now; follow-up will make this currency-aware globally.
[System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'AB modal labels updated to be currency-agnostic.'
