// app.js - 主应用文件

let currentPageCleanup = null;

/**
 * 全局 HTML 转义工具函数，防止 XSS 注入
 * @param {string} str
 * @returns {string}
 */
window.escapeHTML = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * 注册当前页面的资源清理回调（切换页面时自动调用）
 * @param {Function} cleanupFn
 */
window.registerPageCleanup = function (cleanupFn) {
    currentPageCleanup = cleanupFn;
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
            // Sidebar active state is updated in showPage -> GlobalSidebar.setActive
        }
    };

    // Initialize Global Sidebar
    if (window.GlobalSidebar) {
        const sidebarContainer = document.getElementById('app-sidebar');
        if (sidebarContainer) {
            window.GlobalSidebar.init(sidebarContainer);
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

    // 切换页面前自动释放上一页的硬件/会话资源（摄像头、麦克风、WebRTC、轮询等）
    if (typeof currentPageCleanup === 'function') {
        try {
            currentPageCleanup();
        } catch (err) {
            console.warn('[Router] Page cleanup error:', err);
        }
        currentPageCleanup = null;
    }

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
            loadDashboardPage(mainContent);
    }

    // 更新激活状态
    updateActivePage(page);
    if (window.GlobalSidebar) {
        window.GlobalSidebar.setActive(page);
    }

    // 为 Studio 页面初始化可自由拖拽调整比例的分割线 (Splitter Resizer)
    setupStudioResizer(mainContent);
}

/**
 * 初始化工作室面板拖拽分割线
 * @param {HTMLElement} container
 */
function setupStudioResizer(container) {
    const layout = container.querySelector('.studio-layout');
    const controls = container.querySelector('.studio-controls');
    const viewport = container.querySelector('.studio-viewport');
    if (!layout || !controls || !viewport) return;

    let resizer = layout.querySelector('.studio-resizer');
    if (!resizer) {
        resizer = document.createElement('div');
        resizer.className = 'studio-resizer';
        resizer.title = '拖拽调整控制面板与画布比例 / 双击重置';
        layout.insertBefore(resizer, viewport);
    }

    // 恢复用户保存的面板偏好宽度
    const savedWidth = localStorage.getItem('ai_studio_controls_width');
    if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (parsed >= 260 && parsed <= 850) {
            controls.style.flex = `0 0 ${parsed}px`;
        }
    }

    let startX = 0;
    let startWidth = 0;
    let isDragging = false;

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const maxW = Math.max(500, Math.min(850, window.innerWidth - 300));
        const newWidth = Math.max(260, Math.min(maxW, startWidth + deltaX));
        controls.style.flex = `0 0 ${newWidth}px`;
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        resizer.classList.remove('is-dragging');
        document.body.classList.remove('is-studio-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const currentWidth = Math.round(controls.getBoundingClientRect().width);
        localStorage.setItem('ai_studio_controls_width', currentWidth);
    };

    resizer.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = controls.getBoundingClientRect().width;
        resizer.classList.add('is-dragging');
        document.body.classList.add('is-studio-resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    };

    resizer.ondblclick = () => {
        controls.style.flex = '0 0 clamp(28rem, 28vw, 42rem)';
        localStorage.removeItem('ai_studio_controls_width');
    };
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