import axios from 'axios';
import path from 'path';
import db from './db/database.js'; // Prisma Client
import storageProvider from './storage/local-storage.js';

class AssetStore {
    constructor() {
        // No caching needed, DB is the source of truth
    }

    /**
     * Add an asset. Downloads the URL to local storage.
     * @param {Object} asset - { type, url, prompt, metadata, userId }
     */
    async add(asset) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        let finalUrl;

        // If URL is already local (starts with /uploads/), use it directly
        // to avoid re-downloading or broken links (since downloadAndSave skips /uploads/)
        if (asset.url && asset.url.startsWith('/uploads/')) {
            finalUrl = asset.url;
        } else {
            const ext = this.getExtension(asset.url) || 'png';
            const filename = `${id}.${ext}`;

            // Download and Save via Provider
            await this.downloadAndSave(asset.url, filename);
            finalUrl = storageProvider.getPublicUrl(filename);
        }

        const newAssetData = {
            id,
            type: asset.type,
            url: finalUrl, // Public URL
            prompt: asset.prompt || '',
            created_at: BigInt(Date.now()), // Prisma schema uses BigInt for timestamp compatibility
            user_id: asset.userId ? parseInt(asset.userId) : null
        };

        // Save to DB
        await db.asset.create({ data: newAssetData });

        console.log(`[AssetStore] Saved asset: ${id} (${asset.type})`);

        // Return object with serializable BigInt
        return {
            ...newAssetData,
            created_at: Number(newAssetData.created_at)
        };
    }

    async delete(id) {
        const asset = await db.asset.findUnique({ where: { id } });
        if (!asset) return false;

        // Delete from storage
        if (asset.url) {
            const filename = path.basename(asset.url);
            await storageProvider.delete(filename);
        }

        await db.asset.delete({ where: { id } });
        return true;
    }

    async getAll() {
        const assets = await db.asset.findMany({
            orderBy: { created_at: 'desc' }
        });

        // Serialize BigInt
        return assets.map(a => ({
            ...a,
            created_at: Number(a.created_at)
        }));
    }

    // --- Helpers ---

    async downloadAndSave(url, filename) {
        if (!url) throw new Error("URL is required");

        // Data URL
        if (url.startsWith('data:')) {
            const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                await storageProvider.save(filename, buffer);
                return;
            }
        }

        // Local path check - if it's already in our /uploads/ dir, we don't need to download it
        if (url.startsWith('/uploads/')) {
            return;
        }

        // Remote URL (Stream)
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        await storageProvider.save(filename, response.data);
    }

    getExtension(url) {
        if (!url) return 'png';
        if (url.startsWith('data:image/jpeg')) return 'jpg';
        if (url.startsWith('data:image/png')) return 'png';
        if (url.startsWith('data:video/mp4')) return 'mp4';
        if (url.startsWith('data:audio/')) return 'mp3'; // Simplify

        // Try from URL
        try {
            // Handle relative URLs like /uploads/file.mp3
            if (url.startsWith('/')) {
                return path.extname(url).substring(1);
            }
            const pathname = new URL(url).pathname;
            return path.extname(pathname).substring(1);
        } catch (e) {
            return null;
        }
    }
}

export default new AssetStore();
