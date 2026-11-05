/**
 * Real-time Vision Page (AI Mirror)
 * Uses Decart AI SDK for low-latency video transformation.
 */
import './realtime-vision-layout.css';
import { Toast } from '../../components/toast.js';

// We use dynamic import because the project mostly uses non-module scripts,
// but the SDK requires ESM.
let decartClient = null;

async function loadRealtimeVisionPage(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="studio-layout fade-in">
            <!-- Col 2: Controls -->
            <div class="studio-controls vision-controls">
                <div class="studio-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('VISION_TITLE')}</div>
                    <div class="status-badge" style="background:rgba(16, 185, 129, 0.1); color:#10b981; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; border:1px solid rgba(16, 185, 129, 0.2);">LIVE</div>
                </div>

                <div class="vision-controls-body">
                    <!-- Engine & Key Status -->
                    <div class="vision-engine-meta" id="rv-engine-meta">
                        <span class="engine-dot" id="rv-engine-dot"></span>
                        <span class="engine-text" id="rv-engine-label">Decart Mirage V2</span>
                        <button type="button" class="engine-link-btn" id="btn-open-vision-cfg">配置 ↗</button>
                    </div>

                    <!-- Connection Controls -->
                    <div class="vision-action-group">
                        <button class="primary-btn" id="btn-start-vision" style="width:100%; height:44px; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <span>🚀</span> ${window.i18n.t('VISION_START_BTN')}
                        </button>
                        <button class="secondary-btn" id="btn-stop-vision" style="width:100%; height:44px; border:none; background:rgba(239, 68, 68, 0.9); color:white; font-weight:600; display:none;">
                            ${window.i18n.t('VISION_STOP_BTN')}
                        </button>
                    </div>

                    <div class="studio-input-section">
                        <div class="section-header">
                            <span class="section-title">${window.i18n.t('VISION_PROMPT_LABEL')}</span>
                        </div>
                        <textarea class="rv-textarea" id="rv-prompt-input" placeholder="${window.i18n.t('VISION_PROMPT_PLACEHOLDER')}">Cyberpunk city</textarea>
                        <div style="display:flex; justify-content:flex-end; margin-top:8px;">
                            <button class="secondary-btn small" id="btn-update-prompt">${window.i18n.t('VISION_UPDATE_BTN')}</button>
                        </div>
                    </div>

                    <!-- Preset Styles (Responsive Grid) -->
                    <div class="vision-presets-section">
                        <div class="section-header">
                            <span class="section-title">${window.i18n.t('VISION_PRESET_TITLE')}</span>
                        </div>
                        <div class="preset-grid">
                            <button class="preset-card" data-prompt="A detailed oil painting in the style of Van Gogh, starry night, swirls">
                                <span class="preset-icon">🎨</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_VANGOGH')}</span>
                            </button>
                            <button class="preset-card" data-prompt="Futuristic cyberpunk city, neon lights, high tech, rain, blade runner style">
                                <span class="preset-icon">🌃</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_CYBERPUNK')}</span>
                            </button>
                            <button class="preset-card" data-prompt="Cute claymation style, stop motion, plasticine texture, play-doh">
                                <span class="preset-icon">🧱</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_CLAYMATION')}</span>
                            </button>
                            <button class="preset-card" data-prompt="Japanese anime style, studio ghibli, vibrant colors, detailed background">
                                <span class="preset-icon">🎌</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_ANIME')}</span>
                            </button>
                            <button class="preset-card" data-prompt="Pencil sketch, charcoal drawing, rough lines, black and white">
                                <span class="preset-icon">✏️</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_SKETCH')}</span>
                            </button>
                            <button class="preset-card" data-prompt="Lego bricks, plastic toy block world, macro photography">
                                <span class="preset-icon">🧩</span>
                                <span class="preset-name">${window.i18n.t('VISION_PRESET_LEGO')}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Footer (Powered By only) -->
                    <div class="vision-footer">
                         <p style="font-size:10px; color:var(--text-secondary); text-align:center;">
                            ${window.i18n.t('VISION_POWERED_BY')}
                        </p>
                    </div>
                </div>
                
                <!-- Hidden API Key Input -->
                <input type="hidden" id="rv-api-key-input">
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport" style="background:#09090b;">
                <!-- Viewport Floating Toolbar -->
                <div class="rv-viewport-toolbar">
                    <div class="rv-toolbar-group">
                        <button type="button" class="rv-tool-btn" id="btn-toggle-fit" title="切换画面铺满/完整适应">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                            <span id="label-fit-mode">适应画布</span>
                        </button>
                        <button type="button" class="rv-tool-btn active" id="btn-toggle-mirror" title="切换水平镜像翻转">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M20 7l-5 5 5 5M4 7l5 5-5 5"/></svg>
                            <span>镜像</span>
                        </button>
                    </div>
                </div>

                <div class="video-container" id="rv-video-container">
                    <video id="video-output" class="fit-contain is-mirrored" autoplay playsinline></video>
                    
                    <div class="rv-status-panel">
                        <div class="status-dot" id="rv-status-dot"></div>
                        <span id="rv-status-text">${window.i18n.t('VISION_STATUS_DISCONNECTED')}</span>
                    </div>

                    <div id="rv-loading-overlay" class="rv-loading-overlay" style="display:none;">
                        <div class="spinner" style="width:30px; height:30px; border:3px solid var(--glass-border); border-top-color:var(--primary); border-radius:50%; animation:rv-spin 1s linear infinite;"></div>
                        <span style="font-size:12px; color:#fff;">${window.i18n.t('VISION_INITIALIZING')}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupRealtimeVisionListeners();
}

let realtimeSession = null;
let currentStream = null;

async function setupRealtimeVisionListeners() {
    const startBtn = document.getElementById('btn-start-vision');
    const stopBtn = document.getElementById('btn-stop-vision');
    const updateBtn = document.getElementById('btn-update-prompt');
    const promptInput = document.getElementById('rv-prompt-input');
    const apiKeyInput = document.getElementById('rv-api-key-input');
    const statusDot = document.getElementById('rv-status-dot');
    const statusText = document.getElementById('rv-status-text');
    const loadingOverlay = document.getElementById('rv-loading-overlay');
    const btnOpenVisionCfg = document.getElementById('btn-open-vision-cfg');

    // Preset Buttons Logic
    document.querySelectorAll('.preset-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt;
            promptInput.value = prompt;
            // Animate input
            promptInput.style.transition = "background-color 0.3s";
            promptInput.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
            setTimeout(() => promptInput.style.backgroundColor = "", 300);
        });
    });

    // --- Robust API Key & Config Loading ---
    let serverApiKey = '';

    const checkVisionConfig = async () => {
        try {
            const configResp = await fetch('/api/config');
            const config = await configResp.json();

            serverApiKey = config.decartApiKey || '';
            if (apiKeyInput) apiKeyInput.value = serverApiKey;

            const dot = document.getElementById('rv-engine-dot');
            const label = document.getElementById('rv-engine-label');
            const cfgBtn = document.getElementById('btn-open-vision-cfg');

            if (serverApiKey) {
                if (dot) dot.className = 'engine-dot is-active';
                if (label) label.textContent = 'Decart Mirage V2';
                if (cfgBtn) cfgBtn.textContent = '管理';
                if (!realtimeSession && statusText) {
                    statusText.textContent = window.i18n.t('VISION_STATUS_DISCONNECTED');
                }
            } else {
                if (dot) dot.className = 'engine-dot';
                if (label) label.textContent = '未配置 Decart 视觉 Key';
                if (cfgBtn) cfgBtn.textContent = '配置 ↗';
                if (!realtimeSession && statusText) {
                    statusText.innerHTML = '未配置 Decart 视觉 Key · <a href="javascript:void(0)" id="rv-link-config" style="color:#60a5fa; text-decoration:underline; cursor:pointer;">立即配置 ↗</a>';
                    const linkCfg = document.getElementById('rv-link-config');
                    if (linkCfg) {
                        linkCfg.onclick = (e) => {
                            e.preventDefault();
                            if (window.ApiConfigModal) window.ApiConfigModal.open('vision');
                        };
                    }
                }
            }
        } catch (e) {
            console.error("[Vision] Failed to load server config:", e);
        }
    };

    await checkVisionConfig();

    if (btnOpenVisionCfg) {
        btnOpenVisionCfg.onclick = () => {
            if (window.ApiConfigModal) window.ApiConfigModal.open('vision');
        };
    }

    const settingsListener = () => {
        checkVisionConfig();
    };
    window.addEventListener('settings-updated', settingsListener);

    if (window.registerPageCleanup) {
        window.registerPageCleanup(() => {
            window.removeEventListener('settings-updated', settingsListener);
            if (realtimeSession) {
                try { realtimeSession.disconnect(); } catch (e) {}
                realtimeSession = null;
            }
            if (currentStream) {
                currentStream.getTracks().forEach(t => t.stop());
                currentStream = null;
            }
        });
    }

    startBtn?.addEventListener('click', async () => {
        try {
            console.log("[Vision] Starting connection...");

            // Ensure key status is current
            if (!serverApiKey) {
                await checkVisionConfig();
            }

            // Realtime Vision Studio strictly requires Decart API Key
            if (!serverApiKey) {
                const errorMsg = `未配置【Decart 视觉 API Key (DECART_API_KEY)】，无法启动实时视觉工作室。\n获取方式：\n1. 访问 Decart 开发者平台：https://platform.decart.ai/\n2. 注册并创建 API Key；\n3. 点击软件左下角【服务配置】填入保存即可。`;
                Toast.show(errorMsg, 'error');
                if (window.ApiConfigModal) {
                    window.ApiConfigModal.open('vision');
                }
                return;
            }

            startBtn.disabled = true;
            loadingOverlay.style.display = 'flex';

            console.log("[Vision] Loading Decart SDK...");
            const { createDecartClient, models } = await import("@decartai/sdk");
            const model = models.realtime("mirage_v2");

            console.log("[Vision] Requesting camera access...");
            currentStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    frameRate: model.fps || 24,
                    width: model.width || 1024,
                    height: model.height || 1024,
                }
            });

            console.log("[Vision] Connecting to Mirage V2...");
            const client = createDecartClient({ apiKey: serverApiKey });

            const session = await client.realtime.connect(currentStream, {
                model,
                onRemoteStream: (transformedStream) => {
                    console.log("[Vision] Remote stream received");
                    const vo = document.getElementById('video-output');
                    if (vo) vo.srcObject = transformedStream;

                    loadingOverlay.style.display = 'none';
                    statusDot.classList.add('active');
                    statusText.textContent = window.i18n.t('VISION_STATUS_ACTIVE');
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';
                }
            });

            realtimeSession = session;
            const initPrompt = promptInput.value.trim();
            if (initPrompt && session) {
                try { session.setPrompt(initPrompt); } catch (e) {}
            }

        } catch (err) {
            console.error("[Vision] Connection error:", err);
            Toast.show("启动失败: " + err.message, 'error');

            loadingOverlay.style.display = 'none';
            startBtn.disabled = false;
            statusDot.classList.remove('active');
            statusText.textContent = window.i18n.t('VISION_STATUS_DISCONNECTED');
        }
    });

    stopBtn?.addEventListener('click', () => {
        console.log("[Vision] Disconnecting...");
        if (realtimeSession) {
            try { realtimeSession.disconnect(); } catch (e) {}
            realtimeSession = null;
        }
        if (currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
            currentStream = null;
        }

        const vo = document.getElementById('video-output');
        if (vo) vo.srcObject = null;

        statusDot.classList.remove('active');
        statusText.textContent = window.i18n.t('VISION_STATUS_DISCONNECTED');
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        startBtn.innerHTML = `<span>🚀</span> ${window.i18n.t('VISION_START_BTN')}`;
        stopBtn.style.display = 'none';
    });

    updateBtn?.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        console.log("[Vision] Clicked Update. Input:", prompt);

        if (realtimeSession && prompt) {
            try {
                // Try both methods for compatibility across SDK versions
                if (typeof realtimeSession.setPrompt === 'function') {
                    realtimeSession.setPrompt(prompt);
                    console.log("[Vision] Style updated using setPrompt:", prompt);
                } else if (typeof realtimeSession.update === 'function') {
                    realtimeSession.update({ prompt });
                    console.log("[Vision] Style updated using update({prompt}):", prompt);
                } else {
                    console.error("[Vision] No prompt update method found on session object", realtimeSession);
                }

                // Visual feedback
                const originalText = updateBtn.textContent;
                updateBtn.textContent = window.i18n.t('VISION_UPDATE_SUCCESS');
                updateBtn.classList.add('primary-btn');
                setTimeout(() => {
                    updateBtn.textContent = originalText;
                    updateBtn.classList.remove('primary-btn');
                }, 1000);
            } catch (e) {
                console.error("[Vision] Style update failed:", e);
            }
        } else {
            console.warn("[Vision] Update clicked but session or prompt is missing. Session:", !!realtimeSession);
        }
    });

    // Toolbar: Fit Mode Toggle (contain vs cover)
    const fitBtn = document.getElementById('btn-toggle-fit');
    const fitLabel = document.getElementById('label-fit-mode');
    const videoOutput = document.getElementById('video-output');

    let currentFit = localStorage.getItem('rv_fit_mode') || 'contain';
    const applyFitMode = (mode) => {
        currentFit = mode;
        localStorage.setItem('rv_fit_mode', mode);
        if (videoOutput) {
            videoOutput.classList.toggle('fit-contain', mode === 'contain');
            videoOutput.classList.toggle('fit-cover', mode === 'cover');
        }
        if (fitLabel) {
            fitLabel.textContent = mode === 'contain' ? '适应画布' : '全屏铺满';
        }
        if (fitBtn) {
            fitBtn.classList.toggle('active', mode === 'cover');
        }
    };
    applyFitMode(currentFit);

    fitBtn?.addEventListener('click', () => {
        applyFitMode(currentFit === 'contain' ? 'cover' : 'contain');
    });

    // Toolbar: Mirror Flip Toggle
    const mirrorBtn = document.getElementById('btn-toggle-mirror');
    let isMirrored = localStorage.getItem('rv_mirrored') !== 'false'; // default mirrored
    const applyMirror = (mirrored) => {
        isMirrored = mirrored;
        localStorage.setItem('rv_mirrored', mirrored ? 'true' : 'false');
        if (videoOutput) videoOutput.classList.toggle('is-mirrored', mirrored);
        if (mirrorBtn) mirrorBtn.classList.toggle('active', mirrored);
    };
    applyMirror(isMirrored);

    mirrorBtn?.addEventListener('click', () => {
        applyMirror(!isMirrored);
    });
}

// Global Export
window.loadRealtimeVisionPage = loadRealtimeVisionPage;
