@echo off
title KPOINT SIMPLE TRADES - Push to GitHub (kpointsimpletrades)
echo =========================================================================
echo   KPOINT SIMPLE TRADES // GREEN ^& BLACK 4H RSI + MACD TERMINAL (1:1 R:R)
echo   Repository: https://github.com/kazzo-program/kpointsimpletrades
echo =========================================================================
echo.
cd /d "%~dp0"

git remote remove kpointsimpletrades 2>nul
git remote add kpointsimpletrades https://github.com/kazzo-program/kpointsimpletrades.git

echo Pushing to kpointsimpletrades...
git push -u kpointsimpletrades HEAD:main --force
if %ERRORLEVEL% equ 0 (
    echo [OK] Successfully synced to kpointsimpletrades on GitHub!
) else (
    echo [ERROR] Failed to push to kpointsimpletrades. Make sure https://github.com/kazzo-program/kpointsimpletrades exists.
)
echo.
pause
