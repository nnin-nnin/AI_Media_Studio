/**
 * Theme Manager for AI Media Studio
 * Handles Light (Pop Art) and Dark (Noir) modes
 */
const ThemeManager = {
    // Current state
    theme: localStorage.getItem('app_theme') || 'light',

    /**
     * Initialize theme on app startup
     */
    init() {
        // Apply saved or default theme
        this.apply(this.theme);
        console.log(`[ThemeManager] Initialized with theme: ${this.theme}`);
    },

    /**
     * Toggle between light and dark
     */
    toggle() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.apply(newTheme);
    },

    /**
     * Apply a specific theme
     * @param {string} themeName - 'light' or 'dark'
     */
    apply(themeName) {
        this.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('app_theme', themeName);

        // Dispatch event for other components (like charts or canvas) to react
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: themeName }
        }));
    }
};

// Export for module usage, but also attach to window for easy access in HTML
export default ThemeManager;
window.ThemeManager = ThemeManager;
