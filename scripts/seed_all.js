import { seedCharacters } from './seed_characters.js';
import { seedUser } from './seed_user.js';
import prisma from '../src/server/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project Root is one level up from scripts/
const PROJECT_ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'data', 'uploads');

async function cleanupAssets() {
    console.log(`🌱 Cleaning up orphaned assets in ${UPLOADS_DIR}...`);

    const assets = await prisma.asset.findMany();
    let deletedCount = 0;

    for (const asset of assets) {
        if (!asset.url || !asset.url.startsWith('/uploads/')) continue;

        const filename = asset.url.replace('/uploads/', '');
        const filePath = path.join(UPLOADS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            console.log(`  [DELETE] Asset ${asset.id} - File missing: ${asset.url}`);
            await prisma.asset.delete({ where: { id: asset.id } });
            deletedCount++;
        }
    }
    if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} orphaned records.`);
    } else {
        console.log(`✅ No orphaned records found.`);
    }
}

async function main() {
    console.log("🚀 Starting database seeding & cleanup...");

    try {
        await seedUser();
        await seedCharacters();
        await cleanupAssets();
        console.log("✨ Seeding & Cleanup completed successfully!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
