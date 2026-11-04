#!/usr/bin/env bash
# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - macOS 桌面客户端一键安装程序
# 用法: curl -fsSL https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install-app.sh | bash
# ==============================================================================

set -e

# ANSI 颜色格式化
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}"
echo "=========================================================="
echo "    AI 媒体工作室 (AI Media Studio) - macOS 一键安装程序   "
echo "=========================================================="
echo -e "${NC}"

if [ "$(uname)" != "Darwin" ]; then
    echo -e "${RED}[ERROR] 此脚本专用于 macOS 系统。${NC}"
    echo "Windows 用户请使用: powershell -c \"irm https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install-app.ps1 | iex\""
    exit 1
fi

# 1. 架构检测 (Apple Silicon vs Intel)
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo -e "${BLUE}[INFO]${NC} 检测到 Apple Silicon (M 系列芯片: arm64)"
    DMG_FILENAME="AI.-1.0.0-arm64.dmg"
else
    echo -e "${BLUE}[INFO]${NC} 检测到 Intel x86_64 处理器"
    DMG_FILENAME="AI.-1.0.0.dmg"
fi

VERSION="v1.0.7"
DOWNLOAD_URL="https://github.com/nnin-nnin/AI_Media_Studio/releases/download/${VERSION}/${DMG_FILENAME}"
TEMP_DMG="/tmp/AI_Media_Studio_${VERSION}.dmg"
MOUNT_POINT="/tmp/ai_media_studio_mount_$$"

# 支持带 Token 的下载 (适用于私有仓库)
CURL_AUTH=()
if [ -n "$GITHUB_TOKEN" ]; then
    CURL_AUTH=(-H "Authorization: token $GITHUB_TOKEN")
elif [ -n "$GH_TOKEN" ]; then
    CURL_AUTH=(-H "Authorization: token $GH_TOKEN")
fi

echo -e "${BLUE}[INFO]${NC} 正在从 GitHub Releases 下载最新安装包 (${VERSION})..."
curl -fL "${CURL_AUTH[@]}" -o "$TEMP_DMG" "$DOWNLOAD_URL" --progress-bar

echo -e "${BLUE}[INFO]${NC} 正在挂载安装镜像并部署至 /Applications..."
mkdir -p "$MOUNT_POINT"
hdiutil attach "$TEMP_DMG" -nobrowse -mountpoint "$MOUNT_POINT" -quiet

APP_SOURCE=$(find "$MOUNT_POINT" -maxdepth 1 -name "*.app" | head -n 1)
if [ -z "$APP_SOURCE" ]; then
    echo -e "${RED}[ERROR] 挂载镜像中未找到 .app 应用程序包。${NC}"
    hdiutil detach "$MOUNT_POINT" -quiet || true
    rm -rf "$MOUNT_POINT" "$TEMP_DMG"
    exit 1
fi

APP_NAME=$(basename "$APP_SOURCE")
TARGET_PATH="/Applications/$APP_NAME"

echo -e "${BLUE}[INFO]${NC} 正在复制 $APP_NAME 到「访达 / 应用程序」..."
rm -rf "$TARGET_PATH"
cp -R "$APP_SOURCE" /Applications/

# 卸载与清理临时文件
hdiutil detach "$MOUNT_POINT" -quiet || true
rm -rf "$MOUNT_POINT" "$TEMP_DMG"

# 2. 关键步骤: 彻底清除 macOS Gatekeeper 的隔离限制 (解除'已损坏'警告)
echo -e "${BLUE}[INFO]${NC} 正在解除 macOS Gatekeeper 隔离限制..."
xattr -cr "$TARGET_PATH"

echo -e "${GREEN}${BOLD}[SUCCESS] AI 媒体工作室已成功安装至 /Applications！${NC}"
echo -e "${GREEN}[INFO] 正在为您启动应用...${NC}"
open -a "$TARGET_PATH"
