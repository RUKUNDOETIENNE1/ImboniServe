$ErrorActionPreference = 'Stop'
$path = "C:\Dev\ImboniResto\src\pages\dashboard\ab-testing.tsx"
if (-not (Test-Path $path)) { throw "File not found: $path" }

# Read file as lines
$lines = [System.IO.File]::ReadAllLines($path)
$list = New-Object System.Collections.Generic.List[string]
$list.AddRange($lines)

function Find-Index([string]$substr, [int]$start = 0) {
  for ($i = $start; $i -lt $list.Count; $i++) {
    if ($list[$i].IndexOf($substr, [System.StringComparison]::Ordinal) -ge 0) { return $i }
  }
  return -1
}

function Get-Indent([string]$line) {
  if ($line -match '^(\s*)') { return $Matches[1] } else { return '' }
}

function Insert-LinesAfter([int]$index, [string[]]$newLines) {
  for ($j = $newLines.Length - 1; $j -ge 0; $j--) {
    $list.Insert($index + 1, $newLines[$j])
  }
}

function Insert-LinesBefore([int]$index, [string[]]$newLines) {
  for ($j = 0; $j -lt $newLines.Length; $j++) {
    $list.Insert($index + $j, $newLines[$j])
  }
}

# 1) Add new state arrays after variantChangesText state
if (-not ($list | Where-Object { $_ -like '*variantPriceRw*' })) {
  $idx = Find-Index("const [variantChangesText, setVariantChangesText] = useState<string[]>(['{}', '{}'])")
  if ($idx -ge 0) {
    $indent = Get-Indent $list[$idx]
    $insert = @(
      "$indent  const [variantPriceRw, setVariantPriceRw] = useState<string[]>(['', ''])",
      "$indent  const [variantDescText, setVariantDescText] = useState<string[]>(['', ''])"
    )
    Insert-LinesAfter -index $idx -newLines $insert
  } else { Write-Host 'Warn: variantChangesText anchor not found' }
}

# 2) Seed new fields when opening modal (inside showNewTest effect)
if (-not ($list | Where-Object { $_.Contains('setVariantPriceRw(newTest.variants.map') })) {
  $idx = Find-Index('setVariantChangesText(newTest.variants.map(v => JSON.stringify(v.changes ?? {})))')
  if ($idx -ge 0) {
    $indent = Get-Indent $list[$idx]
    $insert = @(
      "$indent      setVariantPriceRw(newTest.variants.map(v => typeof (v as any).changes?.priceCents === 'number' ? String(Math.round(((v as any).changes.priceCents as number) / 100)) : ''))",
      "$indent      setVariantDescText(newTest.variants.map(v => typeof (v as any).changes?.description === 'string' ? ((v as any).changes.description as string) : ''))"
    )
    Insert-LinesAfter -index $idx -newLines $insert
  } else { Write-Host 'Warn: seeding anchor not found' }
}

# 3) Reset fields after successful create
if (-not ($list | Where-Object { $_.Contains("setVariantPriceRw(['', ''])") })) {
  $idx = Find-Index("setVariantChangesText(['{}', '{}'])")
  if ($idx -ge 0) {
    $indent = Get-Indent $list[$idx]
    $insert = @(
      "$indent        setVariantPriceRw(['', ''])",
      "$indent        setVariantDescText(['', ''])"
    )
    Insert-LinesAfter -index $idx -newLines $insert
  } else { Write-Host 'Warn: reset anchor not found' }
}

# 4) Change label text to Options (A/B)
$idx = Find-Index("t('ab.variants', 'Variants')")
if ($idx -ge 0) { $list[$idx] = $list[$idx].Replace("'Variants'", "'Options (A/B)'") }

# 5) Add hint after Traffic input closing tag
$start = Find-Index('name={`variant-traffic-${index}`}')
if ($start -ge 0) {
  $endSearch = [Math]::Min($start + 20, $list.Count - 1)
  for ($i = $start; $i -le $endSearch; $i++) {
    if ($list[$i].Trim() -eq '/>') {
      $indent = Get-Indent $list[$i]
      $insert = @(
        ($indent + '<p class="text-[11px] text-slate-500 mt-1">Percentage of visitors who will see this option.</p>')
      )
      Insert-LinesAfter -index $i -newLines $insert
      break
    }
  }
} else { Write-Host 'Warn: variant-traffic block not found' }

# 6) Insert friendly price/desc grid before JSON block
$idxMt3 = Find-Index('<div className="mt-3">')
if ($idxMt3 -ge 0) {
  # Ensure we are in the variant block by checking previous lines contain 'grid grid-cols-2'
  $indent = Get-Indent $list[$idxMt3]
  $block = @(
    ($indent + '<div class="grid grid-cols-2 gap-4 mt-3">'),
    ($indent + '  <div>'),
    ($indent + '    <label htmlFor={`variant-price-${index}`} className="block text-xs text-slate-600 mb-1">New price (RWF)</label>'),
    ($indent + '    <input'),
    ($indent + '      type="number"'),
    ($indent + '      id={`variant-price-${index}`}'),
    ($indent + '      name={`variant-price-${index}`}'),
    ($indent + '      value={variantPriceRw[index] ?? ''''}'),
    ($indent + '      onChange={(e) => {'),
    ($indent + '        const val = e.target.value'),
    ($indent + '        setVariantPriceRw(prev => { const copy = [...prev]; copy[index] = val; return copy })'),
    ($indent + '        const updated = [...newTest.variants]'),
    ($indent + '        const c: any = { ...(updated[index].changes || {}) }'),
    ($indent + '        if (val === '''' || isNaN(Number(val))) { delete c.priceCents } else { c.priceCents = Math.max(0, Math.round(Number(val) * 100)) }'),
    ($indent + '        updated[index].changes = c'),
    ($indent + '        setNewTest({ ...newTest, variants: updated })'),
    ($indent + '      }}'),
    ($indent + '      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"'),
    ($indent + '      min="0"'),
    ($indent + '    />'),
    ($indent + '    <p className="text-[11px] text-slate-500 mt-1">Leave blank to keep the current price.</p>'),
    ($indent + '  </div>'),
    ($indent + '  <div>'),
    ($indent + '    <label htmlFor={`variant-desc-${index}`} className="block text-xs text-slate-600 mb-1">Description change</label>'),
    ($indent + '    <input'),
    ($indent + '      type="text"'),
    ($indent + '      id={`variant-desc-${index}`}'),
    ($indent + '      name={`variant-desc-${index}`}'),
    ($indent + '      value={variantDescText[index] ?? ''''}'),
    ($indent + '      onChange={(e) => {'),
    ($indent + '        const val = e.target.value'),
    ($indent + '        setVariantDescText(prev => { const copy = [...prev]; copy[index] = val; return copy })'),
    ($indent + '        const updated = [...newTest.variants]'),
    ($indent + '        const c: any = { ...(updated[index].changes || {}) }'),
    ($indent + '        if (!val) { delete c.description } else { c.description = val }'),
    ($indent + '        updated[index].changes = c'),
    ($indent + '        setNewTest({ ...newTest, variants: updated })'),
    ($indent + '      }}'),
    ($indent + '      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"'),
    ($indent + '    />'),
    ($indent + '    <p className="text-[11px] text-slate-500 mt-1">Optional. Shown to customers if provided.</p>'),
    ($indent + '  </div>'),
    ($indent + '</div>')
  )
  Insert-LinesBefore -index $idxMt3 -newLines $block
} else { Write-Host 'Warn: mt-3 JSON block anchor not found' }

# 7) Enhance + Add Variant handler
if (-not ($list | Where-Object { $_.Contains('setVariantPriceRw([') })) {
  $idx = Find-Index('setVariantChangesText([...variantChangesText, ''{}''])')
  if ($idx -lt 0) { $idx = Find-Index("setVariantChangesText([...variantChangesText, '{}'])") }
  if ($idx -ge 0) {
    $indent = Get-Indent $list[$idx]
    $insert = @(
      "$indent                      setVariantPriceRw([...variantPriceRw, ''])",
      "$indent                      setVariantDescText([...variantDescText, ''])"
    )
    Insert-LinesAfter -index $idx -newLines $insert
  } else { Write-Host 'Warn: Add Variant anchor not found' }
}

# 8) Insert total traffic const before return (
if (-not ($list | Where-Object { $_ -like '*const totalNewTestTraffic*' })) {
  $idx = Find-Index('return (')
  if ($idx -ge 0) {
    $insert = @('  const totalNewTestTraffic = newTest.variants.reduce((sum, v) => sum + (v.trafficPercent || 0), 0)', '')
    Insert-LinesBefore -index $idx -newLines $insert
  } else { Write-Host 'Warn: return ( anchor not found' }
}

# 9) Add help box before footer buttons
if (-not ($list | Where-Object { $_ -like '*A/B Testing basics*' })) {
  $idx = Find-Index('<div className="p-6 border-t border-slate-200 flex gap-3 justify-end">')
  if ($idx -ge 0) {
    $indent = Get-Indent $list[$idx]
    $block = @(
      ($indent + '<div class="p-6 pt-0 text-sm text-slate-700">'),
      ($indent + '  <div class="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">'),
      ($indent + '    <p class="font-medium mb-2">A/B Testing basics</p>'),
      ($indent + '    <ul class="list-disc pl-5 space-y-1">'),
      ($indent + '      <li><span class="font-medium">Options (A/B)</span>: A is the Control; add one or more alternatives to compare.</li>'),
      ($indent + '      <li><span class="font-medium">Traffic %</span>: The share of visitors who see each option. Aim for a total of 100%.</li>'),
      ($indent + '      <li><span class="font-medium">Changes</span>: Use New price and Description for quick edits. Advanced users can edit raw JSON.</li>'),
      ($indent + '      <li><span class="font-medium">Run</span>: Start the test, watch views, orders and revenue, then end and select the winner.</li>'),
      ($indent + '    </ul>'),
      ($indent + '  </div>'),
      ($indent + '</div>')
    )
    Insert-LinesBefore -index $idx -newLines $block
  } else { Write-Host 'Warn: footer anchor not found' }
}

# 10) Insert total traffic indicator after '+ Add Variant' button
if (-not ($list | Where-Object { $_ -like '*Total traffic:*' })) {
  $btnIdx = Find-Index('+ Add Variant')
  if ($btnIdx -ge 0) {
    $indent = Get-Indent $list[$btnIdx]
    $insert = @(
      ($indent + '<div className="mt-2 text-xs text-slate-600">'),
      ($indent + '  Total traffic: <span className={totalNewTestTraffic === 100 ? ''text-green-600'' : ''text-amber-600''}>{totalNewTestTraffic}%</span> (should equal 100%)'),
      ($indent + '</div>')
    )
    Insert-LinesAfter -index $btnIdx -newLines $insert
  } else { Write-Host 'Warn: Add Variant button anchor not found' }
}

# 11) Wrap raw JSON editor in <details> with summary
$jsonOpenIdx = Find-Index('<div className="mt-3">')
if ($jsonOpenIdx -ge 0) {
  # Insert opening <details> + summary after the opening div line
  $indent = Get-Indent $list[$jsonOpenIdx]
  $openInsert = @(
    ($indent + '  <details>'),
    ($indent + '    <summary className="text-xs text-slate-600 cursor-pointer select-none">Advanced: Edit raw JSON</summary>')
  )
  Insert-LinesAfter -index $jsonOpenIdx -newLines $openInsert
  # Find the textarea line and append closing </details>
  $searchEnd = [Math]::Min($jsonOpenIdx + 50, $list.Count - 1)
  for ($k = $jsonOpenIdx; $k -le $searchEnd; $k++) {
    if ($list[$k] -like '*rows={2}*') {
      $tIndent = Get-Indent $list[$k]
      $close = @(
        ($tIndent + '    '),
        ($tIndent + '  </details>')
      )
      Insert-LinesAfter -index $k -newLines $close
      break
    }
  }
} else { Write-Host 'Warn: JSON block open anchor not found' }

# Write back with UTF8 no BOM
$final = [string]::Join("`r`n", $list)
[System.IO.File]::WriteAllText($path, $final, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'UX Patch applied to ab-testing.tsx'
