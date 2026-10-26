@echo off
REM Double-click to set up real email sending (Gmail / any SMTP) for ShopEase
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-email.ps1"
pause
