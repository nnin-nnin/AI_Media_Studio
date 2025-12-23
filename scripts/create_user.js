import db from '../src/server/db/database.js'; // This now exports PrismaClient
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: node scripts/create_user.js <username> <password>");
    process.exit(1);
}

const [username, password] = args;

async function createUser() {
    try {
        console.log(`Setting up user: ${username} `);
        const hash = await bcrypt.hash(password, 10);

        // Upsert: Create or Update
        const user = await db.user.upsert({
            where: { username: username },
            update: { password_hash: hash },
            create: {
                username: username,
                password_hash: hash
            }
        });

        console.log(`User '${user.username}'(ID: ${user.id}) configured successfully.`);
    } catch (e) {
        console.error("Error creating user:", e.message);
        process.exit(1);
    }
}

createUser();
