// main.js - 简化版

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { writeFile, mkdir, readFile } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from 'electron-squirrel-startup';

if (electronSquirrelStartup) {
  app.quit();
}

let mainWindow;
let watcher;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools for debugging in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
  
  // 设置热加载
  if (process.argv.includes('--dev')) {
    setupHotReload();
  }
  
  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (process.argv.includes('--dev')) {
        setupHotReload();
      }
    }
  });
});

// 退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 清理 watcher
    if (watcher) {
      watcher.close();
    }
    app.quit();
  }
});

// 设置热重载
function setupHotReload() {
  try {
    const chokidar = require('chokidar');
    
    // 延迟启动监听以避免初始化时的文件变更
    setTimeout(() => {
      watcher = chokidar.watch([
        path.join(__dirname, '..', 'renderer'),
        path.join(__dirname, '..', 'assets')
      ], {
        ignored: /node_modules|[/\\]\./,
        ignoreInitial: true,
        persistent: true
      });

      watcher.on('change', (filePath) => {
        console.log('文件变更:', filePath);
        // 重新加载页面
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reloadIgnoringCache();
        }
      });

      watcher.on('error', (error) => {
        console.log('监视文件时出错:', error);
      });

      console.log('热重载功能已启用');
    }, 3000);
  } catch (e) {
    console.log('无法启用热重载功能:', e.message);
  }
}

// AI功能调用处理
ipcMain.handle('ai-generate-image', async (event, options) => {
  try {
    // 动态导入AI服务模块以避免初始化问题
    const { default: AIService } = await import('./ai/ai-service.js');
    return await AIService.generateImage(options);
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
});

ipcMain.handle('ai-edit-image', async (event, options) => {
  try {
    // 动态导入AI服务模块以避免初始化问题
    const { default: AIService } = await import('./ai/ai-service.js');
    return await AIService.editImage(options);
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
});

ipcMain.handle('ai-generate-video', async (event, options) => {
  try {
    // 动态导入AI服务模块以避免初始化问题
    const { default: AIService } = await import('./ai/ai-service.js');
    return await AIService.generateVideo(options);
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
});

// 添加处理保存图片文件的IPC事件
ipcMain.handle('save-image-file', async (event, fileName, dataURL) => {
  return new Promise((resolve, reject) => {
    // 创建临时目录
    const tempDir = path.join(tmpdir(), 'ai-course');
    mkdir(tempDir, { recursive: true }, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 移除数据URL前缀
      const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = path.join(tempDir, fileName);
      
      writeFile(filePath, buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });
  });
});

// 添加处理读取图片文件的IPC事件
ipcMain.handle('read-image-file', async (event, fileName) => {
  return new Promise((resolve, reject) => {
    // 构建文件路径
    const tempDir = path.join(tmpdir(), 'ai-course');
    const filePath = path.join(tempDir, fileName);
    
    // 读取文件并转换为数据URL
    readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // 转换为数据URL格式
        const ext = path.extname(fileName).toLowerCase();
        let mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') {
          mimeType = 'image/jpeg';
        } else if (ext === '.gif') {
          mimeType = 'image/gif';
        }
        
        const dataURL = `data:${mimeType};base64,${data.toString('base64')}`;
        resolve(dataURL);
      }
    });
  });
});

// 添加获取临时目录路径的IPC事件
ipcMain.handle('get-temp-dir', async () => {
  return path.join(tmpdir(), 'ai-course');
});

// 处理来自渲染进程的重新加载请求
ipcMain.on('reload-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.reloadIgnoringCache();
  }
});