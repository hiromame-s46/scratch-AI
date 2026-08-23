@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"
title Scratch AI - Windows Setup

echo ========================================
echo   Scratch AI Windows Setup
echo ========================================
echo.

if not exist package.json (
    echo [ERROR] package.jsonが見つかりません。
    echo このファイルをscratch-AIフォルダの中で実行してください。
    goto :fail
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.jsが見つかりません。
    echo https://nodejs.org/en/download/ からNode.js v24.19.0 LTSをインストールしてください。
    goto :fail
)

node -e "const major=process.versions.node.split('.')[0]; if (major !== '24') { console.error('Node.js v24が必要です。現在: v' + process.versions.node); process.exit(1); }"
if errorlevel 1 goto :fail

echo Node.jsを確認しました。
node -v
npm -v
echo.

echo [1/7] 依存パッケージをインストールしています...
call npm ci --no-audit --no-fund
if errorlevel 1 goto :fail

echo [2/7] task-herderをビルドしています...
call npm --workspace @scratch/task-herder run build
if errorlevel 1 goto :fail

echo [3/7] scratch-storageをビルドしています...
call npm --workspace @scratch/scratch-storage run build
if errorlevel 1 goto :fail

echo [4/7] scratch-svg-rendererをビルドしています...
call npm --workspace @scratch/scratch-svg-renderer run build
if errorlevel 1 goto :fail

echo [5/7] scratch-renderをビルドしています...
call npm --workspace @scratch/scratch-render run build
if errorlevel 1 goto :fail

echo [6/7] scratch-vmをビルドしています...
call npm --workspace @scratch/scratch-vm run build
if errorlevel 1 goto :fail

echo [7/7] Scratch GUIをビルドしています...
call npm --workspace @scratch/scratch-gui run build
if errorlevel 1 goto :fail

echo.
echo セットアップが完了しました。
echo start-windows.cmdをダブルクリックすると起動できます。
pause
exit /b 0

:fail
echo.
echo セットアップに失敗しました。
echo 表示されたエラーを確認してください。
pause
exit /b 1
