const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
    isElectron: true,
    platform: process.platform,
    versions: {
        chrome: process.versions.chrome,
        node: process.versions.node,
        electron: process.versions.electron
    }
});
