@echo off
REM Stops ShopEase (the app and its local database)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
pause
