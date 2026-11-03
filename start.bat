@echo off
chcp 65001 >nul
title AI 媒体工作室 - 本地 Web 版启动器

echo ======================================================
echo     欢迎使用 AI 媒体工作室 (AI Media Studio) Web 版
echo ======================================================
echo.

cd /d "%~dp0"

:: 检查 Node.js 环境
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 运行环境！
    echo 请前往 https://nodejs.org 下载并安装 Node.js ^(推荐 LTS 版本^)。
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [1/3] Node.js 环境检测通过: %NODE_VER%

:: 检查依赖
if not exist "node_modules\" (
    echo [2/3] 首次启动，正在安装依赖组件（请耐心等待 1-2 分钟）...
    call npm install
) else (
    echo [2/3] 本地组件依赖完整。
)

:: 检查构建产物
if not exist "dist\" (
    echo 正在构建前端静态资产...
    call npm run build
)

:: 检查并同步本地数据库
if not exist "data\ai_course.sqlite" (
    echo 首次启动，正在初始化本地数据库与预置角色...
    call npm run db:seed
)

echo [3/3] 正在启动本地服务...
echo 服务地址: http://localhost:3000
echo 正在自动为您打开默认浏览器...
echo.

start "" "http://localhost:3000"

node src/server/server.js
pause
