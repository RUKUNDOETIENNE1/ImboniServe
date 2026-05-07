$ErrorActionPreference = 'Stop'
$path = "C:\Dev\ImboniResto\src\pages\dashboard\ab-testing.tsx"
if (-not (Test-Path $path)) { throw "File not found: $path" }

$lines = [System.IO.File]::ReadAllLines($path)
$list = New-Object System.Collections.Generic.List[string]
$list.AddRange($lines)

function Find-Index([string]$substr, [int]$start = 0) {
  for ($i = $start; $i -lt $list.Count; $i++) {
    if ($list[$i].IndexOf($substr, [System.StringComparison]::Ordinal) -ge 0) { return $i }
  }
  return -1
}

# A) Replace React attribute 'class' -> 'className' where needed
for ($i = 0; $i -lt $list.Count; $i++) {
  if ($list[$i].Contains(' class="')) {
    $list[$i] = $list[$i].Replace(' class="', ' className="')
  }
}

# B) Fix misplaced </details> so it appears after the textarea closes
$openDetails = Find-Index('<details>')
if ($openDetails -ge 0) {
  $textAreaStart = Find-Index('<textarea', $openDetails)
  if ($textAreaStart -ge 0) {
    # find its closing '/>' line
    $textAreaClose = -1
    for ($j = $textAreaStart; $j -lt [Math]::Min($textAreaStart + 40, $list.Count); $j++) {
      if ($list[$j].Trim() -eq '/>') { $textAreaClose = $j; break }
    }
    if ($textAreaClose -ge 0) {
      # locate any closing </details> before the textarea close and move it to after
      for ($k = $openDetails; $k -lt $textAreaClose; $k++) {
        if ($list[$k].Trim().StartsWith('</details>')) {
          $closing = $list[$k]
          $list.RemoveAt($k)
          $insAt = $textAreaClose + 1
          $list.Insert($insAt, $closing)
          break
        }
      }
    }
  }
}

# C) Move Total traffic indicator outside the "+ Add Variant" button if it's nested inside
$totalLine = Find-Index('Total traffic: ')
if ($totalLine -ge 0) {
  $openDiv = $totalLine - 1
  $closeDiv = $totalLine + 1
  if ($openDiv -ge 0 -and $closeDiv -lt $list.Count -and $list[$openDiv].Contains('<div') -and $list[$closeDiv].Contains('</div>')) {
    $divOpenLine = $list[$openDiv]
    $divMidLine = $list[$totalLine]
    $divCloseLine = $list[$closeDiv]
    # remove from current location
    $list.RemoveAt($closeDiv)
    $list.RemoveAt($totalLine)
    $list.RemoveAt($openDiv)
    # find the next </button> after openDiv
    $btnCloseIdx = -1
    for ($m = $openDiv; $m -lt [Math]::Min($openDiv + 30, $list.Count); $m++) {
      if ($list[$m].Trim() -eq '</button>') { $btnCloseIdx = $m; break }
    }
    if ($btnCloseIdx -ge 0) {
      $list.Insert($btnCloseIdx + 1, $divCloseLine)
      $list.Insert($btnCloseIdx + 1, $divMidLine)
      $list.Insert($btnCloseIdx + 1, $divOpenLine)
    }
  }
}

# D) Ensure Add Variant handler also resets price/desc arrays
$addVarIdx = Find-Index('setVariantChangesText([...variantChangesText, ''{}''])')
if ($addVarIdx -lt 0) { $addVarIdx = Find-Index("setVariantChangesText([...variantChangesText, '{}'])") }
if ($addVarIdx -ge 0) {
  # Check if the next few lines already include setVariantPriceRw
  $exists = $false
  for ($n = $addVarIdx; $n -le [Math]::Min($addVarIdx + 5, $list.Count - 1); $n++) {
    if ($list[$n].Contains('setVariantPriceRw([')) { $exists = $true; break }
  }
  if (-not $exists) {
    $null = ($list[$addVarIdx] -match '^(\s*)'); $indentStr = $Matches[1]
    $list.Insert($addVarIdx + 1, ($indentStr + "setVariantPriceRw([...variantPriceRw, ''])"))
    $list.Insert($addVarIdx + 2, ($indentStr + "setVariantDescText([...variantDescText, ''])"))
  }
}

# E) If </details> still appears before '/>' right after rows={2}, swap them
$rowsIdx = Find-Index('rows={2}')
if ($rowsIdx -ge 0) {
  # find indices of next lines for potential swap
  $detIdx = -1
  $closeIdx = -1
  for ($x = $rowsIdx; $x -lt [Math]::Min($rowsIdx + 6, $list.Count - 1); $x++) {
    if ($detIdx -lt 0 -and $list[$x].Trim().StartsWith('</details>')) { $detIdx = $x }
    if ($closeIdx -lt 0 -and $list[$x].Trim() -eq '/>') { $closeIdx = $x }
  }
  if ($detIdx -ge 0 -and $closeIdx -ge 0 -and $detIdx -lt $closeIdx) {
    $line = $list[$detIdx]
    $list.RemoveAt($detIdx)
    # After removal, closeIdx shifts by -1 if it was after detIdx
    if ($closeIdx -gt $detIdx) { $closeIdx = $closeIdx - 1 }
    $list.Insert($closeIdx + 1, $line)
  }
}

# Write file back
$indicatorExists = $false
foreach ($l in $list) { if ($l.IndexOf('Total traffic: ') -ge 0) { $indicatorExists = $true; break } }
if (-not $indicatorExists) {
  $btnLabelIdx = Find-Index('+ Add Variant')
  if ($btnLabelIdx -ge 0) {
    # find closing </button> after this line
    $btnClose = -1
    for ($p = $btnLabelIdx; $p -lt [Math]::Min($btnLabelIdx + 20, $list.Count); $p++) {
      if ($list[$p].Trim() -eq '</button>') { $btnClose = $p; break }
    }
    if ($btnClose -ge 0) {
      $indent = ($list[$btnClose] -match '^(\s*)') | Out-Null; $indentStr = $Matches[1]
      $list.Insert($btnClose + 1, ($indentStr + '<div className="mt-2 text-xs text-slate-600">'))
      $list.Insert($btnClose + 2, ($indentStr + '  Total traffic: <span className={totalNewTestTraffic === 100 ? ''text-green-600'' : ''text-amber-600''}>{totalNewTestTraffic}%</span> (should equal 100%)'))
      $list.Insert($btnClose + 3, ($indentStr + '</div>'))
    }
  }
}

$final = [string]::Join("`r`n", $list)
[System.IO.File]::WriteAllText($path, $final, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Post-fix for UX patch applied.'
