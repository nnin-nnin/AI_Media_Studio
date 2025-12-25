// pages/video-generation/video-generation.js

/**
 * 加载生成视频页面内容 (Studio Layout Refactor)
 */
function loadVideoGenerationPage(container) {
    if (!container) return;

    // Inject styles if not present
    if (!document.getElementById('vg-layout-css')) {
        const link = document.createElement('link');
        link.id = 'vg-layout-css';
        link.rel = 'stylesheet';
        link.href = 'pages/video-generation/video-generation-layout.css';
        document.head.appendChild(link);
    }

    container.innerHTML = `
        <div class="studio-layout fade-in">
            
            <!-- Col 2: Controls (Left Panel) -->
            <div class="studio-controls video-gen-controls">
                
                <!-- 1. Header & Mode -->
                <div class="studio-header">
                    <div style="font-weight:600; font-size:14px;">${window.i18n.t('STUDIO_VIDEO')}</div>
                    <div class="studio-mode-switch">
                        <button class="mode-btn" data-mode="text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Text
                        </button>
                        <button class="mode-btn active" data-mode="image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Image
                        </button>
                    </div>
                </div>

                <!-- 2. Interactive Input Section -->
                <div class="studio-input-section">
                    <!-- Image Upload Slot (Initially hidden or shown based on mode) -->
                    <div class="studio-slots-row" id="vg-image-slot-row" style="display:flex;">
                        <div class="studio-slot" id="vg-slot-ref" title="Add Image Reference">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="image/*">
                        </div>
                        <div class="studio-slot" id="vg-btn-camera" title="Take Photo">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        </div>
                        <!-- Empty Placeholder Slots (Visual only) -->
                        <div class="studio-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                        <div class="studio-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                    </div>

                    <!-- Sample Faces -->
                    <div class="studio-sample-label">${window.i18n.t('STUDIO_SAMPLE_LABEL')}</div>
                    <div class="studio-samples-row">
                        <img class="studio-sample-img" src="/assets/system/samples/sample_face_1.png" data-index="1">
                        <img class="studio-sample-img" src="/assets/system/samples/sample_face_2.png" data-index="2">
                        <img class="studio-sample-img" src="/assets/system/samples/sample_face_3.png" data-index="3">
                        <img class="studio-sample-img" src="/assets/system/samples/sample_face_4.png" data-index="4">
                    </div>

                    <!-- Quick Selection Tags -->
                    <div class="studio-tags-row">
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_CLOSEUP_SMILE')}">${window.i18n.t('VIDEO_TAG_CLOSEUP_SMILE')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_SLOW_TURN')}">${window.i18n.t('VIDEO_TAG_SLOW_TURN')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_SINGING')}">${window.i18n.t('VIDEO_TAG_SINGING')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_DANCING')}">${window.i18n.t('VIDEO_TAG_DANCING')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_BASKETBALL')}">${window.i18n.t('VIDEO_TAG_BASKETBALL')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_CINEMATIC_FIXED')}">${window.i18n.t('VIDEO_TAG_CINEMATIC_FIXED')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_DISNEY_PORTRAIT')}">${window.i18n.t('VIDEO_TAG_DISNEY_PORTRAIT')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_ANIME_ID')}">${window.i18n.t('VIDEO_TAG_ANIME_ID')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_STABLE_WALK')}">${window.i18n.t('VIDEO_TAG_STABLE_WALK')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_WUKONG_STABLE')}">${window.i18n.t('VIDEO_TAG_WUKONG_STABLE')}</div>
                        <div class="studio-tag" data-prompt="${window.i18n.t('VIDEO_PROMPT_MODERN_ID')}">${window.i18n.t('VIDEO_TAG_MODERN_ID')}</div>
                    </div>

                    <!-- Text Editor -->
                    <div class="studio-text-editor">
                        <textarea class="studio-textarea" id="vg-prompt-input" placeholder="${window.i18n.t('VG_PROMPT_PLACEHOLDER')}"></textarea>
                        
                        <div class="studio-toolbar">
                             <button class="tool-icon-btn" id="btn-gen-prompt" title="Generate Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></button>
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="studio-tabs-panel vg-tabs-panel">
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
                            <span class="bg-label">Aspect Ratio</span>
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
                                <span class="bg-label">Duration</span>
                            </div>
                            <div class="duration-chips" style="display: flex; gap: 8px; margin-top: 8px;">
                                <div class="duration-chip active" data-value="5">5s</div>
                                <div class="duration-chip" data-value="10">10s</div>
                            </div>
                            <p style="font-size:10px; color:var(--text-secondary); margin-top:4px;">Currently limited to 5s or 10s by model.</p>

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                                <span class="bg-label">Motion Strength</span>
                                <span id="motion-display" style="font-size: 11px; color: var(--primary); font-weight: 600;">5</span>
                            </div>
                            <input type="range" class="studio-slider" id="motion-slider" min="1" max="10" value="5" style="margin-top:8px;">

                         </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div id="vg-asset-list" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                                <!-- Dynamic Assets -->
                            </div>
                            <div id="vg-asset-empty" style="text-align:center; margin-top:1rem; font-size:12px; color:var(--text-secondary); display:none;">
                                No history found
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="studio-action-area vg-action-area">
                     <button class="primary-btn" id="generate-video-btn" style="width:100%;">
                        ${window.i18n.t('VG_BTN_GENERATE')}
                     </button>
                </div>
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <!-- Preview Header -->
                <div style="position:absolute; top:20px; right:20px; display:flex; gap:10px; z-index:10;">
                   <div class="status-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px;">Ready</div>
                </div>

                <!-- Empty State / Result -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                     <div class="preview-placeholder">
                        <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">🎬</span>
                        <p style="color:var(--text-secondary);">${window.i18n.t('VG_RESULT_PLACEHOLDER')}</p>
                     </div>
                </div>
            </div>
            
            
        </div>

        <!-- Camera Modal -->
        <div id="vg-camera-modal" class="vg-modal" style="display:none;">
            <div class="vg-modal-content">
                <div class="vg-modal-header">
                    <span>Capture Reference</span>
                    <button id="vg-camera-close">&times;</button>
                </div>
                <div class="vg-camera-container">
                    <video id="vg-video-preview" autoplay playsinline></video>
                    <canvas id="vg-capture-canvas" style="display:none;"></canvas>
                </div>
                <div class="vg-modal-footer">
                    <button class="primary-btn" id="vg-btn-capture">Snap Photo</button>
                </div>
            </div>
        </div>

        <style>
            .vg-modal {
                position: fixed; top:0; left:0; width:100%; height:100%;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center; z-index: 1000;
            }
            .vg-modal-content {
                background: var(--bg-deep); border: 1px solid var(--glass-border);
                border-radius: 16px; width: 500px; max-width: 90%; overflow: hidden;
            }
            .vg-modal-header {
                padding: 15px 20px; border-bottom: 1px solid var(--glass-border);
                display: flex; justify-content: space-between; align-items: center;
            }
            #vg-camera-close {
                background: none; border: none; color: var(--text-secondary);
                font-size: 24px; cursor: pointer;
            }
            .vg-camera-container {
                width: 100%; aspect-ratio: 4/3; background: #000;
                display: flex; align-items: center; justify-content: center;
            }
            #vg-video-preview { width: 100%; height: 100%; object-fit: cover; }
            .vg-modal-footer { padding: 20px; text-align: center; }

            .studio-samples-row {
                display: flex; gap: 10px; margin-top: 10px; overflow-x: auto; padding-bottom: 5px;
            }
            .studio-sample-img {
                width: 60px; height: 60px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1);
                cursor: pointer; transition: all 0.2s; object-fit: cover; flex-shrink: 0;
            }
            .studio-sample-img:hover { border-color: var(--accent-color); transform: scale(1.05); }
            .studio-sample-label { font-size: 11px; opacity: 0.6; margin-top: 15px; }

            .duration-chip {
                padding: 6px 16px; border: 1px solid var(--glass-border); border-radius: 8px;
                font-size: 12px; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.05);
                color: var(--text-secondary);
            }
            .duration-chip.active {
                background: var(--accent-color); color: #333; border-color: var(--accent-color);
                font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
        </style>
    `;

    setupVideoGenerationEventListeners();
}

/**
 * 设置生成视频页面事件监听器
 */
function setupVideoGenerationEventListeners() {

    // 1. Mode Switcher (Text vs Image)
    const modeBtns = document.querySelectorAll('.mode-btn');
    const imageSlotRow = document.getElementById('vg-image-slot-row');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            if (mode === 'image') {
                imageSlotRow.style.display = 'flex';
            } else {
                imageSlotRow.style.display = 'none';
            }
        });
    });

    // 2. Image Slot Logic
    const slot = document.getElementById('vg-slot-ref');
    const defaultIconHTML = slot?.innerHTML;

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
                        alert(`Image too small (${img.width}x${img.height}px). Minimum required is ${minDim}x${minDim}px.`);
                        e.target.value = ""; // Clear input
                        return;
                    }

                    slotElement.dataset.hasImage = "true"; // Mark for logic
                    setSlotImage(slotElement, evt.target.result, defaultHTML);
                };
                img.src = evt.target.result;
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
        if (initialInput) {
            initialInput.addEventListener('change', (e) => handleFileSelect(e, slot, defaultIconHTML));
        }
    }

    // 2.2 Sample Faces Logic
    document.querySelectorAll('.studio-sample-img').forEach(img => {
        img.addEventListener('click', async () => {
            if (slot) {
                try {
                    const resp = await fetch(img.src);
                    const blob = await resp.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSlotImage(slot, reader.result, defaultIconHTML);
                    };
                    reader.readAsDataURL(blob);
                } catch (e) {
                    console.error("Failed to load sample image", e);
                    setSlotImage(slot, img.src, defaultIconHTML);
                }
            }
        });
    });

    // Camera Logic
    const btnCamera = document.getElementById('vg-btn-camera');
    const cameraModal = document.getElementById('vg-camera-modal');
    const cameraClose = document.getElementById('vg-camera-close');
    const btnCapture = document.getElementById('vg-btn-capture');
    const videoPreview = document.getElementById('vg-video-preview');
    const captureCanvas = document.getElementById('vg-capture-canvas');
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
            alert("Could not access camera. Please check permissions.");
        }
    });

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraModal.style.display = 'none';
        videoPreview.srcObject = null;
    };

    cameraClose?.addEventListener('click', stopCamera);

    btnCapture?.addEventListener('click', () => {
        if (!videoPreview.videoWidth) return;

        const ctx = captureCanvas.getContext('2d');
        captureCanvas.width = videoPreview.videoWidth;
        captureCanvas.height = videoPreview.videoHeight;

        // Quality check
        const minDim = 300;
        if (captureCanvas.width < minDim || captureCanvas.height < minDim) {
            alert(`Camera resolution too low (${captureCanvas.width}x${captureCanvas.height}px).`);
            stopCamera();
            return;
        }

        ctx.drawImage(videoPreview, 0, 0, captureCanvas.width, captureCanvas.height);
        const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.9);

        // Update Slot
        const slotRef = document.getElementById('vg-slot-ref');
        if (slotRef) {
            slotRef.innerHTML = `
                <img src="${dataUrl}">
                <div class="remove-btn" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            `;
            slotRef.classList.add('has-image');
            slotRef.dataset.hasImage = "true";

            slotRef.querySelector('.remove-btn').addEventListener('click', (ev) => {
                ev.stopPropagation();
                slotRef.innerHTML = defaultIconHTML;
                slotRef.classList.remove('has-image');
                delete slotRef.dataset.hasImage;
                // Re-attach file listener
                const newInput = slotRef.querySelector('input');
                if (newInput) {
                    newInput.addEventListener('change', (ev2) => handleFileSelect(ev2, slotRef, defaultIconHTML));
                }
            });
        }

        stopCamera();
    });

    // 3. Aspect Ratio (Event Delegation)
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

    // 4. Sliders & Duration Chips
    const durChips = document.querySelectorAll('.duration-chip');
    let selectedDuration = 5;

    durChips.forEach(chip => {
        chip.addEventListener('click', () => {
            durChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedDuration = parseInt(chip.dataset.value);
        });
    });

    // Make it accessible for generator
    window.vgSelectedDuration = () => selectedDuration;
    const motSlider = document.getElementById('motion-slider');
    const motDisplay = document.getElementById('motion-display');
    if (motSlider) {
        motSlider.addEventListener('input', (e) => {
            motDisplay.textContent = e.target.value;
        });
    }

    // 5. Tabs
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

    // 5.5 Model Settings Logic
    // initModelSelect removed per user request

    // 6. Generate Logic
    const generateBtn = document.getElementById('generate-video-btn');
    generateBtn?.addEventListener('click', async () => {
        const promptInput = document.getElementById('vg-prompt-input');
        const prompt = promptInput?.value?.trim();
        const slot = document.getElementById('vg-slot-ref');
        const hasImage = slot?.dataset.hasImage === "true";
        const imgElement = slot?.querySelector('img');

        if (!prompt && !hasImage) {
            alert("Please enter a prompt or upload an image.");
            return;
        }

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = window.i18n.t('VG_BTN_GENERATING');
        generateBtn.disabled = true;

        if (window.GlobalSidebar) {
            window.GlobalSidebar.setJobStatus('video-generation', 'processing');
        }

        try {
            // Get Parameters
            const activeRatio = document.querySelector('.ratio-option.active')?.dataset.ratio || "16:9";
            // Map ratio to resolution or orientation
            // Simple mapping: 16:9 -> landscape, 9:16 -> portrait, 1:1 -> square
            let orientation = 'landscape';
            if (activeRatio === '9:16') orientation = 'portrait';
            if (activeRatio === '1:1') orientation = 'square';

            // Note: API might expect 'resolution' string like "720p". 
            // In original code, we inferred 720p. 
            // Let's pass resolution if supported, or orientation. 
            // Checking ai-service.js: it accepts 'resolution' (e.g. '720p') but doesn't seem to use ratio explicitly?
            // Actually, for video gen, usually you send width/height or aspect ratio.
            // Let's stick to what worked before: passing a resolution string and maybe relying on model defaults?
            // The previous code had "Orientation" buttons which mapped to 720p.

            const duration = (typeof window.vgSelectedDuration === 'function') ? window.vgSelectedDuration() : 5;

            // Prepare Opts
            const opts = {
                prompt: prompt || "A high quality video",
                image_url: hasImage ? imgElement.src : null,
                duration: duration,
                resolution: "720p", // Defaulting as before
                ratio: activeRatio, // Passing ratio just in case backend uses it
                model: window.SettingsManager.get('videoModel') // Using configured model
            };

            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                <div class="energy-overlay">
                    <div class="energy-bar-container">
                        <div class="energy-fill" id="energy-progress" style="width: 5%;"></div>
                    </div>
                    <div class="energy-label">${window.i18n.t('FS_STATUS_GATHERING')}</div>
                </div>
            `;

            let progress = 5;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 8;
                if (progress > 96) progress = 96;
                const fill = document.getElementById('energy-progress');
                const label = document.querySelector('.energy-label');
                if (fill) fill.style.width = `${progress}%`;
                if (label) {
                    if (progress > 20) label.innerText = window.i18n.t('FS_STATUS_PROCESSING');
                    if (progress > 50) label.innerText = window.i18n.t('FS_STATUS_FINISHING');
                    if (progress > 80) label.innerText = window.i18n.t('COMMON_LOADING');
                }
            }, 1200);

            let result;
            if (window.electronAPI && window.electronAPI.generateVideo) {
                result = await window.electronAPI.generateVideo(opts);
            } else {
                // Fallback to global fetchAPI which includes 429 retry support
                result = await window.fetchAPI('/api/ai/video', opts);
            }

            if (result && result.status === 'success') {
                if (!result.video_url) {
                    throw new Error("AI generated success but no video URL was returned.");
                }
                resBox.innerHTML = `
                    <div style="text-align: center; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <video controls autoplay loop style="max-width: 100%; max-height: 80%; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                            <source src="${result.video_url}" type="video/mp4">
                            Your browser does not support video.
                        </video>
                        <div style="margin-top:1.5rem; display:flex; gap:12px;">
                             <button class="secondary-btn" id="btn-save-assets">Save to Assets</button>
                             <button class="secondary-btn" id="btn-download-video">Download</button>
                        </div>
                    </div>
                `;

                // Auto-Save to Assets
                try {
                    window.AssetManager.add({
                        type: 'video',
                        url: result.video_url,
                        prompt: prompt || "Generated Video",
                        metadata: { duration, model: "doubao-video", ratio: activeRatio }
                    });
                    console.log("Video auto-saved to assets");
                    // No sidebar in this view to refresh, but GlobalSidebar will pick it up
                } catch (err) {
                    console.error("Auto-save failed:", err);
                }

                // Update Save Button Visual
                setTimeout(() => {
                    const saveBtn = document.getElementById('btn-save-assets');
                    if (saveBtn) {
                        saveBtn.innerHTML = "Saved ✓";
                        saveBtn.disabled = true;
                    }
                }, 500);

                document.getElementById('btn-download-video')?.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = result.video_url;
                    a.download = `video_${Date.now()}.mp4`;
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
                <div class="energy-overlay" style="background:#000;">
                     <div style="text-align:center; color:white;">
                        <span style="font-size:32px; margin-bottom:1rem; display:block;">⚠️</span>
                        <p>${window.i18n.t('COMMON_ERROR')}</p>
                        <small style="opacity:0.6;">${error.message}</small>
                     </div>
                </div>
            `;
        } finally {
            if (typeof progressInterval !== 'undefined') clearInterval(progressInterval);
            generateBtn.innerHTML = oldText;
            generateBtn.disabled = false;

            if (window.GlobalSidebar) {
                window.GlobalSidebar.setJobStatus('video-generation', 'idle');
            }
        }
    });

    // Quick Prompt Tags
    const tagsRow = document.querySelector('.studio-tags-row');
    const promptInputArea = document.getElementById('vg-prompt-input');
    if (tagsRow && promptInputArea) {
        tagsRow.addEventListener('click', (e) => {
            const tag = e.target.closest('.studio-tag');
            if (tag) {
                const prompt = tag.dataset.prompt;
                promptInputArea.value = prompt;

                // Visual feedback: Flash the input box
                promptInputArea.style.transition = 'background-color 0.3s';
                promptInputArea.style.backgroundColor = 'rgba(255, 217, 61, 0.2)'; // Unified Pop Yellow
                setTimeout(() => {
                    promptInputArea.style.backgroundColor = 'white';
                }, 300);
            }
        });
    }

    // 7. Render Assets
    function renderAssetsTab() {
        const list = document.getElementById('vg-asset-list');
        const empty = document.getElementById('vg-asset-empty');
        if (!list) return;

        const assets = window.AssetManager.getRecent('video', 20);

        if (assets.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = assets.map(asset => `
            <div class="asset-item" onclick="window.MediaPreview.open('${asset.id}')" style="aspect-ratio:16/9; border-radius:8px; overflow:hidden; position:relative; cursor:pointer; border:1px solid var(--glass-border); background:#000;">
                <video src="${asset.url}" style="width:100%; height:100%; object-fit:cover;"></video>
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; opacity:0.8;">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                </div>
            </div>
        `).join('');
    }

    // 8. Toolbar (Clear & Randomize)
    document.getElementById('btn-clear-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('vg-prompt-input');
        if (el) {
            el.value = '';
            el.focus();
        }
    });

    document.getElementById('btn-gen-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('vg-prompt-input');
        if (el) {
            const prompts = [
                window.i18n.t('VIDEO_PROMPT_CHARACTER_WAVE'),
                window.i18n.t('VIDEO_PROMPT_CHARACTER_SMILE'),
                window.i18n.t('VIDEO_PROMPT_CHARACTER_WALK'),
                window.i18n.t('VIDEO_PROMPT_CHARACTER_ACTION'),
                window.i18n.t('VIDEO_PROMPT_RANDOM_5')
            ];
            el.value = prompts[Math.floor(Math.random() * prompts.length)];
            el.focus();
        }
    });

    // Initial render
    renderAssetsTab();
    window.AssetManager.refresh();

    const updateHandler = () => renderAssetsTab();
    window.addEventListener('assets-updated', updateHandler);
}

// Make it globally available
window.loadVideoGenerationPage = loadVideoGenerationPage;

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