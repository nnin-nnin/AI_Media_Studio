# AI Course Project - AI变身魔法：真假我是谁？

面向小学二年级学生的AI教育课程，通过互动式体验帮助儿童理解人工智能的基本概念。

## 项目概述

本项目是一个基于Electron的桌面应用程序，旨在通过多媒体和互动体验向小学生介绍AI技术。项目包含教学内容展示和AI功能演示两部分：

1. 教学内容：以幻灯片形式展示AI在人脸识别、语音合成和视频生成方面的应用
2. AI功能演示：提供图像处理、图像生成和视频生成功能的实际操作体验

## 技术架构

- **前端**: HTML/CSS/JavaScript (无框架)
- **桌面应用框架**: Electron
- **AI处理**: Node.js (纯JavaScript实现，无Python依赖)
- **API服务**: 火山引擎方舟平台

### 项目结构

```
.
├── src/
│   ├── main/           # Electron主进程代码
│   │   ├── ai/         # AI功能模块
│   │   │   ├── image-gen.js    # 图像生成模块
│   │   │   ├── video-gen.js    # 视频生成模块
│   │   │   └── ai-service.js   # AI服务封装
│   │   ├── main.js     # 主进程入口
│   │   └── preload.js  # 预加载脚本
│   └── renderer/       # 渲染进程代码（前端）
│       ├── components/ # UI组件
│       ├── pages/      # 功能页面
│       ├── assets/     # 静态资源
│       └── utils/      # 工具函数
├── docs/               # 文档
└── package.json        # 项目配置
```

## 安装与运行

### 环境要求

- Node.js >= 18
- npm >= 6

### 安装步骤

```bash
# 克隆项目
git clone <项目地址>
cd ai-course

# 安装依赖
npm install
```

### 运行项目

```bash
# 设置API密钥
export ARK_API_KEY="your_api_key_here"

# 启动应用
npm start
```

### 开发模式

```bash
# 设置API密钥
export ARK_API_KEY="your_api_key_here"

# 启动开发模式（带热重载）
npm run dev
```

## 功能模块

### 1. 人脸变脸 (Face Swap)

通过AI技术实现图像中人脸的替换和编辑。

### 2. 视频生成 (Video Generation)

根据文本描述生成相关视频内容。

### 3. 语音克隆 (Voice Cloning)

语音合成和克隆功能演示。

## API密钥配置

本项目使用火山引擎方舟平台的API服务，需要配置API密钥：

1. 注册并登录[火山引擎](https://www.volcengine.com/)
2. 获取API密钥
3. 设置环境变量:
   ```bash
   export ARK_API_KEY="your_api_key_here"
   ```

## 代码规范

- 使用ES模块语法 (import/export)
- 遵循JavaScript标准样式
- 保持代码简洁和可维护性
- 所有AI功能模块返回JSON格式结果

## 目录说明

### src/main/
Electron主进程代码，负责窗口管理、应用生命周期和AI功能调用。

### src/main/ai/
AI功能模块，包含图像和视频处理功能，所有功能都在主进程中直接调用，无需子进程通信。

### src/renderer/
前端代码，包含用户界面和交互逻辑。

### src/renderer/components/
可复用的UI组件，如头部、底部等。

### src/renderer/pages/
各功能页面的实现，包括：
- face-swap: 人脸变脸功能
- video-generation: 视频生成功能
- voice-cloning: 语音克隆功能

## 架构优势

### 纯JavaScript实现
项目完全使用JavaScript/Node.js实现，无需Python环境，降低了部署和运行的复杂性。

### 高效的进程通信
通过优化的IPC通信机制，渲染进程可以直接调用主进程中的AI功能，避免了子进程开销。

### 模块化设计
所有AI功能都封装在独立的模块中，便于维护和扩展。

## 开发指南

### 添加新功能

1. 在`src/main/ai/`中创建新的AI功能模块
2. 在`AIService`类中添加对应的方法
3. 在主进程和预加载脚本中注册新的IPC接口
4. 在前端添加调用逻辑

### 代码组织原则

1. 功能模块化：每个功能独立成模块
2. 职责分离：主进程负责系统操作和AI调用，渲染进程负责界面展示
3. 安全通信：通过Electron的IPC机制进行进程间通信
4. 环境配置：敏感信息通过环境变量配置

## 常见问题

### 启动时报错"请设置 ARK_API_KEY 玎境变量"

需要设置火山引擎API密钥：
```bash
export ARK_API_KEY="your_api_key_here"
```

### 视频生成失败

检查：
1. API密钥是否正确设置
2. 网络连接是否正常
3. 火山引擎账户是否有相关权限

## 许可证

MIT