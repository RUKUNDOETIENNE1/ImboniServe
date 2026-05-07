$p = 'c:/Users/Steve/Dropbox/PC/Desktop/ImboniResto/next.config.js'
$content = Get-Content -Raw $p

# If experimental already has workerThreads/cpus, do nothing
if ($content -match 'experimental:\s*\{[\s\S]*workerThreads' -and $content -match 'experimental:\s*\{[\s\S]*cpus') {
  Write-Output 'experimental.workerThreads/cpus already present'
  exit 0
}

# Prefer inserting after swcMinify: false,
$pattern = 'swcMinify:\s*false,'
if ($content -match $pattern) {
  $insertion = "`r`n  experimental: {`r`n    workerThreads: false,`r`n    cpus: 1,`r`n  },"
  $new = [Regex]::Replace($content, $pattern, ($matches[0] + $insertion), 1)
  [IO.File]::WriteAllText($p, $new)
  Write-Output 'Inserted experimental block after swcMinify'
  exit 0
}

# Fallback: insert near top of module.exports
$pattern2 = 'module\.exports\s*=\s*\{'
if ($content -match $pattern2) {
  $m = [Regex]::Match($content, $pattern2)
  $idx = $m.Index + $m.Length
  $insertion2 = "`r`n  experimental: {`r`n    workerThreads: false,`r`n    cpus: 1,`r`n  },"
  $new = $content.Substring(0, $idx) + $insertion2 + $content.Substring($idx)
  [IO.File]::WriteAllText($p, $new)
  Write-Output 'Inserted experimental block at top of module.exports'
  exit 0
}

Write-Error 'Could not find insertion point'
exit 1
