document.addEventListener('DOMContentLoaded', function() {
    // Tab切换功能
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // 更新按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 显示对应的面板
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${tabId}-tab`) {
                    pane.classList.add('active');
                }
            });
        });
    });
    
    // 按钮组切换功能
    const buttonGroups = document.querySelectorAll('.button-group');
    buttonGroups.forEach(group => {
        const buttons = group.querySelectorAll('.param-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    });
    
    // 上传按钮功能
    const uploadButtons = document.querySelectorAll('.upload-btn');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent;
            if (buttonText.includes('上传')) {
                // 模拟文件选择
                alert('点击了上传按钮，实际项目中会打开文件选择对话框');
            } else if (buttonText.includes('拍摄') || buttonText.includes('录制')) {
                // 模拟拍照或录制
                alert('点击了拍摄/录制按钮，实际项目中会打开摄像头或录音设备');
            }
        });
    });
    
    // 一键生成按钮功能
    const generateButton = document.querySelector('.primary-btn');
    if (generateButton) {
        generateButton.addEventListener('click', async function() {
            // 获取当前激活的tab
            const activeTab = document.querySelector('.tab-btn.active');
            const tabType = activeTab ? activeTab.getAttribute('data-tab') : 'image';
            
            // 显示生成状态
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-info span:nth-child(2)');
            if (statusDot && statusText) {
                statusDot.style.backgroundColor = '#ff9800';
                statusText.textContent = '处理中...';
            }
            
            // 调用实际的AI功能
            await callAIFunction(tabType);
        });
    }
    
    // 参数滑块功能
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            // 实际项目中可以在这里处理滑块值变化
            console.log(`Slider ${this.previousElementSibling.textContent} changed to: ${this.value}`);
        });
    });
    
    // 开关切换功能
    const switches = document.querySelectorAll('.switch input');
    switches.forEach(switchEl => {
        switchEl.addEventListener('change', function() {
            const label = this.closest('.toggle-control').querySelector('label').textContent;
            console.log(`${label} switched ${this.checked ? 'on' : 'off'}`);
        });
    });
});

// 调用实际的AI功能
async function callAIFunction(tabType) {
    console.log(`调用 ${tabType} AI功能...`);
    
    try {
        let result;
        
        switch(tabType) {
            case 'image':
                // 调用图像生成功能
                result = await window.electronAPI.generateImage({
                    prompt: "一个奇幻的风景画，有山川、湖泊和城堡",
                    size: "1024x1024",
                    model: "doubao-seedream-4-0-250828"
                });
                break;
                
            case 'video':
                // 调用视频生成功能
                result = await window.electronAPI.generateVideo({
                    prompt: "无人机以极快速度穿越复杂障碍或自然奇观，带来沉浸式飞行体验",
                    model: "doubao-seedance-1-0-pro-fast-251015",
                    image_url: "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_i2v.png",
                    duration: 5,
                    resolution: "1080p",
                    output_path: "output_video.mp4"
                });
                break;
                
            case 'voice':
                // 语音功能暂时使用模拟
                await new Promise(resolve => setTimeout(resolve, 2000));
                result = { success: true };
                break;
                
            default:
                throw new Error(`未知的tab类型: ${tabType}`);
        }
        
        // 处理结果
        if (result.status === 'success') {
            // 更新状态为完成
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-info span:nth-child(2)');
            if (statusDot && statusText) {
                statusDot.style.backgroundColor = '#4caf50';
                statusText.textContent = '完成';
            }
            
            // 显示结果预览
            showResultPreview(tabType, result);
        } else {
            throw new Error(result.message || 'AI处理失败');
        }
        
    } catch (error) {
        console.error(`${tabType} 生成过程中出现错误:`, error);
        
        // 显示错误状态
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-info span:nth-child(2)');
        if (statusDot && statusText) {
            statusDot.style.backgroundColor = '#f44336';
            statusText.textContent = '失败';
        }
        
        alert(`处理失败: ${error.message}`);
    }
}

// 显示结果预览
function showResultPreview(tabType, result) {
    const previewContent = document.querySelector('.preview-content');
    if (!previewContent) return;
    
    let previewHTML = '';
    
    if (result && result.status === 'success') {
        if (tabType === 'image' && result.image_url) {
            previewHTML = `
                <div style="text-align: center;">
                    <img src="${result.image_url}" alt="生成的图片" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <p style="font-weight: 500; margin-top: 1rem;">AI变脸图片生成完成</p>
                </div>
            `;
        } else if (tabType === 'video' && result.video_url) {
            previewHTML = `
                <div style="text-align: center;">
                    <video controls style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <source src="${result.video_url}" type="video/mp4">
                        您的浏览器不支持视频播放。
                    </video>
                    <p style="font-weight: 500; margin-top: 1rem;">AI视频生成完成</p>
                </div>
            `;
        }
    }
    
    // 如果没有特定的预览内容，使用默认内容
    if (!previewHTML) {
        const previewPlaceholders = {
            'image': `
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🎭</div>
                    <p style="font-weight: 500;">AI变脸图片生成完成</p>
                    <p style="font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;">
                        这里将显示生成的变脸图片
                    </p>
                </div>
            `,
            'video': `
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🎬</div>
                    <p style="font-weight: 500;">AI视频生成完成</p>
                    <p style="font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;">
                        这里将显示生成的视频内容
                    </p>
                </div>
            `,
            'voice': `
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔊</div>
                    <p style="font-weight: 500;">AI语音合成完成</p>
                    <p style="font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;">
                        这里将提供语音试听功能
                    </p>
                </div>
            `
        };
        
        previewHTML = previewPlaceholders[tabType] || previewContent.innerHTML;
    }
    
    previewContent.innerHTML = previewHTML;
}

// 模板芯片点击功能
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('template-chip')) {
        // 移除其他芯片的选中状态
        document.querySelectorAll('.template-chip').forEach(chip => {
            chip.style.backgroundColor = '';
            chip.style.borderColor = '';
        });
        
        // 添加选中状态
        e.target.style.backgroundColor = '#e3f2fd';
        e.target.style.borderColor = '#2196f3';
        
        console.log(`Selected template: ${e.target.textContent}`);
    }
});