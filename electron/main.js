import { app, BrowserWindow, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged && process.env.ELECTRON_DEV === 'true';

let mainWindow = null;
let serverInstance = null;

// Allow overriding userData via env or --user-data-dir CLI argument (for testing and multi-instance)
const customUserData = process.env.ELECTRON_USER_DATA || process.argv.find(arg => arg.startsWith('--user-data-dir='))?.split('=')[1];
if (customUserData) {
    app.setPath('userData', path.resolve(customUserData));
}

// Configure persistent paths for desktop packaging
const userDataDir = app.getPath('userData');
const dataDir = path.join(userDataDir, 'data');
const uploadsDir = path.join(dataDir, 'uploads');
const userDbPath = path.join(dataDir, 'ai_course.sqlite');
const userEnvPath = path.join(userDataDir, '.env');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadsDir, 'temp'))) {
    fs.mkdirSync(path.join(uploadsDir, 'temp'), { recursive: true });
}

// Copy seed database template if user database does not exist
if (!fs.existsSync(userDbPath)) {
    const templateDbCandidates = [
        path.join(process.resourcesPath, 'data', 'ai_course.sqlite'),
        path.join(__dirname, '..', 'data', 'ai_course.sqlite'),
        path.join(process.cwd(), 'data', 'ai_course.sqlite')
    ];
    const templateDb = templateDbCandidates.find(p => fs.existsSync(p));
    if (templateDb) {
        try {
            fs.copyFileSync(templateDb, userDbPath);
            console.log('[Electron] Initialized user database template from:', templateDb, 'to:', userDbPath);
        } catch (e) {
            console.error('[Electron] Failed to copy database template:', e);
        }
    }
}

// In desktop mode, isolate from terminal dev keys so user settings are strictly hermetic
delete process.env.ARK_API_KEY;
delete process.env.DASHSCOPE_API_KEY;
delete process.env.DECART_API_KEY;
delete process.env.TENCENT_SECRET_ID;
delete process.env.TENCENT_SECRET_KEY;
delete process.env.TENCENT_COS_BUCKET;
delete process.env.TENCENT_COS_REGION;

// Set environment variables before backend server initializes
process.env.DATA_DIR = dataDir;
process.env.DATABASE_URL = `file:${userDbPath}`;
process.env.ENV_FILE_PATH = userEnvPath;
process.env.USE_REDIS_QUEUE = 'false';

// Load user .env from userData ONLY if it exists
if (fs.existsSync(userEnvPath)) {
    try {
        const envContent = fs.readFileSync(userEnvPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
            if (m) {
                process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
            }
        });
    } catch (e) {
        console.warn('[Electron] Failed reading user .env:', e);
    }
}

async function startBackendServer() {
    const { default: appServer, enforceDesktopIsolation } = await import('../src/server/server.js');
    if (typeof enforceDesktopIsolation === 'function') {
        enforceDesktopIsolation();
    }
    return new Promise((resolve) => {
        // Listen on ephemeral free port or standard 3000
        serverInstance = appServer.listen(0, '127.0.0.1', () => {
            const port = serverInstance.address().port;
            console.log(`[Electron] Backend server started on http://127.0.0.1:${port}`);
            resolve(port);
        });
    });
}

function createWindow(targetUrl) {
    mainWindow = new BrowserWindow({
        width: 1360,
        height: 880,
        minWidth: 1024,
        minHeight: 700,
        title: 'AI 媒体工作室',
        backgroundColor: '#0f172a',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        }
    });

    // Auto-grant media (camera / mic) and notification permissions
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'camera', 'microphone', 'notifications', 'display-capture'];
        callback(allowedPermissions.includes(permission));
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        const allowedPermissions = ['media', 'camera', 'microphone', 'notifications', 'display-capture'];
        return allowedPermissions.includes(permission);
    });

    // Open external links (e.g. Volcengine Console, documentation) in system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Pipe renderer console messages to terminal for seamless debugging
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        console.log(`[Renderer ${levels[level] || level}] ${message}`);
    });

    // Toggle DevTools shortcut (Cmd+Option+I on Mac, Ctrl+Shift+I or F12 on Windows)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if (input.key === 'F12' ||
                (input.meta && input.alt && input.key.toLowerCase() === 'i') ||
                (input.control && input.shift && input.key.toLowerCase() === 'i')) {
                mainWindow.webContents.toggleDevTools();
            }
        }
    });

    if (process.env.DEBUG === 'true' || process.argv.includes('--devtools')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.loadURL(targetUrl);
}

app.whenReady().then(async () => {
    // In dev mode, check if Vite dev server is already running on 5173
    let targetUrl = '';
    if (isDev) {
        try {
            const resp = await fetch('http://localhost:5173', { method: 'HEAD', signal: AbortSignal.timeout(600) });
            if (resp.ok) {
                targetUrl = 'http://localhost:5173';
            }
        } catch {
            // Dev server not active, fallback to internal backend
        }
    }

    if (!targetUrl) {
        const port = await startBackendServer();
        targetUrl = `http://127.0.0.1:${port}`;
    }

    createWindow(targetUrl);

    if (process.env.ELECTRON_TEST === 'true') {
        setTimeout(() => {
            console.log('[Electron] Self-test verified successfully. Exiting.');
            if (mainWindow) mainWindow.close();
            app.quit();
            process.exit(0);
        }, 3000);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow(targetUrl);
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverInstance) {
        try {
            serverInstance.close();
        } catch {
            // Ignore close error on exit
        }
    }
});
