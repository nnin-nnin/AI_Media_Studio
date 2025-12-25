/**
 * Real-time Vision Page (AI Mirror)
 * Uses Decart AI SDK for low-latency video transformation.
 */

// We use dynamic import because the project mostly uses non-module scripts,
// but the SDK requires ESM.
let decartClient = null;

async function loadRealtimeVisionPage(container) {
    if (!container) return;

    // Inject styles
    if (!document.getElementById('rv-layout-css')) {
        const link = document.createElement('link');
        link.id = 'rv-layout-css';
        link.rel = 'stylesheet';
        link.href = 'pages/realtime-vision/realtime-vision-layout.css';
        document.head.appendChild(link);
    }

    container.innerHTML = `
        <div class="studio-layout fade-in">
            <!-- Col 2: Controls -->
            <div class="studio-controls vision-controls">
                <div class="studio-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('VISION_TITLE')}</div>
                    <div class="status-badge" style="background:rgba(16, 185, 129, 0.1); color:#10b981; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; border:1px solid rgba(16, 185, 129, 0.2);">LIVE</div>
                </div>

                <!-- Connection Controls (Moved to Top) -->
                <div style="padding: 1.5rem 1.5rem 0 1.5rem;">
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

                <!-- Preset Styles (Refined) -->
                <div style="padding: 0 1.5rem; flex: 1; overflow-y: auto;">
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
                <div class="studio-action-area" style="padding-top: 10px; padding-bottom: 20px; border-top: none;">
                    <div style="margin-top:0;">
                         <p style="font-size:10px; color:var(--text-secondary); text-align:center;">
                            ${window.i18n.t('VISION_POWERED_BY')}
                        </p>
                    </div>
                </div>
                
                <!-- Hidden API Key Input -->
                <input type="hidden" id="rv-api-key-input">
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <div class="video-container">
                    <video id="video-output" autoplay playsinline></video>
                    
                    <div class="rv-status-panel">
                        <div class="status-dot" id="rv-status-dot"></div>
                        <span id="rv-status-text">${window.i18n.t('VISION_STATUS_DISCONNECTED')}</span>
                    </div>

                    <div id="rv-loading-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px; backdrop-filter:blur(4px);">
                        <div class="spinner" style="width:30px; height:30px; border:3px solid var(--glass-border); border-top-color:var(--primary); border-radius:50%; animation:rv-spin 1s linear infinite;"></div>
                        <span style="font-size:12px;">${window.i18n.t('VISION_INITIALIZING')}</span>
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

    // --- Robust API Key Loading ---
    let serverApiKey = '';

    try {
        const configResp = await fetch('/api/config');
        const config = await configResp.json();

        if (config.decartApiKey) {
            serverApiKey = config.decartApiKey;
            apiKeyInput.value = serverApiKey;
            console.log(`[Vision] Server API Key loaded. Length: ${serverApiKey.length}, Prefix: ${serverApiKey.substring(0, 4)}...`);
        } else {
            console.warn("[Vision] Server config loaded but NO API KEY found.");
        }
    } catch (e) {
        console.error("[Vision] Failed to load server config:", e);
    }


    startBtn?.addEventListener('click', async () => {
        try {
            console.log("[Vision] Starting connection...");

            // 1. Validate API Key
            const apiKey = serverApiKey; // Strictly use server key

            if (!apiKey) {
                alert("API Key is missing. Please check ARK_API_KEY / DECART_API_KEY in your .env file.");
                return;
            }

            console.log(`[Vision] Using API Key (Length: ${apiKey.length}): ${apiKey.substring(0, 4)}...`);

            startBtn.disabled = true;
            loadingOverlay.style.display = 'flex';

            // 2. Load SDK
            console.log("[Vision] Loading Decart SDK...");
            const { createDecartClient, models } = await import("@decartai/sdk");
            const model = models.realtime("mirage_v2");

            // 3. Get Stream
            console.log("[Vision] Requesting camera access...");
            currentStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    frameRate: model.fps || 24,
                    width: model.width || 1024,
                    height: model.height || 1024,
                }
            });

            // 4. Connect
            console.log("[Vision] Connecting to Mirage V2...");
            const client = createDecartClient({ apiKey });

            // IMPORTANT: Fix race condition. We assign session BEFORE connect finishes if possible? 
            // Actually SDK usually provides a way to get the session in the callback or after await.
            const session = await client.realtime.connect(currentStream, {
                model,
                onRemoteStream: (transformedStream) => {
                    console.log("[Vision] Remote stream received");
                    const vo = document.getElementById('video-output');
                    if (vo) vo.srcObject = transformedStream;

                    // Success UI
                    loadingOverlay.style.display = 'none';
                    statusDot.classList.add('active');
                    statusText.textContent = window.i18n.t('VISION_STATUS_ACTIVE');
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';
                }
            });

            realtimeSession = session; // Assign globally
            console.log("[Vision] Session established:", session);

            // Set initial prompt immediately after session starts
            const initPrompt = promptInput.value.trim();
            if (initPrompt && session) {
                try {
                    session.setPrompt(initPrompt);
                    console.log("[Vision] Initial style set to:", initPrompt);
                } catch (e) {
                    console.warn("[Vision] SetPrompt failed:", e);
                }
            }

        } catch (err) {
            console.error("[Vision] AI Mirror Error:", err);
            alert("Failed to connect: " + err.message + "\nPlease check your server API Key configuration.");

            loadingOverlay.style.display = 'none';
            startBtn.disabled = false;
        }
    });

    stopBtn?.addEventListener('click', () => {
        console.log("[Vision] Disconnecting...");
        if (realtimeSession) {
            realtimeSession.disconnect();
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
}

// Global Export
window.loadRealtimeVisionPage = loadRealtimeVisionPage;
