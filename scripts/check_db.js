import db from '../src/server/db/database.js';

try {
    const users = db.prepare('SELECT * FROM users').all();
    console.log('--- Users in DB ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, PaswordHashLen: ${u.password_hash ? u.password_hash.length : 0}`);
    });
    console.log('-------------------');
} catch (e) {
    console.error('Error reading DB:', e);
}
