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
            <!-- Col 1: Global Nav (Handled by App) -->
            
            <!-- Col 2: Controls (Left Panel) -->
            <div class="studio-controls video-gen-controls">
                
                <!-- 1. Header & Mode -->
                <div class="vg-header">
                    <div style="font-weight:600; font-size:14px;">Video Director</div>
                    <div class="vg-mode-switch">
                        <button class="mode-btn active" data-mode="text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Text
                        </button>
                        <button class="mode-btn" data-mode="image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Image
                        </button>
                    </div>
                </div>

                <!-- 2. Interactive Input Section -->
                <div class="vg-input-section">
                    <!-- Image Upload Slot (Initially hidden or shown based on mode) -->
                    <div class="vg-slots-row" id="vg-image-slot-row" style="display:none;">
                        <div class="vg-slot" id="vg-slot-ref" title="Upload Reference Image">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                             <input type="file" style="display:none" accept="image/*">
                        </div>
                        <div style="font-size:12px; color:var(--text-secondary); display:flex; align-items:center; margin-left:10px;">
                            Start with an image (optional)
                        </div>
                    </div>

                    <!-- Text Editor -->
                    <div class="vg-text-editor">
                        <textarea class="vg-textarea" id="vg-prompt-input" placeholder="Describe the scene, movement, and style..."></textarea>
                        
                        <div class="vg-toolbar">
                             <button class="tool-icon-btn" id="btn-gen-prompt" title="Generate Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></button>
                             <button class="tool-icon-btn" id="btn-clear-prompt" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path></svg></button>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabbed Component Panel -->
                <div class="vg-tabs-panel">
                    <div class="vg-tab-header">
                        <button class="vg-tab-btn active" data-tab="settings">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Settings
                        </button>
                        <button class="vg-tab-btn" data-tab="assets">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                            Assets
                        </button>
                    </div>
                    <div class="vg-tab-content">
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

                            <span class="bg-label" style="margin-top:20px;">Duration</span>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <span style="font-size:12px; color:var(--text-secondary);">Seconds</span>
                                <span id="duration-display" style="font-size:12px; color:var(--text-primary);">5s</span>
                            </div>
                            <input type="range" class="vg-slider" id="duration-slider" min="5" max="10" step="5" value="5">
                             <p style="font-size:10px; color:var(--text-secondary); margin-top:4px;">Currently limited to 5s or 10s by model.</p>

                            <span class="bg-label" style="margin-top:20px;">Motion Strength</span>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <span style="font-size:12px; color:var(--text-secondary);">1-10</span>
                                <span id="motion-display" style="font-size:12px; color:var(--text-primary);">5</span>
                            </div>
                            <input type="range" class="vg-slider" id="motion-slider" min="1" max="10" value="5">
                         </div>

                         <!-- Tab: Assets -->
                         <div id="tab-assets" class="tab-pane" style="display:none;">
                            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                                <!-- Mock Assets -->
                                <div style="aspect-ratio:16/9; background:#f1f5f9; border-radius:8px;"></div>
                                <div style="aspect-ratio:16/9; background:#f1f5f9; border-radius:8px;"></div>
                            </div>
                            <div style="text-align:center; margin-top:1rem; font-size:12px; color:var(--text-secondary);">
                                Generative history
                            </div>
                         </div>
                    </div>
                </div>

                <!-- 4. Action Area -->
                <div class="vg-action-area">
                     <button class="primary-btn" id="generate-video-btn" style="width:100%;">
                        Generate Video
                     </button>
                </div>
            </div>

            <!-- Col 3: Viewport -->
            <div class="studio-viewport">
                <!-- Preview Header -->
                <div style="position:absolute; top:20px; right:20px; display:flex; gap:10px; z-index:10;">
                   <div class="status-badge" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px;">Ready</div>
                </div>

                <!-- Result Container -->
                <div class="preview-box result-preview empty" style="width:100%; height:100%; border:none; background:transparent; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                     <div class="preview-placeholder">
                        <span style="font-size:32px; margin-bottom:1rem; opacity:0.5;">🎬</span>
                        <p style="color:var(--text-secondary);">Your generated video will play here</p>
                     </div>
                </div>
            </div>
            
        </div>
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

    function handleFileSelect(e, slotElement, defaultHTML) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                slotElement.innerHTML = `
                    <img src="${evt.target.result}">
                    <div class="remove-btn" title="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                `;
                slotElement.classList.add('has-image');
                slotElement.dataset.hasImage = "true"; // Mark for logic

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

    // 4. Sliders
    const durSlider = document.getElementById('duration-slider');
    const durDisplay = document.getElementById('duration-display');
    if (durSlider) {
        durSlider.addEventListener('input', (e) => {
            durDisplay.textContent = e.target.value + 's';
        });
    }
    const motSlider = document.getElementById('motion-slider');
    const motDisplay = document.getElementById('motion-display');
    if (motSlider) {
        motSlider.addEventListener('input', (e) => {
            motDisplay.textContent = e.target.value;
        });
    }

    // 5. Tabs
    const tabBtns = document.querySelectorAll('.vg-tab-btn');
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
        generateBtn.innerHTML = "Generating...";
        generateBtn.disabled = true;

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

            const duration = durSlider ? parseInt(durSlider.value) : 5;

            // Prepare Opts
            const opts = {
                prompt: prompt || "A high quality video",
                image_url: hasImage ? imgElement.src : null,
                duration: duration,
                resolution: "720p", // Defaulting as before
                ratio: activeRatio // Passing ratio just in case backend uses it
            };

            const resBox = document.querySelector('.result-preview');
            resBox.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
                    <div class="spinner" style="margin-bottom:15px; width:30px; height:30px; border:3px solid var(--glass-border); border-top-color:var(--primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <p>Generating video... (this may take a while)</p>
                </div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            `;

            let result;
            if (window.electronAPI && window.electronAPI.generateVideo) {
                result = await window.electronAPI.generateVideo(opts);
            } else {
                // Fallback
                const resp = await fetch('/api/ai/video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(opts)
                });
                result = await resp.json();
            }

            if (result && result.status === 'success') {
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

    // Toolbar
    document.getElementById('btn-clear-prompt')?.addEventListener('click', () => {
        const el = document.getElementById('vg-prompt-input');
        if (el) el.value = '';
    });
}

// Make it globally available
window.loadVideoGenerationPage = loadVideoGenerationPage;