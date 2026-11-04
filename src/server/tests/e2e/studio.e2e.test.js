import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
import app from '../../server.js';

const require = createRequire(import.meta.url);

// Resolve Playwright
let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    try {
        ({ chromium } = require('/Users/min/.npm/_npx/e41f203b7505f1fb/node_modules/playwright'));
    } catch {
        chromium = null;
    }
}

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:5173';

describe('End-to-End (E2E) Test Suite: Full-Stack & Browser UI', () => {
    let browser;
    let page;
    let serverInstance;
    let targetUrl = FRONTEND_URL;
    const pageErrors = [];

    beforeAll(async () => {
        if (chromium) {
            try {
                browser = await chromium.launch({ headless: true });
                const context = await browser.newContext();
                page = await context.newPage();
                page.on('pageerror', (err) => {
                    pageErrors.push(err.message);
                });
            } catch (err) {
                console.warn('[E2E] Chromium launch skipped:', err.message);
            }
        }

        // Always bind app to an ephemeral port for hermetic test execution
        await new Promise((resolve) => {
            serverInstance = app.listen(0, '127.0.0.1', () => {
                const port = serverInstance.address().port;
                targetUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
        if (serverInstance) {
            await new Promise((resolve) => serverInstance.close(resolve));
        }
    });

    describe('1. Backend API & Queue E2E', () => {
        it('GET /api/ai/characters should return seeded system characters', async () => {
            const res = await request(app).get('/api/ai/characters?category=system');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('GET /api/ai/models should return filtered models list', async () => {
            const res = await request(app).get('/api/ai/models?type=image');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.models)).toBe(true);
            expect(res.body.models.length).toBeGreaterThan(0);
        });

        it('GET /api/ai/jobs/:id should return 404 for unknown job ID', async () => {
            const res = await request(app).get('/api/ai/jobs/non-existent-job-id');
            expect(res.status).toBe(404);
            expect(res.body.status).toBe('error');
        });

        it('GET /api/settings/keys should return masked API key status', async () => {
            const res = await request(app).get('/api/settings/keys');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.keys).toHaveProperty('ARK_API_KEY');
            expect(res.body.keys).toHaveProperty('DASHSCOPE_API_KEY');
        });
    });

    describe.skipIf(!chromium)('2. Browser UI E2E (Playwright)', () => {
        it('loads Dashboard page with 4 studio feature cards and zero runtime errors', async () => {
            await page.goto(targetUrl, { waitUntil: 'networkidle' });
            expect(await page.title()).toContain('AI');

            const cardsCount = await page.locator('.feature-card').count();
            expect(cardsCount).toBe(4);

            // Verify API Config Modal opens and closes cleanly
            await page.click('#sidebar-api-config-btn');
            await page.waitForFunction(() => {
                const el = document.getElementById('api-config-modal');
                return el && getComputedStyle(el).display !== 'none';
            });
            await page.click('#api-modal-close');
            await page.waitForFunction(() => {
                const el = document.getElementById('api-config-modal');
                return el && getComputedStyle(el).display === 'none';
            });

            expect(pageErrors).toEqual([]);
        });

        it('switches language (ZH <-> EN) while preserving active sidebar state and without raw i18n keys', async () => {
            // 1. Click #main-lang-toggle on Dashboard where global-util-bar is visible
            await page.evaluate(() => window.app.navigate('dashboard'));
            await page.waitForSelector('#main-lang-toggle');
            await page.click('#main-lang-toggle');
            await page.waitForTimeout(150);

            // 2. Navigate to video-generation and switch language via i18n API to verify active state preservation
            await page.evaluate(() => window.app.navigate('video-generation'));
            await page.waitForSelector('#vg-prompt-input');

            const activeBefore = await page.locator('#nav-item-video-generation').evaluate(el => el.classList.contains('active'));
            expect(activeBefore).toBe(true);

            await page.evaluate(() => window.i18n.switchLanguage('zh'));
            await page.waitForTimeout(150);

            const activeAfter = await page.locator('#nav-item-video-generation').evaluate(el => el.classList.contains('active'));
            expect(activeAfter).toBe(true);

            const bodyText = await page.locator('body').innerText();
            expect(bodyText).not.toMatch(/COMMON_|LABEL_|ASSETS_FILTER_|VIDEO_PROMPT_/);
        });

        it('applies Dark Mode CSS variables properly without hardcoded white backgrounds', async () => {
            await page.evaluate(() => window.app.navigate('face-swap'));
            await page.waitForSelector('.studio-text-editor');

            // Ensure dark theme is active
            await page.evaluate(() => window.ThemeManager.apply('dark'));
            await page.waitForTimeout(100);

            const sidebarBg = await page.locator('#app-sidebar').evaluate(el => getComputedStyle(el).backgroundColor);
            const editorBg = await page.locator('.studio-text-editor').evaluate(el => getComputedStyle(el).backgroundColor);

            // Neither should be pure white rgb(255, 255, 255) in dark mode
            expect(sidebarBg).not.toBe('rgb(255, 255, 255)');
            expect(editorBg).not.toBe('rgb(255, 255, 255)');

            // Restore light theme
            await page.evaluate(() => window.ThemeManager.apply('light'));
        });

        it('verifies Image Studio (face-swap) mode switch, tags, and tabs', async () => {
            await page.evaluate(() => window.app.navigate('face-swap'));
            await page.waitForSelector('#fs-prompt-input');

            // Click first quick tag
            await page.locator('.studio-tags-row .studio-tag').first().click();
            const promptVal = await page.locator('#fs-prompt-input').inputValue();
            expect(promptVal.length).toBeGreaterThan(0);

            // Switch to Text mode and back to Image mode
            await page.click('.mode-btn[data-mode="text"]');
            const slotsHiddenInText = await page.locator('#fs-slots-row').evaluate(el => getComputedStyle(el).display === 'none');
            expect(slotsHiddenInText).toBe(true);

            await page.click('.mode-btn[data-mode="image"]');
            const slotsVisibleInImage = await page.locator('#fs-slots-row').evaluate(el => getComputedStyle(el).display !== 'none');
            expect(slotsVisibleInImage).toBe(true);

            // Switch to Assets tab
            await page.click('.studio-tab-btn[data-tab="assets"]');
            const assetsTabVisible = await page.locator('#tab-assets').evaluate(el => getComputedStyle(el).display !== 'none');
            expect(assetsTabVisible).toBe(true);
        });

        it('verifies Video Studio (video-generation) random prompt button populates valid localized text', async () => {
            await page.evaluate(() => window.app.navigate('video-generation'));
            await page.waitForSelector('#btn-gen-prompt');

            await page.click('#btn-gen-prompt');
            const videoPrompt = await page.locator('#vg-prompt-input').inputValue();
            expect(videoPrompt.length).toBeGreaterThan(0);
            expect(videoPrompt).not.toContain('VIDEO_PROMPT_');
            expect(videoPrompt).not.toBe('undefined');
        });

        it('verifies Voice Studio (voice-chat) loads characters and selects a character', async () => {
            await page.evaluate(() => window.app.navigate('voice-chat'));
            await page.waitForSelector('.character-card');

            const charCount = await page.locator('.character-card').count();
            expect(charCount).toBeGreaterThan(0);

            await page.locator('.character-card').first().click();
            const chatVisible = await page.locator('#chat-interface').evaluate(el => getComputedStyle(el).display !== 'none');
            expect(chatVisible).toBe(true);
        });

        it('verifies Voice Cloning Studio (voice-cloning) renders presets and audio assets tab', async () => {
            await page.evaluate(() => window.app.navigate('voice-cloning'));
            await page.waitForSelector('#vc-prompt-input');

            await page.click('.studio-tab-btn[data-tab="assets"]');
            const tabHtml = await page.locator('#tab-assets').innerHTML();
            expect(tabHtml.length).toBeGreaterThan(0);
        });

        it('verifies Vision Studio (realtime-vision) updates prompt on preset click', async () => {
            await page.evaluate(() => window.app.navigate('realtime-vision'));
            await page.waitForSelector('#rv-prompt-input');

            await page.locator('.preset-card').first().click();
            const rvPrompt = await page.locator('#rv-prompt-input').inputValue();
            expect(rvPrompt).toContain('Van Gogh');
        });

        it('verifies Page Lifecycle Cleanup hook triggers on route change', async () => {
            const cleanupCalled = await page.evaluate(() => {
                window.__cleanupTestFlag = false;
                window.registerPageCleanup(() => {
                    window.__cleanupTestFlag = true;
                });
                window.app.navigate('dashboard');
                return window.__cleanupTestFlag;
            });
            expect(cleanupCalled).toBe(true);
        });

        it('prevents XSS injection in Toast notifications and Asset Library cards', async () => {
            // 1. Test Toast XSS escaping
            await page.evaluate(() => {
                window.__xss_toast = false;
                window.Toast.show('<img src=x onerror="window.__xss_toast=true">', 'error');
            });
            await page.waitForTimeout(100);
            const toastXss = await page.evaluate(() => window.__xss_toast);
            expect(toastXss).toBe(false);

            // 2. Test Asset Library XSS escaping
            const xssPrompt = '<img src=x onerror="window.__xss_asset=true">';
            const createRes = await request(app).post('/api/assets').send({
                userId: 1,
                type: 'image',
                url: '/uploads/test_xss_check.png',
                prompt: xssPrompt
            });
            const assetId = createRes.body.asset.id;

            await page.evaluate(async () => {
                window.__xss_asset = false;
                await window.AssetManager.init();
                window.app.navigate('assets');
            });
            await page.waitForSelector('#assets-grid');
            await page.waitForTimeout(150);

            const assetXss = await page.evaluate(() => window.__xss_asset);
            expect(assetXss).toBe(false);

            // Clean up test asset
            await request(app).delete(`/api/assets/${assetId}`);
            expect(pageErrors).toEqual([]);
        });
    });
});
