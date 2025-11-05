// components/footer/footer.js
/**
 * 初始化底部组件
 */
function initializeFooter() {
    loadFooterTemplate();
}

/**
 * 加载底部模板
 */
function loadFooterTemplate() {
    // 创建底部HTML内容
    const footerHTML = `
        <div class="copyright-info">
            © 2025 AI Media Studio - 教育版
        </div>
    `;
    
    const footer = document.getElementById('main-footer');
    if (footer) {
        footer.innerHTML = footerHTML;
        footer.className = 'bottom-bar';
    }
}
