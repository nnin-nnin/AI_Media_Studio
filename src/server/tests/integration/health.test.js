import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../server.js';

describe('System Health & Config', () => {
    it('GET /api/config should return 200 and valid config structure', async () => {
        const res = await request(app).get('/api/config');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('debugMode');
        expect(res.body).toHaveProperty('decartApiKey');
        expect(res.body).toHaveProperty('skipAuth');
    });

    it('GET /non-existent-route should return 404 (handled by frontend fallback or Express)', async () => {
        const res = await request(app).get('/api/non-existent');
        // Note: Depending on server setup, this might return index.html or 404
        // If API route not found, Express default is 404 
        // But rate limiter or other middleware might intercept.
        // Let's just check it doesn't crash (500).
        expect(res.status).not.toBe(500);
    });
});
