# ==============================================================================
# AI 媒体工作室 (AI Media Studio) - Windows 桌面客户端一键安装程序
# 用法: powershell -ExecutionPolicy ByPass -c "irm https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install-app.ps1 | iex"
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    AI 媒体工作室 (AI Media Studio) - Windows 一键安装程序 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Version = "v1.0.7"
$InstallerName = "AI.Setup.1.0.0.exe"
$DownloadUrl = "https://github.com/nnin-nnin/AI_Media_Studio/releases/download/$Version/$InstallerName"
$TempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "AI_Media_Studio_Setup.exe")

$Headers = @{}
if ($env:GITHUB_TOKEN) {
    $Headers["Authorization"] = "token $env:GITHUB_TOKEN"
} elseif ($env:GH_TOKEN) {
    $Headers["Authorization"] = "token $env:GH_TOKEN"
}

Write-Host "[INFO] 正在下载最新 Windows 安装包 ($Version)..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempPath -Headers $Headers -UseBasicParsing

Write-Host "[INFO] 正在解除 Windows SmartScreen 执行限制 (Unblock-File)..." -ForegroundColor Yellow
Unblock-File -Path $TempPath

Write-Host "[INFO] 正在启动安装向导..." -ForegroundColor Green
Start-Process -FilePath $TempPath
