/**
 * i18nManager.js
 * A lightweight, commercial-grade internationalization manager for vanilla JS.
 */
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('app_lang') || 'zh';
        this.locales = {};
        this.isLoaded = false;
        this.listeners = [];
    }

    /**
     * Initializes the manager by loading the current language
     */
    async init() {
        await this.load(this.currentLang);
        this.isLoaded = true;
        this.notify();
    }

    /**
     * Loads a locale file
     * @param {string} lang - 'en' or 'zh'
     */
    async load(lang) {
        try {
            // Add a cache buster timestamp to ensure we get the latest file
            const cacheBuster = `?t=${Date.now()}`;
            const resp = await fetch(`./locales/${lang}.json${cacheBuster}`);
            if (!resp.ok) throw new Error(`Could not load locale: ${lang}`);
            this.locales[lang] = await resp.json();
            this.currentLang = lang;
            localStorage.setItem('app_lang', lang);
        } catch (e) {
            console.error("[i18n] Load Error:", e);
            // Fallback to empty if failed
            if (!this.locales[lang]) this.locales[lang] = {};
        }
    }

    /**
     * Translates a key
     * @param {string} key - The dictionary key
     * @param {Object} params - Optional parameters for interpolation
     * @returns {string} Translated string
     */
    t(key, params = {}) {
        const dict = this.locales[this.currentLang] || {};
        let text = dict[key] || key; // Fallback to key itself if missing

        // Simple interpolation: {name} -> params.name
        Object.keys(params).forEach(p => {
            text = text.replace(new RegExp(`{${p}}`, 'g'), params[p]);
        });

        return text;
    }

    /**
     * Switch language and reload UI
     * @param {string} lang 
     */
    async switchLanguage(lang) {
        if (lang === this.currentLang && this.locales[lang]) return;

        await this.load(lang);
        this.notify();

        // Dispatch global event for components that don't use the listener pattern
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));

        // Optional: Some apps prefer a full reload for clean state
        // window.location.reload(); 
    }

    /**
     * Add a listener for language changes
     */
    onLanguageChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(callback => callback(this.currentLang));
    }

    get lang() {
        return this.currentLang;
    }
}

// Global instance
window.i18n = new I18nManager();
// Export as module if needed
export default window.i18n;
