@echo off
REM Deletes the local database and uploaded images so sample data is loaded fresh on the next start.
echo This deletes all orders, users and changes in the local ShopEase database.
set /p ok=Type YES to continue:
if /i not "%ok%"=="YES" (
  echo Cancelled.
  pause
  exit /b
)
REM Stop ShopEase first - the database files are locked while it runs
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
if exist "%~dp0server\.data" rmdir /s /q "%~dp0server\.data"
if exist "%~dp0server\uploads" rmdir /s /q "%~dp0server\uploads"
echo Local data deleted. Run start.bat (or sign in again if auto-start is on) to start with fresh sample data.
pause
