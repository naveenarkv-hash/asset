@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org first, then run this file again.
  pause
  exit /b 1
)
echo Preparing the Evergreen Industries demonstration...
call npm ci --no-audit --no-fund
if errorlevel 1 (
  echo Dependency installation failed. Check the error above.
  pause
  exit /b 1
)
echo Starting the sample company. Your normal customer database will not be changed.
call npm run demo
if errorlevel 1 pause
