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
        link.href = 'pages/dashboard/dashboard.css?v=4';
        document.head.appendChild(link);
    }

    const dashboardHTML = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1 class="dashboard-title">${window.i18n.t('DASHBOARD_TITLE')}</h1>
                <p class="dashboard-subtitle">${window.i18n.t('DASHBOARD_SUBTITLE')}</p>
            </div>

            <div class="cards-grid">
                <!-- 1. Face Swap Card (Image Studio) -->
                <div class="feature-card" onclick="window.app.navigate('face-swap')">
                    <div class="card-media media-placeholder face">
                        <img src="/assets/system/covers/face_swap.png" alt="Face Swap">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${window.i18n.t('STUDIO_IMAGE')}</div>
                        <ul class="card-features">
                            <li>${window.i18n.t('DASHBOARD_IMAGE_DESC_1')}</li>
                            <li>${window.i18n.t('DASHBOARD_IMAGE_DESC_2')}</li>
                            <li>${window.i18n.t('DASHBOARD_IMAGE_DESC_3')}</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                ${window.i18n.t('DASHBOARD_ACTION_IMAGE')}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 2. Video Generation Card (Video Studio) -->
                <div class="feature-card" onclick="window.app.navigate('video-generation')">
                    <div class="card-media media-placeholder video">
                        <img src="/assets/system/covers/video_gen.png" alt="Video Generation">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${window.i18n.t('STUDIO_VIDEO')}</div>
                        <ul class="card-features">
                            <li>${window.i18n.t('DASHBOARD_VIDEO_DESC_1')}</li>
                            <li>${window.i18n.t('DASHBOARD_VIDEO_DESC_2')}</li>
                            <li>${window.i18n.t('DASHBOARD_VIDEO_DESC_3')}</li>
                        </ul>
                        <div class="card-action">
                            <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                ${window.i18n.t('DASHBOARD_ACTION_VIDEO')}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Voice Cloning Card (Audio Studio) -->
                <div class="feature-card" onclick="window.app.navigate('voice-cloning')">
                    <div class="card-media media-placeholder voice">
                        <img src="/assets/system/covers/voice_clone.png" alt="Voice Cloning">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${window.i18n.t('STUDIO_AUDIO')}</div>
                        <ul class="card-features">
                            <li>${window.i18n.t('DASHBOARD_AUDIO_DESC_1')}</li>
                            <li>${window.i18n.t('DASHBOARD_AUDIO_DESC_2')}</li>
                            <li>${window.i18n.t('DASHBOARD_AUDIO_DESC_3')}</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                                ${window.i18n.t('DASHBOARD_ACTION_AUDIO')}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 4. Real-time Vision Card (Vision Studio) -->
                <div class="feature-card" onclick="window.app.navigate('realtime-vision')">
                    <div class="card-media media-placeholder vision">
                        <img src="/assets/system/covers/vision_ai.png" alt="Real-time Vision">
                    </div>
                    <div class="card-content">
                        <div class="card-title">${window.i18n.t('STUDIO_VISION')}</div>
                        <ul class="card-features">
                            <li>${window.i18n.t('DASHBOARD_VISION_DESC_1')}</li>
                            <li>${window.i18n.t('DASHBOARD_VISION_DESC_2')}</li>
                            <li>${window.i18n.t('DASHBOARD_VISION_DESC_3')}</li>
                        </ul>
                        <div class="card-action">
                             <button class="use-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                     <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                </svg>
                                ${window.i18n.t('DASHBOARD_ACTION_VISION')}
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
