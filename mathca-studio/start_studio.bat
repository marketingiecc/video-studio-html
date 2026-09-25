@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title MathCA Video Studio Pro
color 0b

echo =======================================================
echo          MATHCA VIDEO STUDIO PRO (HYPERFRAMES)
echo   Phan mem Truc quan Bien tap va Xuat Video MathCA 9:16
echo =======================================================
echo.

set "NODE_OK=0"
where node >nul 2>nul
if not errorlevel 1 (
    node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)" >nul 2>nul
    if not errorlevel 1 set "NODE_OK=1"
)

if "%NODE_OK%"=="0" (
    echo [INFO] May chua co Node.js 22+. Dang mo trinh cai dat...
    call install_studio.bat /auto
    if errorlevel 1 exit /b 1
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay npm. Hay chay install_studio.bat.
    pause
    exit /b 1
)

if not exist "node_modules\hyperframes\bin\hyperframes.mjs" (
    echo [INFO] Dang cai dat cac thanh phan con thieu...
    call npm ci
    if errorlevel 1 (
        echo [LOI] Cai dat thu vien that bai.
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Dang kiem tra bo render cuc bo va khoi dong Studio...
echo [INFO] Lan chay dau co the mat vai phut de tai trinh duyet render.
echo.
powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.InterfaceAlias -notmatch 'vEthernet|Loopback|VMnet|Tailscale' } | Select-Object -ExpandProperty IPAddress -First 1); if($ip){ Write-Host '  ➜ LINK MANG LAN (Cho may khac truy cap): http://'$ip':3300' -ForegroundColor Green; Write-Host '' }"

start "" powershell -NoProfile -WindowStyle Hidden -Command "$url='http://localhost:3300'; for($i=0; $i -lt 180; $i++){ try { Invoke-WebRequest -UseBasicParsing -Uri ($url + '/api/health') -TimeoutSec 1 | Out-Null; Start-Process $url; break } catch { Start-Sleep -Seconds 1 } }"
call npm start

if errorlevel 1 (
    echo.
    echo [LOI] Studio da dung bat thuong. Xem thong bao phia tren.
)
pause
