#!/usr/bin/env bash
# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - 一键在线云端/服务器安装程序
# 支持系统: Ubuntu / Debian / CentOS / AlmaLinux / Rocky / Fedora / Arch / macOS
# 用法: curl -fsSL https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install.sh | bash
# ==============================================================================

set -e

# ANSI 颜色格式化
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

REPO_URL="https://github.com/nnin-nnin/AI_Media_Studio.git"
INSTALL_DIR="${AI_MEDIA_STUDIO_DIR:-$HOME/ai-media-studio}"
SERVICE_NAME="ai-media-studio"

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "==================================================================="
    echo "          AI 媒体工作室 (AI Media Studio) - 一键云端安装向导        "
    echo "       全功能 AI 图像创作、视频生成、角色互动对话与实时视觉感知        "
    echo "==================================================================="
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测是否有 sudo 权限
run_sudo() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo "$@"
    else
        log_error "系统需要管理员权限执行此操作，但未找到 sudo。"
        exit 1
    fi
}

# 检测并自动安装 Git
ensure_git() {
    if ! command -v git >/dev/null 2>&1; then
        log_info "未检测到 Git，正在自动安装..."
        if [ -f /etc/debian_version ]; then
            run_sudo apt-get update -y && run_sudo apt-get install -y git
        elif [ -f /etc/redhat-release ]; then
            run_sudo yum install -y git || run_sudo dnf install -y git
        elif [ -f /etc/arch-release ]; then
            run_sudo pacman -Sy --noconfirm git
        elif [ "$(uname)" = "Darwin" ]; then
            if command -v brew >/dev/null 2>&1; then
                brew install git
            else
                xcode-select --install || true
            fi
        else
            log_error "无法自动安装 Git，请先手动安装 Git 后重试。"
            exit 1
        fi
    fi
    log_success "Git 检查通过: $(git --version)"
}

# 检测并自动安装 Node.js (>= 18)
ensure_nodejs() {
    local install_node=false
    if ! command -v node >/dev/null 2>&1; then
        install_node=true
    else
        NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            log_warn "检测到当前 Node.js 版本 (${NODE_MAJOR}) 过低，需要 Node.js 18 或更高版本。"
            install_node=true
        fi
    fi

    if [ "$install_node" = true ]; then
        log_info "正在自动安装 Node.js 20.x (LTS)..."
        if [ -f /etc/debian_version ]; then
            run_sudo apt-get update -y && run_sudo apt-get install -y curl ca-certificates gnupg
            curl -fsSL https://deb.nodesource.com/setup_20.x | run_sudo bash -
            run_sudo apt-get install -y nodejs
        elif [ -f /etc/redhat-release ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | run_sudo bash -
            run_sudo yum install -y nodejs || run_sudo dnf install -y nodejs
        elif [ -f /etc/arch-release ]; then
            run_sudo pacman -Sy --noconfirm nodejs npm
        elif [ "$(uname)" = "Darwin" ]; then
            if command -v brew >/dev/null 2>&1; then
                brew install node@20
                brew link node@20 --force --overwrite || true
            else
                log_error "macOS 未检测到 Homebrew，请先安装 Homebrew 或前往 https://nodejs.org 下载安装 Node.js。"
                exit 1
            fi
        else
            log_error "未识别的 Linux 发行版，请先手动安装 Node.js 18+ 后重试。"
            exit 1
        fi
    fi

    log_success "Node.js 检查通过: $(node -v) (npm: $(npm -v))"
}

# 下载或更新代码仓库
setup_codebase() {
    # 如果当前目录就是工程目录，直接在当前目录安装
    if [ -f "./src/server/server.js" ] && [ -f "./package.json" ]; then
        INSTALL_DIR="$(pwd)"
        log_info "检测到当前目录即为工程目录: ${INSTALL_DIR}"
    else
        if [ -d "$INSTALL_DIR/.git" ]; then
            log_info "检测到已有代码仓库，正在同步最新版本..."
            cd "$INSTALL_DIR"
            git pull origin main || git pull origin yuandan || true
        else
            log_info "正在克隆代码仓库至: ${INSTALL_DIR} ..."
            git clone "$REPO_URL" "$INSTALL_DIR"
            cd "$INSTALL_DIR"
        fi
    fi
}

# 安装依赖与编译前端静态资源
build_project() {
    log_info "正在安装项目依赖（纯 Node.js 架构，无 Python 编译依赖）..."
    npm install

    log_info "正在构建生产环境静态资产..."
    npm run build

    log_info "初始化数据库结构..."
    npm run db:push || true
    npm run db:seed || true
}

# 配置环境变量
configure_env() {
    local env_file="$INSTALL_DIR/.env"
    if [ ! -f "$env_file" ]; then
        if [ -f "$INSTALL_DIR/.env.example" ]; then
            cp "$INSTALL_DIR/.env.example" "$env_file"
        else
            cat <<EOF > "$env_file"
PORT=3000
NODE_ENV=production
DEBUG=false
SKIP_AUTH=true
USE_REDIS_QUEUE=false
DATABASE_URL="file:./data/ai_course.sqlite"
ARK_API_KEY=
EOF
        fi
    fi

    # 如果是非交互式管道运行，跳过输入询问
    if [ -t 0 ]; then
        echo ""
        echo -e "${YELLOW}------------------------------------------------------------${NC}"
        echo -e "${BOLD}🔑 API Key 配置（可选）${NC}"
        echo "可在此处输入火山方舟 API Key，或者回车跳过，稍后在 WebUI 界面中填写。"
        echo -e "${YELLOW}------------------------------------------------------------${NC}"
        read -p "请输入火山方舟 ARK_API_KEY (直接回车跳过): " input_ark_key
        if [ -n "$input_ark_key" ]; then
            # 写入 .env
            if grep -q "^ARK_API_KEY=" "$env_file"; then
                sed -i.bak "s|^ARK_API_KEY=.*|ARK_API_KEY=${input_ark_key}|" "$env_file" && rm -f "$env_file.bak"
            else
                echo "ARK_API_KEY=${input_ark_key}" >> "$env_file"
            fi
            log_success "已成功配置火山方舟 API Key！"
        fi
    fi
}

# 获取服务器 IP
get_server_ips() {
    LOCAL_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n 1 || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
    PUBLIC_IP=$(curl -s --connect-timeout 2 https://api.ipify.org 2>/dev/null || curl -s --connect-timeout 2 https://ifconfig.me 2>/dev/null || echo "")
}

# 可选配置 Systemd 后台服务 (仅限 Linux systemd)
setup_systemd() {
    if [ "$(uname)" = "Linux" ] && command -v systemctl >/dev/null 2>&1; then
        if [ -t 0 ]; then
            echo ""
            read -p "是否将 AI 媒体工作室配置为 systemd 开机自启常驻后台服务？(Y/n): " setup_svc
            setup_svc=${setup_svc:-Y}
            if [[ "$setup_svc" =~ ^[Yy]$ ]]; then
                log_info "正在生成 systemd 服务配置文件..."
                NODE_BIN=$(command -v node)
                SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

                run_sudo bash -c "cat <<EOF > $SERVICE_FILE
[Unit]
Description=AI Media Studio Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$NODE_BIN src/server/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

                run_sudo systemctl daemon-reload
                run_sudo systemctl enable "${SERVICE_NAME}"
                run_sudo systemctl restart "${SERVICE_NAME}"
                log_success "systemd 后台服务已成功创建并启动！"
                SYSTEMD_ACTIVE=true
                return
            fi
        fi
    fi
    SYSTEMD_ACTIVE=false
}

# 打印最终成功界面
print_completion() {
    get_server_ips

    echo ""
    echo -e "${GREEN}${BOLD}===================================================================${NC}"
    echo -e "${GREEN}${BOLD}           🎉 AI 媒体工作室 (AI Media Studio) 安装成功！            ${NC}"
    echo -e "${GREEN}${BOLD}===================================================================${NC}"
    echo ""
    echo -e "  ${BOLD}访问地址：${NC}"
    echo -e "  • 本机/局域网访问: ${CYAN}http://localhost:3000${NC} 或 ${CYAN}http://${LOCAL_IP}:3000${NC}"
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "$LOCAL_IP" ]; then
        echo -e "  • 公网服务器访问: ${CYAN}http://${PUBLIC_IP}:3000${NC}"
    fi
    echo ""
    if [ "$SYSTEMD_ACTIVE" = true ]; then
        echo -e "  ${BOLD}服务管理命令（已在后台常驻）：${NC}"
        echo -e "  • 查看运行状态: ${YELLOW}sudo systemctl status ${SERVICE_NAME}${NC}"
        echo -e "  • 重启服务:     ${YELLOW}sudo systemctl restart ${SERVICE_NAME}${NC}"
        echo -e "  • 停止服务:     ${YELLOW}sudo systemctl stop ${SERVICE_NAME}${NC}"
        echo -e "  • 查看实时日志: ${YELLOW}sudo journalctl -u ${SERVICE_NAME} -f${NC}"
    else
        echo -e "  ${BOLD}手动启动命令：${NC}"
        echo -e "  cd ${INSTALL_DIR} && npm start"
        echo ""
        echo -e "  ${BOLD}或者双击启动：${NC}"
        if [ "$(uname)" = "Darwin" ]; then
            echo -e "  直接双击运行 ${CYAN}${INSTALL_DIR}/start.command${NC}"
        else
            echo -e "  执行 ${CYAN}${INSTALL_DIR}/start.sh${NC}"
        fi
    fi
    echo ""
    echo -e "  ${YELLOW}注意：云服务器用户请在控制台安全组中放行 3000 端口！${NC}"
    echo -e "${GREEN}===================================================================${NC}"
    echo ""
}

main() {
    print_banner
    ensure_git
    ensure_nodejs
    setup_codebase
    build_project
    configure_env
    setup_systemd
    print_completion
}

main "$@"
