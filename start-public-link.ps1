# Gives ShopEase a public https link (Cloudflare Tunnel) so it opens from any network / mobile data.
# No Cloudflare account needed. The link changes every time the tunnel starts; the current one is
# saved in logs\public-url.txt, shown in Admin > Dashboard and by public-link.bat.
#   -Watch   keep running and restart the tunnel if it stops (used by the hidden auto-start)
param([switch]$Watch, [switch]$Quiet)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$exe = Join-Path $root 'tools\cloudflared.exe'
$logDir = Join-Path $root 'logs'
$urlFile = Join-Path $logDir 'public-url.txt'
$tunnelLog = Join-Path $logDir 'tunnel.log'
$port = 5000
New-Item -ItemType Directory -Force $logDir | Out-Null

function Say($text, $color = 'Gray') { if (-not $Quiet) { Write-Host $text -ForegroundColor $color } }

function Get-Tunnel {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe }
}

function Test-Link($url) {
  try { return (Invoke-WebRequest "$url/api/health" -UseBasicParsing -TimeoutSec 15).StatusCode -eq 200 } catch { return $false }
}

function Start-Tunnel {
  if (-not (Test-Path $exe)) {
    Say 'Downloading Cloudflare Tunnel (one time, about 55 MB)...' Cyan
    New-Item -ItemType Directory -Force (Split-Path $exe) | Out-Null
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $exe -UseBasicParsing
  }
  Get-Tunnel | Stop-Process -Force -ErrorAction SilentlyContinue
  Remove-Item $urlFile -ErrorAction SilentlyContinue
  if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force -ErrorAction SilentlyContinue }
  # cloudflared writes its log (including the link) to stderr
  Start-Process -FilePath $exe -ArgumentList 'tunnel', '--no-autoupdate', '--url', "http://localhost:$port" `
    -WindowStyle Hidden -RedirectStandardError $tunnelLog -RedirectStandardOutput "$tunnelLog.out" | Out-Null

  $url = $null
  for ($i = 0; $i -lt 60 -and -not $url; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $tunnelLog) {
      $m = Select-String -Path $tunnelLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($m) { $url = $m.Matches[0].Value }
    }
  }
  if (-not $url) { Say 'Could not get a public link - is the internet connected? See logs\tunnel.log' Red; return $null }

  # A brand new link needs a few seconds before it answers
  for ($i = 0; $i -lt 30; $i++) { if (Test-Link $url) { break }; Start-Sleep -Seconds 2 }
  Set-Content -Path $urlFile -Value $url -Encoding ascii
  return $url
}

function Show-Link($url) {
  Say ''
  Say '  ShopEase public link (works on any network / mobile data):' Green
  Say "     $url" Yellow
  Say ''
  Say '  The link is also in Admin > Dashboard (with a QR code) and in logs\public-url.txt.' Gray
  Say '  It changes when the computer restarts - run public-link.bat to see the current one.' Gray
  try { Set-Clipboard -Value $url; Say '  (copied to the clipboard)' Gray } catch {}
}

# Wait until ShopEase itself is running
for ($i = 0; $i -lt 90; $i++) {
  try { if ((Invoke-WebRequest "http://localhost:$port/api/health" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { break } } catch {}
  Start-Sleep -Seconds 2
}

$current = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { '' }
if ((Get-Tunnel) -and $current -and (Test-Link $current)) {
  $url = $current
} else {
  $url = Start-Tunnel
}
if ($url) { Show-Link $url }

if ($Watch) {
  # Keep the link alive: restart the tunnel if it stopped or no longer answers
  $fails = 0
  while ($true) {
    Start-Sleep -Seconds 60
    $current = if (Test-Path $urlFile) { (Get-Content $urlFile -Raw).Trim() } else { '' }
    if ((Get-Tunnel) -and $current -and (Test-Link $current)) { $fails = 0; continue }
    # ShopEase itself stopped (stop.bat): nothing to fix, and a new link would not help
    if (-not (Test-Link "http://localhost:$port")) {
      if (-not (Get-Process node -ErrorAction SilentlyContinue)) { Get-Tunnel | Stop-Process -Force -ErrorAction SilentlyContinue; break }
      continue
    }
    $fails++
    # one slow answer is not enough to throw the link away
    if (-not (Get-Tunnel) -or $fails -ge 3) { $fails = 0; Start-Tunnel | Out-Null }
  }
}
