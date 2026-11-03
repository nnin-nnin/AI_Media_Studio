#!/bin/bash
# AI 媒体工作室 - macOS 双击一键安装与启动脚本

cd "$(dirname "$0")"

echo "=================================================="
echo "   🚀 正在准备 AI 媒体工作室 (AI Media Studio)   "
echo "=================================================="

# 补充常见环境变量路径（防止双击启动时找不到 Homebrew / nvm / uv）
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
fi

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js！"
    echo "请先访问 https://nodejs.org 下载并安装 Node.js (LTS 长期支持版)，安装后再双击本脚本。"
    read -p "按回车键退出..."
    exit 1
fi

echo "✅ 已检测到 Node.js: $(node -v)"

# 2. 初始化 .env 配置文件
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已自动创建默认 .env 配置文件（稍后可在网页中直接填写 API Key）。"
    fi
fi

# 3. 安装 Node.js 依赖（首次运行时自动安装）
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装前端与后端依赖（约需 1~2 分钟）..."
    npm install --registry=https://registry.npmmirror.com || npm install
fi

# 4. 安装 Python 语音依赖（可选，用于语音对话与克隆）
if [ ! -d ".venv" ]; then
    if command -v uv &> /dev/null; then
        echo "🐍 正在通过 uv 配置 Python 语音环境..."
        uv sync || true
    elif command -v python3 &> /dev/null; then
        echo "🐍 正在配置 Python 虚拟环境..."
        python3 -m venv .venv && ./.venv/bin/pip install -i https://pypi.tuna.tsinghua.edu.cn/simple cos-python-sdk-v5 dashscope openai || true
    fi
fi

# 5. 初始化本地数据库
echo "🗄️ 正在初始化本地数据库..."
npx prisma generate
npm run db:seed

# 6. 启动服务并自动打开浏览器
echo ""
echo "🎉 启动成功！正在为您打开浏览器访问 http://localhost:5173 ..."
echo "💡 提示：进入网页后，点击左下角或右上角【⚙️ API 配置】即可直接粘贴您的 API Key！"
echo "（保持此窗口开启即可，关闭此窗口将停止网站服务）"
echo "=================================================="

(sleep 3 && open "http://localhost:5173") &
npm run dev

