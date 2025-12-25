import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const srcServerDir = path.join(rootDir, 'src', 'server');

const uploadsPath = path.join(srcServerDir, '..', '..', 'data', 'uploads');

console.log('Project Root:', rootDir);
console.log('src/server:', srcServerDir);
console.log('Calculated Uploads Path:', uploadsPath);

if (fs.existsSync(uploadsPath)) {
    console.log('✅ Uploads directory exists.');
    const files = fs.readdirSync(uploadsPath);
    console.log(`Found ${files.length} files in uploads.`);

    const sampleFile = 'mjkuzn1aer2u7aajctc.mp4';
    const samplePath = path.join(uploadsPath, sampleFile);
    if (fs.existsSync(samplePath)) {
        console.log(`✅ Sample file ${sampleFile} exists.`);
    } else {
        console.log(`❌ Sample file ${sampleFile} NOT found.`);
    }
} else {
    console.log('❌ Uploads directory NOT found at calculated path.');
}
