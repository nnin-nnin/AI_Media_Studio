/**
 * AssetManager (Persistent)
 * Communicates with the Backend API to store/retrieve assets.
 */
class AssetManager {
    constructor() {
        this.assets = [];
        this.refresh(); // Load initial data
    }

    async refresh() {
        try {
            const res = await fetch('/api/assets');
            if (res.ok) {
                this.assets = await res.json();
                this.notify();
            }
        } catch (e) {
            console.error("Failed to load assets from server", e);
        }
    }

    /**
     * Add a new asset
     * @param {Object} asset - { type, url, prompt, metadata }
     */
    async add(asset) {
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asset)
            });

            if (res.ok) {
                const result = await res.json();
                // Optimistic update or refresh? Refresh ensures proper local URL
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
        // Optimistic UI update
        this.assets = this.assets.filter(a => a.id !== id);
        this.notify();

        try {
            await fetch(`/api/assets/${id}`, { method: 'DELETE' });
            // Confirm sync
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
