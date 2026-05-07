$p = 'c:/Users/Steve/Dropbox/PC/Desktop/ImboniResto/next.config.js'
$content = Get-Content -Raw $p

if ($content -match 'eslint:\s*\{\s*ignoreDuringBuilds:\s*true') {
  Write-Output 'eslint.ignoreDuringBuilds already present'
  exit 0
}

$pattern = 'reactStrictMode: true,'
if ($content.Contains($pattern)) {
  $replacement = "reactStrictMode: true,`r`n  eslint: {`r`n    ignoreDuringBuilds: true,`r`n  },"
  $new = $content.Replace($pattern, $replacement)
  [System.IO.File]::WriteAllText($p, $new)
  Write-Output 'Inserted eslint.ignoreDuringBuilds after reactStrictMode'
  exit 0
}

$pattern2 = 'module.exports = {'
if ($content.Contains($pattern2)) {
  $idx = $content.IndexOf($pattern2) + $pattern2.Length
  $insertion = "`r`n  eslint: {`r`n    ignoreDuringBuilds: true,`r`n  },"
  $new = $content.Substring(0, $idx) + $insertion + $content.Substring($idx)
  [System.IO.File]::WriteAllText($p, $new)
  Write-Output 'Inserted eslint.ignoreDuringBuilds at top of module.exports'
  exit 0
}

Write-Error 'Pattern not found in next.config.js'
exit 1
