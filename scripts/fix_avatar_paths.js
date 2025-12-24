import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("🛠  Fixing Avatar Paths in Database...");

    const characters = await prisma.character.findMany();

    for (const char of characters) {
        if (char.avatar && char.avatar.startsWith('http://localhost:3000')) {
            const newAvatar = char.avatar.replace('http://localhost:3000', '');
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
