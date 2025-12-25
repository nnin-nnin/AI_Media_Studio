import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

async function checkAssets() {
    console.log(`Checking assets in ${UPLOADS_DIR}...`);

    const assets = await prisma.asset.findMany();
    console.log(`Found ${assets.length} assets in database.`);

    const missing = [];
    const existing = [];

    for (const asset of assets) {
        if (!asset.url) {
            console.log(`Asset ${asset.id} has no URL.`);
            continue;
        }

        if (asset.url.startsWith('/uploads/')) {
            const filename = asset.url.replace('/uploads/', '');
            const filePath = path.join(UPLOADS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                missing.push({ id: asset.id, url: asset.url, path: filePath });
            } else {
                existing.push(asset.id);
            }
        } else {
            console.log(`Asset ${asset.id} has non-standard URL: ${asset.url}`);
        }
    }

    console.log(`\nSummary:`);
    console.log(`- Total: ${assets.length}`);
    console.log(`- Existing: ${existing.length}`);
    console.log(`- Missing: ${missing.length}`);

    if (missing.length > 0) {
        console.log(`\nMissing Files:`);
        missing.forEach(m => console.log(`[${m.id}] ${m.url}`));
    }

    await prisma.$disconnect();
}

checkAssets().catch(err => {
    console.error(err);
    process.exit(1);
});
