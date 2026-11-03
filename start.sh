#!/bin/bash
# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - 本地 Web 版一键启动脚本 (Linux / POSIX)
# ==============================================================================

cd "$(dirname "$0")" || exit 1

echo "======================================================"
echo "    欢迎使用 AI 媒体工作室 (AI Media Studio) Web 版"
echo "======================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[错误] 未检测到 Node.js 运行环境！"
    echo "请先安装 Node.js 18+ (推荐: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs)"
    exit 1
fi

echo "[1/3] Node.js: $(node -v)"

if [ ! -d "node_modules" ]; then
    echo "[2/3] 安装依赖组件..."
    npm install
fi

if [ ! -d "dist" ]; then
    echo "构建前端静态资产..."
    npm run build
fi

echo "[3/3] 启动本地服务: http://localhost:3000"

if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2 && xdg-open "http://localhost:3000") &
elif command -v open >/dev/null 2>&1; then
    (sleep 2 && open "http://localhost:3000") &
fi

node src/server/server.js
