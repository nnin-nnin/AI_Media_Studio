import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'assets.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

class AssetStore {
    constructor() {
        this.assets = this.loadDB();
    }

    loadDB() {
        try {
            if (fs.existsSync(DB_FILE)) {
                return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            }
        } catch (e) {
            console.error("Failed to load assets DB:", e);
        }
        return [];
    }

    saveDB() {
        try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.assets, null, 2));
        } catch (e) {
            console.error("Failed to save assets DB:", e);
        }
    }

    /**
     * Add an asset. Downloads the URL to local storage.
     * @param {Object} asset - { type, url, prompt, metadata }
     */
    async add(asset) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const ext = this.getExtension(asset.url) || 'png'; // Default to png
        const filename = `${id}.${ext}`;
        const localPath = path.join(UPLOADS_DIR, filename);

        // Download file
        await this.downloadFile(asset.url, localPath);

        const newAsset = {
            id,
            timestamp: Date.now(),
            type: asset.type,
            url: `/uploads/${filename}`, // Public URL
            originalUrl: asset.url,
            prompt: asset.prompt,
            metadata: asset.metadata || {}
        };

        this.assets.unshift(newAsset);
        this.saveDB();
        console.log(`[AssetStore] Saved asset: ${id} (${asset.type})`);
        return newAsset;
    }

    async delete(id) {
        const index = this.assets.findIndex(a => a.id === id);
        if (index === -1) return false;

        const asset = this.assets[index];

        // Delete local file
        if (asset.url && asset.url.startsWith('/uploads/')) {
            const filename = path.basename(asset.url);
            const localPath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }

        this.assets.splice(index, 1);
        this.saveDB();
        return true;
    }

    getAll() {
        return this.assets;
    }

    // --- Helpers ---

    async downloadFile(url, dest) {
        if (!url) throw new Error("URL is required for download");
        // If it's already a data URL, write directly
        if (url.startsWith('data:')) {
            const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                fs.writeFileSync(dest, buffer);
                return;
            }
        }

        // If it's a remote URL
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(dest);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    getExtension(url) {
        if (!url) return 'png';
        if (url.startsWith('data:image/jpeg')) return 'jpg';
        if (url.startsWith('data:image/png')) return 'png';
        if (url.startsWith('data:video/mp4')) return 'mp4';
        if (url.startsWith('data:audio/')) return 'mp3'; // Simplify

        // Try from URL
        try {
            const pathname = new URL(url).pathname;
            return path.extname(pathname).substring(1);
        } catch (e) {
            return null;
        }
    }
}

export default new AssetStore();
