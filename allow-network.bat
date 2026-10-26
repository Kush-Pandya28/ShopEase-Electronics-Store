@echo off
REM Lets other computers / phones on the same Wi-Fi open ShopEase (http://<this-PC-IP>:5000).
REM Adds one Windows Firewall rule for port 5000 on Private networks. Asks for administrator permission once.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Asking for administrator permission...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
netsh advfirewall firewall delete rule name="ShopEase (port 5000)" >nul 2>&1
netsh advfirewall firewall add rule name="ShopEase (port 5000)" dir=in action=allow protocol=TCP localport=5000 profile=private,domain
if %errorlevel% equ 0 (
  echo.
  echo Done. Other devices on this network can now open ShopEase at http://^<this-PC-IP^>:5000
  echo Tip: your Wi-Fi must be set to "Private network" in Windows Settings ^> Network.
) else (
  echo Could not add the firewall rule.
)
pause
