// web-api.js
// Replaces Electron IPC with HTTP calls to the Node.js Express server

let authToken = localStorage.getItem('ai_auth_token') || null;

// Helper function for API calls
// Helper function for API calls
const API_BASE = '';

export async function fetchAPI(endpoint, data = {}, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const config = {
            method: options.method || 'POST', // Default to POST for backward compatibility
            headers: headers
        };

        if (config.method !== 'GET' && config.method !== 'HEAD') {
            config.body = JSON.stringify(data);
        }

        console.log(`[WebAPI] Fetching ${url}`, config);

        const response = await fetch(url, config);

        if (response.status === 401 || response.status === 403) {
            // Token expired or invalid
            console.warn("Auth failed, clearing token");
            // Try to read the error message
            try {
                const errData = await response.clone().json();
                console.warn("[WebAPI] Auth Error Details:", errData);
            } catch (e) {
                console.warn("[WebAPI] Could not read auth error body");
            }
            localStorage.removeItem('ai_auth_token');
            authToken = null;
            window.dispatchEvent(new Event('auth-failed')); // Trigger re-login UI
            throw new Error('Authentication required');
        }

        if (!response.ok) {
            const error = await response.json();
            console.error("[WebAPI] HTTP Error:", error);
            throw new Error(error.message || 'Server Error');
        }

        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        if (window.Toast) {
            window.Toast.show(e.message || 'API Connection Failed', 'error');
        }
        // return { status: 'error', message: e.message }; // Let caller handle error better
        throw e;
    }
}

// Auth Functions
export const login = async (username, password) => {
    try {
        const res = await fetchAPI('/api/auth/login', { username, password });
        if (res.status === 'success') {
            authToken = res.data.token;
            localStorage.setItem('ai_auth_token', authToken);
            return res; // Return full response so UI can check .status
        }
        return res; // Return error response
    } catch (e) {
        throw e;
    }
};

/**
 * Security Hardening: Ritual-based Unlock
 */
export const getRitualSession = async () => {
    const res = await fetchAPI('/api/auth/ritual-session', {}, { method: 'GET' });
    return res.nonce;
};

export const unlockWithRitual = async (ritualLog, nonce) => {
    try {
        const res = await fetchAPI('/api/auth/ritual-unlock', { ritualLog, nonce });
        if (res.status === 'success') {
            authToken = res.data.token;
            localStorage.setItem('ai_auth_token', authToken);
            return res; // Return full response
        }
        return res;
    } catch (e) {
        throw e;
    }
};

export const register = async (username, password) => {
    return fetchAPI('/api/auth/register', { username, password });
};

export const logout = () => {
    authToken = null;
    localStorage.removeItem('ai_auth_token');
    window.location.reload();
};

// ... Existing Helpers ...
function downloadDataUrl(dataUrl, fileName) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Core API Functions
export const generateImage = async (options) => {
    return fetchAPI('/api/ai/image', options);
};

export const editImage = async (options) => {
    return fetchAPI('/api/ai/edit-image', options);
};

export const generateVideo = async (options) => {
    return fetchAPI('/api/ai/video', options);
};

export const cloneVoice = async (options) => {
    return fetchAPI('/api/ai/voice', options);
};

export const saveImageFile = async (fileName, dataURL) => {
    // ... unchanged
    console.log('Web: Triggering download for', fileName);
    downloadDataUrl(dataURL, fileName);
    return fileName;
};

export const saveAudioFile = async (fileName, dataURL) => {
    console.log('Web: Triggering download for', fileName);
    downloadDataUrl(dataURL, fileName);
    return fileName;
};

export const getTempDir = async () => {
    return '/temp';
};

export const readImageFile = async (fileName) => {
    console.warn('readImageFile not fully supported in Web mode');
    return null;
};

export const readAudioFile = async (fileName) => {
    console.warn('readAudioFile not fully supported in Web mode');
    return null;
};

export const listModels = async () => {
    return fetchAPI('/api/ai/models', {}, { method: 'GET' });
};

// Legacy / Window Attachment for Renderer
if (typeof window !== 'undefined') {
    // In Web-Only mode, we ALWAYS use this adapter.
    window.electronAPI = {
        login,
        getRitualSession,
        unlockWithRitual,
        register,
        logout,
        generateImage,
        editImage,
        generateVideo,
        cloneVoice,
        saveImageFile,
        saveAudioFile,
        getTempDir,
        readImageFile,
        readAudioFile,
        listModels
    };
    console.log('Web API Adapter initialized (Secure)');
}
