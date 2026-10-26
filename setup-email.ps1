# ShopEase email setup: saves Gmail (or any SMTP) settings into server\.env and sends a test email.
# Your password is typed here, on your own computer, and stored only in server\.env (never committed to git).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$envFile = "$root\server\.env"

Write-Host ''
Write-Host '=== ShopEase email setup ===' -ForegroundColor Cyan
Write-Host 'Gmail is easiest. You need a Gmail "App Password" (16 letters), not your normal password:'
Write-Host '  1. Turn on 2-Step Verification:  https://myaccount.google.com/signinoptions/twosv'
Write-Host '  2. Create an App Password:       https://myaccount.google.com/apppasswords'
Write-Host '     (App name: ShopEase) and copy the 16-letter code.'
Write-Host ''

if (-not (Test-Path $envFile)) {
  Copy-Item "$root\server\.env.example" $envFile
}

$choice = Read-Host 'Use Gmail? (Y = Gmail, N = other SMTP like Outlook/Brevo/Mailtrap) [Y]'
if ($choice -match '^[nN]') {
  $smtpHost = Read-Host 'SMTP host (e.g. smtp.office365.com)'
  $smtpPort = Read-Host 'SMTP port (587 or 465) [587]'
  if (-not $smtpPort) { $smtpPort = '587' }
  $user = Read-Host 'SMTP username / email'
} else {
  $smtpHost = 'smtp.gmail.com'
  $smtpPort = '465'
  $user = Read-Host 'Your Gmail address'
}
$secure = Read-Host 'App Password (input hidden)' -AsSecureString
$pass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$pass = $pass -replace '\s', ''   # Google shows the app password in groups of 4
$adminEmail = Read-Host "Email for admin alerts (low stock) [$user]"
if (-not $adminEmail) { $adminEmail = $user }

if (-not $user -or -not $pass) {
  Write-Host 'Email and password are required. Nothing was changed.' -ForegroundColor Red
  exit 1
}

# Update or add each key in server\.env
$settings = [ordered]@{
  SMTP_HOST   = $smtpHost
  SMTP_PORT   = $smtpPort
  SMTP_USER   = $user
  SMTP_PASS   = $pass
  EMAIL_FROM  = "ShopEase <$user>"
  ADMIN_EMAIL = $adminEmail
}
$lines = [System.Collections.Generic.List[string]](Get-Content $envFile)
foreach ($key in $settings.Keys) {
  $line = "$key=$($settings[$key])"
  $idx = $lines.FindIndex([Predicate[string]] { param($l) $l -match "^\s*$key=" })
  if ($idx -ge 0) { $lines[$idx] = $line } else { $lines.Add($line) }
}
[IO.File]::WriteAllLines($envFile, $lines)
Write-Host "Saved email settings to server\.env" -ForegroundColor Green

# Node: installed or the portable copy used by start.bat
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $portable = Get-ChildItem "$env:USERPROFILE\nodejs-portable" -Directory -Filter 'node-v*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($portable) { $env:Path = "$($portable.FullName);$env:Path" }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js not found yet - run start.bat once, then run setup-email.bat again to send a test.' -ForegroundColor Yellow
  exit 0
}

$to = Read-Host "Send a test email to [$user]"
if (-not $to) { $to = $user }
Push-Location "$root\server"
node scripts/test-email.js $to
$ok = $LASTEXITCODE -eq 0
Pop-Location

Write-Host ''
if ($ok) {
  Write-Host 'Done. Restart ShopEase (close the two windows, run start.bat) so the new settings are used.' -ForegroundColor Green
} else {
  Write-Host 'The test email failed - check the message above, then run setup-email.bat again.' -ForegroundColor Red
}
