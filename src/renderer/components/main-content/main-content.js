// components/main-content/main-content.js
/**
 * 初始化主内容区域
 */
function initializeMainContent() {
    // 主内容区域将在页面切换时动态加载
}

/**
 * 页面配置信息
 */
const pageConfig = {
    'face-swap': {
        title: '变脸图片',
        icon: '🖼️',
        modulePath: '../../pages/face-swap/face-swap.js',
        loadFunction: 'loadFaceSwapContent'
    },
    'video-generation': {
        title: '生成视频',
        icon: '🎬',
        modulePath: '../../pages/video-generation/video-generation.js',
        loadFunction: 'loadVideoGenerationContent'
    },
    'voice-cloning': {
        title: '克隆声音',
        icon: '🔊',
        modulePath: '../../pages/voice-cloning/voice-cloning.js',
        loadFunction: 'loadVoiceCloningContent'
    }
};

/**
 * 生成页面导航HTML
 */
function generateNavigationHTML(activePage) {
    return `
        <div class="tab-navigation">
            ${Object.entries(pageConfig).map(([pageId, config]) => `
                <button class="tab-btn ${pageId === activePage ? 'active' : ''}" data-page="${pageId}">
                    <span class="icon">${config.icon}</span>
                    ${config.title}
                </button>
            `).join('')}
        </div>
    `;
}


/**
 * 生成页面内容HTML
 */
function generatePageContentHTML(pageId) {
    const config = pageConfig[pageId];
    return `
        <div class="layout-container">
            <div class="left-panel">
                ${generateNavigationHTML(pageId)}
                
                <div class="tab-content">
                    <div class="tab-pane active" id="${pageId}-content">
                        <!-- ${config.title}内容将在这里加载 -->
                    </div>
                </div>
            </div>
            
            <div class="right-panel">
                <div class="preview-container">
                    <div class="preview-header">
                        <h3>预览</h3>
                    </div>
                    <div class="preview-content">
                        <div class="preview-placeholder">
                            <span class="preview-icon">👁️</span>
                            <p>预览内容将显示在这里</p>
                        </div>
                    </div>
                    <div class="preview-actions">
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 加载变脸图片页面
 * @param {HTMLElement} container - 容器元素
 */
function loadFaceSwapPage(container) {
    container.innerHTML = generatePageContentHTML('face-swap');
    
    // 动态加载变脸页面的具体内容
    import('../../pages/face-swap/face-swap.js').then(module => {
        module.loadFaceSwapContent();
        setupMainContentEventListeners();
    });
}

/**
 * 加载生成视频页面
 * @param {HTMLElement} container - 容器元素
 */
function loadVideoGenerationPage(container) {
    container.innerHTML = generatePageContentHTML('video-generation');
    
    // 动态加载视频生成页面的具体内容
    import('../../pages/video-generation/video-generation.js').then(module => {
        module.loadVideoGenerationContent();
    });
}

/**
 * 加载克隆声音页面
 * @param {HTMLElement} container - 容器元素
 */
function loadVoiceCloningPage(container) {
    container.innerHTML = generatePageContentHTML('voice-cloning');
    
    // 动态加载声音克隆页面的具体内容
    import('../../pages/voice-cloning/voice-cloning.js').then(module => {
        module.loadVoiceCloningContent();
    });
}

/**
 * 设置主内容区域事件监听器
 */
function setupMainContentEventListeners() {
    // 等待DOM更新后绑定事件
    setTimeout(() => {
        // 绑定Tab切换事件
        document.querySelectorAll('.tab-btn[data-page]').forEach(button => {
            button.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                showPage(page);
                history.pushState({ page: page }, '', `#${page}`);
            });
        });
    }, 100);
}
