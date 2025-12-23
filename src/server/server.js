import config from './config.js';
import logger from './utils/logger.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

// Import AI Service (reusing existing logic)
import AIService from './ai/ai-service.js';
import AssetStore from './asset-store.js';
import AuthService from './auth/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

logger.info("Starting server...", { env: config.env, port: config.port });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for image/audio data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    logger.info("Incoming Request", { method: req.method, url: req.url, ip: req.ip });
    next();
});

// Static files (Frontend)
const rendererPath = path.join(__dirname, '..', 'renderer');
app.use(express.static(rendererPath));

// Static files (Uploads)
const uploadsPath = path.join(__dirname, '..', '..', 'data', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- System Config ---
app.get('/api/config', (req, res) => {
    res.json({
        debugMode: config.debug,
        decartApiKey: config.ai.arkApiKey // Maintain backward compat with frontend usage
    });
});

// --- Auth Routes ---
app.get('/api/auth/ritual-session', (req, res) => {
    const nonce = AuthService.createRitualSession();
    res.json({ status: 'success', nonce });
});

app.post('/api/auth/ritual-unlock', async (req, res) => {
    try {
        const { ritualLog, nonce } = req.body;
        const result = await AuthService.verifyRitual(ritualLog, nonce);
        res.json({ status: 'success', data: result });
    } catch (e) {
        logger.error("Ritual Unlock Failed", { error: e.message });
        res.status(400).json({ status: 'error', message: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Logging is now handled by middleware or inside AuthService via logger
        const result = await AuthService.login(username, password);
        res.json({ status: 'success', data: result });
    } catch (e) {
        logger.warn("Login Failed", { username: req.body.username, error: e.message });
        res.status(401).json({ status: 'error', message: e.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AuthService.register(username, password);
        res.json({ status: 'success', data: result });
    } catch (e) {
        res.status(400).json({ status: 'error', message: e.message });
    }
});


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

// --- Protected Routes ---
// Apply verify token to all /api routes EXCEPT auth and config
app.use('/api', (req, res, next) => {
    const path = req.path || '';
    if (path.startsWith('/auth') || path === '/config') return next();
    AuthService.authenticateToken(req, res, next);
});

// --- Asset Routes ---
app.get('/api/assets', (req, res) => {
    res.json(AssetStore.getAll());
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
app.post('/api/ai/image', async (req, res) => {
    try {
        logger.info("Generating Image", { options: req.body });
        const result = await AIService.generateImage(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Image Gen Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/edit-image', async (req, res) => {
    try {
        logger.info("Editing Image", { options: req.body });
        const result = await AIService.editImage(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Image Edit Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/video', async (req, res) => {
    try {
        logger.info("Generating Video", { options: req.body });
        const result = await AIService.generateVideo(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Video Gen Error", { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/voice', async (req, res) => {
    try {
        logger.info("Cloning Voice", { options: req.body });
        const result = await AIService.cloneVoice(req.body);
        if (result.status === 'error') return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        logger.error("Voice Clone Error", { error: error.message });
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


// Start Server
app.listen(config.port, async () => {
    logger.info(`Server running`, { url: `http://localhost:${config.port}`, frontend: rendererPath });
    // REMOVED: Auto-register default student user. This is now handled by scripts/create_user.js
});

