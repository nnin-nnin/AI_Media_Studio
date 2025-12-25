import { describe, it, expect, vi } from 'vitest';
import AuthService from '../auth-service.js';

// Mock specific dependencies to avoid DB calls in unit tests
vi.mock('../../db/database.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn()
        }
    }
}));

describe('AuthService', () => {
    it('should sanitize user object by removing password_hash', () => {
        const rawUser = {
            id: 1,
            username: 'testuser',
            password_hash: '$2a$10$abcdef...',
            email: 'test@example.com'
        };
        const sanitized = AuthService._sanitizeUser(rawUser);

        expect(sanitized).not.toHaveProperty('password_hash');
        expect(sanitized.username).toBe('testuser');
        expect(sanitized.id).toBe(1);
    });

    it('should create a ritual session with a nonce and expiry', () => {
        const nonce = AuthService.createRitualSession();
        expect(nonce).toBeDefined();
        expect(typeof nonce).toBe('string');

        const session = AuthService.activeRituals.get(nonce);
        expect(session).toBeDefined();
        expect(session.expiry).toBeGreaterThan(Date.now());
    });

    it('should throw error for invalid ritual log', async () => {
        const nonce = AuthService.createRitualSession();
        await expect(AuthService.verifyRitual([], nonce))
            .rejects.toThrow('Insufficient ritual data');
    });
});
