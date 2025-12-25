import { PrismaClient } from '@prisma/client';
import path from 'path';
const prisma = new PrismaClient();

async function main() {
    console.log("🛠  Fixing Avatar Paths in Database...");

    const characters = await prisma.character.findMany();

    for (const char of characters) {
        if (char.avatar && char.avatar.includes('/uploads/avatar_')) {
            const filename = path.basename(char.avatar);
            const newAvatar = `/assets/system/avatars/${filename}`;
            await prisma.character.update({
                where: { id: char.id },
                data: { avatar: newAvatar }
            });
            console.log(`✅ Updated [${char.name}]: ${char.avatar} -> ${newAvatar}`);
        }
    }

    console.log("✨ Avatar path fix complete!");
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Fix failed:", err);
    process.exit(1);
});
