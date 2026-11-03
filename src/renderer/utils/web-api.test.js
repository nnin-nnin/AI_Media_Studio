import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage, generateVideo, fetchAPI } from './web-api.js';

// Mock global fetch
global.fetch = vi.fn();

describe('Web API Utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchAPI', () => {
        it('should return JSON on success', async () => {
            const mockResponse = { status: 'success', data: '123' };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await fetchAPI('/test', {});
            expect(result).toEqual(mockResponse);
        });

        it('should handle server errors gracefully', async () => {
            const mockError = { message: 'Invalid prompt' };
            global.fetch.mockResolvedValue({
                ok: false,
                json: async () => mockError,
            });

            await expect(fetchAPI('/test', {})).rejects.toThrow('Invalid prompt');
        });

        it('should handle network exceptions', async () => {
            global.fetch.mockRejectedValue(new Error('Network Error'));

            await expect(fetchAPI('/test', {})).rejects.toThrow('Network Error');
        });
    });

    describe('generateImage', () => {
        it('should call generic fetchAPI with correct endpoint', async () => {
            const mockResponse = { status: 'success', image: 'base64...' };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const options = { prompt: 'cat' };
            await generateImage(options);

            expect(global.fetch).toHaveBeenCalledWith('/api/ai/image', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(options)
            }));
        });
    });

    describe('generateVideo', () => {
        it('should call generic fetchAPI with correct endpoint', async () => {
            const mockResponse = { status: 'success' };
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            await generateVideo({ prompt: 'dance' });
            expect(global.fetch).toHaveBeenCalledWith('/api/ai/video', expect.any(Object));
        });
    });
});
