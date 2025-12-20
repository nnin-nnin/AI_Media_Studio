// pages/face-swap/face-swap.js

/**
 * 加载变脸图片页面内容 (Runway Style Refactor)
 */
function loadFaceSwapPage(container) {
    if (!container) return;

    // Inject styles if not present
    if (!document.getElementById('fs-layout-css')) {
        const link = document.createElement('link');
        link.id = 'fs-layout-css';
        link.rel = 'stylesheet';
        link.href = 'pages/face-swap/face-swap-layout.css';
        document.head.appendChild(link);
    }

    container.innerHTML = `
        <div class="studio-layout fade-in">
            <!-- Col 1: Global Nav -->
            <div class="studio-nav" id="global-sidebar"></div>

            <!-- Col 2: Controls (Left Panel) -->
            <div class="studio-controls face-swap-controls">
                
                <!-- 1. Header & Mode -->
                <div class="fs-header">
                    <div style="font-weight:600; font-size:14px;">Generative Session</div>
                    <div class="fs-mode-switch">
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
                <div class="fs-input-section">
                    <!-- Reference Slots (Hidden in Text mode) -->
                    <div class="fs-slots-row" id="fs-slots-row">
                        <!-- Upload Slot 1 -->
                        <div class="fs-slot" id="slot-ref-1" title="Add Image Reference">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="image/*">
                        </div>
                        <!-- Camera Button -->
                        <div class="fs-slot" id="fs-btn-camera" title="Take Photo" style="cursor:pointer; display:flex; align-items:center; justify-content:center;">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        </div>
                        <!-- Empty Placeholder Slots (Visual only) -->
                        <div class="fs-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                        <div class="fs-slot" style="opacity:0.5; cursor:default; border-style:dashed;"></div>
                    </div>

                    <!-- Text Editor -->
                    <div class="fs-text-editor">
                        <textarea class="fs-textarea" id="fs-prompt-input" placeholder="Describe your image...
Mention colors, lighting, and style."></textarea>
                        
                        <div class="fs-toolbar">
                             <button class="tool-icon-btn" id="btn-gen-prompt" title="Generate Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></button>
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="fs-tabs-panel">
                    <div class="fs-tab-header">
                        <button class="fs-tab-btn active" data-tab="settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Settings
                        </button>
                        <button class="fs-tab-btn" data-tab="assets">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Assets
                        </button>
                    </div>
                    <div class="fs-tab-content">
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

                            <span class="bg-label" style="margin-top:20px;">Reference Strength</span>
                            <input type="range" class="fs-slider" min="0" max="100" value="75" style="margin-top:8px;">

                            <div class="studio-setting-group" style="margin-top:24px; padding-top:20px; border-top:1px solid var(--glass-border);">
                                <span class="bg-label">Model Configuration</span>
                                <div style="margin-top:12px;">
                                    <label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Endpoint ID</label>
                                    <select id="fs-model-select" class="studio-select-glass">
                                        <option value="${window.SettingsManager.get('imageModel')}">${window.SettingsManager.get('imageModel')}</option>
                                        <option disabled>Loading models...</option>
                                    </select>
                                </div>
                            </div>
                         </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div id="fs-asset-list" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                                <!-- Dynamic Assets -->
                            </div>
                            <div id="fs-asset-empty" style="text-align:center; margin-top:1rem; font-size:12px; color:var(--text-secondary); display:none;">
                                No history found
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="fs-action-area">
                     <button class="primary-btn" id="generate-btn" style="width:100%;">
                        Generate
                     </button>
                </div>

            </div>

            <!-- Col 3: Viewport (Canvas) -->
            <div class="studio-viewport">
                <!-- Simple Header -->
                <div style="position:absolute; top:20px; right:20px; display:flex; gap:10px; z-index:10;">
                    <button class="secondary-btn" style="background:var(--bg-glass); backdrop-filter:blur(10px);">Export</button>
                </div>

                <!-- Empty State / Result -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent;">
                    <div class="preview-placeholder">
                        <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">✨</span>
                        <p style="color:var(--text-secondary);">Your generated image will appear here</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Camera Modal -->
        <div id="fs-camera-modal" class="fs-modal" style="display:none;">
            <div class="fs-modal-content">
                <div class="fs-modal-header">
                    <span>Capture Reference</span>
                    <button id="fs-camera-close">&times;</button>
                </div>
                <div class="fs-camera-container">
                    <video id="fs-video-preview" autoplay playsinline></video>
                    <canvas id="fs-capture-canvas" style="display:none;"></canvas>
                </div>
                <div class="fs-modal-footer">
                    <button class="primary-btn" id="fs-btn-capture">Snap Photo</button>
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
                width: 100%; aspect-ratio: 4/3; background: #000;
                display: flex; align-items: center; justify-content: center;
            }
            #fs-video-preview { width: 100%; height: 100%; object-fit: cover; }
            .fs-modal-footer { padding: 20px; text-align: center; }
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

                    slotElement.innerHTML = `
                        <img src="${evt.target.result}">
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
                        // Re-attach listener
                        const newInput = slotElement.querySelector('input');
                        if (newInput) {
                            newInput.addEventListener('change', (ev2) => handleFileSelect(ev2, slotElement, defaultHTML));
                        }
                    });
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
        const slotElement = document.getElementById('slot-ref-1');
        if (slotElement) {
            slotElement.innerHTML = `
                <img src="${dataUrl}">
                <div class="remove-btn" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            `;
            slotElement.classList.add('has-image');
            slotElement.dataset.hasImage = "true";

            slotElement.querySelector('.remove-btn').addEventListener('click', (ev) => {
                ev.stopPropagation();
                slotElement.innerHTML = defaultIconHTML;
                slotElement.classList.remove('has-image');
                delete slotElement.dataset.hasImage;

                const newInput = slotElement.querySelector('input');
                if (newInput) {
                    newInput.addEventListener('change', (ev2) => handleFileSelect(ev2, slotElement, defaultIconHTML));
                }
            });
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

    // 4. Tab Switching (Settings / Assets)
    const tabBtns = document.querySelectorAll('.fs-tab-btn');
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
    initModelSelect('fs-model-select', 'imageModel', 'image');

    // 5. Generate Logic
    const generateBtn = document.getElementById('generate-btn');
    generateBtn?.addEventListener('click', async () => {
        const promptInput = document.getElementById('fs-prompt-input');
        const prompt = promptInput?.value?.trim();
        const slot = document.getElementById('slot-ref-1');
        const hasImage = slot?.dataset.hasImage === "true";
        const imgElement = slot?.querySelector('img');

        if (!prompt && !hasImage) {
            alert("Please enter a prompt or upload an image.");
            return;
        }

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = "Generating...";
        generateBtn.disabled = true;

        try {
            // Get Parameters
            const activeRatio = document.querySelector('.ratio-option.active')?.dataset.ratio || "1:1";

            // Map Ratio to Size (Must be >= 921,600 pixels)
            let width = 1024, height = 1024;
            if (activeRatio === '16:9') { width = 1280; height = 720; }
            if (activeRatio === '4:3') { width = 1280; height = 960; }
            if (activeRatio === '3:4') { width = 960; height = 1280; }
            if (activeRatio === '9:16') { width = 720; height = 1280; }

            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
                    <div class="spinner" style="margin-bottom:15px; width:30px; height:30px; border:3px solid var(--glass-border); border-top-color:var(--primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <p>Creating masterpiece...</p>
                </div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            `;
            resBox.classList.remove('empty');

            let result;
            if (hasImage) {
                // EDIT IMAGE MODE
                const opts = {
                    image: imgElement.src,
                    prompt: prompt || "Enhance this image",
                    model: window.SettingsManager.get('imageModel') || "doubao-seedream-4-0-250828"
                };
                if (window.electronAPI && window.electronAPI.editImage) {
                    result = await window.electronAPI.editImage(opts);
                } else {
                    const resp = await fetch('/api/ai/edit-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(opts)
                    });
                    result = await resp.json();
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
                    const resp = await fetch('/api/ai/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(opts)
                    });
                    result = await resp.json();
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
                             <button class="secondary-btn small" id="btn-save-assets">Save to Assets</button>
                             <button class="secondary-btn small" onclick="window.open('${imageUrl}')">Open</button>
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

                // Add Save Listener (Just for visual feedback or updates)
                setTimeout(() => {
                    const saveBtn = document.getElementById('btn-save-assets');
                    if (saveBtn) {
                        saveBtn.innerHTML = "Saved ✓";
                        saveBtn.disabled = true;
                    }
                }, 0);
            } else {
                throw new Error(result?.message || "Unknown error");
            }

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                <div class="preview-placeholder">
                    <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">⚠️</span>
                    <p style="color:var(--text-secondary);">Generation failed.</p>
                </div>
            `;
        } finally {
            generateBtn.innerHTML = oldText;
            generateBtn.disabled = false;
        }
    });

    // 6. Toolbar
    document.getElementById('btn-clear-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('fs-prompt-input');
        if (el) {
            el.value = "";
            el.focus();
        }
    });

    document.getElementById('btn-gen-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('fs-prompt-input');
        if (el) {
            const prompts = [
                "A futuristic cyberpunk city with neon lights and flying cars, cinematic lighting.",
                "Ethereal landscape with floating islands and purple waterfalls, studio ghibli style.",
                "Detailed portrait of a cosmic explorer in a gold spacesuit, nebula background.",
                "Vintage oil painting of a Victorian robot drinking tea in a garden.",
                "3D isometric room design for a cozy gaming setup, soft pastel lighting."
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
                <img src="${asset.url}" style="width:100%; height:100%; object-fit:cover;">
            </div>
        `).join('');
    }

    // Initial render
    renderAssetsTab();

    // Force refresh to ensure data is consistent (fixes race condition or stale data)
    window.AssetManager.refresh();

    // Listen for global asset updates
    const updateHandler = () => renderAssetsTab();
    window.removeEventListener('assets-updated', updateHandler); // Attempt cleanup (not effective with anon function previously, but good practice going forward if we lift this)
    window.addEventListener('assets-updated', updateHandler);
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