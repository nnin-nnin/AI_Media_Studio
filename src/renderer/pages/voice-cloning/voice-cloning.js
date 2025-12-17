// pages/voice-cloning/voice-cloning.js

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
                <div class="vc-header">
                    <div style="font-weight:600; font-size:14px;">Audio Studio</div>
                    <div class="vc-mode-switch">
                        <button class="mode-btn active" data-mode="text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Text
                        </button>
                        <button class="mode-btn" data-mode="clone">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>
                            Clone
                        </button>
                    </div>
                </div>

                <!-- 2. Interactive Input Section -->
                <div class="vc-input-section">
                    <!-- Audio Reference Slots (Hidden by default in Text mode) -->
                    <div class="vc-slots-row" id="vc-slots-row" style="display:none;">
                        <div class="vc-slot" id="vc-slot-ref" title="Upload Audio Reference">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="audio/*">
                        </div>
                        <div style="font-size:12px; color:var(--text-secondary); display:flex; align-items:center;">
                            Upload reference<br>voice sample
                        </div>
                    </div>

                    <!-- Text Editor -->
                    <div class="vc-text-editor">
                        <textarea class="vc-textarea" id="vc-prompt-input" placeholder="Type what you want the voice to say..."></textarea>
                        
                        <div class="vc-toolbar">
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="vc-tabs-panel">
                    <div class="vc-tab-header">
                        <button class="vc-tab-btn active" data-tab="settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Settings
                        </button>
                        <button class="vc-tab-btn" data-tab="assets">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Assets
                        </button>
                    </div>
                    <div class="vc-tab-content">
                         <!-- Tab: Settings -->
                         <div id="tab-settings" class="tab-pane">
                            <span class="bg-label">Emotion / Style</span>
                            <div class="emotion-grid">
                                <button class="emotion-btn active" data-emotion="neutral">Neutral</button>
                                <button class="emotion-btn" data-emotion="happy">Happy</button>
                                <button class="emotion-btn" data-emotion="friendly">Friendly</button>
                            </div>

                            <span class="bg-label" style="margin-top:20px;">Speed</span>
                            <input type="range" class="vc-slider" id="speed-slider" min="0.5" max="2.0" step="0.1" value="1.0">
                            
                            <span class="bg-label" style="margin-top:20px;">Similarity</span>
                            <input type="range" class="vc-slider" id="similarity-slider" min="0" max="100" value="75">
                         </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div style="text-align:center; margin-top:2rem; font-size:12px; color:var(--text-secondary);">
                                No voice history found.
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="vc-action-area">
                     <button class="primary-btn" id="generate-voice-btn" style="width:100%;">
                        Generate Speech
                     </button>
                </div>
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <!-- Header -->
                <div style="position:absolute; top:20px; right:20px; z-index:10;">
                   <div class="status-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px;">Audio Ready</div>
                </div>

                <!-- Result Container -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                     <div class="preview-placeholder">
                        <span style="font-size:48px; margin-bottom:1rem; opacity:0.5;">🎙️</span>
                        <p style="color:var(--text-secondary);">Your generated speech will play here</p>
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
            } else {
                slotsRow.style.display = 'none';
            }
        });
    });

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
    const tabBtns = document.querySelectorAll('.vc-tab-btn');
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

    // 5. Generate Logic
    const generateBtn = document.getElementById('generate-voice-btn');
    generateBtn?.addEventListener('click', async () => {
        const promptInput = document.getElementById('vc-prompt-input');
        const prompt = promptInput?.value?.trim();
        const slot = document.getElementById('vc-slot-ref');
        const hasAudio = slot?.dataset.hasAudio === "true";
        const mode = document.querySelector('.mode-btn.active').dataset.mode;

        if (!prompt) {
            alert("Please enter text to generate speech.");
            return;
        }

        if (mode === 'clone' && !hasAudio) {
            alert("Please upload a reference audio for cloning.");
            return;
        }

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = "Generating...";
        generateBtn.disabled = true;

        try {
            const resBox = document.querySelector('.result-preview');
            // Fake Visualizer
            resBox.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                    <div class="audio-visualizer">
                        ${Array(10).fill(0).map(() => `<div class="visual-bar" style="height:${20 + Math.random() * 40}px; animation-duration:${0.3 + Math.random() * 0.5}s"></div>`).join('')}
                    </div>
                    <p style="margin-top:20px; color:var(--text-secondary);">Synthesizing voice...</p>
                </div>
            `;

            // Call API
            const result = await window.electronAPI.cloneVoice({
                text: prompt,
                audio: hasAudio ? slot.dataset.audioData : null
            });

            if (result && result.status === 'success') {
                resBox.innerHTML = `
                    <div style="text-align: center; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <audio controls autoplay style="width: 300px; border-radius:30px; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
                            <source src="${result.audio_url}" type="audio/mpeg">
                            Your browser does not support audio.
                        </audio>
                        <div style="margin-top:1.5rem; display:flex; gap:12px;">
                             <button class="secondary-btn" id="btn-download-audio">Download</button>
                        </div>
                    </div>
                `;

                document.getElementById('btn-download-audio')?.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = result.audio_url;
                    a.download = `voice_${Date.now()}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });

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
        }
    });

    // Toolbar
    document.getElementById('btn-clear-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('vc-prompt-input');
        if (el) el.value = '';
    });
}

window.loadVoiceCloningPage = loadVoiceCloningPage;