/**
 * TaskManager.js
 * Manages active AI generation tasks to allow persistence across frontend refreshes.
 */
class TaskManager {
    constructor() {
        this.activeTasks = new Set(); // Stores studio IDs that are currently processing
    }

    /**
     * Mark a studio task as started
     * @param {string} studioId - e.g., 'face-swap', 'video-generation', 'voice-cloning', 'voice-chat'
     */
    begin(studioId) {
        if (!studioId) return;
        this.activeTasks.add(studioId);
        console.log(`[TaskManager] Task started: ${studioId}. Active:`, Array.from(this.activeTasks));
    }

    /**
     * Mark a studio task as finished or failed
     * @param {string} studioId
     */
    end(studioId) {
        if (!studioId) return;
        this.activeTasks.delete(studioId);
        console.log(`[TaskManager] Task ended: ${studioId}. Active:`, Array.from(this.activeTasks));
    }

    /**
     * Get all currently active studio IDs
     * @returns {string[]}
     */
    getActive() {
        return Array.from(this.activeTasks);
    }
}

// Singleton instance
const taskManager = new TaskManager();

export default taskManager;
