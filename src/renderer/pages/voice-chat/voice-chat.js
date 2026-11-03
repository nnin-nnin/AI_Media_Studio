/**
 * voice-chat.js
 * AI角色互动页面逻辑
 */
import './voice-chat.css';
import { fetchAPI } from '../../utils/web-api.js';
import { AudioRecorder } from '../../utils/audio-recorder.js';

class VoiceChatPage {
    constructor() {
        this.selectedCharacter = null;
        this.isRecording = false;
        this.recorder = new AudioRecorder();
        this.characters = [];
        this.currentAudio = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="studio-layout fade-in">
                <!-- Col 2: Controls (Left Panel) -->
                <div class="studio-controls">
                    <div class="studio-header">
                        <div style="font-weight:600; font-size:14px;">${window.i18n.t('CHAT_TITLE')}</div>
                    </div>

                    <!-- Character List -->
                    <div class="character-list-container" id="character-list">
                        <div class="loading-overlay">${window.i18n.t('COMMON_LOADING')}</div>
                    </div>

                    <!-- Voice Settings (Bottom) -->
                    <div class="voice-settings-panel">
                        <div class="setting-row">
                            <div class="setting-label">${window.i18n.t('LABEL_MIC_INPUT')}</div>
                            <select id="mic-select" class="studio-select-glass" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--glass-border);">
                                <option value="" disabled selected>${window.i18n.t('COMMON_LOADING')}</option>
                            </select>
                        </div>
                        <div class="setting-row">
                            <div class="setting-label">
                                <span>${window.i18n.t('AUDIO_SPEED_LABEL')}</span>
                                <span id="speed-val">1.0x</span>
                            </div>
                            <input type="range" class="studio-slider" id="voice-speed" min="0.5" max="2.0" step="0.1" value="1.0">
                        </div>
                        <div class="setting-row">
                            <div class="setting-label">${window.i18n.t('LABEL_SAMPLE_RATE')}</div>
                            <select id="voice-sr" class="studio-select-glass" style="width:100%; padding:6px; border-radius:6px; border:1px solid rgba(0,0,0,0.1);">
                                <option value="22050" selected>22050 Hz</option>
                                <option value="44100">44100 Hz (Hi-Fi)</option>
                            </select>
                        </div>
                        <div class="voice-engine-meta">
                            <span class="engine-dot" id="engine-dot"></span>
                            <span class="engine-text" id="engine-name-label">本地免密语音</span>
                            <button type="button" class="engine-link-btn" id="btn-open-speech-cfg" title="配置火山原厂角色语音">配置 ↗</button>
                        </div>
                    </div>
                </div>

                <!-- Col 3: Viewport (Chat Canvas) -->
                <div class="studio-viewport" id="chat-viewport">
                    <!-- Default State (No Character Selected) -->
                    <div id="vc-empty-state" style="text-align:center; opacity:0.6;">
                        <div style="font-size:48px; margin-bottom:1rem;">🎙️</div>
                        <p>${window.i18n.t('CHAT_WELCOME')}</p>
                    </div>

                    <!-- Active Chat Interface -->
                    <div class="chat-viewport-inner" id="chat-interface" style="display:none;">
                        
                        <!-- Active Character Display -->
                        <div class="active-char-display" id="active-char-container">
                            <img id="char-avatar" class="active-char-avatar" src="" alt="Avatar">
                            <div class="active-char-name" id="char-name"></div>
                        </div>

                        <!-- Recognition Text -->
                         <div class="transcript-box" id="recognition-result"></div>
                         <p id="mic-status" style="font-size:12px; color:var(--text-secondary); margin-bottom:20px;">${window.i18n.t('CHAT_MIC_START')}</p>

                        <!-- Mic Button with Pulse -->
                        <div class="mic-wrapper">
                            <button id="mic-btn" class="mic-btn-large">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="23"></line><line x1="8" x2="16" y1="23" y2="23"></line></svg>
                            </button>
                            <div class="mic-pulse"></div>
                        </div>

                        <!-- Bottom Input Area -->
                        <div class="input-area">
                             <button class="action-btn-circle" id="upload-btn" title="Upload Audio">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             </button>
                             <input type="file" id="audio-input" accept="audio/*" style="display: none;">
                             
                             <textarea id="manual-text-input" placeholder="${window.i18n.t('AUDIO_PROMPT_PLACEHOLDER')}" rows="1"></textarea>
                             
                             <button class="action-btn-circle primary" id="send-text-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.init();
    }

    async init() {
        this.micBtn = document.getElementById('mic-btn');
        this.micStatus = document.getElementById('mic-status');
        this.recognitionResult = document.getElementById('recognition-result');
        this.characterList = document.getElementById('character-list');
        this.chatInterface = document.getElementById('chat-interface');

        await this.loadCharacters();

        if (this.micBtn) {
            this.micBtn.onclick = () => this.toggleRecording();
        }

        this.uploadBtn = document.getElementById('upload-btn');
        this.audioInput = document.getElementById('audio-input');

        if (this.uploadBtn && this.audioInput) {
            this.uploadBtn.onclick = () => this.audioInput.click();
            this.audioInput.onchange = (e) => this.handleFileUpload(e);
        }

        this.sendTextBtn = document.getElementById('send-text-btn');
        this.manualTextInput = document.getElementById('manual-text-input');

        if (this.sendTextBtn) {
            this.sendTextBtn.onclick = () => {
                const text = this.manualTextInput.value.trim();
                if (text) {
                    const speedEl = document.getElementById('voice-speed');
                    const srEl = document.getElementById('voice-sr');
                    this.handleFinalTranscript(text, {
                        speed: speedEl ? parseFloat(speedEl.value) : 1.0,
                        sampleRate: srEl ? parseInt(srEl.value) : 22050
                    });
                    this.manualTextInput.value = '';
                }
            };
        }

        if (this.manualTextInput) {
            this.manualTextInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendTextBtn?.click();
                }
            });
        }

        if (window.registerPageCleanup) {
            window.registerPageCleanup(() => {
                if (this.isRecording) {
                    this.isRecording = false;
                    this.recorder.stop().catch(() => {});
                }
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                }
                if (this._settingsListener) {
                    window.removeEventListener('settings-updated', this._settingsListener);
                }
            });
        }

        // Open speech configuration modal from control panel
        const btnOpenSpeechCfg = document.getElementById('btn-open-speech-cfg');
        if (btnOpenSpeechCfg) {
            btnOpenSpeechCfg.onclick = () => window.ApiConfigModal && window.ApiConfigModal.open('speech');
        }

        // Voice Control Listeners
        const speedInput = document.getElementById('voice-speed');
        const speedVal = document.getElementById('speed-val');
        if (speedInput && speedVal) {
            speedInput.oninput = (e) => {
                speedVal.innerText = e.target.value + 'x';
            };
        }

        // Check Volcengine Speech configuration
        await this.checkSpeechConfig();
        this._settingsListener = () => this.checkSpeechConfig();
        window.addEventListener('settings-updated', this._settingsListener);

        // Initialize Mic Selector
        await this.loadMicrophones();
    }

    async checkSpeechConfig() {
        try {
            const res = await window.fetch('/api/settings/keys');
            const data = await res.json();
            const hasVolc = !!(data.keys?.VOLC_SPEECH_APPID?.configured && data.keys?.VOLC_SPEECH_TOKEN?.configured);
            this.hasVolcSpeech = hasVolc;

            const dot = document.getElementById('engine-dot');
            const label = document.getElementById('engine-name-label');
            const cfgBtn = document.getElementById('btn-open-speech-cfg');

            if (hasVolc) {
                if (dot) dot.className = 'engine-dot is-active';
                if (label) label.innerText = '火山豆包原厂音色';
                if (cfgBtn) cfgBtn.innerText = '管理';
            } else {
                if (dot) dot.className = 'engine-dot';
                if (label) label.innerText = '本地免密语音';
                if (cfgBtn) cfgBtn.innerText = '配置 ↗';
            }
        } catch (e) {
            console.warn('[VoiceChat] Failed to check speech config:', e);
        }
    }

    async loadMicrophones() {
        const micSelect = document.getElementById('mic-select');
        if (!micSelect) return;

        try {
            micSelect.innerHTML = '<option>Loading...</option>';
            // Request permission first found to get labels
            // (Assumes permission already granted or will trigger prompt)

            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');

            micSelect.innerHTML = '';

            // Auto-select logic
            let savedId = localStorage.getItem('selected_mic_id');
            let hasSelection = false;

            audioInputs.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                // Add a meaningful label if missing (common in some browsers until permission)
                option.text = device.label || `Microphone ${index + 1}`;

                // Highlight BlackHole as (Virtual) so user knows
                if (option.text.toLowerCase().includes('blackhole')) {
                    option.text = `🚫 ${option.text} (Virtual Loopback)`;
                }

                if (device.deviceId === savedId) {
                    option.selected = true;
                    hasSelection = true;
                }
                micSelect.appendChild(option);
            });

            // If no saved selection, attempt to pick a sensible default (NOT BlackHole)
            if (!hasSelection && audioInputs.length > 0) {
                const bestDevice = audioInputs.find(d =>
                    !d.label.toLowerCase().includes('blackhole') &&
                    !d.label.toLowerCase().includes('virtual') &&
                    d.deviceId !== 'default'
                );
                if (bestDevice) {
                    micSelect.value = bestDevice.deviceId;
                    localStorage.setItem('selected_mic_id', bestDevice.deviceId);
                }
            }

            // Listener
            micSelect.onchange = (e) => {
                localStorage.setItem('selected_mic_id', e.target.value);
                console.log("[VoiceChat] User selected mic:", e.target.value);
            };

        } catch (e) {
            console.error("Failed to load mics", e);
            micSelect.innerHTML = '<option value="">Default</option>';
        }
    }

    async loadCharacters() {
        try {
            const data = await window.fetchAPI('/api/ai/characters?category=system', {}, { method: 'GET' });
            if (data.status === 'success') {
                this.characters = data.data;
                this.renderCharacterList();
            }
        } catch (e) {
            console.error("Load characters failed", e);
        }
    }

    renderCharacterList() {
        if (!this.characterList) return;
        const escapeHTML = window.escapeHTML || (s => s);
        this.characterList.innerHTML = this.characters.map(char => `
            <div class="character-card" data-id="${escapeHTML(char.id)}">
                <img src="${escapeHTML(char.avatar)}" alt="${escapeHTML(char.name)}">
                <div class="character-info">
                    <h3>${escapeHTML(char.name)}</h3>
                    <p>${escapeHTML(char.description || '')}</p>
                </div>
            </div>
        `).join('');

        this.characterList.querySelectorAll('.character-card').forEach(card => {
            card.onclick = () => this.selectCharacter(card.dataset.id);
        });
    }

    selectCharacter(id) {
        const char = this.characters.find(c => c.id == id);
        if (!char) return;
        this.selectedCharacter = char;

        // UI Update: Highlight active card
        this.characterList.querySelectorAll('.character-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id == id);
        });

        // Update Chat Viewport
        const emptyState = document.getElementById('vc-empty-state');
        const chatInterface = document.getElementById('chat-interface');

        if (emptyState) emptyState.style.display = 'none';
        if (chatInterface) {
            chatInterface.style.display = 'flex';
            chatInterface.classList.add('fade-in');
        }

        document.getElementById('char-avatar').src = char.avatar;
        document.getElementById('char-name').innerText = char.name;
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            // Get explicitly selected Mic from localStorage or Dropdown
            // We use the dropdown value as truth if available
            const micSelect = document.getElementById('mic-select');
            let micId = micSelect ? micSelect.value : null;

            if (!micId) {
                micId = localStorage.getItem('selected_mic_id');
            }

            console.log("[VoiceChat] Starting recording with device:", micId);
            await this.recorder.start(micId);

            this.isRecording = true;
            this.micBtn.classList.add('recording');
            this.micStatus.innerText = window.i18n.t('CHAT_MIC_STOP');
            this.recognitionResult.innerText = "Listening...";
        } catch (e) {
            console.error("Start recording failed", e);
            this.micStatus.innerText = "Microphone access denied.";
        }
    }

    async stopRecording() {
        console.log("[VoiceChat] Stopping recording...");
        this.isRecording = false;
        if (this.micBtn) this.micBtn.classList.remove('recording');
        if (this.micStatus) this.micStatus.innerText = window.i18n.t('CHAT_PROCESSING');

        const recordResult = await this.recorder.stop();
        if (recordResult && recordResult.blob && recordResult.maxVolume > 0.01) {
            console.log("[VoiceChat] Sending valid audio. Max Volume:", recordResult.maxVolume);
            await this.processRecordedAudio(recordResult.blob);
        } else {
            console.warn("[VoiceChat] Recording produced no audio data or was too quiet.", recordResult);
            this.micStatus.innerText = "No audio detected or volume too low.";
            this.recognitionResult.innerText = "";
        }
    }

    async processRecordedAudio(blob) {
        console.log("[VoiceChat] Processing recorded audio, size:", blob.size);
        this.recognitionResult.innerText = "Transcribing...";
        if (window.GlobalSidebar) {
            window.GlobalSidebar.setJobStatus('voice-chat', 'processing');
        }

        // Capture settings NOW, before manual navigation or async delays
        const speedEl = document.getElementById('voice-speed');
        const srEl = document.getElementById('voice-sr');
        const currentSettings = {
            speed: speedEl ? parseFloat(speedEl.value) : 1.0,
            sampleRate: srEl ? parseInt(srEl.value) : 22050
        };

        try {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');

            const token = localStorage.getItem('ai_auth_token');
            // ... (fetch logic) ...
            const res = await window.fetch('/api/ai/stt', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            // ... (response handling) ...
            const result = await res.json();

            if (result.status === 'success') {
                if (result.text && result.text.trim()) {
                    this.recognitionResult.innerText = result.text;
                    // Pass the pre-captured settings
                    await this.handleFinalTranscript(result.text, currentSettings);
                } else {
                    // ... (empty text handling) ...
                    console.warn("[VoiceChat] STT returned empty text.");
                    this.micStatus.innerText = "Couldn't hear anything. Please try again.";
                    this.recognitionResult.innerText = "";
                    const avatarContainer = document.getElementById('active-char-container');
                    if (avatarContainer) avatarContainer.classList.remove('speaking');
                }
            } else {
                throw new Error(result.message || "STT failed");
            }
        } catch (e) {
            // ... (error handling) ...
            console.error("[VoiceChat] STT Error:", e);
            this.micStatus.innerText = "Speech recognition failed.";
            this.recognitionResult.innerText = "";
        } finally {
            if (window.GlobalSidebar) {
                window.GlobalSidebar.setJobStatus('voice-chat', 'idle');
            }
        }
    }

    async handleFinalTranscript(text, settings = { speed: 1.0, sampleRate: 22050 }) {
        if (!text || !this.selectedCharacter) return;
        this.micStatus.innerText = window.i18n.t('CHAT_PROCESSING');

        try {
            // Use passed settings, no DOM access needed here
            const res = await fetchAPI('/api/ai/character-voice', {
                characterId: this.selectedCharacter.id,
                text: text,
                speed: settings.speed,
                sampleRate: settings.sampleRate
            });

            if (res.status === 'success') {
                // Show the text being read back
                this.recognitionResult.innerText = res.text || "Recognition complete.";

                // Refresh Sidebar Recent Work
                if (window.AssetManager) {
                    window.AssetManager.refresh();
                }

                if (this.currentAudio) {
                    this.currentAudio.pause();
                }

                const avatarContainer = document.getElementById('active-char-container');

                if (res.audio_url) {
                    const audio = new Audio(res.audio_url);
                    this.currentAudio = audio;

                    audio.onplay = () => {
                        if (avatarContainer) avatarContainer.classList.add('speaking');
                        this.micStatus.innerText = "Speaking...";
                    };

                    audio.onended = () => {
                        if (avatarContainer) avatarContainer.classList.remove('speaking');
                        this.micStatus.innerText = window.i18n.t('CHAT_MIC_START');
                    };

                    audio.play();
                } else if ('speechSynthesis' in window) {
                    // Fallback to Web Speech API when no DashScope key is set
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(res.text);
                    utterance.rate = settings.speed || 1.0;
                    utterance.lang = 'zh-CN';

                    utterance.onstart = () => {
                        if (avatarContainer) avatarContainer.classList.add('speaking');
                        this.micStatus.innerText = "Speaking...";
                    };

                    utterance.onend = () => {
                        if (avatarContainer) avatarContainer.classList.remove('speaking');
                        this.micStatus.innerText = window.i18n.t('CHAT_MIC_START');
                    };

                    window.speechSynthesis.speak(utterance);
                } else {
                    this.micStatus.innerText = window.i18n.t('CHAT_MIC_START');
                }
            }
        } catch (e) {
            console.error("TTS Failed", e);
            this.micStatus.innerText = "Generation failed. Try again.";
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file || !this.selectedCharacter) return;

        this.micStatus.innerText = window.i18n.t('CHAT_PROCESSING');
        this.recognitionResult.innerText = "Uploading audio file...";

        if (window.GlobalSidebar) {
            window.GlobalSidebar.setJobStatus('voice-chat', 'processing');
        }

        try {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('audio', file);

            const token = localStorage.getItem('ai_auth_token');
            const res = await window.fetch('/api/ai/stt', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const sttResult = await res.json();

            if (sttResult.status === 'success') {
                this.recognitionResult.innerText = sttResult.text;
                await this.handleFinalTranscript(sttResult.text);
            } else {
                throw new Error(sttResult.message || "STT failed");
            }
        } catch (e) {
            console.error("Upload/STT Failed", e);
            this.micStatus.innerText = "Process failed. Try again.";
            this.recognitionResult.innerText = "";
        } finally {
            if (window.GlobalSidebar) {
                window.GlobalSidebar.setJobStatus('voice-chat', 'idle');
            }
            this.audioInput.value = ''; // Reset input
        }
    }
}

window.loadVoiceChatPage = (container) => {
    const page = new VoiceChatPage();
    page.render(container);
};
