// pages/face-swap/face-swap.js
/**
 * 加载变脸图片页面内容
 */
function loadFaceSwapContent() {
    const contentContainer = document.getElementById('face-swap-content');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="section">
            <h3>模板与素材</h3>
            <div class="template-grid">
                <div class="template-chip" data-template="prompt1">超人</div>
                <div class="template-chip" data-template="prompt2">漫画头像</div>
                <div class="template-chip" data-template="prompt3">职业装扮</div>
            </div>
        </div>

        <div class="section">
            <h3>提示词编辑</h3>
            <div class="prompt-editor">
                <textarea placeholder="输入提示词..." class="prompt-input" id="positive-prompt"></textarea>
            </div>
        </div>
        
        <div class="section">
            <div class="preview-actions">
                <div class="upload-area">
                    <button class="upload-btn" id="upload-image-btn">
                        <span class="icon">⬆️</span>
                        选择图片
                    </button>
                    <button class="upload-btn" id="capture-image-btn">
                        <span class="icon">📷</span>
                        拍摄照片
                    </button>
                    <p class="upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <button class="primary-btn" id="generate-btn">
                <span class="icon">⚡</span>
                生成
            </button>
        </div>
    `;
    
    // 绑定事件监听器
    setupFaceSwapEventListeners();
}

/**
 * 设置变脸图片页面事件监听器
 */
function setupFaceSwapEventListeners() {
    // 等待DOM更新后绑定事件
    setTimeout(() => {
        // 模板选择
        document.querySelectorAll('.template-chip[data-template]').forEach(chip => {
            chip.addEventListener('click', handleTemplateSelect);
        });
        
        // 上传图片按钮
        const uploadImageBtn = document.getElementById('upload-image-btn');
        if (uploadImageBtn) {
            uploadImageBtn.addEventListener('click', handleUploadImageClick);
        }
        
        // 拍摄照片按钮
        const captureImageBtn = document.getElementById('capture-image-btn');
        if (captureImageBtn) {
            captureImageBtn.addEventListener('click', handleCaptureImageClick);
        }
        
        // 生成按钮
        document.getElementById('generate-btn')?.addEventListener('click', handleGenerateClick);
        
        // 参数调节
        document.querySelectorAll('.param-btn[data-ratio]').forEach(button => {
            button.addEventListener('click', handleRatioChange);
        });
        
        // 滑块控制
        document.getElementById('style-strength')?.addEventListener('input', handleStyleStrengthChange);
        document.getElementById('cfg-value')?.addEventListener('input', handleCfgChange);
        document.getElementById('steps-value')?.addEventListener('input', handleStepsChange);
        
        // 开关控制
        document.getElementById('preserve-features')?.addEventListener('change', handlePreserveFeaturesChange);
    }, 100);
}

/**
 * 处理模板选择
 */
function handleTemplateSelect(event) {
    const template = event.target.getAttribute('data-template');
    console.log('选择模板:', template);
    
    // 更新选中状态
    document.querySelectorAll('.template-chip').forEach(chip => {
        chip.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 根据模板类型设置对应的提示词
    const promptMap = {
        'prompt1': '照片中的人脸保持不变。身体变成超人，强壮的身体，披风，标志性的S标志，正义的表情',
        'prompt2': '照片中的人脸保持不变。漫画风格，鲜明的色彩，夸张的表情，线条艺术，日式动漫',
        'prompt3': '照片中的人脸保持不变。职业装，西装革履，领带，专业表情，办公室背景'
    };
    
    const promptInput = document.getElementById('positive-prompt');
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
 * 处理一键生成按钮点击
 */
async function handleGenerateClick() {
    console.log('换脸开始');
    
    // 显示加载状态
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        const originalContent = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="icon">⏳</span> 生成中...';
        generateBtn.disabled = true;
        
        // 获取提示词
        const promptInput = document.getElementById('positive-prompt');
        const prompt = promptInput ? promptInput.value : '';
        
        // 获取选中的模板
        const selectedTemplate = document.querySelector('.template-chip.selected');
        const template = selectedTemplate ? selectedTemplate.getAttribute('data-template') : '';
        
        // 获取上传的图片 - 使用更可靠的方法
        let imageSrc = null;
        const uploadedImageInput = document.getElementById('uploaded-image-data');
        imageSrc = uploadedImageInput.value;
        console.log('上传的图片:', imageSrc);
        
        const result = await window.electronAPI.editImage({
            prompt: prompt,
            image: imageSrc, // 传入图片数据
            // size: '1024x1024'
        });
        
        console.log('AI生成结果:', result);
        
        // 显示结果
        if (result.status === 'success') {
            // 在预览区域显示生成的图片
            const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
            if (previewPlaceholder) {
                previewPlaceholder.innerHTML = `
                    <img src="${result.image_url}" alt="AI生成图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                `;
            }
        } else {
            alert('生成失败: ' + (result.message));
        }

        
        // 恢复按钮状态
        if (generateBtn) {
            generateBtn.innerHTML = originalContent;
            generateBtn.disabled = false;
        }
    }
}

/**
 * 使用AI处理图片
 * @param {string} prompt - 提示词
 * @param {string} imageSrc - 图片数据URL
 */
async function processImageWithAI(prompt, imageSrc) {
    try {
        console.log('开始AI图片处理:', prompt);
        
        // 保存图片到临时文件
        const fileName = 'input_image_' + Date.now() + '.png';
        let imagePath;
        
        if (window.electronAPI && window.electronAPI.saveImageFile) {
            imagePath = await window.electronAPI.saveImageFile(fileName, imageSrc);
            console.log('图片已保存到:', imagePath);
        } else {
            console.warn('无法保存图片到本地文件，使用数据URL');
            imagePath = imageSrc; // 回退到使用数据URL
        }
        
        // 调用JavaScript版本的AI图片处理脚本
        if (window.electronAPI && window.electronAPI.runPythonScript) {
            console.log('调用JavaScript脚本处理图片...');
            // 使用JavaScript版本的脚本 (注意这里改为edit_photo_js.js)
            const result = await window.electronAPI.runPythonScript(
                'edit_photo_js.js',
                ['--input', imagePath, '--prompt', prompt]
            );
            
            console.log('JavaScript脚本执行结果:', result);
            
            // 检查是否有错误返回
            if (result.error) {
                throw new Error(result.error);
            }
            
            // 解析脚本输出的生成文件路径
            let generatedImageName = null;
            if (result.stdout) {
                try {
                    // 尝试解析JSON格式的输出
                    const scriptResult = JSON.parse(result.stdout);
                    if (scriptResult.status === "success") {
                        generatedImageName = scriptResult.saved_path;
                    }
                } catch (parseError) {
                    console.error('解析脚本输出失败:', parseError);
                    // 如果JSON解析失败，回退到正则表达式方式
                    const match = result.stdout.match(/::GENERATED_FILE::([^\s]+)/);
                    if (match && match[1]) {
                        generatedImageName = match[1];
                    }
                }
            }
            
            // 显示结果
            if (generatedImageName && window.electronAPI.readImageFile) {
                // 使用API读取生成的图片文件
                const imageDataUrl = await window.electronAPI.readImageFile(generatedImageName);
                showResultPreview(imageDataUrl);
            } else {
                showResultPreview();
            }
        } else {
            console.warn('未检测到脚本执行API，使用模拟结果');
            
            // 模拟处理过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 显示结果
            showResultPreview();
        }
        
        // 恢复按钮状态
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="icon">⚡</span> 一键生成';
        }
        
        console.log('AI图片处理完成');
    } catch (error) {
        console.error('AI图片处理失败:', error);
        
        // 恢复按钮状态
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="icon">⚡</span> 一键生成';
        }
        
        // 显示用户友好的错误信息
        let errorMessage = 'AI图片处理失败';
        if (error && error.error) {
            // 如果是脚本错误，显示具体的错误信息
            errorMessage += ': ' + error.error;
        } else if (error && error.message) {
            errorMessage += ': ' + error.message;
        } else {
            errorMessage += ': ' + String(error);
        }
        
        alert(errorMessage);
    }
}

/**
 * 显示结果预览
 */
function showResultPreview(imageDataUrl) {
    const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
    if (!previewPlaceholder) return;
    
    previewPlaceholder.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img src="${imageDataUrl}" alt="AI生成图片" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>
    `;
}

/**
 * 处理分辨率比例变化
 */
function handleRatioChange(event) {
    const ratio = event.target.getAttrSeedreamibute('data-ratio');
    console.log('选择分辨率比例:', ratio);
    
    // 更新选中状态
    document.querySelectorAll('.param-btn[data-ratio]').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 导出函数供外部调用
export { loadFaceSwapContent };