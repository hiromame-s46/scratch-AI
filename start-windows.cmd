@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"
title Scratch AI - Windows Start

if not exist node_modules (
    echo 先にsetup-windows.cmdを実行してください。
    pause
    exit /b 1
)

echo Scratch AIを起動しています...
echo 起動後、ブラウザで http://localhost:5173/ を開いてください。
echo 終了するには、この画面でCtrl+Cを押してください。
echo.

call npm --workspace @scratch/scratch-gui run start -- --host 127.0.0.1 --port 5173
pause
