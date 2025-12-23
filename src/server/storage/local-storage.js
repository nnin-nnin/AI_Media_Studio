import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project Root is ../../../ relative to src/server/storage
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

class LocalStorageProvider {
    constructor() {
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    }

    /**
     * Save a buffer or stream to storage
     * @param {string} filename 
     * @param {Buffer|Stream} data 
     */
    async save(filename, data) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (Buffer.isBuffer(data)) {
            fs.writeFileSync(filePath, data);
        } else if (data && typeof data.pipe === 'function') {
            // Stream
            const writer = fs.createWriteStream(filePath);
            data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } else {
            throw new Error("Unsupported data type for save");
        }
    }

    async delete(filename) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }

    getPublicUrl(filename) {
        return `/uploads/${filename}`;
    }
}

export default new LocalStorageProvider();
