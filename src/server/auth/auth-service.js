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

    // --- Ritual Verification (Security Hardening) ---

    constructor() {
        this.activeRituals = new Map(); // nonce -> { startTime, expiry }
    }

    createRitualSession() {
        const nonce = Math.random().toString(36).substring(7);
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minute window
        this.activeRituals.set(nonce, { startTime: Date.now(), expiry });
        return nonce;
    }

    /**
     * verifyRitual
     * Replays the gesture logic on raw hand data sent by client.
     * @param {Array} ritualLog - Array of { timestamp, isFist, twoHandsDetected, handDistance, etc }
     * @param {string} nonce - Session nonce
     */
    async verifyRitual(ritualLog, nonce) {
        // 1. Validate Nonce
        const session = this.activeRituals.get(nonce);
        if (!session) throw new Error("Invalid or missing ritual session");
        if (Date.now() > session.expiry) {
            this.activeRituals.delete(nonce);
            throw new Error("Ritual session expired");
        }
        this.activeRituals.delete(nonce); // Use once

        if (!Array.isArray(ritualLog) || ritualLog.length < 50) {
            throw new Error("Insufficient ritual data");
        }

        // 2. Replay State Machine Logic
        let state = 0; // 0: Sphere, 1: Collapsing, 2: Exploding/Hex, 3: Expansion, 4: Done
        let fistStartTime = 0;
        let lastStateChange = 0;
        let fistFrames = 0;
        let openFrames = 0;

        for (const frame of ritualLog) {
            const { isFist, twoHandsDetected, handDistance, expansionProgress, timestamp } = frame;

            if (state === 0) { // SPHERE
                if (isFist) {
                    fistFrames++;
                } else {
                    fistFrames = 0;
                }
                if (fistFrames > 10) {
                    state = 1; // COLLAPSING
                    fistStartTime = timestamp;
                    lastStateChange = timestamp;
                }
            }
            else if (state === 1) { // COLLAPSING
                if (!isFist) {
                    openFrames++;
                } else {
                    openFrames = 0;
                }
                if (openFrames > 5) {
                    // Check if held long enough (min 1s)
                    if (timestamp - lastStateChange > 800) {
                        state = 2; // EXPLODING/HEX
                        lastStateChange = timestamp;
                    } else {
                        throw new Error("Ritual invalid: Charge time too short");
                    }
                }
            }
            else if (state === 2) { // HEXAGRAM -> COMPLEX
                if (twoHandsDetected && handDistance > 0.4) {
                    state = 3; // EXPANSION
                    lastStateChange = timestamp;
                }
                // Timeout if HEX state hangs too long? 
            }
            else if (state === 3) { // COMPLEX -> UNLOCK
                if (expansionProgress > 0.85) {
                    if (timestamp - lastStateChange > 800) {
                        state = 4; // UNLOCKED
                    }
                } else {
                    lastStateChange = timestamp;
                }
            }
        }

        if (state !== 4) {
            throw new Error("Ritual incomplete: Sequence failed verification");
        }

        // 3. Success! Generate session for 'student'
        return this.issueToken('student');
    }

    async issueToken(username) {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) throw new Error("User not found");

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            user: this._sanitizeUser(user),
            token
        };
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
