# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - Windows PowerShell 一键在线安装脚本
# 用法: powershell -ExecutionPolicy ByPass -c "irm https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install.ps1 | iex"
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "          AI 媒体工作室 (AI Media Studio) - 一键在线安装程序        " -ForegroundColor Cyan
Write-Host "       全功能 AI 图像创作、视频生成、角色互动对话与实时视觉感知        " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$RepoUrl = "https://github.com/nnin-nnin/AI_Media_Studio.git"
$InstallDir = Join-Path $HOME "ai-media-studio"

# 1. 检查 Node.js
Write-Host "[1/4] 检查 Node.js 运行环境..." -ForegroundColor Blue
try {
    $nodeVer = & node -v
    Write-Host "  -> Node.js 已安装: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  -> 未检测到 Node.js，正在尝试通过 winget 自动安装..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        Write-Host "  -> Node.js 安装成功，请重新开启终端运行本脚本生效。" -ForegroundColor Green
        return
    } catch {
        Write-Host "  -> 自动安装失败，请前往 https://nodejs.org 下载并安装 Node.js LTS 后重试。" -ForegroundColor Red
        return
    }
}

# 2. 检查 Git 并拉取代码
Write-Host "[2/4] 获取最新代码仓库..." -ForegroundColor Blue
if (Test-Path -Path (Join-Path $InstallDir ".git")) {
    Write-Host "  -> 发现已有代码仓库，正在同步更新..." -ForegroundColor Green
    Set-Location $InstallDir
    git pull origin main
} else {
    Write-Host "  -> 正在克隆至 $InstallDir ..." -ForegroundColor Green
    git clone $RepoUrl $InstallDir
    Set-Location $InstallDir
}

# 3. 安装依赖与构建
Write-Host "[3/4] 正在安装依赖与编译静态资产..." -ForegroundColor Blue
npm install
npm run build
npm run db:push
npm run db:seed

# 4. 配置并启动
Write-Host "[4/4] 准备就绪，正在启动服务..." -ForegroundColor Blue
$envPath = Join-Path $InstallDir ".env"
if (-not (Test-Path $envPath)) {
    $examplePath = Join-Path $InstallDir ".env.example"
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
    }
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "           🎉 AI 媒体工作室安装完成，正在打开浏览器...             " -ForegroundColor Green
Write-Host "  本地访问地址: http://localhost:3000                              " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:3000"
npm start
