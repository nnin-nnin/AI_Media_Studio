import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Inspecting Database Content...");
    console.log("\n--- Characters ---");
    const characters = await prisma.character.findMany();
    console.table(characters, ['id', 'name', 'avatar', 'voice_id']);

    console.log("\n--- Assets (First 5) ---");
    const assets = await prisma.asset.findMany({ take: 5 });
    console.table(assets, ['id', 'type', 'url']);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
