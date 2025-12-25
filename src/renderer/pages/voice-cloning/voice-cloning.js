// pages/voice-cloning/voice-cloning.js
import { AudioRecorder } from '../../utils/audio-recorder.js';

/**
 * 加载克隆声音页面内容 (Studio Layout Refactor)
 */
function loadVoiceCloningPage(container) {
    if (!container) return;

    // Inject styles if not present
    if (!document.getElementById('vc-layout-css')) {
        const link = document.createElement('link');
        link.id = 'vc-layout-css';
        link.rel = 'stylesheet';
        link.href = 'pages/voice-cloning/voice-cloning-layout.css';
        document.head.appendChild(link);
    }

    container.innerHTML = `
        <div class="studio-layout fade-in">
            <!-- Col 1: Global Nav (Handled by App) -->
            
            <!-- Col 2: Controls (Left Panel) -->
            <div class="studio-controls voice-cloning-controls">
                
                <!-- 1. Header & Mode -->
                <div class="studio-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('AUDIO_TITLE')}</div>
                    <div class="vc-mode-switch">
                        <button class="mode-btn active" data-mode="text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ${window.i18n.t('AUDIO_MODE_TEXT')}
                        </button>
                        <button class="mode-btn" data-mode="clone">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>
                            ${window.i18n.t('AUDIO_MODE_CLONE')}
                        </button>
                    </div>
                </div>

                <!-- 2. Interactive Input Section -->
                <div class="studio-input-section">
                    <!-- Audio Reference Slots (Hidden by default in Text mode) -->
                    <div class="studio-slots-row" id="vc-slots-row" style="display:none; gap: 10px;">
                        <div class="studio-slot" id="vc-slot-ref" title="${window.i18n.t('AUDIO_UPLOAD_LABEL')}" style="flex:1;">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="audio/*">
                             <div style="font-size:12px; margin-top:5px;">${window.i18n.t('AUDIO_UPLOAD_LABEL')}</div>
                        </div>
                        
                        <div class="studio-slot" id="vc-slot-mic" title="${window.i18n.t('AUDIO_RECORD_LABEL')}" style="flex:1;">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>
                             <div style="font-size:12px; margin-top:5px;">${window.i18n.t('AUDIO_RECORD_LABEL')}</div>
                        </div>
                    </div>

                    <!-- Preset Voices Row (Visible in Text mode) -->
                    <div class="studio-slots-row" id="vc-presets-row" style="display:flex; gap: 10px; margin-bottom:12px; overflow-x:auto; padding-bottom:8px;">
                        <div class="loading-vc-presets" style="font-size:11px; color:var(--text-secondary); opacity:0.7;">Loading presets...</div>
                    </div>

                    <!-- Text Editor -->
                    <div class="studio-text-editor">
                        <textarea class="studio-textarea" id="vc-prompt-input" placeholder="${window.i18n.t('AUDIO_PROMPT_PLACEHOLDER')}"></textarea>
                        
                        <div class="studio-toolbar">
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="studio-tabs-panel">
                    <div class="studio-tab-header">
                        <button class="studio-tab-btn active" data-tab="settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Settings
                        </button>
                        <button class="studio-tab-btn" data-tab="assets">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Assets
                        </button>
                    </div>
                    <div class="studio-tab-content">
                         <!-- Tab: Settings -->
                         <div id="tab-settings" class="tab-pane">
                            <span class="bg-label">${window.i18n.t('AUDIO_EMOTION_LABEL')}</span>
                            <div class="emotion-grid">
                                <button class="emotion-btn active" data-emotion="neutral">${window.i18n.t('AUDIO_EMOTION_NEUTRAL')}</button>
                                <button class="emotion-btn" data-emotion="happy">${window.i18n.t('AUDIO_EMOTION_HAPPY')}</button>
                                <button class="emotion-btn" data-emotion="friendly">${window.i18n.t('AUDIO_EMOTION_FRIENDLY')}</button>
                            </div>

                            <span class="bg-label" style="margin-top:20px;">${window.i18n.t('AUDIO_SPEED_LABEL')}</span>
                            <input type="range" class="studio-slider" id="speed-slider" min="0.5" max="2.0" step="0.1" value="1.0">
                            
                            <span class="bg-label" style="margin-top:20px;">${window.i18n.t('AUDIO_SIMILARITY_LABEL')}</span>
                            <input type="range" class="studio-slider" id="similarity-slider" min="0" max="100" value="75">

                            <div style="margin-top:12px;">
                                    <label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Microphone Input</label>
                                    <select id="vc-mic-select" class="studio-select-glass">
                                        <option value="default">Default System Audio</option>
                                    </select>
                                </div>
                            </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div style="text-align:center; margin-top:2rem; font-size:12px; color:var(--text-secondary);">
                                ${window.i18n.t('AUDIO_ASSETS_EMPTY')}
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="studio-action-area vc-action-area">
                     <button class="primary-btn" id="generate-voice-btn" style="width:100%;">
                        ${window.i18n.t('AUDIO_GENERATE_BTN')}
                     </button>
                </div>
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <!-- Header -->
                <div style="position:absolute; top:20px; right:20px; z-index:10;">
                   <div class="status-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px;">${window.i18n.t('AUDIO_STATUS_READY')}</div>
                </div>

                <!-- Result Container -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                     <div class="preview-placeholder">
                        <span style="font-size:48px; margin-bottom:1rem; opacity:0.5;">🎙️</span>
                        <p style="color:var(--text-secondary);">${window.i18n.t('AUDIO_PLACEHOLDER_TEXT')}</p>
                     </div>
                </div>
            </div>
            
        </div>
    `;

    setupVoiceCloningEventListeners();
}

/**
 * 设置克隆声音页面事件监听器
 */
function setupVoiceCloningEventListeners() {

    // 1. Mode Switcher
    const modeBtns = document.querySelectorAll('.mode-btn');
    const slotsRow = document.getElementById('vc-slots-row');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            if (mode === 'clone') {
                slotsRow.style.display = 'flex';
                document.getElementById('vc-presets-row').style.display = 'none';
            } else {
                slotsRow.style.display = 'none';
                document.getElementById('vc-presets-row').style.display = 'flex';
            }
        });
    });

    // 1.5 Load Presets
    loadAndRenderVCPresets();

    // 2. Audio Slot Logic
    const slot = document.getElementById('vc-slot-ref');
    const defaultIconHTML = slot?.innerHTML;

    function handleFileSelect(e, slotElement, defaultHTML) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                slotElement.innerHTML = `
                    <div style="font-size:24px;">🎵</div>
                    <div class="remove-btn" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>
                `;
                slotElement.classList.add('has-audio');
                slotElement.dataset.hasAudio = "true";
                slotElement.title = file.name;

                // Hidden data storage
                slotElement.dataset.audioData = evt.target.result;

                slotElement.querySelector('.remove-btn').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    slotElement.innerHTML = defaultHTML;
                    slotElement.classList.remove('has-audio');
                    delete slotElement.dataset.hasAudio;
                    delete slotElement.dataset.audioData;

                    const newInput = slotElement.querySelector('input');
                    if (newInput) newInput.addEventListener('change', (ev2) => handleFileSelect(ev2, slotElement, defaultHTML));
                });
            };
            reader.readAsDataURL(file);
        }
    }

    if (slot) {
        slot.addEventListener('click', (e) => {
            if (e.target.closest('.remove-btn')) return;
            const input = slot.querySelector('input');
            if (input) input.click();
        });
        const initialInput = slot.querySelector('input');
        if (initialInput) initialInput.addEventListener('change', (e) => handleFileSelect(e, slot, defaultIconHTML));
    }

    // 3. Emotion Selection
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 4. Tabs
    const tabBtns = document.querySelectorAll('.studio-tab-btn');
    const tabSettings = document.getElementById('tab-settings');
    const tabAssets = document.getElementById('tab-assets');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            if (target === 'settings') {
                tabSettings.style.display = 'block';
                tabAssets.style.display = 'none';
            } else {
                tabSettings.style.display = 'none';
                tabAssets.style.display = 'block';
            }
        });
    });

    // 4.5 Model Settings Logic
    // 4.5 Model Settings Logic
    // initModelSelect removed per user request
    initMicSelect();

    // 5. Generate Logic
    const generateBtn = document.getElementById('generate-voice-btn');
    generateBtn?.addEventListener('click', async () => {
        const promptInput = document.getElementById('vc-prompt-input');
        const prompt = promptInput?.value?.trim();
        const refSlot = document.getElementById('vc-slot-ref');
        const micSlot = document.getElementById('vc-slot-mic');

        let audioData = null;
        if (refSlot?.dataset.hasAudio === "true") {
            audioData = refSlot.dataset.audioData;
        } else if (micSlot?.dataset.hasAudio === "true") {
            audioData = micSlot.dataset.audioData;
        }

        const mode = document.querySelector('.mode-btn.active').dataset.mode;
        let selectedVoiceId = null;

        if (mode === 'text') {
            const activePreset = document.querySelector('.vc-preset-item.active');
            if (!activePreset) {
                alert("Please select a preset voice.");
                return;
            }
            selectedVoiceId = activePreset.dataset.voiceId;
        }

        if (!prompt) {
            alert("Please enter text to generate speech.");
            return;
        }

        if (mode === 'clone' && !audioData) {
            alert("Please upload a reference audio or record your voice for cloning.");
            return;
        }

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = "Generating...";
        generateBtn.disabled = true;

        if (window.GlobalSidebar) {
            window.GlobalSidebar.setJobStatus('voice-cloning', 'processing');
        }

        try {
            const resBox = document.querySelector('.result-preview');
            // Fake Visualizer
            resBox.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                    <div class="audio-visualizer">
                        ${Array(10).fill(0).map(() => `<div class="visual-bar" style="height:${20 + Math.random() * 40}px; animation-duration:${0.3 + Math.random() * 0.5}s"></div>`).join('')}
                    </div>
                    <p style="margin-top:20px; color:var(--text-secondary);">${window.i18n.t('AUDIO_GENERATE_LOADING')}</p>
                </div>
            `;

            // Call API
            const result = await window.electronAPI.cloneVoice({
                text: prompt,
                audio: audioData,
                voiceId: selectedVoiceId,
                mode: mode,
                model: window.SettingsManager.get('audioModel') || "cosyvoice-v2"
            });

            if (result && result.status === 'success') {
                if (!result.audio_url) {
                    throw new Error("AI generated success but no audio URL was returned.");
                }
                resBox.innerHTML = `
                    <div style="text-align: center; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <audio controls autoplay style="width: 300px; border-radius:30px; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
                            <source src="${result.audio_url}" type="audio/mpeg">
                            Your browser does not support audio.
                        </audio>
                        <div style="margin-top:1.5rem; display:flex; gap:12px;">
                             <button class="secondary-btn" id="btn-save-assets">${window.i18n.t('COMMON_SAVE')}</button>
                             <button class="secondary-btn" id="btn-download-audio">${window.i18n.t('COMMON_EXPORT')}</button>
                        </div>
                        ${result.isMock ? `<div style="margin-top:12px; font-size:10px; color:var(--primary);">${window.i18n.t('AUDIO_MOCK_NOTICE')}</div>` : ''}
                    </div>
                `;

                // Auto-Save to Assets
                try {
                    window.AssetManager.add({
                        type: 'audio',
                        url: result.audio_url,
                        prompt: prompt || "Cloned Voice",
                        metadata: { model: "cosyvoice" }
                    });
                    console.log("Voice auto-saved to assets");
                } catch (err) {
                    console.error("Auto-save failed:", err);
                }

                // Update Save Button Visual
                setTimeout(() => {
                    const saveBtn = document.getElementById('btn-save-assets');
                    if (saveBtn) {
                        saveBtn.innerHTML = `${window.i18n.t('COMMON_SAVE')} ✓`;
                        saveBtn.disabled = true;
                    }
                }, 500);

                document.getElementById('btn-download-audio')?.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = result.audio_url;
                    a.download = `voice_${Date.now()}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });

                // Auto-registration to character presets removed per user request (too messy/ugly)

            } else {
                throw new Error(result?.message || "Generation failed");
            }

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                 <div class="preview-placeholder">
                    <span style="font-size:48px; margin-bottom:1rem; opacity:0.5;">⚠️</span>
                    <p style="color:var(--text-secondary);">Generation failed.</p>
                 </div>
            `;
        } finally {
            generateBtn.innerHTML = oldText;
            generateBtn.disabled = false;

            if (window.GlobalSidebar) {
                window.GlobalSidebar.setJobStatus('voice-cloning', 'idle');
            }
        }
    });


    // --- Preset Voices Helper ---
    async function loadAndRenderVCPresets() {
        const row = document.getElementById('vc-presets-row');
        if (!row) return;

        try {
            const data = await window.fetchAPI('/api/ai/characters?category=cloned', {}, { method: 'GET' });
            if (data.status === 'success') {
                row.innerHTML = data.data.map((char, index) => `
                    <div class="vc-preset-item ${index === 0 ? 'active' : ''}" data-voice-id="${char.voice_id}" title="${char.name}">
                        <img src="${char.avatar}" alt="${char.name}">
                        <span>${char.name}</span>
                    </div>
                `).join('');

                row.querySelectorAll('.vc-preset-item').forEach(item => {
                    item.addEventListener('click', () => {
                        row.querySelectorAll('.vc-preset-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                    });
                });
            }
        } catch (err) {
            console.error("Failed to load presets:", err);
            row.innerHTML = `<div style="font-size:11px; color:var(--error);">Failed to load presets</div>`;
        }
    }

    // 6. Recording Logic
    const micSlot = document.getElementById('vc-slot-mic');
    const defaultMicHTML = micSlot?.innerHTML;
    const recorder = new AudioRecorder();
    let recordingStartTime = 0;

    if (micSlot) {
        micSlot.addEventListener('click', async () => {
            if (micSlot.classList.contains('has-audio')) return;

            if (recorder.isRecording) {
                // STOP Recording
                const duration = (Date.now() - recordingStartTime) / 1000;
                if (duration < 3) {
                    alert(window.i18n.t('AUDIO_RECORD_TOO_SHORT'));
                    return;
                }

                const result = await recorder.stop();
                if (!result) return;

                const { blob: audioBlob, avgVolume, maxVolume } = result;
                micSlot.classList.remove('recording');

                // Advanced Silence Detection: RMS threshold (0.01 is roughly very quiet background noise)
                // Also check size as fallback
                if (!audioBlob || audioBlob.size < 1000 || maxVolume < 0.01) {
                    console.warn("[VoiceCloning] Recording stopped but audio seems silent. Avg:", avgVolume, "Max:", maxVolume);
                    alert(`${window.i18n.t('AUDIO_RECORD_SILENT')} (Volume too low)`);
                    micSlot.innerHTML = defaultMicHTML;
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    micSlot.innerHTML = `
                        <div style="font-size:24px;">🎤</div>
                        <div class="remove-btn" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>
                    `;
                    micSlot.classList.add('has-audio');
                    micSlot.dataset.hasAudio = "true";
                    micSlot.title = "Recorded Audio";
                    micSlot.dataset.audioData = reader.result;

                    micSlot.querySelector('.remove-btn').addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        micSlot.innerHTML = defaultMicHTML;
                        micSlot.classList.remove('has-audio');
                        delete micSlot.dataset.hasAudio;
                        delete micSlot.dataset.audioData;
                    });
                };
                reader.readAsDataURL(audioBlob);
                return;
            }

            // START Recording
            try {
                const savedMicId = window.SettingsManager.get('audioInputDeviceId');
                const micId = (savedMicId && savedMicId !== 'default') ? savedMicId : null;
                const started = await recorder.start(micId);
                if (started) {
                    recordingStartTime = Date.now();
                    micSlot.classList.add('recording');
                    micSlot.innerHTML = `
                        <div class="recording-dot"></div>
                        <div style="font-size:12px; margin-top:5px;">Stop</div>
                    `;
                }
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert(`${window.i18n.t('AUDIO_RECORD_SILENT')} (${err.message})`);
            }
        });
    }

    // Helper: Convert AudioBuffer to WAV Blob (Removed as AudioRecorder handled Blob)
    // Toolbar
    document.getElementById('btn-clear-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('vc-prompt-input');
        if (el) el.value = '';
    });
}

window.loadVoiceCloningPage = loadVoiceCloningPage;

/**
 * Initialize a standard select for model selection
 */
async function initModelSelect(selectId, settingsKey, type = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const url = type ? `/api/ai/models?type=${type}` : '/api/ai/models';
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.status === 'success') {
            const current = window.SettingsManager.get(settingsKey);
            select.innerHTML = data.models.map(m => `
                <option value="${m.id}" ${m.id === current ? 'selected' : ''}>${m.name}</option>
            `).join('');
        }
    } catch (err) {
        console.error("Failed to fetch models:", err);
    }

    select.addEventListener('change', (e) => {
        window.SettingsManager.set(settingsKey, e.target.value);
    });
}

/**
 * Initialize Microphone Selection
 */
async function initMicSelect() {
    const select = document.getElementById('vc-mic-select');
    if (!select) return;

    // Load saved device
    let savedId = window.SettingsManager.get('audioInputDeviceId');

    const updateDevices = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission first to get labels
            const devices = await navigator.mediaDevices.enumerateDevices();

            // Filter audio inputs
            const audioInputs = devices.filter(d => d.kind === 'audioinput');

            // --- Auto-Select Logic ---
            // If current setting is default/missing, try to find a better one
            if (!savedId || savedId === 'default') {
                const bestCandidate = audioInputs.find(d =>
                    (d.label.toLowerCase().includes('built-in') || d.label.toLowerCase().includes('macbook') || d.label.toLowerCase().includes('default')) &&
                    !d.label.toLowerCase().includes('virtual') &&
                    !d.label.toLowerCase().includes('blackhole')
                );

                if (bestCandidate) {
                    console.log("[AutoSelect] Switching from default to:", bestCandidate.label);
                    savedId = bestCandidate.deviceId;
                    window.SettingsManager.set('audioInputDeviceId', savedId);
                }
            }
            // -------------------------

            select.innerHTML = `
                <option value="default">Default System Audio</option>
                ${audioInputs.map(d => `<option value="${d.deviceId}" ${d.deviceId === savedId ? 'selected' : ''}>${d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}</option>`).join('')}
            `;

            // Ensure select reflects auto-selection
            select.value = savedId || 'default';

        } catch (e) {
            console.error("Failed to list audio devices", e);
        }
    };

    updateDevices();
    navigator.mediaDevices.ondevicechange = updateDevices;

    select.addEventListener('change', (e) => {
        window.SettingsManager.set('audioInputDeviceId', e.target.value);
    });
}

// Export for global use
window.loadVoiceCloningPage = loadVoiceCloningPage;