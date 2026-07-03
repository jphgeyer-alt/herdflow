$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$reportPath = Join-Path $repoRoot 'PHASE1_AUTOMATED_REPORT.md'
$lighthouseJsonPath = Join-Path $repoRoot 'phase1-lh-marketplace.json'

Write-Host '== HerdFlow Phase 1 Automated Audit ==' -ForegroundColor Cyan

# 1) Build
Write-Host 'Running production build...' -ForegroundColor Yellow
cmd /c npm run build | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw 'Build failed. Aborting audit.'
}

# 2) Collect bundle sizes
$assetDir = Join-Path $repoRoot 'dist\assets'
if (-not (Test-Path $assetDir)) {
  throw 'dist/assets not found after build.'
}

$jsFiles = Get-ChildItem $assetDir -Filter '*.js' -File
$cssFiles = Get-ChildItem $assetDir -Filter '*.css' -File

$jsTotalBytes = ($jsFiles | Measure-Object -Property Length -Sum).Sum
$cssTotalBytes = ($cssFiles | Measure-Object -Property Length -Sum).Sum

function Format-KB([double]$bytes) {
  if (-not $bytes) { return '0.00 kB' }
  return ('{0:N2} kB' -f ($bytes / 1KB))
}

# 3) Start preview server
Write-Host 'Starting preview server...' -ForegroundColor Yellow
$previewProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run preview -- --host 127.0.0.1 --port 4173' -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 4

$lighthouseStatus = 'Not run'
$lighthousePerf = 'N/A'
$lcp = 'N/A'
$cls = 'N/A'
$tbt = 'N/A'
$lighthouseNote = ''

try {
  Write-Host 'Running Lighthouse for /marketplace...' -ForegroundColor Yellow
  $lhCommand = 'npx lighthouse http://127.0.0.1:4173/marketplace --only-categories=performance --chrome-flags="--headless --no-sandbox" --output=json --output-path=phase1-lh-marketplace.json --quiet --no-enable-error-reporting'
  cmd /c $lhCommand | Out-Host

  if ($LASTEXITCODE -eq 0 -and (Test-Path $lighthouseJsonPath)) {
    $lh = Get-Content $lighthouseJsonPath -Raw | ConvertFrom-Json
    $lighthouseStatus = 'Success'
    $lighthousePerf = '{0:N0}' -f (($lh.categories.performance.score) * 100)

    $lcpValue = $lh.audits.'largest-contentful-paint'.numericValue
    $clsValue = $lh.audits.'cumulative-layout-shift'.numericValue
    $tbtValue = $lh.audits.'total-blocking-time'.numericValue

    $lcp = '{0:N2}s' -f ($lcpValue / 1000)
    $cls = '{0:N3}' -f $clsValue
    $tbt = '{0:N0} ms' -f $tbtValue
  } else {
    $lighthouseStatus = 'Failed'
    $lighthouseNote = 'Lighthouse could not run. Ensure Google Chrome is installed and available in PATH.'
  }
} finally {
  if ($previewProcess -and -not $previewProcess.HasExited) {
    Stop-Process -Id $previewProcess.Id -Force
  }
}

# 4) Write report
$lines = @(
  '# HerdFlow Phase 1 Automated Report',
  '',
  "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  '',
  '## Build Artifacts',
  '',
  "- JS files: $($jsFiles.Count)",
  "- JS total size: $(Format-KB $jsTotalBytes)",
  "- CSS files: $($cssFiles.Count)",
  "- CSS total size: $(Format-KB $cssTotalBytes)",
  ''
)

foreach ($file in $jsFiles) {
  $lines += "- JS: $($file.Name) ($(Format-KB $file.Length))"
}
foreach ($file in $cssFiles) {
  $lines += "- CSS: $($file.Name) ($(Format-KB $file.Length))"
}

$lines += @(
  '',
  '## Lighthouse (/marketplace)',
  '',
  "- Status: $lighthouseStatus",
  "- Performance score: $lighthousePerf",
  "- LCP: $lcp",
  "- CLS: $cls",
  "- TBT: $tbt"
)

if ($lighthouseNote) {
  $lines += "- Note: $lighthouseNote"
}

$lines += @(
  '',
  '## Next Step',
  '',
  '- Copy these values into PHASE1_BASELINE_CHECKLIST.md compare table if needed.'
)

Set-Content -Path $reportPath -Value $lines -Encoding UTF8
Write-Host "Audit report written to: $reportPath" -ForegroundColor Green
