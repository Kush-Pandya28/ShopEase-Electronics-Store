@echo off
REM Makes ShopEase start automatically in the background every time you sign in to Windows,
REM so http://localhost:5000 always works without double-clicking start.bat. No admin rights needed.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$vbs = Join-Path '%~dp0' 'run-hidden.vbs'; $user = \"$env:USERDOMAIN\$env:USERNAME\";" ^
  "$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('\"' + $vbs + '\"') -WorkingDirectory '%~dp0';" ^
  "$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user;" ^
  "$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable;" ^
  "$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited;" ^
  "Register-ScheduledTask -TaskName 'ShopEase' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Starts the ShopEase store in the background when you sign in' -Force | Out-Null;" ^
  "Start-ScheduledTask -TaskName 'ShopEase';" ^
  "Write-Host 'Auto-start installed and ShopEase is starting now (about 30 seconds).' -ForegroundColor Green;" ^
  "Write-Host 'Open http://localhost:5000 in your browser.' -ForegroundColor Cyan"
pause
