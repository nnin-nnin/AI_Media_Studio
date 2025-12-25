import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

async function cleanupAssets() {
    console.log(`Cleaning up assets in ${UPLOADS_DIR}...`);

    const assets = await prisma.asset.findMany();
    console.log(`Found ${assets.length} assets in database.`);

    let deletedCount = 0;

    for (const asset of assets) {
        if (!asset.url) continue;

        if (asset.url.startsWith('/uploads/')) {
            const filename = asset.url.replace('/uploads/', '');
            const filePath = path.join(UPLOADS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                console.log(`[DELETE] Asset ${asset.id} - File missing: ${asset.url}`);
                await prisma.asset.delete({
                    where: { id: asset.id }
                });
                deletedCount++;
            }
        }
    }

    console.log(`\nCleanup Finished:`);
    console.log(`- Deleted orphaned records: ${deletedCount}`);

    await prisma.$disconnect();
}

cleanupAssets().catch(err => {
    console.error(err);
    process.exit(1);
});
