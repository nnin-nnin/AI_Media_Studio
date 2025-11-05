// app.js - 主应用文件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initializeApp();
});

/**
 * 初始化应用
 */
function initializeApp() {
    // 初始化各个组件
    initializeHeader();
    initializeMainContent();
    initializeFooter();
    
    // 设置路由变化监听
    setupRouting();
    
    // 设置全局事件监听
    setupGlobalEventListeners();
}

/**
 * 设置路由变化监听
 */
function setupRouting() {
    // 默认显示变脸图片页面
    showPage('face-swap');
    
    // 监听浏览器前进后退
    window.addEventListener('popstate', function(event) {
        const page = event.state ? event.state.page : 'face-swap';
        showPage(page);
    });
}

/**
 * 设置全局事件监听
 */
function setupGlobalEventListeners() {
    // 全局点击事件处理
    document.addEventListener('click', function(event) {
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
        case 'face-swap':
            loadFaceSwapPage(mainContent);
            break;
        case 'video-generation':
            loadVideoGenerationPage(mainContent);
            break;
        case 'voice-cloning':
            loadVoiceCloningPage(mainContent);
            break;
        default:
            loadFaceSwapPage(mainContent);
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
}