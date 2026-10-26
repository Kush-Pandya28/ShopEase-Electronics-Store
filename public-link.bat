@echo off
REM Shows the current public link of ShopEase (opens from any network / mobile data) and copies it.
REM Starts the link if it is not running yet.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-public-link.ps1"
pause
