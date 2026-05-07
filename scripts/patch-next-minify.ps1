$p = 'c:/Users/Steve/Dropbox/PC/Desktop/ImboniResto/next.config.js'
$content = Get-Content -Raw $p

# Add swcMinify: false if not present
if (-not ($content -match 'swcMinify')) {
  $content = $content -replace 'typescript: \{[\r\n\s]+ignoreBuildErrors: true,[\r\n\s]+\},', "typescript: {`r`n    ignoreBuildErrors: true,`r`n  },`r`n  swcMinify: false,"
  Write-Output 'Added swcMinify: false'
} else {
  Write-Output 'swcMinify already present'
}

# Add webpack minimize=false if not present
if (-not ($content -match 'optimization\.minimize')) {
  $webpackBlock = "  webpack: (config) => {`r`n    config.optimization.minimize = false`r`n    return config`r`n  },"
  $content = $content -replace 'images: \{', "$webpackBlock`r`n  images: {"
  Write-Output 'Added webpack minimize=false'
} else {
  Write-Output 'webpack minimize already present'
}

[System.IO.File]::WriteAllText($p, $content)
Write-Output 'Done patching next.config.js'
