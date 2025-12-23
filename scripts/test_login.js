import db from '../src/server/db/database.js';
import bcrypt from 'bcryptjs';

const username = 'student';
const password = 'magic-password';

const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (!user) {
    console.error('User not found!');
    process.exit(1);
}

// verify async (as used in real app)
console.log("Testing with bcrypt.compare (async)...");
bcrypt.compare(password, user.password_hash).then(isValid => {
    console.log(`User: ${username}`);
    console.log(`Stored Hash: ${user.password_hash}`);
    console.log(`Password: ${password}`);
    console.log(`Match Result: ${isValid}`);

    if (isValid) {
        console.log("LOGIN SHOULD SUCCEED!");
    } else {
        console.log("LOGIN FAILED - Password Mismatch");
    }
}).catch(err => console.error(err));
