// pages/face-swap/face-swap.js
import './face-swap-layout.css';

const notifyError = (msg) => window.Toast ? window.Toast.show(msg, 'error') : alert(msg);

/**
 * 加载变脸图片页面内容 (Runway Style Refactor)
 */
function loadFaceSwapPage(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="studio-layout fade-in">
            <!-- Col 2: Controls (Left Panel) -->
            <div class="studio-controls face-swap-controls">
                
                <!-- 1. Header & Mode -->
                <div class="studio-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('STUDIO_IMAGE')}</div>
                    <div class="studio-mode-switch">
                        <button class="mode-btn" data-mode="text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            ${window.i18n.t('MODE_TEXT')}
                        </button>
                        <button class="mode-btn active" data-mode="image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            ${window.i18n.t('MODE_IMAGE')}
                        </button>
                    </div>
                </div>

                <!-- 2. Interactive Input Section -->
                <div class="studio-input-section">
                    <!-- Reference Slots (Hidden in Text mode) -->
                    <div class="studio-slots-row" id="fs-slots-row">
                        <!-- Upload Slot 1 -->
                        <div class="studio-slot" id="slot-ref-1" title="Add Image Reference">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="image/*">
                        </div>
                        <!-- Camera Button -->
                        <div class="studio-slot" id="fs-btn-camera" title="Take Photo">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        </div>
                        <!-- Empty Placeholder Slots (Visual only) -->
                        <div class="studio-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                        <div class="studio-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                    </div>

                    <!-- Sample Faces -->
                    <div class="studio-sample-label">${window.i18n.t('STUDIO_SAMPLE_LABEL')}</div>
                    <div class="studio-samples-row">
                        <img src="/system/samples/sample_face_1.png" class="studio-sample-img" data-index="1">
                        <img src="/system/samples/sample_face_2.png" class="studio-sample-img" data-index="2">
                        <img src="/system/samples/sample_face_3.png" class="studio-sample-img" data-index="3">
                        <img src="/system/samples/sample_face_4.png" class="studio-sample-img" data-index="4">
                    </div>

                    <!-- Quick Selection Tags -->
                    <div class="studio-tags-row">
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_SUPERMAN')}">${window.i18n.t('IMAGE_TAG_SUPERMAN')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_BATMAN')}">${window.i18n.t('IMAGE_TAG_BATMAN')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_CYBERPUNK')}">${window.i18n.t('IMAGE_TAG_CYBERPUNK')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_ANIME')}">${window.i18n.t('IMAGE_TAG_ANIME')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_DISNEY')}">${window.i18n.t('IMAGE_TAG_DISNEY')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_WUKONG')}">${window.i18n.t('IMAGE_TAG_WUKONG')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_NEZHA')}">${window.i18n.t('IMAGE_TAG_NEZHA')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('IMAGE_PROMPT_LANGLANG')}">${window.i18n.t('IMAGE_TAG_LANGLANG')}</div>
                    </div>

                    <!-- Text Editor -->
                    <div class="studio-text-editor">
                        <textarea class="studio-textarea" id="fs-prompt-input" placeholder="${window.i18n.t('FS_PROMPT_PLACEHOLDER')}"></textarea>
                        
                        <div class="studio-toolbar">
                             <button class="tool-icon-btn" id="btn-gen-prompt" title="Generate Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></button>
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="studio-tabs-panel fs-tabs-panel">
                    <div class="studio-tab-header">
                        <button class="studio-tab-btn active" data-tab="settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            ${window.i18n.t('TAB_SETTINGS')}
                        </button>
                        <button class="studio-tab-btn" data-tab="assets">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            ${window.i18n.t('TAB_ASSETS')}
                        </button>
                    </div>
                    <div class="studio-tab-content">
                         <!-- Tab: Settings -->
                         <div id="tab-settings" class="tab-pane">
                            <span class="bg-label">${window.i18n.t('LABEL_ASPECT_RATIO')}</span>
                            <div class="ratio-grid">
                                <div class="ratio-option active" data-ratio="16:9">
                                    <div class="ratio-box ratio-16-9"></div>
                                    <span class="ratio-label">16:9</span>
                                </div>
                                <div class="ratio-option" data-ratio="4:3">
                                     <div class="ratio-box ratio-4-3"></div>
                                     <span class="ratio-label">4:3</span>
                                </div>
                                <div class="ratio-option" data-ratio="1:1">
                                     <div class="ratio-box ratio-1-1"></div>
                                     <span class="ratio-label">1:1</span>
                                </div>
                                <div class="ratio-option" data-ratio="3:4">
                                     <div class="ratio-box ratio-3-4"></div>
                                     <span class="ratio-label">3:4</span>
                                </div>
                                <div class="ratio-option" data-ratio="9:16">
                                     <div class="ratio-box ratio-9-16"></div>
                                     <span class="ratio-label">9:16</span>
                                </div>
                            </div>

                             <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                                <span class="bg-label">${window.i18n.t('LABEL_REF_STRENGTH')}</span>
                                <span id="fs-strength-value" style="font-size: 11px; color: var(--primary); font-weight: 600;">75%</span>
                             </div>
                             <input type="range" class="studio-slider" id="fs-strength-slider" min="0" max="100" value="75" style="margin-top:8px;">

                         </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div id="fs-asset-list" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                                <!-- Dynamic Assets -->
                            </div>
                            <div id="fs-asset-empty" style="text-align:center; margin-top:1rem; font-size:12px; color:var(--text-secondary); display:none;">
                                ${window.i18n.t('COMMON_NO_HISTORY')}
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="studio-action-area fs-action-area">
                     <button class="primary-btn" id="generate-btn" style="width:100%;">
                        ${window.i18n.t('FS_BTN_GENERATE')}
                     </button>
                </div>

            </div>

            <!-- Col 3: Viewport (Canvas) -->
            <div class="studio-viewport">
                <!-- Simple Header -->
                <div style="position:absolute; top:20px; right:20px; display:flex; gap:10px; z-index:10;">
                    <div class="status-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px;">${window.i18n.t('COMMON_READY')}</div>
                </div>

                <!-- Empty State / Result -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent;">
                    <div class="preview-placeholder">
                        <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">✨</span>
                        <p style="color:var(--text-secondary);">${window.i18n.t('FS_RESULT_PLACEHOLDER')}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Camera Modal -->
        <div id="fs-camera-modal" class="fs-modal" style="display:none;">
            <div class="fs-modal-content">
                <div class="fs-modal-header">
                    <span>${window.i18n.t('CAMERA_CAPTURE_TITLE')}</span>
                    <button id="fs-camera-close">&times;</button>
                </div>
                <div class="fs-camera-container">
                    <video id="fs-video-preview" autoplay playsinline></video>
                    <canvas id="fs-capture-canvas" style="display:none;"></canvas>
                </div>
                <div class="fs-modal-footer">
                    <button class="primary-btn" id="fs-btn-capture">${window.i18n.t('CAMERA_SNAP_BTN')}</button>
                </div>
            </div>
        </div>

        <style>
            .fs-modal {
                position: fixed; top:0; left:0; width:100%; height:100%;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center; z-index: 1000;
            }
            .fs-modal-content {
                background: var(--bg-deep); border: 1px solid var(--glass-border);
                border-radius: 16px; width: 500px; max-width: 90%; overflow: hidden;
            }
            .fs-modal-header {
                padding: 15px 20px; border-bottom: 1px solid var(--glass-border);
                display: flex; justify-content: space-between; align-items: center;
            }
            #fs-camera-close {
                background: none; border: none; color: var(--text-secondary);
                font-size: 24px; cursor: pointer;
            }
            .fs-camera-container {
                width: 100%; aspect-ratio: 16/9; background: #000;
                display: flex; align-items: center; justify-content: center;
                position: relative; overflow: hidden;
            }
            #fs-video-preview { width: 100%; height: 100%; object-fit: contain; }
            .fs-modal-footer { padding: 20px; text-align: center; }

            .studio-samples-row {
                display: flex; gap: 10px; margin-top: 10px; overflow-x: auto; padding-bottom: 5px;
            }
            .studio-sample-img {
                width: 60px; height: 60px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1);
                cursor: pointer; transition: all 0.2s; object-fit: cover; flex-shrink: 0;
            }
            .studio-sample-img:hover { border-color: var(--accent-color); transform: scale(1.05); }
            .studio-sample-label { font-size: 11px; opacity: 0.6; margin-top: 15px; }
        </style>
    `;

    setupFaceSwapEventListeners();
}

/**
 * 设置变脸/生成页面事件监听器
 */
function setupFaceSwapEventListeners() {

    // 1. Mode Switcher (Text vs Image)
    const modeBtns = document.querySelectorAll('.mode-btn');
    const slotsRow = document.getElementById('fs-slots-row');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle Slots for Text/Image Mode
            const mode = btn.dataset.mode;
            if (mode === 'text') {
                if (slotsRow) slotsRow.style.display = 'none';
            } else {
                if (slotsRow) slotsRow.style.display = 'flex';
            }
        });
    });

    // 2. Interactive Input Section (Start with Image Logic)
    const slot1 = document.getElementById('slot-ref-1');
    const defaultIconHTML = slot1?.innerHTML;

    function setSlotImage(slotElement, imageSrc, defaultHTML) {
        slotElement.innerHTML = `
            <img src="${imageSrc}">
            <div class="remove-btn" title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
        `;
        slotElement.classList.add('has-image');
        slotElement.dataset.hasImage = "true";

        slotElement.querySelector('.remove-btn').addEventListener('click', (ev) => {
            ev.stopPropagation();
            slotElement.innerHTML = defaultHTML;
            slotElement.classList.remove('has-image');
            delete slotElement.dataset.hasImage;
            const newInput = slotElement.querySelector('input');
            if (newInput) {
                newInput.addEventListener('change', (ev2) => handleFileSelect(ev2, slotElement, defaultHTML));
            }
        });
    }

    function handleFileSelect(e, slotElement, defaultHTML) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const minDim = 300;
                    if (img.width < minDim || img.height < minDim) {
                        notifyError(`${window.i18n.t('MSG_IMAGE_TOO_SMALL')} (${img.width}x${img.height}px)`);
                        e.target.value = ""; // Clear input
                        return;
                    }
                    setSlotImage(slotElement, evt.target.result, defaultHTML);
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    if (slot1) {
        slot1.addEventListener('click', (e) => {
            if (e.target.closest('.remove-btn')) return;
            const input = slot1.querySelector('input');
            if (input) input.click();
        });
        const initialInput = slot1.querySelector('input');
        if (initialInput) {
            initialInput.addEventListener('change', (e) => handleFileSelect(e, slot1, defaultIconHTML));
        }
    }

    // 2.2 Sample Faces Logic
    document.querySelectorAll('.studio-sample-img').forEach(img => {
        img.addEventListener('click', async () => {
            if (slot1) {
                try {
                    // Fetch and convert to data URL so the backend/AI can read it
                    const resp = await fetch(img.src);
                    const blob = await resp.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSlotImage(slot1, reader.result, defaultIconHTML);
                    };
                    reader.readAsDataURL(blob);
                } catch (e) {
                    console.error("Failed to load sample image", e);
                    // Fallback to direct URL if fetch fails
                    setSlotImage(slot1, img.src, defaultIconHTML);
                }
            }
        });
    });

    // 2.3 Text Editor Tools
    const btnClearPrompt = document.getElementById('btn-clear-prompt');
    if (btnClearPrompt) {
        btnClearPrompt.addEventListener('click', () => {
            const promptInput = document.getElementById('fs-prompt-input');
            if (promptInput) promptInput.value = '';
        });
    }

    // 2.4 Quick Prompt Tags
    const tagsRow = document.querySelector('.studio-tags-row');
    const promptInputArea = document.getElementById('fs-prompt-input');
    if (tagsRow && promptInputArea) {
        tagsRow.addEventListener('click', (e) => {
            const tag = e.target.closest('.studio-tag');
            if (tag) {
                const prompt = tag.dataset.prompt;
                promptInputArea.value = prompt;

                // Visual feedback: Flash the input box
                promptInputArea.style.transition = 'background-color 0.3s';
                promptInputArea.style.backgroundColor = 'rgba(255, 217, 61, 0.2)'; // Faint yellow
                setTimeout(() => {
                    promptInputArea.style.backgroundColor = '';
                }, 300);
            }
        });
    }

    // 2.5 Camera Logic
    const btnCamera = document.getElementById('fs-btn-camera');
    const cameraModal = document.getElementById('fs-camera-modal');
    const cameraClose = document.getElementById('fs-camera-close');
    const btnCapture = document.getElementById('fs-btn-capture');
    const videoPreview = document.getElementById('fs-video-preview');
    const captureCanvas = document.getElementById('fs-capture-canvas');
    let cameraStream = null;

    btnCamera?.addEventListener('click', async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            videoPreview.srcObject = cameraStream;
            cameraModal.style.display = 'flex';
        } catch (err) {
            console.error("Camera access denied:", err);
            notifyError(window.i18n.t('MSG_CAMERA_DENIED'));
        }
    });

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        if (cameraModal) cameraModal.style.display = 'none';
        if (videoPreview) videoPreview.srcObject = null;
    };

    cameraClose?.addEventListener('click', stopCamera);

    btnCapture?.addEventListener('click', () => {
        if (!videoPreview.videoWidth) return;

        // Match the canvas perfectly to the video stream dimensions
        const ctx = captureCanvas.getContext('2d');
        captureCanvas.width = videoPreview.videoWidth;
        captureCanvas.height = videoPreview.videoHeight;

        const minDim = 300;
        if (captureCanvas.width < minDim || captureCanvas.height < minDim) {
            notifyError(`${window.i18n.t('MSG_IMAGE_TOO_SMALL')} (${captureCanvas.width}x${captureCanvas.height}px)`);
            stopCamera();
            return;
        }

        ctx.drawImage(videoPreview, 0, 0, captureCanvas.width, captureCanvas.height);
        const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.9);

        // Update Slot
        const slotElement = document.getElementById('slot-ref-1');
        if (slotElement) {
            setSlotImage(slotElement, dataUrl, defaultIconHTML);
        }

        stopCamera();
    });

    // 3. Aspect Ratio Selection (Event Delegation)
    const ratioGrid = document.querySelector('.ratio-grid');
    if (ratioGrid) {
        ratioGrid.addEventListener('click', (e) => {
            const option = e.target.closest('.ratio-option');
            if (option) {
                document.querySelectorAll('.ratio-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            }
        });
    }

    // 3.5 Strength Slider Value Update
    const strengthSlider = document.getElementById('fs-strength-slider');
    const strengthValueDisp = document.getElementById('fs-strength-value');
    if (strengthSlider && strengthValueDisp) {
        strengthSlider.addEventListener('input', (e) => {
            strengthValueDisp.innerText = `${e.target.value}%`;
        });
    }

    // 4. Tab Switching (Settings / Assets)
    const tabBtns = document.querySelectorAll('.studio-tab-btn');
    const tabSettings = document.getElementById('tab-settings');
    const tabAssets = document.getElementById('tab-assets');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            if (target === 'settings') {
                if (tabSettings) tabSettings.style.display = 'block';
                if (tabAssets) tabAssets.style.display = 'none';
            } else {
                if (tabSettings) tabSettings.style.display = 'none';
                if (tabAssets) tabAssets.style.display = 'block';
            }
        });
    });

    // 4.5 Model Settings Logic (Searchable Dropdown)
    // 7. Model Settings Logic
    // initModelSelect removed per user request (auto-selection enabled)

    // 5. Generate Logic
    const generateBtn = document.getElementById('generate-btn');
    generateBtn?.addEventListener('click', async () => {
        const promptInput = document.getElementById('fs-prompt-input');
        const prompt = promptInput?.value?.trim();
        const slot = document.getElementById('slot-ref-1');
        const hasImage = slot?.dataset.hasImage === "true";
        const imgElement = slot?.querySelector('img');

        if (!prompt && !hasImage) {
            notifyError(window.i18n.t('MSG_PROMPT_OR_IMAGE_REQUIRED'));
            return;
        }

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = window.i18n.t('FS_BTN_GENERATING');
        generateBtn.disabled = true;

        if (window.GlobalSidebar) {
            window.GlobalSidebar.setJobStatus('face-swap', 'processing');
        }

        let progressInterval;
        try {
            // Get Parameters
            const activeRatio = document.querySelector('.ratio-option.active')?.dataset.ratio || "1:1";
            const strengthSlider = document.getElementById('fs-strength-slider');
            const strengthValue = strengthSlider ? parseFloat(strengthSlider.value) / 100 : 0.75;

            // Map Ratio to Size (Must be >= 921,600 pixels)
            let width = 1024, height = 1024;
            if (activeRatio === '16:9') { width = 1280; height = 720; }
            if (activeRatio === '4:3') { width = 1280; height = 960; }
            if (activeRatio === '3:4') { width = 960; height = 1280; }
            if (activeRatio === '9:16') { width = 720; height = 1280; }

            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                <div class="energy-overlay">
                    <div class="energy-logo-sphere">
                        <div class="energy-logo-inner"></div>
                    </div>
                    <div class="energy-bar-container">
                        <div class="energy-bar-fill" id="energy-progress" style="width: 10%;"></div>
                    </div>
                    <div class="energy-label">${window.i18n.t('FS_STATUS_GATHERING')}</div>
                </div>
            `;

            let progress = 10;
            progressInterval = setInterval(() => {
                progress += Math.random() * 12;
                if (progress > 94) progress = 94;
                const fill = document.getElementById('energy-progress');
                const label = document.querySelector('.energy-label');
                if (fill) fill.style.width = `${progress}%`;
                if (label) {
                    if (progress > 30) label.innerText = window.i18n.t('FS_STATUS_PROCESSING');
                    if (progress > 70) label.innerText = window.i18n.t('FS_STATUS_FINISHING');
                }
            }, 800);

            let result;
            if (hasImage) {
                // EDIT IMAGE MODE
                const opts = {
                    image: imgElement.src,
                    prompt: prompt || "Enhance this image",
                    strength: strengthValue,
                    model: window.SettingsManager.get('imageModel') || "doubao-seedream-4-0-250828"
                };
                if (window.electronAPI && window.electronAPI.editImage) {
                    result = await window.electronAPI.editImage(opts);
                } else {
                    result = await window.fetchAPI('/api/ai/edit-image', opts);
                }
            } else {
                // GENERATE IMAGE MODE
                const opts = {
                    prompt: prompt,
                    width, height,
                    model: window.SettingsManager.get('imageModel') || "doubao-seedream-4-0-250828"
                };
                if (window.electronAPI && window.electronAPI.generateImage) {
                    result = await window.electronAPI.generateImage(opts);
                } else {
                    result = await window.fetchAPI('/api/ai/image', opts);
                }
            }

            if (result && result.status === 'success') {
                const imageUrl = result.image_url || result.url;
                if (!imageUrl) {
                    throw new Error("AI generated success but no image URL was returned.");
                }
                resBox.innerHTML = `
                    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <img src="${imageUrl}" style="max-width:100%; max-height:100%; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                        <div style="margin-top:10px; display:flex; gap:10px;">
                            <button class="secondary-btn small" id="btn-save-assets" disabled>${window.i18n.t('COMMON_SAVED')}</button>
                            <button class="secondary-btn small" onclick="window.open('${imageUrl}')">${window.i18n.t('COMMON_OPEN')}</button>
                        </div>
                    </div>
                `;

                // Auto-Save to Assets
                try {
                    window.AssetManager.add({
                        type: 'image',
                        url: imageUrl,
                        prompt: prompt || "Generated Image",
                        metadata: { width, height, model: "doubao-seedream" }
                    });
                    console.log("Auto-saved to assets");
                    renderAssetsTab(); // Refresh sidebar
                } catch (err) {
                    console.error("Auto-save failed:", err);
                }
            } else {
                throw new Error(result?.message || "Unknown error");
            }

        } catch (error) {
            console.error(error);
            notifyError(error.message);
            const resBox = document.querySelector('.result-preview');
            if (resBox) {
                const safeErr = window.escapeHTML ? window.escapeHTML(error.message) : error.message;
                resBox.innerHTML = `
                    <div class="preview-placeholder">
                        <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">⚠️</span>
                        <p style="color:var(--text-secondary);">${window.i18n.t('COMMON_ERROR')}</p>
                        <small>${safeErr}</small>
                    </div>
                `;
            }
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            generateBtn.disabled = false;
            generateBtn.innerHTML = oldText;
            if (window.GlobalSidebar) {
                window.GlobalSidebar.setJobStatus('face-swap', 'idle');
            }
        }
    });

    // 6. Toolbar
    document.getElementById('btn-gen-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('fs-prompt-input');
        if (el) {
            const prompts = [
                window.i18n.t('IMAGE_PROMPT_RANDOM_1'),
                window.i18n.t('IMAGE_PROMPT_RANDOM_2'),
                window.i18n.t('IMAGE_PROMPT_RANDOM_3'),
                window.i18n.t('IMAGE_PROMPT_RANDOM_4'),
                window.i18n.t('IMAGE_PROMPT_RANDOM_5')
            ];
            el.value = prompts[Math.floor(Math.random() * prompts.length)];
            el.focus();
        }
    });

    // 7. Render Assets
    function renderAssetsTab() {
        const list = document.getElementById('fs-asset-list');
        const empty = document.getElementById('fs-asset-empty');
        if (!list) return;

        const assets = window.AssetManager.getRecent('image', 20);

        if (assets.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = assets.map(asset => `
                <div class="asset-item" onclick="window.MediaPreview.open('${asset.id}')" style="aspect-ratio:1; border-radius:8px; overflow:hidden; position:relative; cursor:pointer; border:1px solid var(--glass-border);">
                    <img src="${asset.url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                </div>
            `).join('');
    }

    // Initial render
    renderAssetsTab();

    // Force refresh to ensure data is consistent (fixes race condition or stale data)
    window.AssetManager.refresh();

    // Listen for global asset updates
    const updateHandler = () => renderAssetsTab();
    window.addEventListener('assets-updated', updateHandler);

    if (window.registerPageCleanup) {
        window.registerPageCleanup(() => {
            stopCamera();
            window.removeEventListener('assets-updated', updateHandler);
        });
    }
}

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

// Export for global usage
window.loadFaceSwapPage = loadFaceSwapPage;