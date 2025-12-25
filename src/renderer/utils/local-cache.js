/**
 * LocalCacheManager.js
 * Specialized utility for storing large media Blobs in IndexedDB.
 */
class LocalCacheManager {
    constructor() {
        this.dbName = 'AI_Media_Storage';
        this.dbVersion = 1;
        this.storeName = 'media_cache';
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB Open Error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Stores a Blob in IndexedDB
     * @param {string} key - Unique key (Asset ID or URL)
     * @param {Blob} blob - The media data
     */
    async set(key, blob) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(blob, key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Retrieves a Blob from IndexedDB
     * @param {string} key 
     * @returns {Promise<Blob|null>}
     */
    async get(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Utility: Downloads a URL and caches it
     */
    async fetchAndCache(url, id) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            // Cache by ID primarily for clean lookup
            await this.set(id, blob);
            return blob;
        } catch (e) {
            console.warn("[LocalCache] Failed to fetch and cache:", url, e);
            return null;
        }
    }
}

window.LocalCacheManager = new LocalCacheManager();
export default window.LocalCacheManager;
