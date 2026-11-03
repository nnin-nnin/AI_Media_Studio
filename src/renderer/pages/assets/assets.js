/**
 * Assets Page
 * Displays gallery of all saved assets (Images, Videos, Voice)
 */
import './assets.css';

function loadAssetsPage(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="assets-page fade-in">
            <!-- Sidebar is handled globally -->
            <div id="global-sidebar" class="studio-nav"></div>

            <div class="assets-main">
                <div class="assets-header">
                    <h1>${window.i18n.t('ASSETS_TITLE')}</h1>
                    <div class="assets-filters">
                        <button class="filter-btn active" data-filter="all">${window.i18n.t('ASSETS_FILTER_ALL')}</button>
                        <button class="filter-btn" data-filter="image">${window.i18n.t('ASSETS_FILTER_IMAGE')}</button>
                        <button class="filter-btn" data-filter="video">${window.i18n.t('ASSETS_FILTER_VIDEO')}</button>
                        <button class="filter-btn" data-filter="audio">${window.i18n.t('ASSETS_FILTER_AUDIO')}</button>
                    </div>
                </div>

                <div class="assets-grid" id="assets-grid">
                    <!-- Dynamic Content -->
                </div>
                
                <div id="assets-empty" class="assets-empty">
                    <div class="empty-icon">📂</div>
                    <p>${window.i18n.t('ASSETS_EMPTY_TITLE')}</p>
                    <small>${window.i18n.t('ASSETS_EMPTY_SUBTITLE')}</small>
                </div>
            </div>
        </div>
    `;

    renderAssetGrid('all');
    setupAssetsListeners();

    // Listen for updates (Named function for reliable removal)
    if (!window._assetsUpdateHandler) {
        window._assetsUpdateHandler = () => {
            const activeBtn = document.querySelector('.filter-btn.active');
            const filter = activeBtn ? activeBtn.dataset.filter : 'all';
            renderAssetGrid(filter);
        };
    }
    window.removeEventListener('assets-updated', window._assetsUpdateHandler);
    window.addEventListener('assets-updated', window._assetsUpdateHandler);
}

function renderAssetGrid(filter) {
    const grid = document.getElementById('assets-grid');
    const empty = document.getElementById('assets-empty');
    if (!grid) return;

    let assets = window.AssetManager.getAll();
    if (filter !== 'all') {
        assets = assets.filter(a => a.type === filter);
    }

    if (assets.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = assets.map(asset => {
        let content = '';
        if (asset.type === 'image') {
            const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
            // Escape double quotes for HTML attribute but avoid breaking the SVG xmlns quote
            content = `<img src="${asset.url}" loading="lazy" onerror="this.onerror=null; this.parentElement.classList.add('is-missing'); this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'%3E%3Cpath d=\\'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\\'/%3E%3Cpolyline points=\\'17 8 12 3 7 8\\'/%3E%3Cline x1=\\'12\\' y1=\\'3\\' x2=\\'12\\' y2=\\'15\\'/%3E%3C/svg%3E';">`;
        } else if (asset.type === 'video') {
            content = `<video src="${asset.url}" muted onmouseover="this.play()" onmouseout="this.pause()" onerror="this.parentElement.classList.add('is-missing'); this.style.display='none';"></video>
                       <div class="video-missing-icon">🎬</div>`;
        } else if (asset.type === 'audio') { // 'audio' or 'mic' mapped to audio type
            content = `<div class="audio-card">🎵</div>`;
        }

        const escapeHTML = window.escapeHTML || (s => s);
        const safeId = escapeHTML(asset.id);
        const safePrompt = escapeHTML(asset.prompt || 'Untitled');

        return `
            <div class="asset-card fade-in" onclick="window.MediaPreview.open('${safeId}')">
                <div class="asset-preview">
                    ${content}
                <div class="asset-overlay">
                    <button class="icon-on-dark" onclick="event.stopPropagation(); window.AssetManager.delete('${safeId}');">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                </div>
                <div class="asset-info">
                    <div class="asset-title">${safePrompt}</div>
                    <div class="asset-meta">${new Date(asset.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

function setupAssetsListeners() {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAssetGrid(btn.dataset.filter);
        });
    });
}

window.loadAssetsPage = loadAssetsPage;
