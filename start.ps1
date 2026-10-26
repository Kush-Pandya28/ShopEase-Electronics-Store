# ShopEase one-click start (Windows).
# Builds the website and runs it together with the API on ONE port (5000):
#   this PC:              http://localhost:5000
#   other PCs / phones:   http://<this-PC-IP>:5000   (same Wi-Fi / LAN)
#   from anywhere:        optional public link, off by default (PUBLIC_LINK=true in server\.env)
# Options: -Hidden (no window, used by auto-start)   -NoBrowser (don't open the browser)
param([switch]$Hidden, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$port = 5000

function Test-Url($url) {
  try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; return $true } catch { return $false }
}

# IPv4 addresses other devices can use to reach this PC (Wi-Fi / Ethernet, not virtual adapters)
function Get-LanAddresses {
  try {
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Loopback|Bluetooth' } |
      Sort-Object { if ($_.InterfaceAlias -match 'Wi-?Fi|Wireless|WLAN') { 0 } elseif ($_.InterfaceAlias -match 'Ethernet') { 1 } else { 2 } } |
      Select-Object -ExpandProperty IPAddress -Unique
  } catch { @() }
}

function Show-Urls {
  $lan = @(Get-LanAddresses)
  Write-Host ''
  Write-Host '  ShopEase is running' -ForegroundColor Green
  Write-Host "  On this computer : http://localhost:$port" -ForegroundColor Cyan
  Write-Host '                    (old link http://localhost:5173 also works)' -ForegroundColor DarkGray
  foreach ($ip in $lan) { Write-Host "  On other devices : http://${ip}:$port   (same Wi-Fi / network)" -ForegroundColor Cyan }
  if (-not $lan) { Write-Host '  (No network connection found - only this computer can open the site)' -ForegroundColor Yellow }
  $adminLine = Select-String -Path "$root\server\.env" -Pattern '^ADMIN_LOGIN_EMAIL=(.+)$' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($adminLine) { Write-Host "  Admin    : $($adminLine.Matches[0].Groups[1].Value) (password set in server\.env)" } else { Write-Host '  Admin    : admin@shopease.com / Admin@123' }
  Write-Host '  Customer : customer@shopease.com / Customer@123'
  Write-Host ''
  Write-Host '  Other device cannot open it? Double-click allow-network.bat once (Windows Firewall).' -ForegroundColor DarkGray
}

# Public internet link (Cloudflare Tunnel) kept alive by a hidden watcher.
# OFF by default - only started when server\.env has PUBLIC_LINK=true (or via public-link.bat)
function Start-PublicLink {
  if (-not (Select-String -Path "$root\server\.env" -Pattern '^PUBLIC_LINK=true' -Quiet -ErrorAction SilentlyContinue)) { return }
  $watcher = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like '*start-public-link.ps1*-Watch*' }
  if (-not $watcher) {
    Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$root\start-public-link.ps1`"", '-Watch', '-Quiet'
  }
  if ($Hidden) { return }
  Write-Host '  Getting the public link (any network / mobile data)...' -ForegroundColor DarkGray
  $urlFile = "$root\logs\public-url.txt"
  for ($i = 0; $i -lt 45 -and -not (Test-Path $urlFile); $i++) { Start-Sleep 2 }
  if (Test-Path $urlFile) {
    $url = (Get-Content $urlFile -Raw).Trim()
    Write-Host "  From anywhere    : $url" -ForegroundColor Green
    Write-Host '                    (changes after a restart - public-link.bat shows the current one)' -ForegroundColor DarkGray
  } else {
    Write-Host '  Public link not ready yet - run public-link.bat in a minute (needs internet).' -ForegroundColor Yellow
  }
}

# Already running: just show the addresses and open the browser
if (Test-Url "http://localhost:$port/api/health") {
  Write-Host 'ShopEase is already running.' -ForegroundColor Green
  Show-Urls
  Start-PublicLink
  if (-not $NoBrowser) { Start-Process "http://localhost:$port" }
  return
}
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
  Write-Host "Port $port is used by another program. Close it (or run stop.bat) and try again." -ForegroundColor Red
  return
}

# 1. Node.js: installed one, else the portable copy in %USERPROFILE%\nodejs-portable (downloaded if needed)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $portable = Get-ChildItem "$env:USERPROFILE\nodejs-portable" -Directory -Filter 'node-v*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $portable) {
    Write-Host 'Node.js not found - downloading portable Node.js 20 LTS (one time)...' -ForegroundColor Yellow
    $ProgressPreference = 'SilentlyContinue'
    $v = ((Invoke-RestMethod https://nodejs.org/dist/index.json) | Where-Object { $_.version -like 'v20.*' -and $_.lts } | Select-Object -First 1).version
    $zip = "$env:TEMP\node-$v.zip"
    Invoke-WebRequest "https://nodejs.org/dist/$v/node-$v-win-x64.zip" -OutFile $zip
    Expand-Archive $zip -DestinationPath "$env:USERPROFILE\nodejs-portable" -Force
    $portable = Get-ChildItem "$env:USERPROFILE\nodejs-portable" -Directory -Filter 'node-v*' | Select-Object -First 1
  }
  $env:Path = "$($portable.FullName);$env:Path"
}
Write-Host "Using Node $(node -v)" -ForegroundColor Green

# 2. Dependencies (first run on a computer, or after moving the folder to a new computer)
foreach ($app in 'server', 'client') {
  if (-not (Test-Path "$root\$app\node_modules")) {
    Write-Host "Installing $app dependencies (first run only, needs internet)..." -ForegroundColor Yellow
    Push-Location "$root\$app"; npm install --no-audit --no-fund; Pop-Location
  }
}

# 3. server/.env with the built-in local database (MONGO_URI=memory)
$envFile = "$root\server\.env"
if (-not (Test-Path $envFile)) {
  $secret = { -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) }) }
  (Get-Content "$root\server\.env.example" -Raw) `
    -replace 'MONGO_URI=.*', 'MONGO_URI=memory' `
    -replace 'JWT_ACCESS_SECRET=.*', "JWT_ACCESS_SECRET=$(& $secret)" `
    -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$(& $secret)" |
    Set-Content $envFile -Encoding utf8
  Write-Host 'Created server/.env (local database, sample data loads automatically)' -ForegroundColor Green
}

# 4. Build the website when the source changed (or no build exists yet)
$dist = "$root\client\dist\index.html"
$newestSource = Get-ChildItem "$root\client\src", "$root\client\index.html", "$root\client\package.json" -Recurse -File |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not (Test-Path $dist) -or $newestSource.LastWriteTime -gt (Get-Item $dist).LastWriteTime) {
  Write-Host 'Building the website...' -ForegroundColor Yellow
  Push-Location "$root\client"; npm run build | Out-Null; $built = $LASTEXITCODE; Pop-Location
  if ($built -ne 0) { Write-Host 'Website build failed - see the messages above.' -ForegroundColor Red; return }
}

# 5. Start the server (website + API). Links inside emails use this PC's network address.
$lanIp = @(Get-LanAddresses) | Select-Object -First 1
$siteUrl = if ($lanIp) { "http://${lanIp}:$port" } else { "http://localhost:$port" }
New-Item -ItemType Directory -Force "$root\logs" | Out-Null
# Keep the previous run's log (server.log is rewritten on every start); history.log is capped at ~5 MB
foreach ($name in 'server.log', 'server-error.log') {
  $log = "$root\logs\$name"
  if ((Test-Path $log) -and (Get-Item $log).Length -gt 0) {
    $history = "$root\logs\history.log"
    if ((Test-Path $history) -and (Get-Item $history).Length -gt 5MB) { Move-Item $history "$history.old" -Force }
    Add-Content -Path $history -Value "===== $name before start at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =====" -Encoding utf8
    Get-Content $log | Add-Content -Path $history -Encoding utf8
  }
}
# Old bookmarks used http://localhost:5173 - serve that port too when it is free
$alsoPort = if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { '' } else { '5173' }
$nodeExe = (Get-Command node).Source
if ($Hidden) {
  $env:PUBLIC_SITE_URL = $siteUrl
  $env:CLIENT_URL = "http://localhost:$port,http://localhost:5173"
  $env:ALSO_PORT = $alsoPort
  Start-Process -FilePath $nodeExe -ArgumentList 'server.js' -WorkingDirectory "$root\server" -WindowStyle Hidden `
    -RedirectStandardOutput "$root\logs\server.log" -RedirectStandardError "$root\logs\server-error.log"
} else {
  $nodeDir = Split-Path $nodeExe
  $cmd = "`$host.UI.RawUI.WindowTitle='ShopEase (close this window to stop)'; `$env:Path='$nodeDir;' + `$env:Path; " +
    "`$env:PUBLIC_SITE_URL='$siteUrl'; `$env:CLIENT_URL='http://localhost:$port,http://localhost:5173'; `$env:ALSO_PORT='$alsoPort'; " +
    "Set-Location '$root\server'; node server.js 2>&1 | Tee-Object -FilePath '$root\logs\server.log'"
  Start-Process powershell -ArgumentList '-NoExit', '-Command', $cmd
}

# 6. Wait until it answers, then open the browser
Write-Host 'Starting ShopEase...' -ForegroundColor Yellow
for ($i = 0; $i -lt 90; $i++) {
  if (Test-Url "http://localhost:$port/api/health") { break }
  Start-Sleep 2
}
if (-not (Test-Url "http://localhost:$port/api/health")) {
  Write-Host "ShopEase did not start. Check logs\server.log" -ForegroundColor Red
  return
}
if (-not $Hidden) { Show-Urls }
Start-PublicLink
if (-not $NoBrowser) { Start-Process "http://localhost:$port" }
