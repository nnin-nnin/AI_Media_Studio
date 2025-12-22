/**
 * Dashboard Page Logic
 * Renders the main entry point with feature cards.
 */

function loadDashboardPage(container) {
    if (!container) return; // Guard clause

    // Clear and set styles
    container.innerHTML = '';

    // Dynamically load CSS if not already present (optional, but good for modularity)
    if (!document.getElementById('dashboard-css')) {
        const link = document.createElement('link');
        link.id = 'dashboard-css';
        link.rel = 'stylesheet';
        link.href = 'pages/dashboard/dashboard.css';
        document.head.appendChild(link);
    }

    const dashboardHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1 class="dashboard-title">Dashboard</h1>
                <p class="dashboard-subtitle">Select a tool to start creating</p>
            </div>

            <div class="cards-grid">
                <!-- 1. Face Swap Card (Image Studio) -->
                <div class="feature-card" onclick="window.app.navigate('face-swap')">
                    <div class="card-media media-placeholder face">
                        <!-- Placeholder for Face Swap Preview -->
                    </div>
                    <div class="card-content">
                        <div class="card-title">Image Studio</div>
                        <ul class="card-features">
                            <li>Professional grade face replacement</li>
                            <li>Multi-face support</li>
                            <li>Real-time preview</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Swap Faces
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 2. Video Generation Card (Video Studio) -->
                <div class="feature-card" onclick="window.app.navigate('video-generation')">
                    <div class="card-media media-placeholder video">
                        <!-- Placeholder for Video Preview -->
                    </div>
                    <div class="card-content">
                        <div class="card-title">Video Studio</div>
                        <ul class="card-features">
                            <li>Create videos from text or image prompts</li>
                            <li>High fidelity motion generation</li>
                            <li>Customizable aspect ratios</li>
                        </ul>
                        <div class="card-action">
                            <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Start Creating
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Voice Cloning Card (Audio Studio) -->
                <div class="feature-card" onclick="window.app.navigate('voice-cloning')">
                    <div class="card-media media-placeholder voice">
                        <!-- Placeholder for Voice Preview -->
                    </div>
                    <div class="card-content">
                        <div class="card-title">Audio Studio</div>
                        <ul class="card-features">
                            <li>Instant voice cloning from audio</li>
                            <li>Text-to-Speech generation</li>
                            <li>Multi-language support</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                                Clone Voice
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 4. Real-time Vision Card (Vision Studio) -->
                <div class="feature-card" onclick="window.app.navigate('realtime-vision')">
                    <div class="card-media media-placeholder vision" style="background: var(--primary-glass); display:flex; align-items:center; justify-content:center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" style="opacity:0.8;">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                        </svg>
                    </div>
                    <div class="card-content">
                        <div class="card-title">Vision Studio</div>
                        <ul class="card-features">
                            <li>Real-time AI style transformation</li>
                            <li>Ultra-low latency streaming</li>
                            <li>Interactive prompt-based styles</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn" style="background:var(--primary); color:white; border:none;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                     <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                </svg>
                                Enter Vision
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = dashboardHTML;
}

// Export for usage if using modules, but current app uses global scripts
window.loadDashboardPage = loadDashboardPage;
