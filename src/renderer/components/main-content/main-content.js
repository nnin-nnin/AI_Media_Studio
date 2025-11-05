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

/**
 * 处理上传图片按钮点击
 */
function handleUploadImageClick() {
    console.log('上传图片按钮被点击');
    
    // 创建一个隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // 添加change事件监听器
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });
    
    // 将文件输入元素添加到页面并触发点击
    document.body.appendChild(fileInput);
    fileInput.click();
    
    // 点击后移除元素
    fileInput.addEventListener('blur', function() {
        document.body.removeChild(fileInput);
    });
}

/**
 * 处理拍摄照片按钮点击
 */
function handleCaptureImageClick() {
    console.log('拍摄照片按钮被点击');
    
    // 检查浏览器是否支持getUserMedia API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 请求访问摄像头
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // 创建一个视频元素用于显示摄像头画面
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                // 创建一个模态框来显示摄像头画面
                const modal = document.createElement('div');
                modal.className = 'camera-modal';
                modal.innerHTML = `
                    <div class="camera-container">
                        <div class="camera-header">
                            <h3>拍摄照片</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="camera-preview"></div>
                        <div class="camera-controls">
                            <button class="capture-btn">拍摄</button>
                            <button class="cancel-btn">取消</button>
                        </div>
                    </div>
                `;
                
                // 将视频元素添加到预览区域
                modal.querySelector('.camera-preview').appendChild(video);
                
                // 添加到页面
                document.body.appendChild(modal);
                
                // 绑定关闭按钮事件
                modal.querySelector('.close-btn').addEventListener('click', function() {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
                
                // 绑定取消按钮事件
                modal.querySelector('.cancel-btn').addEventListener('click', function() {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
                
                // 绑定拍摄按钮事件
                modal.querySelector('.capture-btn').addEventListener('click', function() {
                    // 创建canvas来捕获当前帧
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // 将canvas转换为Blob对象
                    canvas.toBlob(function(blob) {
                        // 创建一个文件对象
                        const file = new File([blob], 'captured-image.png', { type: 'image/png' });
                        handleImageFile(file);
                    }, 'image/png');
                    
                    // 停止摄像头并关闭模态框
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
            })
            .catch(function(err) {
                console.error('无法访问摄像头:', err);
                alert('无法访问摄像头，请检查权限设置');
            });
    } else {
        alert('您的浏览器不支持摄像头功能');
    }
}

/**
 * 处理图像文件（无论是上传还是拍摄）
 * @param {File} file - 图像文件对象
 */
function handleImageFile(file) {
    // 检查文件类型
    if (!file.type.match('image.*')) {
        alert('请选择图像文件');
        return;
    }
    
    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('文件大小超过5MB限制');
        return;
    }
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = function(e) {
        // 查找左侧预览区域并显示图像
        const previewContent = document.querySelector('.left-panel .preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="预览图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <!-- 添加隐藏的input来存储图片数据 -->
                <input type="hidden" id="uploaded-image-data" value="${e.target.result}">
            `;
        } else {
            // 如果没有找到left-panel中的preview-content，则查找任何preview-placeholder
            const previewPlaceholder = document.querySelector('.preview-placeholder');
            if (previewPlaceholder) {
                previewPlaceholder.innerHTML = `
                    <div class="preview-container">
                        <img src="${e.target.result}" alt="预览图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <!-- 添加隐藏的input来存储图片数据 -->
                    <input type="hidden" id="uploaded-image-data" value="${e.target.result}">
                `;
            }
        }
        
        // 显示成功消息
        console.log('图像已加载:', file.name);
        
        // 在实际项目中，这里会将文件保存到本地供Python脚本处理
        // 通过 window.electronAPI.saveImageFile 可以实现
    };
    reader.readAsDataURL(file);
}

/**
 * 处理下载按钮点击
 */
function handleDownloadClick() {
    console.log('下载按钮被点击');
    
    // 查找预览区域中的图片
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!previewPlaceholder) {
        alert('没有找到预览内容');
        return;
    }
    
    const imgElement = previewPlaceholder.querySelector('img');
    if (!imgElement) {
        alert('没有可下载的图片');
        return;
    }
    
    // 创建临时的下载链接
    const link = document.createElement('a');
    link.href = imgElement.src;
    link.download = 'ai-generated-image-' + Date.now() + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 处理预览按钮点击
 */
function handlePreviewClick() {
    console.log('预览按钮被点击');
    
    // 查找预览区域中的图片
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!previewPlaceholder) {
        alert('没有找到预览内容');
        return;
    }
    
    const imgElement = previewPlaceholder.querySelector('img');
    if (!imgElement) {
        alert('没有可预览的图片');
        return;
    }
    
    // 创建模态框用于放大预览
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="image-preview-container">
            <div class="image-preview-header">
                <h3>图片预览</h3>
                <button class="close-preview-btn">&times;</button>
            </div>
            <div class="image-preview-content">
                <img src="${imgElement.src}" alt="预览图片" class="preview-image">
            </div>
            <div class="image-preview-footer">
                <button class="secondary-btn download-preview-btn">
                    <span class="icon">⬇️</span>
                    下载图片
                </button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 绑定关闭按钮事件
    const closeBtn = modal.querySelector('.close-preview-btn');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 绑定下载按钮事件
    const downloadBtn = modal.querySelector('.download-preview-btn');
    downloadBtn.addEventListener('click', function() {
        // 创建临时的下载链接
        const link = document.createElement('a');
        link.href = imgElement.src;
        link.download = 'ai-generated-image-' + Date.now() + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // 点击模态框背景关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * 处理保存模板按钮点击
 */
function handleSaveTemplateClick() {
    console.log('保存模板按钮被点击');
    // 实际项目中会处理保存模板逻辑
}
