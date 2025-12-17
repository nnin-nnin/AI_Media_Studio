
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';

// Import AI Service (reusing existing logic)
import AIService from './ai/ai-service.js';
import AssetStore from './asset-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for image/audio data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Static files (Frontend)
const rendererPath = path.join(__dirname, '..', 'renderer');
app.use(express.static(rendererPath));

// Static files (Uploads)
const uploadsPath = path.join(__dirname, '..', '..', 'data', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- System Config ---
app.get('/api/config', (req, res) => {
    res.json({
        debugMode: process.env.DEBUG === 'true'
    });
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
        console.error("Save Asset Error:", e);
        res.status(500).json({ status: 'error', message: e.message });
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
        console.log("Generating Image with options:", req.body);
        const result = await AIService.generateImage(req.body);
        res.json(result);
    } catch (error) {
        console.error("Image Gen Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/edit-image', async (req, res) => {
    try {
        console.log("Editing Image with options:", req.body);
        const result = await AIService.editImage(req.body);
        res.json(result);
    } catch (error) {
        console.error("Image Edit Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/video', async (req, res) => {
    try {
        console.log("Generating Video with options:", req.body);
        const result = await AIService.generateVideo(req.body);
        res.json(result);
    } catch (error) {
        console.error("Video Gen Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/ai/voice', async (req, res) => {
    try {
        console.log("Cloning Voice with options:", req.body);
        const result = await AIService.cloneVoice(req.body);
        res.json(result);
    } catch (error) {
        console.error("Voice Clone Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Helper to manage temp files if needed, though AIService handles its own.

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Frontend served from: ${rendererPath}`);
});
