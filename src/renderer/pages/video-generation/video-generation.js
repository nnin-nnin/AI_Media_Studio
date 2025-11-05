// pages/video-generation/video-generation.js
/**
 * 加载生成视频页面内容
 */
function loadVideoGenerationContent() {
    const contentContainer = document.getElementById('video-generation-content');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="section">
            <h3>模板与素材</h3>
            <div class="template-grid">
                <div class="template-chip" data-template="lecture">讲台演说</div>
                <div class="template-chip" data-template="travel">旅行Vlog</div>
                <div class="template-chip" data-template="montage">卡点混剪</div>
                <div class="template-chip" data-template="mv">手绘MV</div>
            </div>
        </div>

        <div class="section">
            <h3>提示词输入</h3>
            <textarea placeholder="如：活泼校园风，节奏明快，明亮色调..." class="prompt-input large" id="video-prompt"></textarea>
        </div>

        <div class="section">
            <h3>参数调节</h3>
            <div class="parameters">
                <div class="param-group">
                    <label>分辨率</label>
                    <div class="button-group">
                        <button class="param-btn active" data-orientation="portrait">竖屏</button>
                        <button class="param-btn" data-orientation="landscape">横屏</button>
                        <button class="param-btn" data-orientation="square">方形</button>
                    </div>
                </div>
                <div class="slider-control">
                    <label>时长 (秒)</label>
                    <input type="range" min="1" max="60" value="10" id="duration">
                </div>
                <div class="slider-control">
                    <label>帧率</label>
                    <input type="range" min="15" max="60" value="30" id="frame-rate">
                </div>
                <div class="toggle-control">
                    <label>稳像</label>
                    <label class="switch">
                        <input type="checkbox" id="stabilization" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-control">
                    <label>自动字幕</label>
                    <label class="switch">
                        <input type="checkbox" id="auto-subtitles">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-control">
                    <label>背景音乐</label>
                    <label class="switch">
                        <input type="checkbox" id="background-music">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="preview-actions">
                <div class="upload-area">
                    <button class="upload-btn" id="upload-video-btn">
                        <span class="icon">⬆️</span>
                        选择图片
                    </button>
                    <button class="upload-btn" id="capture-video-btn">
                        <span class="icon">📷</span>
                        拍摄照片
                    </button>
                    <p class="upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
                </div>
            </div>
        </div>

        <div class="section">
            <button class="primary-btn" id="generate-video-btn">
                <span class="icon">🎬</span>
                生成视频
            </button>
        </div>
    `;
    
    // 绑定事件监听器
    setupVideoGenerationEventListeners();
}

/**
 * 设置生成视频页面事件监听器
 */
function setupVideoGenerationEventListeners() {
    // 等待DOM更新后绑定事件
    setTimeout(() => {
        // 模板选择
        document.querySelectorAll('.template-chip[data-template]').forEach(chip => {
            chip.addEventListener('click', handleVideoTemplateSelect);
        });
        
        // 上传按钮
        document.getElementById('upload-video-btn')?.addEventListener('click', handleUploadImageClick);
        document.getElementById('capture-video-btn')?.addEventListener('click', handleCaptureImageClick);
        
        // 参数调节
        document.querySelectorAll('.param-btn[data-orientation]').forEach(button => {
            button.addEventListener('click', handleOrientationChange);
        });
        
        // 滑块控制
        document.getElementById('duration')?.addEventListener('input', handleDurationChange);
        document.getElementById('frame-rate')?.addEventListener('input', handleFrameRateChange);
        
        // 开关控制
        document.getElementById('stabilization')?.addEventListener('change', handleStabilizationChange);
        document.getElementById('auto-subtitles')?.addEventListener('change', handleAutoSubtitlesChange);
        document.getElementById('background-music')?.addEventListener('change', handleBackgroundMusicChange);
        
        // 生成按钮
        document.getElementById('generate-video-btn')?.addEventListener('click', handleGenerateVideoClick);
    }, 100);
}

/**
 * 处理视频模板选择
 */
function handleVideoTemplateSelect(event) {
    const template = event.target.getAttribute('data-template');
    console.log('选择视频模板:', template);
    
    // 更新选中状态
    document.querySelectorAll('.template-chip').forEach(chip => {
        chip.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 根据模板类型设置对应的提示词
    const promptMap = {
        'lecture': '教室场景，老师在讲台上授课，学生认真听讲，教育风格，明亮光线',
        'travel': '户外风景，旅行拍摄，移动镜头，自然风光，第一人称视角',
        'montage': '快节奏剪辑，多场景切换，时尚动感，炫酷转场效果',
        'mv': '手绘动画风格，色彩丰富，流畅线条，音乐节奏同步'
    };
    
    const promptInput = document.getElementById('video-prompt');
    if (promptInput && promptMap[template]) {
        promptInput.value = promptMap[template];
    }
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
        // 创建一个图片对象来获取原始尺寸
        const img = new Image();
        img.onload = function() {
            // 检查图片尺寸，如果宽度小于300像素则进行调整
            let imageDataURL = e.target.result;
            if (img.width < 300) {
                // 创建canvas来调整图片尺寸
                const canvas = document.createElement('canvas');
                // 设置新尺寸，保持宽高比
                const scale = 300 / img.width;
                canvas.width = 300;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                // 绘制调整后的图片
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 获取调整后的图片数据
                imageDataURL = canvas.toDataURL('image/jpeg', 0.9);
            }
            
            // 查找左侧预览区域并显示图像
            const previewContent = document.querySelector('.left-panel .preview-content');
            if (previewContent) {
                previewContent.innerHTML = `
                    <div class="preview-container">
                        <img src="${imageDataURL}" alt="预览图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <!-- 添加隐藏的input来存储图片数据 -->
                    <input type="hidden" id="uploaded-image-data" value="${imageDataURL}">
                `;
            } else {
                // 如果没有找到left-panel中的preview-content，则查找任何preview-placeholder
                const previewPlaceholder = document.querySelector('.preview-placeholder');
                if (previewPlaceholder) {
                    previewPlaceholder.innerHTML = `
                        <div class="preview-container">
                            <img src="${imageDataURL}" alt="预览图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        <!-- 添加隐藏的input来存储图片数据 -->
                        <input type="hidden" id="uploaded-image-data" value="${imageDataURL}">
                    `;
                }
            }
            
            // 显示成功消息
            console.log('图像已加载:', file.name);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * 处理方向变化
 */
function handleOrientationChange(event) {
    const orientation = event.target.getAttribute('data-orientation');
    console.log('选择方向:', orientation);
    
    // 更新选中状态
    document.querySelectorAll('.param-btn[data-orientation]').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
}

/**
 * 处理时长变化
 */
function handleDurationChange(event) {
    const value = event.target.value;
    console.log('时长调整为:', value);
}

/**
 * 处理帧率变化
 */
function handleFrameRateChange(event) {
    const value = event.target.value;
    console.log('帧率调整为:', value);
}

/**
 * 处理稳像开关变化
 */
function handleStabilizationChange(event) {
    const checked = event.target.checked;
    console.log('稳像开关状态:', checked);
}

/**
 * 处理自动字幕开关变化
 */
function handleAutoSubtitlesChange(event) {
    const checked = event.target.checked;
    console.log('自动字幕开关状态:', checked);
}

/**
 * 处理背景音乐开关变化
 */
function handleBackgroundMusicChange(event) {
    const checked = event.target.checked;
    console.log('背景音乐开关状态:', checked);
}

/**
 * 处理一键生成视频按钮点击
 */
async function handleGenerateVideoClick() {
    console.log('一键生成视频按钮被点击');
    
    // 显示加载状态
    const generateBtn = document.getElementById('generate-video-btn');
    if (generateBtn) {
        const originalContent = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="icon">⏳</span> 生成中...';
        generateBtn.disabled = true;
        
        try {
            // 获取参数
            const promptInput = document.getElementById('video-prompt');
            const prompt = promptInput ? promptInput.value : '';
            
            // 获取上传的图片
            let imageSrc = null;
            const uploadedImageInput = document.getElementById('uploaded-image-data');
            if (uploadedImageInput) {
                imageSrc = uploadedImageInput.value;
            }
            
            // 获取时长
            const durationSlider = document.getElementById('duration');
            const duration = durationSlider ? parseInt(durationSlider.value) : 10;
            
            // 获取方向（转换为分辨率）
            const activeOrientation = document.querySelector('.param-btn.active');
            const orientation = activeOrientation ? activeOrientation.getAttribute('data-orientation') : 'portrait';
            
            // 根据方向设置分辨率 (使用模型支持的分辨率)
            let resolution = "720p";
            switch (orientation) {
                case 'landscape':
                    resolution = "720p"; // 使用720p而不是1920x1080
                    break;
                case 'square':
                    resolution = "720p"; // 使用720p而不是1080x1080
                    break;
                case 'portrait':
                default:
                    resolution = "720p"; // 竖屏也使用720p
                    break;
            }
            
            // 获取稳像设置
            const stabilizationCheckbox = document.getElementById('stabilization');
            const loop = stabilizationCheckbox ? stabilizationCheckbox.checked : true;
            
            // 调用AI服务生成视频
            const result = await window.electronAPI.generateVideo({
                prompt: prompt || '默认视频提示词',
                image_url: imageSrc, // 传入首帧参考图
                duration: duration,
                resolution: resolution,
                loop: loop
            });
            
            console.log('AI视频生成结果:', result);
            
            // 显示结果
            if (result.status === 'success') {
                // 在预览区域显示生成的视频
                const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
                if (previewPlaceholder) {
                    previewPlaceholder.innerHTML = `
                        <div style="text-align: center; padding: 10px;">
                            <video controls autoplay style="max-width: 100%; max-height: 100%;">
                                <source src="${result.video_url}" type="video/mp4">
                                您的浏览器不支持视频播放。
                            </video>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">视频已生成</p>
                        </div>
                    `;
                }
            } else {
                // 显示错误信息
                const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
                if (previewPlaceholder) {
                    previewPlaceholder.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                            <p>视频生成失败</p>
                            <p style="font-size: 12px; color: #666;">错误信息: ${result.message || '未知错误'}</p>
                        </div>
                    `;
                }
                alert('生成失败: ' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('生成过程中出错:', error);
            
            // 显示错误信息
            const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
            if (previewPlaceholder) {
                previewPlaceholder.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                        <p>视频生成过程中出现错误</p>
                        <p style="font-size: 12px; color: #666;">请查看控制台了解详情</p>
                    </div>
                `;
            }
            
            alert('生成过程中出现错误，请查看控制台了解详情');
        } finally {
            // 恢复按钮状态
            if (generateBtn) {
                generateBtn.innerHTML = originalContent;
                generateBtn.disabled = false;
            }
        }
    }
}

// 导出函数供外部调用
export { loadVideoGenerationContent };