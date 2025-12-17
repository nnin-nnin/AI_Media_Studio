// web-api.js
// Replaces Electron IPC with HTTP calls to the Node.js Express server

// Helper function for API calls
export async function fetchAPI(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Server Error');
        }

        return await response.json();
    } catch (e) {
        console.error('API Error:', e);
        if (window.Toast) {
            window.Toast.show(e.message || 'API Connection Failed', 'error');
        }
        return { status: 'error', message: e.message };
    }
}

// Helper to trigger browser download
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

// Legacy / Window Attachment for Renderer
if (typeof window !== 'undefined') {
    // In Web-Only mode, we ALWAYS use this adapter.
    window.electronAPI = {
        generateImage,
        editImage,
        generateVideo,
        cloneVoice,
        saveImageFile,
        saveAudioFile,
        getTempDir,
        readImageFile,
        readAudioFile
    };
    console.log('Web API Adapter initialized');
}
