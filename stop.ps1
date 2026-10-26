# Stops ShopEase: the app (ports 5000 / 5173), its local database (port 27018) and the public link.
$root = $PSScriptRoot

# Public link: its watcher first (so it does not restart the tunnel), then the tunnel itself
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*start-public-link.ps1*-Watch*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq (Join-Path $root 'tools\cloudflared.exe') } |
  Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $root 'logs\public-url.txt') -ErrorAction SilentlyContinue

$ids = Get-NetTCPConnection -LocalPort 5000, 5173, 27018 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
if (-not $ids) {
  Write-Host 'ShopEase was not running.'
  return
}
foreach ($id in $ids) {
  $name = (Get-Process -Id $id -ErrorAction SilentlyContinue).ProcessName
  # Only stop ShopEase's own programs, never something else that happens to use the port
  if ($name -in 'node', 'mongod' -or $name -like 'mongod*') { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 2
if (Get-NetTCPConnection -LocalPort 5000, 27018 -State Listen -ErrorAction SilentlyContinue) {
  Write-Host 'Some parts are still running - close any ShopEase window and try again.' -ForegroundColor Yellow
} else {
  Write-Host 'ShopEase stopped.' -ForegroundColor Green
}
