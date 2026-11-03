#!/bin/bash
# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - 本地 Web 版一键启动脚本 (macOS)
# 双击即可自动启动本地服务并在浏览器中打开工作室
# ==============================================================================

cd "$(dirname "$0")" || exit 1

# 自动补充常见 Node 环境变量路径
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"

echo "======================================================"
echo "    欢迎使用 AI 媒体工作室 (AI Media Studio) Web 版"
echo "======================================================"
echo ""

# 检查 Node.js 环境
if ! command -v node >/dev/null 2>&1; then
    echo "[错误] 未检测到 Node.js 运行环境！"
    echo "请前往 https://nodejs.org 下载并安装 Node.js (推荐 LTS 版本)。"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

echo "[1/3] Node.js 环境检测通过: $(node -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "[2/3] 首次启动，正在安装依赖组件（请耐心等待 1-2 分钟）..."
    npm install
else
    echo "[2/3] 本地组件依赖完整。"
fi

# 检查前端构建产物
if [ ! -d "dist" ]; then
    echo "正在构建前端静态资产..."
    npm run build
fi

echo "[3/3] 正在启动本地服务..."
echo "服务地址: http://localhost:3000"
echo "正在自动为您打开默认浏览器..."
echo ""

# 异步等待服务启动后自动打开浏览器
(sleep 2 && open "http://localhost:3000") &

# 启动服务端
node src/server/server.js
