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
                    <div style="font-weight:600; font-size:14px;">Vision Studio</div>
                    <div class="status-badge" style="background:var(--primary-glass); padding:4px 8px; border-radius:4px; font-size:11px;">Real-time</div>
                </div>

                <div class="rv-input-section">
                    <span class="bg-label">Style Prompt</span>
                    <textarea class="rv-textarea" id="rv-prompt-input" placeholder="Enter style (e.g. Cyberpunk city, Van Gogh painting...)">Cyberpunk city</textarea>
                    <div class="rv-toolbar">
                        <button class="secondary-btn small" id="btn-update-prompt">Update Style</button>
                    </div>
                </div>

                <div class="studio-setting-group" style="padding-top:20px; border-top:1px solid var(--glass-border);">
                    <span class="bg-label">Connection Settings</span>
                    <div id="rv-api-key-container" style="margin-top:12px;">
                        <label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Decart API Key</label>
                        <input type="password" id="rv-api-key-input" class="rv-textarea" style="min-height:36px; padding:8px 12px;" placeholder="sk_...">
                        <p style="font-size:10px; color:var(--text-secondary); margin-top:4px;">
                            Enter your key here or set <code>DECART_API_KEY</code> on server.
                        </p>
                    </div>
                    <div style="margin-top:16px;">
                        <button class="primary-btn" id="btn-start-vision" style="width:100%;">Connect to AI Mirror</button>
                    </div>
                    <div style="margin-top:8px;">
                        <button class="secondary-btn" id="btn-stop-vision" style="width:100%; display:none;">Disconnect</button>
                    </div>
                </div>

                <div class="rv-action-area">
                    <p style="font-size:10px; color:var(--text-secondary); text-align:center;">
                        Powered by Decart AI Mirage V2
                    </p>
                </div>
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <div class="video-container">
                    <video id="video-output" autoplay playsinline></video>
                    
                    <div class="rv-status-panel">
                        <div class="status-dot" id="rv-status-dot"></div>
                        <span id="rv-status-text">Disconnected</span>
                    </div>

                    <div id="rv-loading-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px; backdrop-filter:blur(4px);">
                        <div class="spinner" style="width:30px; height:30px; border:3px solid var(--glass-border); border-top-color:var(--primary); border-radius:50%; animation:rv-spin 1s linear infinite;"></div>
                        <span style="font-size:12px;">Initializing Stream...</span>
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
            const { createDecartClient, models } = await import("@decartai/sdk");
            const model = models.realtime("mirage_v2");

            // 3. Get Stream
            currentStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    frameRate: model.fps,
                    width: model.width,
                    height: model.height,
                }
            });

            // 4. Connect
            const client = createDecartClient({ apiKey });

            realtimeSession = await client.realtime.connect(currentStream, {
                model,
                onRemoteStream: (transformedStream) => {
                    const vo = document.getElementById('video-output');
                    if (vo) vo.srcObject = transformedStream;

                    // Success UI
                    loadingOverlay.style.display = 'none';
                    statusDot.classList.add('active');
                    statusText.textContent = 'Live - AI Mirror Active';
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';

                    // Set initial prompt
                    const prompt = promptInput.value.trim();
                    if (prompt) realtimeSession.setPrompt(prompt);
                }
            });

        } catch (err) {
            console.error("AI Mirror Error:", err);
            alert("Failed to connect: " + err.message);
            loadingOverlay.style.display = 'none';
            startBtn.disabled = false;
        }
    });

    stopBtn?.addEventListener('click', () => {
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
        statusText.textContent = 'Disconnected';
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        stopBtn.style.display = 'none';
    });

    updateBtn?.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        if (realtimeSession && prompt) {
            realtimeSession.setPrompt(prompt);
            console.log("Style updated to:", prompt);

            // Visual feedback
            const originalText = updateBtn.textContent;
            updateBtn.textContent = "Updated!";
            updateBtn.classList.add('primary-btn');
            setTimeout(() => {
                updateBtn.textContent = originalText;
                updateBtn.classList.remove('primary-btn');
            }, 1000);
        }
    });
}

// Global Export
window.loadRealtimeVisionPage = loadRealtimeVisionPage;
