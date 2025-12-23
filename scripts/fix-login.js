import db from '../src/server/db/database.js';
import bcrypt from 'bcryptjs';

async function fixLogin() {
    console.log("Fixing 'student' login...");
    const username = 'student';
    const password = 'magic-password';

    // Check if exists
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    if (user) {
        console.log("User found. Updating password...");
        db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
        console.log("Password updated.");
    } else {
        console.log("User not found. Creating new user...");
        db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
        console.log("User created.");
    }
}

fixLogin().catch(console.error);
