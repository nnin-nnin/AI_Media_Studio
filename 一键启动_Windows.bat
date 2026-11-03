@echo off
chcp 65001 >nul
title AI 媒体工作室 (AI Media Studio)
cd /d "%~dp0"

echo ==================================================
echo    🚀 正在准备 AI 媒体工作室 (AI Media Studio)
echo ==================================================

:: 1. 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js！
    echo 请先访问 https://nodejs.org 下载并安装 Node.js ^(LTS 版本^)，安装后再双击本文件。
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node -v') do set NODE_VER=%%i
echo ✅ 已检测到 Node.js: %NODE_VER%

:: 2. 初始化 .env 配置文件
if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
        echo ✅ 已自动生成默认 .env 配置文件（稍后可在网页中直接填写 API Key）。
    )
)

:: 3. 首次运行安装 Node 依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装网站依赖（约需 1~2 分钟，请耐心等待）...
    call npm install --registry=https://registry.npmmirror.com
)

:: 4. 配置 Python 虚拟环境（可选，用于语音功能）
if not exist ".venv" (
    where uv >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🐍 正在通过 uv 同步 Python 语音环境...
        call uv sync
    ) else (
        where python >nul 2>nul
        if %errorlevel% equ 0 (
            echo 🐍 正在创建 Python 虚拟环境...
            python -m venv .venv
            call .venv\Scripts\pip install -i https://pypi.tuna.tsinghua.edu.cn/simple cos-python-sdk-v5 dashscope openai
        )
    )
)

:: 5. 初始化数据库
echo 🗄️ 正在初始化本地数据库...
call npx prisma generate
call npm run db:seed

:: 6. 自动打开浏览器并启动服务
echo.
echo 🎉 启动成功！即将为您打开浏览器访问 http://localhost:5173 ...
echo 💡 提示：进入网页后，点击页面上的【⚙️ API 配置】即可直接粘贴您的 API Key！
echo （使用过程中请勿关闭此黑色窗口）
echo ==================================================

start "" cmd /c "timeout /t 4 >nul && start http://localhost:5173"
call npm run dev
pause

