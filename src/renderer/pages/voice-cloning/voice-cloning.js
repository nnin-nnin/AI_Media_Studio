// pages/voice-cloning/voice-cloning.js
/**
 * 加载克隆声音页面内容
 */
function loadVoiceCloningContent() {
    const contentContainer = document.getElementById('voice-cloning-content');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="section">
            <h3>素材与授权</h3>
            <div class="upload-area">
                <button class="upload-btn" id="upload-audio-btn">
                    <span class="icon">🎵</span>
                    上传音频
                </button>
                <button class="upload-btn" id="record-audio-btn">
                    <span class="icon">🎤</span>
                    录制音频
                </button>
                <div class="file-info">支持 WAV/MP3 格式</div>
            </div>
        </div>

        <div class="section">
            <h3>文本输入</h3>
            <textarea placeholder="输入要合成的语音文本..." class="prompt-input large" id="voice-text"></textarea>
        </div>

        <div class="section">
            <h3>参数调节</h3>
            <div class="parameters">
                <div class="slider-control">
                    <label>相似度</label>
                    <input type="range" min="0" max="100" value="80" id="similarity">
                </div>
                <div class="slider-control">
                    <label>语速</label>
                    <input type="range" min="0" max="100" value="50" id="speech-rate">
                </div>
                <div class="param-group">
                    <label>情感</label>
                    <div class="button-group">
                        <button class="param-btn active" data-emotion="neutral">中性</button>
                        <button class="param-btn" data-emotion="happy">开心</button>
                        <button class="param-btn" data-emotion="friendly">亲切</button>
                    </div>
                </div>
                <div class="toggle-control">
                    <label>去噪处理</label>
                    <label class="switch">
                        <input type="checkbox" id="noise-reduction" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-control">
                    <label>停顿处理</label>
                    <label class="switch">
                        <input type="checkbox" id="pause-processing">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="preview-actions">
                <button class="secondary-btn" id="play-voice-btn">
                    <span class="icon">▶️</span>
                    播放声音
                </button>
                <button class="secondary-btn" id="download-voice-btn">
                    <span class="icon">⬇️</span>
                    下载
                </button>
            </div>
        </div>

        <div class="section">
            <button class="primary-btn" id="generate-voice-btn">
                <span class="icon">🔊</span>
                一键生成
            </button>
        </div>
    `;
    
    // 绑定事件监听器
    setupVoiceCloningEventListeners();
}

/**
 * 设置克隆声音页面事件监听器
 */
function setupVoiceCloningEventListeners() {
    // 等待DOM更新后绑定事件
    setTimeout(() => {
        // 上传音频按钮
        const uploadAudioBtn = document.getElementById('upload-audio-btn');
        if (uploadAudioBtn) {
            uploadAudioBtn.addEventListener('click', () => {
                console.log('上传音频按钮被点击');
                // 实际项目中会处理文件上传
            });
        }
        
        // 录制音频按钮
        const recordAudioBtn = document.getElementById('record-audio-btn');
        if (recordAudioBtn) {
            recordAudioBtn.addEventListener('click', () => {
                console.log('录制音频按钮被点击');
                // 实际项目中会处理音频录制
            });
        }
        
        // 情感选择
        document.querySelectorAll('.param-btn[data-emotion]').forEach(button => {
            button.addEventListener('click', handleEmotionChange);
        });
        
        // 一键生成按钮
        const generateVoiceBtn = document.getElementById('generate-voice-btn');
        if (generateVoiceBtn) {
            generateVoiceBtn.addEventListener('click', handleGenerateVoiceClick);
        }
        
        // 播放声音按钮
        const playVoiceBtn = document.getElementById('play-voice-btn');
        if (playVoiceBtn) {
            playVoiceBtn.addEventListener('click', handlePlayVoiceClick);
        }
        
        // 下载按钮
        const downloadVoiceBtn = document.getElementById('download-voice-btn');
        if (downloadVoiceBtn) {
            downloadVoiceBtn.addEventListener('click', handleDownloadVoiceClick);
        }
    }, 100);
}

/**
 * 处理一键生成声音按钮点击
 */
async function handleGenerateVoiceClick() {
    console.log('一键生成声音按钮被点击');
    
    // 显示加载状态
    const generateBtn = document.getElementById('generate-voice-btn');
    if (generateBtn) {
        const originalContent = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="icon">⏳</span> 生成中...';
        generateBtn.disabled = true;
        
        try {
            // 获取参数
            const textInput = document.getElementById('voice-text');
            const text = textInput ? textInput.value : '';
            
            const similaritySlider = document.getElementById('similarity');
            const similarity = similaritySlider ? parseInt(similaritySlider.value) : 80;
            
            const speechRateSlider = document.getElementById('speech-rate');
            const speechRate = speechRateSlider ? parseInt(speechRateSlider.value) : 50;
            
            const activeEmotion = document.querySelector('.param-btn.active');
            const emotion = activeEmotion ? activeEmotion.getAttribute('data-emotion') : 'neutral';
            
            const noiseReductionCheckbox = document.getElementById('noise-reduction');
            const noiseReduction = noiseReductionCheckbox ? noiseReductionCheckbox.checked : true;
            
            const pauseProcessingCheckbox = document.getElementById('pause-processing');
            const pauseProcessing = pauseProcessingCheckbox ? pauseProcessingCheckbox.checked : true;
            
            // 调用AI服务生成声音
            // 注意：这里我们暂时没有实现声音生成功能，仅作演示
            console.log('声音生成参数:', {
                text: text || '默认文本',
                similarity: similarity,
                speechRate: speechRate,
                emotion: emotion,
                noiseReduction: noiseReduction,
                pauseProcessing: pauseProcessing
            });
            
            // 模拟生成过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 显示结果
            const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
            if (previewPlaceholder) {
                previewPlaceholder.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🔊</div>
                        <p>声音已生成</p>
                        <audio id="generated-audio" controls style="width: 100%; margin-top: 10px;">
                            <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFd2xqZ2RlY2RlZmhpb3F3fYOFiIqQlZmfo6etr7K1uLq8vsLGys3P0tXY29zh4+Xo6uzu8fP19/j5+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==" type="audio/wav">
                        </audio>
                        <input type="hidden" id="generated-audio-data" value="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFd2xqZ2RlY2RlZmhpb3F3fYOFiIqQlZmfo6etr7K1uLq8vsLGys3P0tXY29zh4+Xo6uzu8fP19/j5+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==">
                    </div>
                `;
            }
        } catch (error) {
            console.error('生成过程中出错:', error);
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

/**
 * 处理播放声音按钮点击
 */
function handlePlayVoiceClick() {
    console.log('播放声音按钮被点击');
    
    const audioElement = document.getElementById('generated-audio');
    if (audioElement) {
        audioElement.play();
    } else {
        alert('请先生成声音');
    }
}

/**
 * 处理下载声音按钮点击
 */
function handleDownloadVoiceClick() {
    console.log('下载声音按钮被点击');
    
    const audioDataInput = document.getElementById('generated-audio-data');
    if (audioDataInput) {
        const audioData = audioDataInput.value;
        
        // 创建临时的下载链接
        const link = document.createElement('a');
        link.href = audioData;
        link.download = 'ai-generated-voice-' + Date.now() + '.wav';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('请先生成声音');
    }
}

/**
 * 处理上传音频
 */
function handleUploadAudio() {
    console.log('上传音频按钮被点击');
    // 实际项目中会打开文件选择对话框
    // 创建一个隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    
    // 添加change事件监听器
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            handleAudioFile(file);
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
 * 处理录制音频
 */
function handleRecordAudio() {
    console.log('录制音频按钮被点击');
    // 实际项目中会打开录音设备
    alert('在实际应用中，这里会打开录音设备');
}

/**
 * 处理音频文件
 * @param {File} file - 音频文件对象
 */
function handleAudioFile(file) {
    // 检查文件类型
    if (!file.type.match('audio.*')) {
        alert('请选择音频文件');
        return;
    }
    
    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('文件大小超过10MB限制');
        return;
    }
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = function(e) {
        // 在预览区域显示音频信息
        const previewContent = document.querySelector('.left-panel .preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="preview-container">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🎵</div>
                        <p>音频文件已上传</p>
                        <p style="font-size: 12px; color: #666;">${file.name}</p>
                        <audio controls style="width: 100%; margin-top: 10px;">
                            <source src="${e.target.result}" type="${file.type}">
                        </audio>
                    </div>
                    <!-- 添加隐藏的input来存储音频数据 -->
                    <input type="hidden" id="uploaded-audio-data" value="${e.target.result}">
                </div>
            `;
        } else {
            // 如果没有找到left-panel中的preview-content，则查找任何preview-placeholder
            const previewPlaceholder = document.querySelector('.preview-placeholder');
            if (previewPlaceholder) {
                previewPlaceholder.innerHTML = `
                    <div class="preview-container">
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">🎵</div>
                            <p>音频文件已上传</p>
                            <p style="font-size: 12px; color: #666;">${file.name}</p>
                            <audio controls style="width: 100%; margin-top: 10px;">
                                <source src="${e.target.result}" type="${file.type}">
                            </audio>
                        </div>
                        <!-- 添加隐藏的input来存储音频数据 -->
                        <input type="hidden" id="uploaded-audio-data" value="${e.target.result}">
                    </div>
                `;
            }
        }
        
        // 显示成功消息
        console.log('音频已加载:', file.name);
    };
    reader.readAsDataURL(file);
}

/**
 * 处理相似度变化
 */
function handleSimilarityChange(event) {
    const value = event.target.value;
    console.log('相似度调整为:', value);
}

/**
 * 处理语速变化
 */
function handleSpeechRateChange(event) {
    const value = event.target.value;
    console.log('语速调整为:', value);
}

/**
 * 处理情感变化
 */
function handleEmotionChange(event) {
    const emotion = event.target.getAttribute('data-emotion');
    console.log('选择情感:', emotion);
    
    // 更新选中状态
    document.querySelectorAll('.param-btn[data-emotion]').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
}

/**
 * 处理去噪处理开关变化
 */
function handleNoiseReductionChange(event) {
    const checked = event.target.checked;
    console.log('去噪处理开关状态:', checked);
}

/**
 * 处理停顿处理开关变化
 */
function handlePauseProcessingChange(event) {
    const checked = event.target.checked;
    console.log('停顿处理开关状态:', checked);
}