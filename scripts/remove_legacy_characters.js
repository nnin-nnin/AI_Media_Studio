import prisma from '../src/server/db/database.js';

async function removeLegacyCharacters() {
    console.log("🧹 Removing legacy characters...");

    const legacyNames = [
        "璃月仙子 (Liyue Fairy)",
        "元气少女 (Genki Girl)",
        "冷酷侦探 (Cool Detective)"
    ];

    try {
        const result = await prisma.character.deleteMany({
            where: {
                name: {
                    in: legacyNames
                }
            }
        });

        console.log(`✅ Deleted ${result.count} legacy characters.`);
    } catch (error) {
        console.error("❌ Failed to delete characters:", error);
    } finally {
        await prisma.$disconnect();
    }
}

removeLegacyCharacters();
