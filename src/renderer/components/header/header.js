// components/header/header.js
/**
 * 初始化头部组件
 */
function initializeHeader() {
    loadHeaderTemplate();
    setupHeaderEventListeners();
}

/**
 * 加载头部模板
 */
function loadHeaderTemplate() {
    fetch('components/header/header.html')
        .then(response => response.text())
        .then(html => {
            const header = document.getElementById('main-header');
            if (header) {
                header.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('加载头部模板失败:', error);
        });
}

/**
 * 设置头部事件监听器
 */
function setupHeaderEventListeners() {
    // 等待DOM更新后绑定事件
    setTimeout(() => {
        document.getElementById('settings-btn')?.addEventListener('click', handleSettingsClick);
        document.getElementById('history-btn')?.addEventListener('click', handleHistoryClick);
        document.getElementById('projects-btn')?.addEventListener('click', handleProjectsClick);
    }, 100);
}

/**
 * 处理设置按钮点击
 */
function handleSettingsClick() {
    console.log('设置按钮被点击');
    // 实际项目中会打开设置模态框
}

/**
 * 处理项目按钮点击
 */
function handleProjectsClick() {
    console.log('项目按钮被点击');
    // 实际项目中会显示项目列表
}