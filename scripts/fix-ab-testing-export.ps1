$ErrorActionPreference = 'Stop'
$path = "C:\Dev\ImboniResto\src\pages\dashboard\ab-testing.tsx"

if (-not (Test-Path $path)) {
  Write-Error "File not found: $path"
  exit 1
}

# Read file content
$content = Get-Content -Raw -Encoding UTF8 $path

# Remove any stray default export lines anywhere in the file (especially inside the interface)
$pattern = '^[\t ]*export default dynamic\(\(\) => Promise\.resolve\(ABTesting\), \{ ssr: false \}\)[\t ]*$'
$lines = $content -split "`r?`n"
$filtered = $lines | Where-Object { $_ -notmatch $pattern }
$content2 = ($filtered -join "`r`n").TrimEnd()

# Append correct default export at the end if not present
if ($content2 -notmatch 'export default dynamic\(\(\) => Promise\.resolve\(ABTesting\), \{ ssr: false \}\)') {
  $append = 'export default dynamic(() => Promise.resolve(ABTesting), { ssr: false })'
  $content2 = $content2 + "`r`n" + $append + "`r`n"
}

# Write back using UTF8 (no BOM)
[System.IO.File]::WriteAllText($path, $content2, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Fixed ab-testing.tsx"
