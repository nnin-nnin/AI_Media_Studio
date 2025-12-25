import prisma from '../src/server/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
    console.log("🚀 Starting Resource Migration...");

    const uploadsDir = path.join(__dirname, '../data/uploads');
    const systemAvatarsDir = path.join(__dirname, '../src/renderer/assets/system/avatars');

    // 1. Move files
    const files = fs.readdirSync(uploadsDir);
    const avatarFiles = files.filter(f => f.startsWith('avatar_'));

    for (const file of avatarFiles) {
        const oldPath = path.join(uploadsDir, file);
        const newPath = path.join(systemAvatarsDir, file);

        console.log(`📦 Moving ${file} to system assets...`);
        fs.renameSync(oldPath, newPath);
    }

    // 2. Update Database Records
    const characters = await prisma.character.findMany();
    let updatedCount = 0;

    for (const char of characters) {
        if (char.avatar && char.avatar.includes('/uploads/avatar_')) {
            const filename = path.basename(char.avatar);
            const newAvatarPath = `/assets/system/avatars/${filename}`;
            await prisma.character.update({
                where: { id: char.id },
                data: { avatar: newAvatarPath }
            });
            console.log(`🔗 Updated DB path for [${char.name}]: ${newAvatarPath}`);
            updatedCount++;
        }
    }

    console.log(`\n✨ Migration complete! Moved ${avatarFiles.length} files and updated ${updatedCount} DB records.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
