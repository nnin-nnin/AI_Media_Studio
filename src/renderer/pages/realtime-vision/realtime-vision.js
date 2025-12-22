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
                <div class="rv-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('VISION_TITLE')}</div>
                    <div class="status-badge" style="background:var(--primary-glass); padding:4px 8px; border-radius:4px; font-size:11px;">Real-time</div>
                </div>

                <div class="rv-input-section">
                    <span class="bg-label">${window.i18n.t('VISION_PROMPT_LABEL')}</span>
                    <textarea class="rv-textarea" id="rv-prompt-input" placeholder="${window.i18n.t('VISION_PROMPT_PLACEHOLDER')}">Cyberpunk city</textarea>
                    <div class="rv-toolbar">
                        <button class="secondary-btn small" id="btn-update-prompt">${window.i18n.t('VISION_UPDATE_BTN')}</button>
                    </div>
                </div>

                <div class="studio-setting-group" style="padding-top:20px; border-top:1px solid var(--glass-border);">
                    <span class="bg-label">${window.i18n.t('VISION_CONNECTION_TITLE')}</span>
                    <div id="rv-api-key-container" style="margin-top:12px;">
                        <label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">${window.i18n.t('VISION_API_KEY_LABEL')}</label>
                        <input type="password" id="rv-api-key-input" class="rv-textarea" style="min-height:36px; padding:8px 12px;" placeholder="sk_...">
                        <p style="font-size:10px; color:var(--text-secondary); margin-top:4px;">
                            ${window.i18n.t('VISION_API_KEY_HINT')}
                        </p>
                    </div>
                    <div style="margin-top:16px;">
                        <button class="primary-btn" id="btn-start-vision" style="width:100%;">${window.i18n.t('VISION_START_BTN')}</button>
                    </div>
                    <div style="margin-top:8px;">
                        <button class="secondary-btn" id="btn-stop-vision" style="width:100%; display:none;">${window.i18n.t('VISION_STOP_BTN')}</button>
                    </div>
                </div>

                <div class="rv-action-area">
                    <p style="font-size:10px; color:var(--text-secondary); text-align:center;">
                        ${window.i18n.t('VISION_POWERED_BY')}
                    </p>
                </div>
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
        <style>@keyframes rv-spin { 100% { transform: rotate(360deg); } }</style>
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

    // Auto-fill from server if available
    try {
        const configResp = await fetch('/api/config');
        const config = await configResp.json();
        if (config.decartApiKey) {
            apiKeyInput.value = config.decartApiKey;
            document.getElementById('rv-api-key-container').style.display = 'none';
        }
    } catch (e) { }

    startBtn?.addEventListener('click', async () => {
        try {
            console.log("[Vision] Starting connection...");
            startBtn.disabled = true;
            loadingOverlay.style.display = 'flex';

            // 1. Get API Key
            let apiKey = apiKeyInput.value.trim();

            if (!apiKey) {
                const configResp = await fetch('/api/config');
                const config = await configResp.json();
                apiKey = config.decartApiKey;
            }

            if (!apiKey) {
                throw new Error("API Key is missing. Please enter it in the connection settings.");
            }

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

                    // Set initial prompt using the session object we just got
                    const initPrompt = promptInput.value.trim();
                    if (initPrompt && session) {
                        try {
                            session.setPrompt(initPrompt);
                            console.log("[Vision] Initial style set to:", initPrompt);
                        } catch (e) {
                            console.warn("[Vision] SetPrompt failed in callback:", e);
                        }
                    }
                }
            });

            realtimeSession = session; // Assign globally
            console.log("[Vision] Session established:", session);

        } catch (err) {
            console.error("[Vision] AI Mirror Error:", err);
            alert("Failed to connect: " + err.message);
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
