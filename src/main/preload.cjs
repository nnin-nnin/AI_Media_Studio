// preload.cjs

const { contextBridge, ipcRenderer } = require('electron');

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // AI功能调用
  generateImage: (options) => ipcRenderer.invoke('ai-generate-image', options),
  editImage: (options) => ipcRenderer.invoke('ai-edit-image', options),
  generateVideo: (options) => ipcRenderer.invoke('ai-generate-video', options),
  
  // 文件操作
  saveImageFile: (fileName, dataURL) => ipcRenderer.invoke('save-image-file', fileName, dataURL),
  
  // 获取临时目录路径
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  
  // 读取图片文件并返回数据URL
  readImageFile: (fileName) => ipcRenderer.invoke('read-image-file', fileName)
});