// app.js - 主应用文件

// --- Global API Interceptor (Centralized Authorization) ---
const originalFetch = window.fetch;
window.fetch = async (resource, config = {}) => {
    // Check if the URL is an internal API call
    const isInternalApi = typeof resource === 'string' && resource.startsWith('/api/');

    if (isInternalApi) {
        // Automatically inject Authorization header if token exists
        const token = localStorage.getItem('ai_auth_token');
        if (token) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }

    return originalFetch(resource, config);
};

// 暴露初始化函数给外部回调
window.initializeApp = initializeApp;

// Wait for explicit call from index.html (which waits for i18n)
// document.addEventListener('DOMContentLoaded', ...);

/**
 * 初始化应用
 */
function initializeApp() {
    // 初始化各个组件
    // initializeHeader(); // Removed for Studio Layout
    // initializeMainContent(); // Removed
    // initializeFooter();      // Removed

    // 设置路由变化监听
    setupRouting();

    // Expose global navigation
    window.app = {
        navigate: (page) => {
            showPage(page);
            history.pushState({ page: page }, '', `#${page}`);
            // Update sidebar active state (simple re-render for now or class toggle)
            if (window.GlobalSidebar) {
                const sidebarContainer = document.getElementById('app-sidebar');
                if (sidebarContainer) {
                    // Ideally we just update classes, but full render is safer for prototype
                    sidebarContainer.innerHTML = window.GlobalSidebar.render(page);
                }
            }
        }
    };

    // Initialize Global Sidebar
    if (window.GlobalSidebar) {
        const sidebarContainer = document.getElementById('app-sidebar');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = window.GlobalSidebar.render('dashboard');
        }
    }

    // Set global event listeners
    setupGlobalEventListeners();

    // Listen for language changes to refresh UI
    window.addEventListener('language-changed', () => {
        console.log("Language changed, refreshing UI...");
        // Update document title
        if (window.i18n) document.title = window.i18n.t('APP_TITLE');

        // Refresh Sidebar
        if (window.GlobalSidebar) {
            window.GlobalSidebar.redraw();
        }

        // Refresh Current Page
        const hash = window.location.hash.slice(1) || 'dashboard';
        showPage(hash);
    });
}

/**
 * 设置路由变化监听
 */
function setupRouting() {
    // Default to 'dashboard'
    // check hash first
    const hash = window.location.hash.slice(1);
    const initialPage = hash || 'dashboard';
    showPage(initialPage);

    // Listen for browser navigation
    window.addEventListener('popstate', function (event) {
        const page = event.state ? event.state.page : 'dashboard';
        showPage(page);
    });
}

/**
 * 设置全局事件监听
 */
function setupGlobalEventListeners() {
    // 全局点击事件处理
    document.addEventListener('click', function (event) {
        // 处理页面切换
        if (event.target.matches('[data-page]')) {
            const page = event.target.getAttribute('data-page');
            showPage(page);
            history.pushState({ page: page }, '', `#${page}`);
        }
    });
}

/**
 * 显示指定页面
 * @param {string} page - 页面名称
 */
function showPage(page) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // 根据页面类型加载对应内容
    switch (page) {
        case 'dashboard':
            loadDashboardPage(mainContent);
            break;
        case 'home': // Legacy fallback
            if (typeof loadHomePage === 'function') loadHomePage(mainContent);
            else loadDashboardPage(mainContent);
            break;
        case 'face-swap':
            loadFaceSwapPage(mainContent);
            break;
        case 'video-generation':
            if (window.loadVideoGenerationPage) window.loadVideoGenerationPage(mainContent);
            break;
        case 'voice-cloning':
            if (window.loadVoiceCloningPage) window.loadVoiceCloningPage(mainContent);
            break;
        case 'realtime-vision':
            if (window.loadRealtimeVisionPage) window.loadRealtimeVisionPage(mainContent);
            break;
        case 'voice-chat':
            if (window.loadVoiceChatPage) window.loadVoiceChatPage(mainContent);
            break;
        case 'assets':
            if (window.loadAssetsPage) window.loadAssetsPage(mainContent);
            break;
        default:
            loadHomePage(mainContent);
    }

    // 更新激活状态
    updateActivePage(page);
}

/**
 * 更新激活页面状态
 * @param {string} page - 当前页面
 */
function updateActivePage(page) {
    // 移除所有激活状态
    document.querySelectorAll('[data-page]').forEach(el => {
        el.classList.remove('active');
    });

    // 添加当前页面激活状态
    const activeElement = document.querySelector(`[data-page="${page}"]`);
    if (activeElement) {
        activeElement.classList.add('active');
    }

    // 控制语言切换栏的显隐 (仅在首页显示)
    const utilBar = document.getElementById('global-util-bar');
    if (utilBar) {
        utilBar.style.display = (page === 'dashboard' || page === 'home') ? 'flex' : 'none';
    }
}