/**
 * Global Sidebar Component (Studio Core Layout)
 * Zones: A (Hub), B (Engines), C (Sessions)
 */
class GlobalSidebar {
    constructor() {
        this.activeItem = 'dashboard';
        this.isCollapsed = false;
        this.jobStatuses = {}; // studioId -> 'idle'|'processing'

        // Listen for asset updates to refresh "Recent Work"
        window.addEventListener('assets-updated', () => {
            this.updateRecentWork();
        });
    }

    /**
     * Initial render of the sidebar skeleton. 
     * This should only be called once or when language changes.
     */
    init(container) {
        if (container) this.container = container;
        if (!this.container) return;

        this.container.innerHTML = this.getTemplate();
        this.setActive(this.activeItem);
        Object.entries(this.jobStatuses).forEach(([studioId, status]) => {
            this.setJobStatus(studioId, status);
        });
        this.updateRecentWork();
        this.setupResizer();

        // Initial sync with backend for persistent tasks
        this.syncWithBackend();
    }

    async syncWithBackend() {
        try {
            const res = await window.fetch('/api/ai/tasks/active');
            const data = await res.json();

            if (data.status === 'success' && data.activeTasks) {
                console.log("[GlobalSidebar] Syncing active tasks:", data.activeTasks);
                data.activeTasks.forEach(studioId => {
                    this.setJobStatus(studioId, 'processing');
                });
            }
        } catch (e) {
            console.error("[GlobalSidebar] Failed to sync tasks with backend", e);
        }
    }

    getTemplate() {
        return `
            <div class="sidebar-header">
                <button class="icon-btn" title="Toggle sidebar" onclick="window.GlobalSidebar.toggle()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                        <path d="M9 3v18"></path>
                        <path d="m16 15-3-3 3-3"></path>
                    </svg>
                </button>
                <button class="icon-btn" onclick="window.app.navigate('dashboard')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                         <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                         <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                </button>
            </div>

            <div class="sidebar-nav-list">
                <!-- Zone A: HUB -->
                <div class="nav-group">
                    ${this.renderNavItem('dashboard', window.i18n.t('NAV_HOME'), 'home')}
                    ${this.renderNavItem('assets', window.i18n.t('NAV_ASSETS'), 'folder')}
                </div>
                
                <div class="nav-divider"></div>
                
                <!-- Zone B: CREATE ENGINES -->
                <div class="sidebar-group-label">${window.i18n.t('NAV_STUDIOS')}</div>
                <div class="nav-group">
                    ${this.renderNavItem('face-swap', window.i18n.t('STUDIO_IMAGE'), 'image')}
                    ${this.renderNavItem('video-generation', window.i18n.t('STUDIO_VIDEO'), 'video')}
                    <!-- ${this.renderNavItem('voice-cloning', window.i18n.t('STUDIO_AUDIO'), 'mic')} -->
                    ${this.renderNavItem('voice-chat', window.i18n.t('STUDIO_AUDIO'), 'message')}
                    ${this.renderNavItem('realtime-vision', window.i18n.t('STUDIO_VISION'), 'zap')}
                </div>

                <div class="nav-divider"></div>

                <!-- Zone C: RECENT WORK (Dynamic) -->
                <div class="sidebar-group-label">${window.i18n.t('NAV_RECENT')}</div>
                <div class="session-list" id="sidebar-recent-work">
                     <!-- Dynamic Content -->
                </div>
            </div>

            <div class="sidebar-footer">
                <button class="sidebar-settings-btn" id="sidebar-api-config-btn" onclick="window.ApiConfigModal && window.ApiConfigModal.open()" title="服务配置">
                    <div class="settings-icon-box">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                    <span class="settings-nav-text">服务配置</span>
                </button>
                <button class="icon-btn theme-sidebar-btn" onclick="window.ThemeManager.toggle()" title="Switch Theme">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                    </svg>
                </button>
            </div>
            <div class="sidebar-resizer-handle" id="sidebar-resizer" title="拖拽调整侧边栏宽度 / 双击折叠"></div>
        `;
    }

    renderNavItem(id, label, iconType) {
        const icon = this.getIcon(iconType);
        return `
            <button class="nav-list-item" id="nav-item-${id}" onclick="window.app.navigate('${id}')">
                <div class="nav-icon-wrapper">
                    ${icon}
                    <div class="status-indicator" id="status-${id}"></div>
                </div>
                <span class="nav-label">${label}</span>
            </button>
        `;
    }

    renderSessionItem(label, iconType, assetId) {
        const icon = this.getIcon(iconType, 14);
        const safeLabel = window.escapeHTML ? window.escapeHTML(label) : label;
        const safeId = window.escapeHTML ? window.escapeHTML(assetId) : assetId;
        return `
            <div class="session-item" onclick="window.MediaPreview.open('${safeId}')">
                ${icon}
                <span class="session-label" title="${safeLabel}">${safeLabel}</span>
            </div>
        `;
    }

    setActive(id) {
        this.activeItem = id;
        // Update DOM directly instead of re-rendering everything
        const items = document.querySelectorAll('.nav-list-item');
        items.forEach(item => item.classList.remove('active'));

        const activeItem = document.getElementById(`nav-item-${id}`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Set the status of a studio (e.g. 'processing' or 'idle')
     */
    setJobStatus(studioId, status) {
        this.jobStatuses[studioId] = status;
        const item = document.getElementById(`nav-item-${studioId}`);
        const indicator = document.getElementById(`status-${studioId}`);

        if (item && indicator) {
            if (status === 'processing') {
                item.classList.add('processing');
                indicator.style.display = 'block';
            } else {
                item.classList.remove('processing');
                indicator.style.display = 'none';
            }
        }
    }

    updateRecentWork() {
        const recentWorkContainer = document.getElementById('sidebar-recent-work');
        if (!recentWorkContainer) return;

        const recentAssets = window.AssetManager ? window.AssetManager.getRecent('all', 10) : [];

        if (recentAssets.length > 0) {
            recentWorkContainer.innerHTML = recentAssets.map(asset => {
                let icon = 'folder';
                if (asset.type === 'image') icon = 'image';
                else if (asset.type === 'video') icon = 'video';
                else if (asset.type === 'audio') icon = 'mic';
                else if (asset.type === 'vision') icon = 'zap';

                const label = asset.prompt || `${window.i18n.t('NAV_ASSETS')} ${asset.id.substring(0, 4)}`;
                return this.renderSessionItem(label, icon, asset.id);
            }).join('');
        } else {
            recentWorkContainer.innerHTML = `<div class="session-item-empty">${window.i18n.t('COMMON_RECENT_EMPTY')}</div>`;
        }
    }

    toggle() {
        this.isCollapsed = !this.isCollapsed;
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
            sidebar.style.width = this.isCollapsed ? '6.4rem' : '22rem';
        }
    }

    setupResizer() {
        const resizer = document.getElementById('sidebar-resizer');
        const sidebar = this.container || document.getElementById('app-sidebar');
        if (!resizer || !sidebar) return;

        let startX = 0;
        let startWidth = 0;
        let isDragging = false;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(64, Math.min(360, startWidth + deltaX));

            if (newWidth < 110) {
                if (!this.isCollapsed) {
                    this.isCollapsed = true;
                    sidebar.classList.add('collapsed');
                }
                sidebar.style.width = '6.4rem';
            } else {
                if (this.isCollapsed) {
                    this.isCollapsed = false;
                    sidebar.classList.remove('collapsed');
                }
                sidebar.style.width = `${newWidth}px`;
            }
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            resizer.classList.remove('is-dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        resizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startWidth = sidebar.getBoundingClientRect().width;
            resizer.classList.add('is-dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        resizer.addEventListener('dblclick', () => {
            this.toggle();
        });
    }

    redraw() {
        if (this.container) {
            this.init(this.container);
        }
    }

    // This is for compatibility with existing calls in app.js
    render(activeItem = 'dashboard') {
        this.activeItem = activeItem;
        // Since app.js calls sidebar.render() which returns a string, 
        // we keep this but it's better to use init() once.
        return this.getTemplate();
    }

    getIcon(type, size = 16) {
        const s = size;
        const icons = {
            'home': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            'folder': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>`,
            'image': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`,
            'video': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></svg>`,
            'mic': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>`,
            'message': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>`,
            'zap': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`
        };
        return icons[type] || icons['home'];
    }
}

window.GlobalSidebar = new GlobalSidebar();
