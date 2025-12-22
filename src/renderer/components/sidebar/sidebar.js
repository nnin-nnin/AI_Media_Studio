/**
 * Global Sidebar Component (Studio Core Layout)
 * Zones: A (Hub), B (Engines), C (Sessions)
 */
/**
 * Global Sidebar Component (Studio Core Layout)
 * Zones: A (Hub), B (Engines), C (Sessions)
 */
class GlobalSidebar {
    constructor() {
        this.activeItem = 'dashboard';
        this.isCollapsed = false;

        // Listen for asset updates to refresh "Recent Work"
        window.addEventListener('assets-updated', () => {
            this.redraw();
        });
    }

    toggle() {
        this.isCollapsed = !this.isCollapsed;
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
        }
    }

    redraw() {
        const sidebarContainer = document.getElementById('app-sidebar');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = this.render(this.activeItem);
        }
    }

    render(activeItem = 'dashboard') {
        this.activeItem = activeItem;

        // Fetch Recent Assets (Top 5)
        const recentAssets = window.AssetManager ? window.AssetManager.getRecent('all', 5) : [];

        let recentWorkHTML = '';
        if (recentAssets.length > 0) {
            recentWorkHTML = recentAssets.map(asset => {
                let targetPage = 'assets';
                let icon = 'folder';

                // Map type to studio page
                if (asset.type === 'image') { targetPage = 'face-swap'; icon = 'image'; }
                else if (asset.type === 'video') { targetPage = 'video-generation'; icon = 'video'; }
                else if (asset.type === 'audio') { targetPage = 'voice-cloning'; icon = 'mic'; }
                else if (asset.type === 'vision') { targetPage = 'realtime-vision'; icon = 'zap'; }

                // Use prompt or ID as label
                const label = asset.prompt || `Asset ${asset.id.substring(0, 4)}`;
                return this.renderSessionItem(label, icon, asset.id);
            }).join('');
        } else {
            recentWorkHTML = `<div class="session-item" style="cursor:default; opacity:0.5; padding-left:14px;">No recent work</div>`;
        }

        // Define navigation structure
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
                ${this.renderNavItem('dashboard', 'Home', activeItem === 'dashboard', 'home')}
                ${this.renderNavItem('assets', 'Assets', activeItem === 'assets', 'folder')}
                
                <div class="nav-divider"></div>
                
                <!-- Zone B: CREATE ENGINES -->
                <div class="sidebar-group-label">STUDIOS</div>
                ${this.renderNavItem('face-swap', 'Image Studio', activeItem === 'face-swap', 'image')}
                ${this.renderNavItem('video-generation', 'Video Studio', activeItem === 'video-generation', 'video')}
                ${this.renderNavItem('voice-cloning', 'Audio Studio', activeItem === 'voice-cloning', 'mic')}
                ${this.renderNavItem('realtime-vision', 'Vision Studio', activeItem === 'realtime-vision', 'zap')}

                <div class="nav-divider"></div>

                <!-- Zone C: RECENT WORK (Dynamic) -->
                <div class="sidebar-group-label">RECENT WORK</div>
                <div class="session-list">
                     ${recentWorkHTML}
                </div>
            </div>

            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar">M</div>
                    <div class="user-details">
                        <span class="user-name">min</span>
                        <span class="user-plan">Pro Plan</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderNavItem(id, label, isActive, iconType) {
        const activeClass = isActive ? 'active' : '';
        const icon = this.getIcon(iconType);

        return `
            <button class="nav-list-item ${activeClass}" onclick="window.app.navigate('${id}')">
                ${icon}
                ${label}
            </button>
        `;
    }

    renderSessionItem(label, iconType, assetId) {
        const icon = this.getIcon(iconType, 14); // Smaller icon for sessions
        return `
            <div class="session-item" onclick="window.MediaPreview.open('${assetId}')">
                ${icon}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</span>
            </div>
        `;
    }

    getIcon(type, size = 16) {
        const s = size;
        const icons = {
            'home': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            'folder': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>`,
            'image': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`,
            'video': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></svg>`,
            'mic': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>`,
            'zap': `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`
        };
        return icons[type] || icons['home'];
    }
}

window.GlobalSidebar = new GlobalSidebar();
