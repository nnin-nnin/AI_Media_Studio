# AI Media Studio 安装与运行指南

AI 媒体工作室提供两种运行体验：**独立桌面客户端**（推荐，全内置运行时，开箱即用）与 **本地 Web 服务端**（适合开发者与私有服务器部署）。

---

## 系统运行环境要求

- **Windows**：Windows 10 / Windows 11 (64 位)
- **macOS**：macOS 12 (Monterey) 及以上版本，原生支持 Apple Silicon (M1/M2/M3/M4) 与 Intel 芯片
- **Linux**：Ubuntu 20.04+、Debian 11+、CentOS/Rocky 8+（Web 服务端模式）
- **网络需求**：能正常访问火山引擎 API 服务端点（无需梯子或海外代理）

---

## Windows 用户安装指南

### 方式一：独立桌面客户端（推荐首选，零环境依赖）

适合无需接触代码或命令行的用户，内置独立运行环境：

1. **获取安装包**：
   访问 [GitHub Releases 页面](https://github.com/nnin-nnin/AI_Media_Studio/releases) 下载最新版本文件：
   - **安装向导版**：`AI-Media-Studio Setup.exe`
   - **免安装便携版**：`AI-Media-Studio-Portable.exe`

2. **启动与安全提示**：
   - 双击文件启动；
   - 若系统弹出 Windows SmartScreen 提示“已保护你的电脑”，请点击 **更多信息**，随后点击 **仍要运行** 即可（开源软件未购买高额商业数字证书时的常规系统提示）。

3. **配置凭证**：
   首次打开会自动弹出配置引导，填入火山方舟 API Key 即可开始使用。

---

### 方式二：双击一键运行包（本地 Web 版，类似 ComfyUI 体验）

适合在浏览器中使用、免编译快速运行：

1. **环境准备**：
   确认电脑已安装 [Node.js](https://nodejs.org/)（推荐 LTS v20 或更高版本）。

2. **下载解压**：
   下载发布的 `AI_Media_Studio_Release.zip`，解压到任意本地英文路径（例如 `D:\AI_Media_Studio`）。

3. **一键启动**：
   双击文件夹中的 `start.bat`。
   - 脚本会自动检查环境依赖并拉起本地服务；
   - 启动完毕后，会自动在默认浏览器中打开 `http://localhost:3000`。

---

### 方式三：PowerShell 一键在线命令安装（自动化部署）

无需提前手动下载文件，通过终端一行命令自动完成克隆、构建与拉起：

1. 按 `Win + X` 快捷键，选择打开 **Windows PowerShell** 或 **终端**。

2. 执行以下命令：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install.ps1 | iex"
```

3. 脚本将自动检测 Node.js 运行时、拉取最新源码并完成初始化启动。

---

## macOS 用户安装指南

### 方式一：桌面客户端（DMG 镜像）

1. **下载安装包**：
   - **Apple Silicon (M 系列芯片)**：下载 `AI-Media-Studio-arm64.dmg`
   - **Intel 处理器**：下载 `AI-Media-Studio-x64.dmg`

2. **安装应用**：
   双击打开 `.dmg` 镜像，将应用图标拖入 `Applications`（应用程序）文件夹。

3. **首次打开安全权限说明**：
   若提示“无法打开，因为无法验证开发者”，请按住 `Control` 键右键点击应用图标并选择 **打开**，在弹出的系统对话框中点击 **确认打开**；或前往 **系统设置 -> 隐私与安全性**，在底部点击 **仍要打开**。

---

### 方式二：双击一键启动脚本

解压源码包后，直接双击运行根目录下的 `start.command`，终端将自动启动服务并唤起默认浏览器访问。

---

## Linux / 服务器部署指南

适用于 Linux 独立服务器部署：

```bash
curl -fsSL https://raw.githubusercontent.com/nnin-nnin/AI_Media_Studio/main/install.sh | bash
```

安装脚本支持交互式配置 systemd 服务，实现开机自启与后台自动保活。

---

## 服务凭证配置 (API Keys)

软件核心功能依托火山引擎（Volcengine）提供的基础模型，配置流程如下：

1. **核心凭证：火山方舟 API Key (`ARK_API_KEY`)**
   - 登录 [火山引擎方舟控制台](https://console.volcengine.com/ark)；
   - 复制生成的 API Key（格式如 `sk-...` 或 `c000...`）；
   - 在应用弹出的配置窗口中粘贴并点击 **保存配置**。
   - 此密钥驱动：图像生图/换脸、视频生成以及大模型对话推理。

2. **扩展凭证：火山语音服务 (可选)**
   - 若需使用原厂角色语音（如孙悟空、哪吒、敖丙原厂声线），可在 [火山语音控制台](https://console.volcengine.com/speech/service/8) 获取 `AppID` 与 `Access Token`；
   - **留空时系统将自动降级使用本地免密神经语音**，不影响正常对话体验。

---

## 常见问题与排查 (FAQ)

### 1. 启动时提示端口冲突 (Port 3000 / 5173 In Use)

说明本机已有其他 Web 服务占用了默认端口。可在命令行中指定备用端口启动：

```bash
PORT=3001 npm start
```

### 2. Node.js 版本不匹配

本系统依赖 Node.js v18 及以上版本（推荐 LTS v20+）。若在终端运行 `node -v` 低于此标准，请前往官网下载最新 LTS 版本安装覆盖。

### 3. 生成内容保存在本地何处

所有创作产物（图片、视频、录音）均持久化保存在用户系统目录中：
- Windows：`%APPDATA%\ai-media-studio`
- macOS：`~/Library/Application Support/ai-media-studio`
- 卸载或更新客户端不会删除历史生成的作品。
