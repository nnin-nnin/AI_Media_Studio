/**
 * Settings Manager
 * Handles persistence of user preferences like model IDs.
 */
class SettingsManager {
    constructor() {
        this.defaults = {
            imageModel: "doubao-seedream-4-0-250828",
            videoModel: "doubao-seedance-1-0-pro-251015",
            audioModel: "cosyvoice-v2", // Default for voice-clone.py
            audioInputDeviceId: "default",
            theme: "dark"
        };
        this.settings = this.load();
    }

    load() {
        const saved = localStorage.getItem('app_settings');
        if (saved) {
            try {
                return { ...this.defaults, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse settings", e);
                return { ...this.defaults };
            }
        }
        return { ...this.defaults };
    }

    save() {
        localStorage.setItem('app_settings', JSON.stringify(this.settings));
        window.dispatchEvent(new CustomEvent('settings-updated', { detail: this.settings }));
    }

    get(key) {
        return this.settings[key] || this.defaults[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
    }
}

// Global instance
window.SettingsManager = new SettingsManager();
