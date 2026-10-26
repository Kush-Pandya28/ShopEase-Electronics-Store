@echo off
REM Sends this project to your GitHub repository. Render then rebuilds the online store from it.
REM First time: create an EMPTY private repository on github.com and paste its address when asked.
REM Later: just double-click again after changing something - the online store updates in a few minutes.
REM Secrets stay on this computer: server\.env, the local database and logs are never uploaded (.gitignore).
setlocal
set "GITDIR=%USERPROFILE%\PortableGit\cmd"
if exist "%GITDIR%\git.exe" set "PATH=%GITDIR%;%PATH%"
where git >nul 2>&1 || (echo Git was not found. Ask for it to be installed again. & pause & exit /b 1)
cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo Paste the address of your new GitHub repository, for example
  echo    https://github.com/your-name/shopease.git
  set /p "REPO=Repository address: "
  call git remote add origin "%%REPO%%"
)

git add -A
git diff --cached --quiet || git commit -q -m "Update ShopEase %date% %time%"
echo.
echo Uploading to GitHub (a browser window may ask you to sign in the first time)...
git push -u origin main
if %errorlevel% equ 0 (
  echo.
  echo Done. Render builds the new version automatically - it is online in about 5 minutes.
) else (
  echo.
  echo Upload failed. Check the repository address and that you signed in to GitHub.
)
pause
