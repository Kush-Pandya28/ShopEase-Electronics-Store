@echo off
REM Stops ShopEase from starting automatically with Windows (run stop.bat to stop it right now)
powershell -NoProfile -Command ^
  "if (Get-ScheduledTask -TaskName 'ShopEase' -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName 'ShopEase' -Confirm:$false; Write-Host 'Auto-start removed.' -ForegroundColor Green } else { Write-Host 'Auto-start was not installed.' };" ^
  "$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'ShopEase.lnk'; if (Test-Path $lnk) { Remove-Item $lnk }"
pause
