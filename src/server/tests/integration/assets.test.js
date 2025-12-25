import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../server.js';
import prisma from '../../db/database.js'; // Ensure we can check DB side effects

describe('Asset Management API', () => {
    // Generate a minimal red pixel as Data URL
    const testAssetUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`;

    it('POST /api/assets should create a new asset record', async () => {
        const payload = {
            userId: 1, // Default user
            type: 'image',
            url: testAssetUrl,
            prompt: 'A test image for integration testing',
            metadata: JSON.stringify({ source: 'test' })
        };

        const res = await request(app)
            .post('/api/assets')
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.asset.id).toBeDefined();
        // Note: For Data URLs, the server converts them to local file paths (e.g. /uploads/temp/...)
        // So we expect the returned URL to NOT match the original Data URL
        expect(res.body.asset.url).toMatch(/^\/uploads\//);

        // Verify in Database
        // We can't query by URL easily now since it changed. 
        // We query by ID returned from API.
        const dbRecord = await prisma.asset.findUnique({
            where: { id: res.body.asset.id }
        });
        expect(dbRecord).not.toBeNull();
        expect(dbRecord.prompt).toBe(payload.prompt);
    });

    it('GET /api/assets should list the newly created asset', async () => {
        const res = await request(app).get('/api/assets');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Find by prompt since URL changed
        const found = res.body.find(a => a.prompt === 'A test image for integration testing');
        expect(found).toBeDefined();
    });

    it('DELETE /api/assets/:id should remove the asset', async () => {
        // First get the ID by prompt
        const dbRecord = await prisma.asset.findFirst({
            where: { prompt: 'A test image for integration testing' }
        });
        expect(dbRecord).not.toBeNull();

        // Delete it
        const res = await request(app).delete(`/api/assets/${dbRecord.id}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');

        // Verify gone from DB
        const deletedRecord = await prisma.asset.findUnique({
            where: { id: dbRecord.id }
        });
        expect(deletedRecord).toBeNull();
    });
});
