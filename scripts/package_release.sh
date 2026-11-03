#!/bin/bash
# 一键打包纯净分发包脚本（剔除本机私有 .env 密钥、缓存及上传历史）

set -e
cd "$(dirname "$0")/.."

OUT_ZIP="AI_Media_Studio_Release.zip"
rm -f "$OUT_ZIP"

echo "📦 正在构建前端生产资源..."
npm run build

echo "🗜️ 正在生成纯净安装包: $OUT_ZIP ..."
zip -r -q "$OUT_ZIP" . \
    -x ".git/*" \
    -x ".env" \
    -x "node_modules/*" \
    -x "src/renderer/node_modules/*" \
    -x ".venv/*" \
    -x "data/uploads/*" \
    -x "data/*.sqlite*" \
    -x "data/database.db*" \
    -x "temp/*" \
    -x "temp_*" \
    -x "zi*" \
    -x "output_video.mp4" \
    -x "release/*" \
    -x ".DS_Store" \
    -x "*/.DS_Store" \
    -x "$OUT_ZIP"

echo "✅ 打包完成！文件位置: $(pwd)/$OUT_ZIP"
echo "🔒 已自动排除您的私有 .env 密钥与历史生成文件，可直接发送给老师或朋友。"

