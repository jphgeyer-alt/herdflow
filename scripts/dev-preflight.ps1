param(
  [int[]]$Ports = @(4173, 4174, 4175, 8081, 8082)
)

$ErrorActionPreference = 'Stop'

Write-Host "[preflight] Checking ports: $($Ports -join ', ')"

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $Ports -contains $_.LocalPort }

if (-not $listeners) {
  Write-Host '[preflight] No listeners found on target ports.'
  exit 0
}

$processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  $ownedPorts = ($listeners | Where-Object { $_.OwningProcess -eq $processId } | Select-Object -ExpandProperty LocalPort -Unique | Sort-Object) -join ', '

  if ($process.ProcessName -ne 'node') {
    Write-Host "[preflight] Skipping non-node process $($process.ProcessName) (PID $processId) on port(s): $ownedPorts"
    continue
  }

  Write-Host "[preflight] Stopping node PID $processId on port(s): $ownedPorts"
  Stop-Process -Id $processId -Force
}

$remaining = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $Ports -contains $_.LocalPort } |
  Select-Object LocalAddress, LocalPort, OwningProcess |
  Sort-Object LocalPort, OwningProcess

if ($remaining) {
  Write-Host '[preflight] Remaining listeners detected:'
  $remaining | Format-Table -AutoSize
} else {
  Write-Host '[preflight] Ports are clear.'
}
