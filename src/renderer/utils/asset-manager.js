/**
 * AssetManager (Persistent)
 * Communicates with the Backend API to store/retrieve assets.
 */
import { fetchAPI } from './web-api.js';

class AssetManager {
    constructor() {
        this.assets = [];
        // Delay refresh slightly to ensure token is ready if login just happened
        // But ideally, we should wait for a 'logged-in' event.
        // For now, we wrap in try/catch silently or listen to event.
        this.init();
    }

    init() {
        if (localStorage.getItem('ai_auth_token')) {
            this.refresh();
        }

        // Listen for auth success to refresh
        window.addEventListener('auth-success', () => this.refresh());
    }

    async refresh() {
        try {
            const data = await fetchAPI('/api/assets', {}, { method: 'GET' });
            if (data) {
                this.assets = data;
                this.notify();
            }
        } catch (e) {
            console.warn("Failed to load assets:", e.message);
        }
    }

    /**
     * Add a new asset
     * @param {Object} asset - { type, url, prompt, metadata }
     */
    async add(asset) {
        try {
            const result = await fetchAPI('/api/assets', asset, { method: 'POST' });
            if (result && result.status === 'success') {
                await this.refresh();
                return result.asset;
            }
        } catch (e) {
            console.error("Failed to save asset", e);
        }
    }

    /**
     * Delete an asset by ID
     */
    async delete(id) {
        this.assets = this.assets.filter(a => a.id !== id);
        this.notify();

        try {
            await fetchAPI(`/api/assets/${id}`, {}, { method: 'DELETE' });
            this.refresh();
        } catch (e) {
            console.error("Failed to delete asset", e);
        }
    }

    /**
     * Get recent assets by type (Sync, fro memory)
     */
    getRecent(type, limit = 10) {
        if (!type || type === 'all') return this.assets.slice(0, limit);
        return this.assets.filter(a => a.type === type).slice(0, limit);
    }

    getAll() {
        return this.assets;
    }

    notify() {
        window.dispatchEvent(new CustomEvent('assets-updated', { detail: this.assets }));
    }
}

// Export singleton
window.AssetManager = new AssetManager();
