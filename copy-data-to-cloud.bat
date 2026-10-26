@echo off
REM Copies the data of this computer's ShopEase (accounts, orders, products...) to your MongoDB Atlas database.
REM ShopEase must be running here. Paste the Atlas connection string when asked.
setlocal
set "NODEDIR="
for /d %%D in ("%USERPROFILE%\nodejs-portable\node-v*") do set "NODEDIR=%%D"
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"
echo.
echo Paste your MongoDB Atlas connection string (mongodb+srv://...) and press Enter:
set /p "ATLAS="
cd /d "%~dp0server"
node scripts\copy-to-cloud.js "%ATLAS%"
if not %errorlevel% equ 2 goto done
echo.
set /p "OK=Type YES to replace the cloud data with the data from this computer: "
if /i not "%OK%"=="YES" goto done
node scripts\copy-to-cloud.js "%ATLAS%" --replace
:done
echo.
pause
