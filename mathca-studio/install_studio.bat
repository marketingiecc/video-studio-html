@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Cai dat MathCA Video Studio Pro
color 0a

echo =======================================================
echo       CAI DAT MATHCA VIDEO STUDIO PRO
echo =======================================================
echo.

set "NODE_OK=0"
where node >nul 2>nul
if not errorlevel 1 (
    node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)" >nul 2>nul
    if not errorlevel 1 set "NODE_OK=1"
)

if "%NODE_OK%"=="0" (
    echo [INFO] Dang cai Node.js LTS 22 tro len...
    where winget >nul 2>nul
    if errorlevel 1 (
        echo [LOI] May chua co Node.js 22+ va khong tim thay Winget.
        echo Vui long cai Node.js LTS tu https://nodejs.org roi chay lai file nay.
        pause
        exit /b 1
    )

    winget upgrade --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements --silent >nul 2>nul
    if errorlevel 1 (
        winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements --silent
    )

    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    where node >nul 2>nul
    if errorlevel 1 (
        echo [LOI] Node.js da duoc cai nhung PATH chua cap nhat.
        echo Hay dong cua so nay, mo lai va chay start_studio.bat.
        pause
        exit /b 1
    )
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)" >nul 2>nul
if errorlevel 1 (
    echo [LOI] MathCA Studio can Node.js 22 tro len.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay npm di kem Node.js.
    pause
    exit /b 1
)

echo [1/2] Dang cai cac thanh phan cua Studio...
call npm ci
if errorlevel 1 (
    echo [LOI] Khong the cai cac thu vien cua Studio.
    pause
    exit /b 1
)

echo.
echo [2/2] Dang chuan bi bo render cuc bo...
call npm run setup
if errorlevel 1 (
    echo [LOI] Khong the chuan bi bo render. Kiem tra ket noi Internet va chay lai.
    pause
    exit /b 1
)

echo.
echo [OK] Cai dat hoan tat. Tu lan sau chi can mo start_studio.bat.
if /I "%~1"=="/auto" exit /b 0
pause
