$ErrorActionPreference = 'Stop'
$path = "C:\Dev\ImboniResto\src\pages\dashboard\ab-testing.tsx"
if (-not (Test-Path $path)) { throw "File not found: $path" }

# Read file
$content = Get-Content -Raw -Encoding UTF8 $path

function Insert-AfterText {
  param([string]$Anchor,[string]$Insert)
  $idx = $content.IndexOf($Anchor)
  if ($idx -ge 0) {
    $script:content = $content.Substring(0, $idx + $Anchor.Length) + $Insert + $content.Substring($idx + $Anchor.Length)
    return $true
  }
  return $false
}
function Insert-BeforeText {
  param([string]$Anchor,[string]$Insert)
  $idx = $content.IndexOf($Anchor)
  if ($idx -ge 0) {
    $script:content = $content.Substring(0, $idx) + $Insert + $content.Substring($idx)
    return $true
  }
  return $false
}

# 1) Add friendlier state arrays after variantChangesText state
$anchor1 = "const [variantChangesText, setVariantChangesText] = useState<string[]>([''{}'', ''{}''])"
$insertion1 = "`r`n  const [variantPriceRw, setVariantPriceRw] = useState<string[]>([''", "''])`r`n  const [variantDescText, setVariantDescText] = useState<string[]>([''", "''])"
if ($content -notmatch [regex]::Escape("variantPriceRw")) {
  if (-not (Insert-AfterText -Anchor $anchor1 -Insert $insertion1)) {
    Write-Host "Warning: Could not find anchor1 to insert new states."
  }
}

# 2) Seed new fields when opening modal (inside showNewTest effect)
$seedAnchor = "setVariantChangesText(newTest.variants.map(v => JSON.stringify(v.changes ?? {})))"
$seedInsert = "`r`n      setVariantPriceRw(newTest.variants.map(v => typeof (v as any).changes?.priceCents -eq 'number' ? String([math]::Round(((v as any).changes.priceCents) / 100)) : ''))`r`n      setVariantDescText(newTest.variants.map(v => typeof (v as any).changes?.description -eq 'string' ? ((v as any).changes.description) : ''))"
if ($content -notmatch [regex]::Escape("setVariantPriceRw")) {
  if (-not (Insert-AfterText -Anchor $seedAnchor -Insert $seedInsert)) {
    Write-Host "Warning: Could not find seed anchor to insert price/desc seeds."
  }
}

# 3) Reset fields after successful create
$resetAnchor = "setVariantChangesText([''{}'', ''{}''])"
$resetInsert = "`r`n        setVariantPriceRw([''", "''])`r`n        setVariantDescText([''", "''])"
if ($content -notmatch [regex]::Escape("setVariantPriceRw([''")) {
  if (-not (Insert-AfterText -Anchor $resetAnchor -Insert $resetInsert)) {
    Write-Host "Warning: Could not find reset anchor to insert price/desc resets."
  }
}

# 4) Add totalNewTestTraffic const before return
if ($content -notmatch [regex]::Escape("const totalNewTestTraffic")) {
  $returnAnchor = "  return ("
  $computeInsert = "`r`n  const totalNewTestTraffic = newTest.variants.reduce((sum, v) => sum + (v.trafficPercent || 0), 0)" + "`r`n"
  if (-not (Insert-BeforeText -Anchor $returnAnchor -Insert $computeInsert)) {
    Write-Host "Warning: Could not insert totalNewTestTraffic before return."
  }
}

# 5) Insert friendly price/description inputs before the Changes JSON block
$changesDivAnchor = "                      <div className=\"mt-3\">"
$friendlyBlock = @"
                      <div className=""grid grid-cols-2 gap-4 mt-3"">
                        <div>
                          <label htmlFor={`variant-price-${index}`} className=""block text-xs text-slate-600 mb-1"">New price (RWF)</label>
                          <input
                            type=""number""
                            id={`variant-price-${index}`}
                            name={`variant-price-${index}`}
                            value={variantPriceRw[index] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setVariantPriceRw(prev => {
                                const copy = [...prev]
                                copy[index] = val
                                return copy
                              })
                              const updated = [...newTest.variants]
                              const c: any = { ...(updated[index].changes || {}) }
                              if (val === '' || isNaN(Number(val))) {
                                delete c.priceCents
                              } else {
                                c.priceCents = Math.max(0, Math.round(Number(val) * 100))
                              }
                              updated[index].changes = c
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className=""w-full px-3 py-2 border border-slate-300 rounded-lg text-sm""
                            min=""0""
                          />
                          <p className=""text-[11px] text-slate-500 mt-1"">Leave blank to keep the current price.</p>
                        </div>
                        <div>
                          <label htmlFor={`variant-desc-${index}`} className=""block text-xs text-slate-600 mb-1"">Description change</label>
                          <input
                            type=""text""
                            id={`variant-desc-${index}`}
                            name={`variant-desc-${index}`}
                            value={variantDescText[index] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              setVariantDescText(prev => {
                                const copy = [...prev]
                                copy[index] = val
                                return copy
                              })
                              const updated = [...newTest.variants]
                              const c: any = { ...(updated[index].changes || {}) }
                              if (!val) {
                                delete c.description
                              } else {
                                c.description = val
                              }
                              updated[index].changes = c
                              setNewTest({ ...newTest, variants: updated })
                            }}
                            className=""w-full px-3 py-2 border border-slate-300 rounded-lg text-sm""
                          />
                          <p className=""text-[11px] text-slate-500 mt-1"">Optional. Shown to customers if provided.</p>
                        </div>
                      </div>
"@
if ($content -notmatch [regex]::Escape("variant-price-")) {
  if (-not (Insert-BeforeText -Anchor $changesDivAnchor -Insert ($friendlyBlock + "`r`n"))) {
    Write-Host "Warning: Could not insert friendly price/desc block."
  }
}

# 6) Add small hint under Traffic % input
$trafficPattern = "max=\"100\"`r`n                          />"
if ($content -match [regex]::Escape($trafficPattern)) {
  $content = $content -replace [regex]::Escape($trafficPattern), ($trafficPattern + "`r`n                          <p className=\"text-[11px] text-slate-500 mt-1\">Percentage of visitors who will see this variant.</p>")
} else {
  # Try LF variant
  $trafficPattern2 = "max=\"100\"`n                          />"
  if ($content -match [regex]::Escape($trafficPattern2)) {
    $content = $content -replace [regex]::Escape($trafficPattern2), ($trafficPattern2 + "`n                          <p className=\"text-[11px] text-slate-500 mt-1\">Percentage of visitors who will see this variant.</p>")
  } else {
    Write-Host "Warning: Could not add traffic hint."
  }
}

# 7) Enhance + Add Variant handler to also adjust price/desc arrays
$addVarAnchor = "setVariantChangesText([...variantChangesText, '{}'])"
$addVarInsert = "`r`n                      setVariantPriceRw([...variantPriceRw, ''])`r`n                      setVariantDescText([...variantDescText, ''])"
if ($content -notmatch [regex]::Escape("setVariantPriceRw([...variantPriceRw")) {
  if (-not (Insert-AfterText -Anchor $addVarAnchor -Insert $addVarInsert)) {
    Write-Host "Warning: Could not enhance Add Variant handler."
  }
}

# 8) Insert total traffic indicator after the Add Variant button closing tag (nearest after the button class)
$btnClass = "className=\"text-sm text-blue-600 hover:text-blue-700 font-medium\""
$btnIdx = $content.IndexOf($btnClass)
if ($btnIdx -ge 0) {
  $closeIdx = $content.IndexOf("</button>", $btnIdx)
  if ($closeIdx -ge 0) {
    $insertPos = $closeIdx + 9
    $trafficInfo = "`r`n                  <div class=\"mt-2 text-xs text-slate-600\">Total traffic: <span className={totalNewTestTraffic === 100 ? 'text-green-600' : 'text-amber-600'}>{totalNewTestTraffic}%</span> (should equal 100%)</div>"
    if ($content.Substring($insertPos, [Math]::Min(200, $content.Length - $insertPos)) -notmatch 'Total traffic:') {
      $content = $content.Substring(0, $insertPos) + $trafficInfo + $content.Substring($insertPos)
    }
  } else {
    Write-Host "Warning: Could not find Add Variant button closing tag."
  }
} else {
  Write-Host "Warning: Could not find Add Variant button class."
}

# 9) Insert help section before footer border top
$footerAnchor = "              <div class=\"p-6 border-t border-slate-200 flex gap-3 justify-end\">"
$helpBlock = @"

              <div className=""p-6 pt-0 text-sm text-slate-700"">
                <div className=""mt-2 p-4 bg-slate-50 border border-slate-200 rounded-lg"">
                  <p className=""font-medium mb-2"">A/B Testing basics</p>
                  <ul className=""list-disc pl-5 space-y-1"">
                    <li><span className=""font-medium"">Variants</span>: A is the Control; add one or more alternatives to compare.</li>
                    <li><span className=""font-medium"">Traffic %</span>: The share of visitors who see each variant. Aim for a total of 100%.</li>
                    <li><span className=""font-medium"">Changes</span>: Use New price and Description for quick edits. Advanced users can edit raw JSON.</li>
                    <li><span className=""font-medium"">Run</span>: Start the test, watch views, orders and revenue, then end and select the winner.</li>
                  </ul>
                </div>
              </div>
"@
if ($content -notmatch [regex]::Escape("A/B Testing basics")) {
  if (-not (Insert-BeforeText -Anchor $footerAnchor -Insert $helpBlock)) {
    Write-Host "Warning: Could not insert help block."
  }
}

# Write back
[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Enhanced A/B Test UX in ab-testing.tsx"
