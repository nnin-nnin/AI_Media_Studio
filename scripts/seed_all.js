import { seedCharacters } from './seed_characters.js';
import { seedUser } from './seed_user.js';
import prisma from '../src/server/db/database.js';

async function main() {
    console.log("🚀 Starting database seeding...");

    try {
        await seedUser();
        await seedCharacters();
        console.log("✨ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
