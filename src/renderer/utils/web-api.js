// web-api.js
// Replaces Electron IPC with HTTP calls to the Node.js Express server

const API_BASE = '';

export async function fetchAPI(endpoint, data = {}, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const maxRetries = options.maxRetries || 3;
    const initialDelay = options.initialDelay || 1000;

    async function attemptFetch(retryCount) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            const config = {
                method: options.method || 'POST',
                headers: headers
            };

            if (config.method !== 'GET' && config.method !== 'HEAD') {
                config.body = JSON.stringify(data);
            }

            console.log(`[WebAPI] Fetching ${url} (Attempt ${retryCount + 1})`, config);

            const response = await fetch(url, config);

            if (response.status === 429 && retryCount < maxRetries) {
                const delay = initialDelay * Math.pow(2, retryCount) + (Math.random() * 500); // Exponential with jitter
                console.warn(`[WebAPI] Rate limited (429). Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return attemptFetch(retryCount + 1);
            }

            let body = {};
            if (typeof response.text === 'function') {
                const text = await response.text();
                try {
                    body = JSON.parse(text);
                } catch (jsonErr) {
                    body = { message: text };
                }
            } else if (typeof response.json === 'function') {
                body = await response.json();
            }

            if (!response.ok) {
                console.error("[WebAPI] HTTP Error:", body);
                throw new Error(body.message || body.error || 'Server Error');
            }

            return body;
        } catch (e) {
            if (e.message && e.message.toLowerCase().includes('too many requests') && retryCount < maxRetries) {
                const delay = initialDelay * Math.pow(2, retryCount) + (Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, delay));
                return attemptFetch(retryCount + 1);
            }
            throw e;
        }
    }

    try {
        return await attemptFetch(0);
    } catch (e) {
        console.error('API Error:', e);
        if (typeof window !== 'undefined' && window.Toast) {
            window.Toast.show(e.message || 'API Connection Failed', 'error');
        }
        throw e;
    }
}

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
    const apiAdapter = {
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

    try {
        if (!window.electronAPI) {
            window.electronAPI = apiAdapter;
        } else {
            Object.assign(window.electronAPI, apiAdapter);
        }
    } catch (e) {
        console.warn('[WebAPI] Could not assign window.electronAPI directly:', e);
    }

    window.webAPI = apiAdapter;
    window.fetchAPI = fetchAPI;
    console.log('Web API Adapter initialized (Secure Mode: Single User)');
}
