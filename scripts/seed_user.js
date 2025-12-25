import prisma from '../src/server/db/database.js';

export async function seedUser() {
    console.log("🌱 Seeding Default User...");

    const user = {
        id: 1,
        username: "default-user",
        password_hash: "system-managed" // Single user mode, no login required
    };

    await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
    });

    // Reset autoincrement sequence if necessary (Dialect specific, usually not needed for upsert)
    console.log(`✅ User [${user.username}] (ID: ${user.id}) synced.`);
}
