@echo off
chcp 65001 >nul
title 反诈人生 · 启动器
echo ========================================
echo   反诈人生 一键启动
echo   游戏将运行在 http://localhost:3000/
echo   浏览器会自动打开，按 Ctrl+C 停止
echo ========================================
echo.

REM 检测端口 3000 是否被占用
powershell -NoProfile -Command "try { $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',3000); $c.Close(); Write-Output OCCUPIED } catch { Write-Output FREE }" > "%TEMP%\fz_port.txt"
set /p PORTSTATE=<"%TEMP%\fz_port.txt"
if "%PORTSTATE%"=="OCCUPIED" (
  echo [警告] 端口 3000 已被占用，可能是上一次未关闭的实例。
  echo 若游戏已可访问，请直接打开浏览器；否则请先关闭占用进程。
  echo.
)

REM 用 Node 守护进程启动（含自动重启与依赖安装）
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 https://nodejs.org 后重试。
  pause
  exit /b 1
)

start "" http://localhost:3000/
node "%~dp0daemon.js"

pause
