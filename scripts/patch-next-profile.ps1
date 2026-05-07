$p = 'c:/Users/Steve/Dropbox/PC/Desktop/ImboniResto/next.config.js'
$content = Get-Content -Raw $p

# 1) Insert const isCI if missing (before module.exports)
if ($content -notmatch "const isCI = process\.env\.BUILD_PROFILE === 'ci'") {
  $pattern = 'module\.exports\s*=\s*\{' 
  $m = [Regex]::Match($content, $pattern)
  if ($m.Success) {
    $insertion = "const isCI = process.env.BUILD_PROFILE === 'ci'`r`n`r`n"
    $content = $content.Substring(0, $m.Index) + $insertion + $content.Substring($m.Index)
  }
}

# 2) Toggle eslint and typescript flags
$content = [Regex]::Replace($content, 'ignoreDuringBuilds:\s*true', 'ignoreDuringBuilds: !isCI')
$content = [Regex]::Replace($content, 'ignoreBuildErrors:\s*true', 'ignoreBuildErrors: !isCI')

# 3) Toggle swcMinify
$content = [Regex]::Replace($content, 'swcMinify:\s*false', 'swcMinify: isCI')

# 4) Experimental block: make dynamic
if ($content -match 'experimental:\s*\{') {
  $content = [Regex]::Replace($content, 'experimental:\s*\{[\s\S]*?\},', "experimental: isCI ? {} : {`r`n    workerThreads: false,`r`n    cpus: 1,`r`n  },", 1)
} else {
  # insert after swcMinify: isCI,
  $content = [Regex]::Replace($content, 'swcMinify:\s*isCI,', "swcMinify: isCI,`r`n  experimental: isCI ? {} : {`r`n    workerThreads: false,`r`n    cpus: 1,`r`n  },", 1)
}

# 5) Webpack minimize flag: make dynamic
$content = [Regex]::Replace($content, 'config\.optimization\.minimize\s*=\s*false', 'config.optimization.minimize = isCI')

[IO.File]::WriteAllText($p, $content)
Write-Output 'Patched next.config.js for BUILD_PROFILE support'
