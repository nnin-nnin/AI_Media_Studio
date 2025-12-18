import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-course-super-secure-secret-key-2025';

class AuthService {

    // Convert DB row to User object (exclude password)
    _sanitizeUser(row) {
        if (!row) return null;
        const { password_hash, ...user } = row;
        return user;
    }

    async register(username, password) {
        if (!username || !password) throw new Error("Username and password required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) throw new Error("Username already taken");

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert
        const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);

        return { id: info.lastInsertRowid, username };
    }

    async login(username, password) {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) throw new Error("Invalid credentials");

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) throw new Error("Invalid credentials");

        // Issue Token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' } // Long session for MVP
        );

        return {
            user: this._sanitizeUser(user),
            token
        };
    }

    // Middleware for Express
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
            req.user = user; // { id, username, iat, exp }
            next();
        });
    }
}

export default new AuthService();
