import config from './config.js';
import logger from './utils/logger.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';

// Import AI Service (reusing existing logic)
import AIService from './ai/ai-service.js';
import AssetStore from './asset-store.js';
import VoiceChatService from './voice-chat-service.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger.js';
import taskManager from './utils/task-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(path.join(UPLOADS_DIR, 'temp'))) {
    fs.mkdirSync(path.join(UPLOADS_DIR, 'temp'), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({ dest: path.join(UPLOADS_DIR, 'temp') }); // Temporary storage for ASR

logger.info("Starting server...", { env: config.env, port: config.port });
console.log("[Config Debug] Loaded config:", JSON.stringify({
    env: config.env,
    skipAuth: config.auth.skipAuth,
    dbPath: config.db.path,
    hasArkKey: !!config.ai.arkApiKey,
    hasDecartKey: !!config.ai.decartApiKey
}, null, 2));

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for image/audio data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    logger.info("Incoming Request", { method: req.method, url: req.url, ip: req.ip });
    next();
});

// Static files (Frontend)
const rendererPath = path.join(PROJECT_ROOT, 'src', 'renderer');
const distPath = path.join(PROJECT_ROOT, 'dist');
const assetsPath = path.join(rendererPath, 'assets');
console.log(`[Static] Resolving paths:
  - PROJECT_ROOT: ${PROJECT_ROOT}
  - rendererPath: ${rendererPath}
  - distPath: ${distPath}
  - assetsPath: ${assetsPath}
  - UPLOADS_DIR: ${UPLOADS_DIR}
`);

// Priority 1: Uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Priority 2: System Assets (maps /assets/xxx to root /xxx as per Vite's publicDir)
app.use(express.static(assetsPath));

// Priority 3: Built Production Frontend (dist/) if available, fallback to renderer source
if (fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
}
app.use(express.static(rendererPath));

// Debug route for uploads (only if express.static falls through)
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const fullPath = path.join(UPLOADS_DIR, filename);
    const exists = fs.existsSync(fullPath);
    logger.error("Upload 404 Debug", {
        filename,
        fullPath,
        exists,
        cwd: process.cwd()
    });
    res.status(404).json({
        error: "File not found in uploads",
        checkedPath: fullPath,
        exists
    });
});

// Debug route for system assets
app.get(/^\/system\/(.*)/, (req, res) => {
    const relativePath = req.params[0];
    const fullPath = path.join(assetsPath, 'system', relativePath);
    const exists = fs.existsSync(fullPath);
    logger.error("System Asset 404 Debug", {
        relativePath,
        fullPath,
        exists
    });
    res.status(404).json({
        error: "System asset not found",
        checkedPath: fullPath,
        exists
    });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- System Config ---
/**
 * @openapi
 * /api/config:
 *   get:
 *     summary: Get server configuration
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server configuration loaded
 */
function maskKey(val) {
    if (!val || val.length < 8) return val ? '****' : '';
    return `${val.slice(0, 4)}****${val.slice(-4)}`;
}

function updateDotEnvFile(updates) {
    const envPath = path.join(PROJECT_ROOT, '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    } else {
        content = 'PORT=3000\nNODE_ENV=development\nDEBUG=true\nSKIP_AUTH=true\nUSE_REDIS_QUEUE=false\nDATABASE_URL="file:../data/ai_course.sqlite"\n';
    }

    const lines = content.split(/\r?\n/);
    const updatedKeys = new Set();

    const newLines = lines.map(line => {
        const match = line.match(/^([A-Z0-9_]+)\s*=/);
        if (match && Object.prototype.hasOwnProperty.call(updates, match[1])) {
            const key = match[1];
            updatedKeys.add(key);
            return `${key}=${updates[key]}`;
        }
        return line;
    });

    for (const [key, val] of Object.entries(updates)) {
        if (!updatedKeys.has(key)) {
            newLines.push(`${key}=${val}`);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n').replace(/\n+$/, '\n'), 'utf8');
}

app.get('/api/config', (req, res) => {
    res.json({
        debugMode: config.debug,
        decartApiKey: process.env.DECART_API_KEY || config.ai.decartApiKey,
        hasArkKey: !!(process.env.ARK_API_KEY || config.ai.arkApiKey),
        hasDashscopeKey: !!(process.env.DASHSCOPE_API_KEY || config.ai.dashscopeApiKey),
        skipAuth: config.auth.skipAuth && config.env === 'development'
    });
});

app.get('/api/settings/keys', (req, res) => {
    const ark = process.env.ARK_API_KEY || '';
    const dashscope = process.env.DASHSCOPE_API_KEY || '';
    const decart = process.env.DECART_API_KEY || '';
    const cosId = process.env.TENCENT_SECRET_ID || '';
    const cosKey = process.env.TENCENT_SECRET_KEY || '';
    const cosBucket = process.env.TENCENT_COS_BUCKET || '';
    const cosRegion = process.env.TENCENT_COS_REGION || 'ap-beijing';

    res.json({
        status: 'success',
        keys: {
            ARK_API_KEY: { configured: !!ark, masked: maskKey(ark) },
            DASHSCOPE_API_KEY: { configured: !!dashscope, masked: maskKey(dashscope) },
            DECART_API_KEY: { configured: !!decart, masked: maskKey(decart) },
            TENCENT_SECRET_ID: { configured: !!cosId, masked: maskKey(cosId) },
            TENCENT_SECRET_KEY: { configured: !!cosKey, masked: maskKey(cosKey) },
            TENCENT_COS_BUCKET: { configured: !!cosBucket, value: cosBucket },
            TENCENT_COS_REGION: { configured: !!cosRegion, value: cosRegion }
        }
    });
});

app.post('/api/settings/keys', (req, res) => {
    try {
        const allowedKeys = [
            'ARK_API_KEY',
            'DASHSCOPE_API_KEY',
            'DECART_API_KEY',
            'TENCENT_SECRET_ID',
            'TENCENT_SECRET_KEY',
            'TENCENT_COS_BUCKET',
            'TENCENT_COS_REGION'
        ];
        const updates = {};
        for (const k of allowedKeys) {
            if (typeof req.body[k] === 'string' && req.body[k].trim() !== '') {
                const cleanVal = req.body[k].trim();
                updates[k] = cleanVal;
                process.env[k] = cleanVal;
            }
        }

        // Sync runtime config object
        if (updates.ARK_API_KEY) config.ai.arkApiKey = updates.ARK_API_KEY;
        if (updates.DASHSCOPE_API_KEY) config.ai.dashscopeApiKey = updates.DASHSCOPE_API_KEY;
        if (updates.DECART_API_KEY) config.ai.decartApiKey = updates.DECART_API_KEY;
        if (updates.TENCENT_SECRET_ID) config.ai.tencent.secretId = updates.TENCENT_SECRET_ID;
        if (updates.TENCENT_SECRET_KEY) config.ai.tencent.secretKey = updates.TENCENT_SECRET_KEY;
        if (updates.TENCENT_COS_BUCKET) config.ai.tencent.bucket = updates.TENCENT_COS_BUCKET;
        if (updates.TENCENT_COS_REGION) config.ai.tencent.region = updates.TENCENT_COS_REGION;

        if (Object.keys(updates).length > 0) {
            updateDotEnvFile(updates);
        }

        res.json({
            status: 'success',
            message: 'API 密钥已保存并立即生效',
            updated: Object.keys(updates)
        });
    } catch (e) {
        logger.error("Save API Keys Error", { error: e.message });
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// --- System Config ---


// 2. Simple In-Memory Rate Limiter
const rateLimit = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    const record = rateLimit.get(ip) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
        // Reset
        record.count = 1;
        record.startTime = now;
    } else {
        record.count++;
    }

    rateLimit.set(ip, record);

    if (record.count > maxRequests) {
        logger.warn("Rate limit exceeded", { ip });
        return res.status(429).json({ status: 'error', message: 'Too many requests, please try again later.' });
    }
    next();
};

app.use('/api', rateLimiter);

// --- Protected Routes (Disabled / Single User Mode) ---
app.use('/api', (req, res, next) => {
    // Default user for all actions
    req.user = { id: 1, username: 'default-user' };
    next();
});

// --- Asset Routes ---
app.get('/api/assets', async (req, res) => {
    res.json(await AssetStore.getAll());
});

app.post('/api/assets', async (req, res) => {
    try {
        const asset = await AssetStore.add(req.body);
        res.json({ status: 'success', asset });
    } catch (e) {
        logger.error("Save Asset Error", { error: e.message });
        res.status(400).json({ status: 'error', message: e.message });
    }
});

app.delete('/api/assets/:id', async (req, res) => {
    try {
        await AssetStore.delete(req.params.id);
        res.json({ status: 'success' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// --- AI Routes ---
app.get('/api/ai/tasks/active', (req, res) => {
    res.json({ status: 'success', activeTasks: taskManager.getActive() });
});

app.post('/api/ai/image', async (req, res) => {
    try {
        taskManager.begin('face-swap');
        logger.info("Generating Image", { options: req.body });
        const result = await AIService.generateImage(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Image Gen Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        taskManager.end('face-swap');
    }
});

app.post('/api/ai/edit-image', async (req, res) => {
    try {
        taskManager.begin('face-swap');
        logger.info("Editing Image", { options: req.body });
        const result = await AIService.editImage(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Edit Image Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        taskManager.end('face-swap');
    }
});

// --- Async AI Generation (Queue) ---
import { addVideoJob, addVoiceJob, videoQueue, voiceQueue } from './queue/index.js';

app.post('/api/ai/video', async (req, res) => {
    try {
        // Enforce UserId
        const jobData = { ...req.body, userId: req.user.id };

        logger.info("[Queue] Submitting Video Job", { user: req.user.id });
        const job = await addVideoJob(jobData);

        // Return 202 Accepted immediately
        res.status(202).json({
            status: 'pending',
            jobId: job.id,
            message: 'Video generation started successfully. Check "My Assets" later.'
        });
    } catch (error) {
        logger.error("Video Queue Error", { error: error.message });
        res.status(500).json({ status: 'error', message: "Failed to queue video task. Ensure Redis is running." });
    }
});

app.post('/api/ai/voice', async (req, res) => {
    try {
        const jobData = { ...req.body, userId: req.user.id };

        logger.info("[Queue] Submitting Voice Clone Job", { user: req.user.id });
        const job = await addVoiceJob(jobData);

        res.status(202).json({
            status: 'pending',
            jobId: job.id,
            message: 'Voice cloning started successfully. Check "My Assets" later.'
        });
    } catch (error) {
        logger.error("Voice Queue Error", { error: error.message });
        res.status(500).json({ status: 'error', message: "Failed to queue voice task. Ensure Redis is running." });
    }
});

app.get('/api/ai/jobs/:id', async (req, res) => {
    try {
        const jobId = req.params.id;

        // Check Video Queue first
        let job = await videoQueue.getJob(jobId);

        // Check Voice Queue if not found
        if (!job) {
            job = await voiceQueue.getJob(jobId);
        }

        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Job not found' });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        res.json({
            status: state === 'completed' ? 'success' : (state === 'failed' ? 'error' : 'pending'),
            state: state,
            result: result,
            error: failedReason
        });
    } catch (error) {
        logger.error("Get Job Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/ai/models', async (req, res) => {
    try {
        const { type } = req.query;
        const result = await AIService.listModels(type);
        res.json(result);
    } catch (error) {
        logger.error("List Models API Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// --- Voice Chat Character Routes ---
app.get('/api/ai/characters', async (req, res) => {
    try {
        const { category } = req.query;
        const characters = await VoiceChatService.listCharacters(category);
        res.json({ status: 'success', data: characters });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/characters', async (req, res) => {
    try {
        const newChar = await VoiceChatService.createCharacter(req.body);
        res.json({ status: 'success', data: newChar });
    } catch (error) {
        logger.error("Create Character Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/character-voice', async (req, res) => {
    try {
        const { characterId, text, speed, sampleRate } = req.body;
        const result = await VoiceChatService.generateCharacterVoice(characterId, text, { speed, sampleRate });

        if (result.audio_url) {
            await AssetStore.add({
                userId: req.user.id,
                type: 'audio',
                url: result.audio_url,
                prompt: `[${result.characterName}] ${result.text}`,
                metadata: JSON.stringify({ characterId, source: 'voice-chat' })
            });
        }

        res.json(result);
    } catch (error) {
        logger.error("Character Voice Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/stt', upload.single('audio'), async (req, res) => {
    logger.info("STT Route Hit", { hasFile: !!req.file });
    try {
        taskManager.begin('voice-chat');
        if (!req.file) throw new Error("No file uploaded");

        logger.info("Processing STT upload", { filename: req.file.filename });
        const result = await AIService.speechToText(req.file.path);

        // Cleanup temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json(result);
    } catch (error) {
        logger.error("STT API Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        taskManager.end('voice-chat');
    }
});



// Start Server
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(config.port, '0.0.0.0', async () => {
        logger.info(`Server running`, { url: `http://localhost:${config.port}`, frontend: rendererPath });
    });
}

export default app;

