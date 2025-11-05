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
            uploadAudioBtn.addEventListener('click', handleUploadAudio);
        }
        
        // 录制音频按钮
        const recordAudioBtn = document.getElementById('record-audio-btn');
        if (recordAudioBtn) {
            recordAudioBtn.addEventListener('click', handleRecordAudio);
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
        
        // 相似度滑块
        const similaritySlider = document.getElementById('similarity');
        if (similaritySlider) {
            similaritySlider.addEventListener('input', handleSimilarityChange);
        }
        
        // 语速滑块
        const speechRateSlider = document.getElementById('speech-rate');
        if (speechRateSlider) {
            speechRateSlider.addEventListener('input', handleSpeechRateChange);
        }
        
        // 去噪处理开关
        const noiseReductionCheckbox = document.getElementById('noise-reduction');
        if (noiseReductionCheckbox) {
            noiseReductionCheckbox.addEventListener('change', handleNoiseReductionChange);
        }
        
        // 停顿处理开关
        const pauseProcessingCheckbox = document.getElementById('pause-processing');
        if (pauseProcessingCheckbox) {
            pauseProcessingCheckbox.addEventListener('change', handlePauseProcessingChange);
        }
    }, 100);
}

/**
 * 处理上传音频按钮点击
 */
function handleUploadAudio() {
    console.log('上传音频按钮被点击');
    
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
 * 处理录制音频按钮点击
 */
function handleRecordAudio() {
    console.log('录制音频按钮被点击');
    
    // 检查浏览器是否支持getUserMedia API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 请求访问麦克风
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // 创建一个音频录制对象
                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];
                
                // 开始录制
                mediaRecorder.start();
                
                // 创建一个模态框来显示录制状态
                const modal = document.createElement('div');
                modal.className = 'recording-modal';
                modal.innerHTML = `
                    <div class="recording-container">
                        <div class="recording-header">
                            <h3>录制音频</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="recording-preview">
                            <div class="recording-indicator">
                                <div class="recording-dot"></div>
                                <p>正在录制...</p>
                            </div>
                        </div>
                        <div class="recording-controls">
                            <button class="stop-btn">停止录制</button>
                            <button class="cancel-btn">取消</button>
                        </div>
                    </div>
                `;
                
                // 添加到页面
                document.body.appendChild(modal);
                
                // 绑定关闭按钮事件
                modal.querySelector('.close-btn').addEventListener('click', function() {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
                
                // 绑定取消按钮事件
                modal.querySelector('.cancel-btn').addEventListener('click', function() {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
                
                // 绑定停止录制按钮事件
                modal.querySelector('.stop-btn').addEventListener('click', function() {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(modal);
                });
                
                // 监听数据可用事件
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });
                
                // 监听停止事件
                mediaRecorder.addEventListener("stop", () => {
                    // 创建音频文件
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const file = new File([audioBlob], 'recorded-audio.wav', { type: 'audio/wav' });
                    handleAudioFile(file);
                });
            })
            .catch(function(err) {
                console.error('无法访问麦克风:', err);
                alert('无法访问麦克风，请检查权限设置');
            });
    } else {
        alert('您的浏览器不支持音频录制功能');
    }
}

/**
 * 处理音频文件（无论是上传还是录制）
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
        // 查找左侧预览区域并显示音频
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

/**
 * 处理播放声音按钮点击
 */
function handlePlayVoiceClick() {
    console.log('播放声音按钮被点击');
    
    // 查找生成的音频元素
    const generatedAudio = document.getElementById('generated-audio');
    if (generatedAudio) {
        generatedAudio.play();
    } else {
        alert('请先生成声音');
    }
}

/**
 * 处理下载按钮点击
 */
async function handleDownloadVoiceClick() {
    console.log('下载按钮被点击');
    
    // 查找生成的音频数据
    const generatedAudioDataInput = document.getElementById('generated-audio-data');
    if (generatedAudioDataInput) {
        const audioDataUrl = generatedAudioDataInput.value;
        // 创建下载链接
        const link = document.createElement('a');
        link.href = audioDataUrl;
        link.download = 'generated-voice.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('请先生成声音');
    }
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
            
            if (!text.trim()) {
                alert('请输入要合成的文本');
                return;
            }
            
            // 获取上传的音频
            let audioSrc = null;
            const uploadedAudioInput = document.getElementById('uploaded-audio-data');
            if (uploadedAudioInput) {
                audioSrc = uploadedAudioInput.value;
            } else {
                alert('请先上传音频文件');
                return;
            }
            
            // 调用AI服务克隆声音
            const result = await window.electronAPI.cloneVoice({
                audio: audioSrc,
                text: text
            });
            
            console.log('AI声音克隆结果:', result);
            
            // 显示结果
            if (result.status === 'success') {
                // 在预览区域显示生成的音频
                const previewPlaceholder = document.querySelector('.right-panel .preview-placeholder');
                if (previewPlaceholder) {
                    previewPlaceholder.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">🔊</div>
                            <p>声音已生成</p>
                            <audio id="generated-audio" controls style="width: 100%; margin-top: 10px;">
                                <source src="${result.audio_url}" type="audio/mpeg">
                            </audio>
                            <!-- 添加隐藏的input来存储音频数据 -->
                            <input type="hidden" id="generated-audio-data" value="${result.audio_url}">
                        </div>
                    `;
                }
            } else {
                alert('生成失败: ' + (result.message || '未知错误'));
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

// 导出函数供外部调用
export { loadVoiceCloningContent };