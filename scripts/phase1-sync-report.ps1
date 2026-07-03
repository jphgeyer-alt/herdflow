$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$reportPath = Join-Path $repoRoot 'PHASE1_AUTOMATED_REPORT.md'
$checklistPath = Join-Path $repoRoot 'PHASE1_BASELINE_CHECKLIST.md'

if (-not (Test-Path $reportPath)) {
  throw 'PHASE1_AUTOMATED_REPORT.md was not found. Run npm run phase1:audit first.'
}
if (-not (Test-Path $checklistPath)) {
  throw 'PHASE1_BASELINE_CHECKLIST.md was not found.'
}

$report = Get-Content $reportPath -Raw
$reportLines = Get-Content $reportPath
$checklistLines = Get-Content $checklistPath

function Get-ReportValueByLabel([string]$label, [string]$fallback = 'N/A') {
  $prefix = "- ${label}:"
  foreach ($line in $reportLines) {
    if ($line.StartsWith($prefix)) {
      return $line.Substring($prefix.Length).Trim()
    }
  }
  return $fallback
}

function ParseFirstKb([string]$text) {
  $match = [regex]::Match($text, '([0-9]+(?:\.[0-9]+)?)\s*kB')
  if ($match.Success) {
    return [double]$match.Groups[1].Value
  }
  return $null
}

$lhStatus = Get-ReportValueByLabel 'Status' 'Failed'
$perf = Get-ReportValueByLabel 'Performance score'
$lcp = Get-ReportValueByLabel 'LCP'
$cls = Get-ReportValueByLabel 'CLS'
$tbt = Get-ReportValueByLabel 'TBT'
$jsTotal = Get-ReportValueByLabel 'JS total size'
$cssTotal = Get-ReportValueByLabel 'CSS total size'

$afterPerf = if ($lhStatus -eq 'Success' -and $perf -ne 'N/A') { $perf } else { 'Blocked (see PHASE1_AUTOMATED_REPORT.md)' }
$afterLcp = if ($lhStatus -eq 'Success' -and $lcp -ne 'N/A') { $lcp } else { 'Blocked (see PHASE1_AUTOMATED_REPORT.md)' }
$afterCls = if ($lhStatus -eq 'Success' -and $cls -ne 'N/A') { $cls } else { 'Blocked (see PHASE1_AUTOMATED_REPORT.md)' }
$afterTbt = if ($lhStatus -eq 'Success' -and $tbt -ne 'N/A') { $tbt } else { 'Blocked (see PHASE1_AUTOMATED_REPORT.md)' }

for ($i = 0; $i -lt $checklistLines.Count; $i++) {
  $line = $checklistLines[$i]

  if ($line.StartsWith('| Lighthouse Performance (/marketplace) |')) {
    $checklistLines[$i] = "| Lighthouse Performance (/marketplace) | Not captured | $afterPerf | N/A |"
    continue
  }
  if ($line.StartsWith('| LCP (/marketplace) |')) {
    $checklistLines[$i] = "| LCP (/marketplace) | Not captured | $afterLcp | N/A |"
    continue
  }
  if ($line.StartsWith('| CLS (/marketplace) |')) {
    $checklistLines[$i] = "| CLS (/marketplace) | Not captured | $afterCls | N/A |"
    continue
  }
  if ($line.StartsWith('| TBT (/marketplace) |')) {
    $checklistLines[$i] = "| TBT (/marketplace) | Not captured | $afterTbt | N/A |"
    continue
  }
  if ($line.StartsWith('| Main JS bundle size |')) {
    $beforeCol = [regex]::Match($line, '^\| Main JS bundle size \|\s*(.*?)\s*\|').Groups[1].Value
    $beforeJs = ParseFirstKb $beforeCol
    $afterJs = ParseFirstKb $jsTotal
    $deltaJs = 'Updated from automated report'
    if ($beforeJs -ne $null -and $afterJs -ne $null) {
      $delta = $afterJs - $beforeJs
      $deltaJs = ('{0:+0.00;-0.00;0.00} kB total' -f $delta)
    }
    $checklistLines[$i] = "| Main JS bundle size | $beforeCol | $jsTotal | $deltaJs |"
    continue
  }
  if ($line.StartsWith('| Main CSS bundle size |')) {
    $beforeCol = [regex]::Match($line, '^\| Main CSS bundle size \|\s*(.*?)\s*\|').Groups[1].Value
    $beforeCss = ParseFirstKb $beforeCol
    $afterCss = ParseFirstKb $cssTotal
    $deltaCss = 'Updated from automated report'
    if ($beforeCss -ne $null -and $afterCss -ne $null) {
      $delta = $afterCss - $beforeCss
      $deltaCss = ('{0:+0.00;-0.00;0.00} kB' -f $delta)
    }
    $checklistLines[$i] = "| Main CSS bundle size | $beforeCol | $cssTotal | $deltaCss |"
    continue
  }
}

Set-Content -Path $checklistPath -Value $checklistLines -Encoding UTF8
Write-Host "Checklist synced from report: $checklistPath" -ForegroundColor Green
