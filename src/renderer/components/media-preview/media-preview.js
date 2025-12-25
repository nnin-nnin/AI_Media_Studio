/**
 * Media Preview Component
 * Handles fullscreen preview of images and videos
 */
class MediaPreview {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // Create modal element if it doesn't exist
        if (document.getElementById('media-preview-modal')) return;

        const modalHtml = `
            <div id="media-preview-modal" class="media-modal" style="display:none;">
                <div class="media-modal-overlay"></div>
                <div class="media-modal-container">
                    <button class="media-modal-close">&times;</button>
                    <div class="media-modal-content" id="media-preview-content">
                        <!-- Content injected here -->
                    </div>
                    <div class="media-modal-info">
                        <h3 id="media-preview-title"></h3>
                        <p id="media-preview-meta"></p>
                    </div>
                </div>
            </div>
            <style>
                .media-modal {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 2000; display: flex; align-items: center; justify-content: center;
                }
                .media-modal-overlay {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);
                }
                .media-modal-container {
                    position: relative; width: 90%; max-width: 1000px; max-height: 90vh;
                    display: flex; flex-direction: column; align-items: center;
                    animation: mediaModalFadeIn 0.3s ease;
                }
                @keyframes mediaModalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .media-modal-close {
                    position: absolute; top: -40px; right: 0;
                    background: none; border: none; color: white;
                    font-size: 32px; cursor: pointer; opacity: 0.7; transition: 0.2s;
                }
                .media-modal-close:hover { opacity: 1; }
                .media-modal-content {
                    width: 100%; display: flex; justify-content: center; align-items: center;
                    overflow: hidden; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                    background: #000;
                }
                .media-modal-content img, .media-modal-content video {
                    max-width: 100%; max-height: 70vh; display: block;
                }
                .media-modal-info {
                    width: 100%; color: white; padding: 20px 0; text-align: center;
                }
                .media-modal-info h3 { margin: 0 0 5px 0; font-size: 18px; font-weight: 500; }
                .media-modal-info p { margin: 0; font-size: 14px; opacity: 0.6; }
            </style>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div);

        this.modal = document.getElementById('media-preview-modal');
        this.content = document.getElementById('media-preview-content');
        this.title = document.getElementById('media-preview-title');
        this.meta = document.getElementById('media-preview-meta');

        // Close on overlay click or button click
        this.modal.querySelector('.media-modal-overlay').onclick = () => this.close();
        this.modal.querySelector('.media-modal-close').onclick = () => this.close();

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    async open(assetId) {
        if (!window.AssetManager) return;
        const asset = window.AssetManager.get(assetId);
        if (!asset) return;

        this.title.innerText = asset.prompt || 'Untitled Asset';
        this.meta.innerText = `${asset.type.toUpperCase()} • ${new Date(asset.timestamp).toLocaleString()}`;

        // Try to get from local cache first
        let mediaUrl = asset.url;
        if (window.LocalCacheManager) {
            try {
                const cachedBlob = await window.LocalCacheManager.get(assetId);
                if (cachedBlob) {
                    console.log("[MediaPreview] Playing from local cache:", assetId);
                    mediaUrl = URL.createObjectURL(cachedBlob);
                    this._currentLocalUrl = mediaUrl; // Store to revoke later
                }
            } catch (e) {
                console.warn("[MediaPreview] Cache lookup failed, falling back to URL", e);
            }
        }

        let html = '';
        if (asset.type === 'image') {
            html = `<img src="${mediaUrl}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\'%3E%3Cpath d=\'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\'/%3E%3Cpolyline points=\'17 8 12 3 7 8\'/%3E%3Cline x1=\'12\' y1=\'3\' x2=\'12\' y2=\'15\'/%3E%3C/svg%3E'; this.style.opacity=0.5; this.style.width='64px';" />`;
        } else if (asset.type === 'video') {
            html = `<video src="${mediaUrl}" controls autoplay loop onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'color:white; padding: 40px;\'>🎬 Missing video file</div>'"></video>`;
        } else if (asset.type === 'audio') {
            html = `
                <div style="padding: 40px; background: var(--bg-deep); border-radius: 12px; width: 100%; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎵</div>
                    <audio src="${mediaUrl}" controls autoplay style="width: 100%;"></audio>
                </div>
            `;
        }

        this.content.innerHTML = html;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.content.innerHTML = ''; // Stop video/audio
        document.body.style.overflow = '';

        // Clean up local blob URL
        if (this._currentLocalUrl) {
            URL.revokeObjectURL(this._currentLocalUrl);
            this._currentLocalUrl = null;
        }
    }
}

// Global instance
window.MediaPreview = new MediaPreview();
