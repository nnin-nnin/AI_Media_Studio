// src/renderer/components/login/login-manager.js
import * as THREE from 'three';
import { MagicCircle } from './magic-circle.js';
import { HandTracker } from './hand-tracker.js';
import { getRitualSession, unlockWithRitual } from '../../utils/web-api.js';

export class LoginManager {
    constructor(containerId, onUnlock) {
        this.container = document.getElementById(containerId);
        this.onUnlock = onUnlock; // Callback to enable app

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.magicCircles = []; // Array of MagicCircle instances

        this.handTracker = null;
        this.videoElement = null;

        this.isUnlocked = false;
        this.lockTimer = 0;
        this.requiredLockTime = 60; // Frames (~1s)

        // Login State
        this.isAuthenticating = false;
        this.lastAuthAttempt = 0;
        this.ritualLog = [];
        this.ritualNonce = null;

        this.init();
    }

    async init() {
        this.setupUI();
        this.setupThreeJS();
        this.setupMediaPipe();
        this.animate();

        // Security: Get a ritual session nonce from server
        try {
            this.ritualNonce = await getRitualSession();
        } catch (e) {
            console.error("Failed to get ritual session:", e);
        }
    }

    setupUI() {
        // Create hidden video element
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'input-video';
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true; // Important for some envs
        this.container.appendChild(this.videoElement);

        // Update HUD text
        const title = this.container.querySelector('.hud-title');
        if (title) title.innerText = window.i18n.t('LOGIN_TITLE');
    }

    setupThreeJS() {
        const canvas = document.getElementById('magic-canvas');
        this.scene = new THREE.Scene();

        // Orthographic camera for HUD/2D-like overlay effect, or Perspective for depth? Perspective is better for Dr. Strange.
        // Camera setup for large particle system
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.z = 800;

        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Create Single Particle Magic Circle
        this.magicCircle = new MagicCircle(this.scene);
        this.magicCircles = [this.magicCircle]; // Keep array for compatibility if needed, but logic changes

        // Show initially (Sphere State)
        this.magicCircles.forEach(mc => mc.setVisible(true));

        // Resize handler
        window.addEventListener('resize', () => {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async setupMediaPipe() {
        const statusEl = this.container.querySelector('.hud-status');
        if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_INIT');

        this.handTracker = new HandTracker(this.videoElement, (data) => {
            this.handleHandData(data);
        });

        try {
            await this.handTracker.init();
            if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_ACTIVE');
        } catch (e) {
            console.error(e);
            if (statusEl) {
                statusEl.innerText = window.i18n.t('LOGIN_STATUS_NO_CAMERA');
                statusEl.style.color = "red";
                statusEl.style.pointerEvents = "auto";
                statusEl.style.cursor = "pointer";

                // Add one-time click listener to retry
                const retry = async () => {
                    statusEl.innerText = window.i18n.t('LOGIN_STATUS_RETRYING');
                    try {
                        await this.handTracker.init();
                        statusEl.innerText = window.i18n.t('LOGIN_STATUS_ACTIVE');
                        statusEl.style.color = "#ffaa00";
                        document.removeEventListener('click', retry);
                    } catch (err) {
                        statusEl.innerText = window.i18n.t('LOGIN_STATUS_FAILED');
                    }
                };
                document.addEventListener('click', retry);
            }
        }
    }

    handleHandData(data) {
        if (this.isUnlocked || this.isAuthenticating) return;

        const statusEl = this.container.querySelector('.hud-status');
        const now = Date.now();

        // Record movement log for server-side verification
        if (data.found || this.ritualLog.length > 0) {
            this.ritualLog.push({
                timestamp: now,
                found: data.found,
                isFist: data.isFist,
                twoHandsDetected: data.twoHandsDetected,
                handDistance: data.handDistance,
                expansionProgress: this.magicCircle ? this.magicCircle.expansionProgress : 0
            });
            // Keep log size reasonable (last 10 seconds / 300 frames)
            if (this.ritualLog.length > 400) this.ritualLog.shift();
        }

        // Init counters if missing
        if (!this.stateCounters) {
            this.stateCounters = {
                fistFrames: 0,
                openFrames: 0,
                lastStateChange: 0
            };
        }

        // Update Particle System
        if (this.magicCircle) {
            // Pass interaction data to MagicCircle for real-time effects
            this.magicCircle.setInteractionState(data);

            this.magicCircle.update(0.05);

            // MANUAL SEQUENCE: HEXAGRAM -> COMPLEX -> UNLOCK
            if (this.magicCircle.currentState === 3) { // 3 = HEXAGRAM
                // Requirement: Pull hands apart to expand
                if (data.twoHandsDetected && data.handDistance > 0.4) {
                    this.magicCircle.becomeComplex();
                    if (statusEl) {
                        statusEl.innerText = "ACCESS LEVEL 10 DETECTED. EXPANDING MATRIX.";
                        statusEl.style.color = "#00ffff";
                    }
                } else {
                    if (statusEl) statusEl.innerText = "ALIGN SPATIAL ANCHORS (TWO HANDS)...";
                }
            }
            else if (this.magicCircle.currentState === 4) { // 4 = COMPLEX CIRCLE
                // Requirement: Fully expand the matrix (pull hands far apart)
                // The magic circle calculates expansionProgress based on hand distance
                if (this.magicCircle.expansionProgress > 0.95) {
                    if (!this.stateCounters.unlockHoldStart) {
                        this.stateCounters.unlockHoldStart = now;
                    }

                    // Hold for 1 second to confirm
                    if (now - this.stateCounters.unlockHoldStart > 1000) {
                        if (!this.unlockTriggered) {
                            this.unlockTriggered = true;
                            if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_GRANTED');
                            this.triggerUnlock();
                        }
                    } else {
                        if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_STABLE');
                    }
                } else {
                    this.stateCounters.unlockHoldStart = 0; // Reset if hands come closer
                    if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_EXPAND');
                }
            }
        }


        if (data.found) {
            // DEBOUNCE LOGIC
            // Require consistent signal for X frames
            if (data.isFist) {
                this.stateCounters.fistFrames++;
                this.stateCounters.openFrames = 0;
            } else {
                this.stateCounters.openFrames++;
                this.stateCounters.fistFrames = 0;
            }

            // STATE MACHINE
            // 1. Fist -> Collapse (Charge)
            // Require 10 frames of fist detection (~300ms)
            if (this.stateCounters.fistFrames > 10) {
                if (this.magicCircle.currentState === 0) { // SPHERE
                    this.magicCircle.collapse();
                    this.stateCounters.lastStateChange = now;
                    if (statusEl) {
                        statusEl.innerText = window.i18n.t('LOGIN_ACTION_CHARGING');
                        statusEl.style.color = "#ff3300";
                    }
                }
            }

            // 2. Open Hand -> Explode (Cast)
            // Require 5 frames of open hand AND minimum charge time (e.g. 1 sec)
            else if (this.stateCounters.openFrames > 5) {
                if (this.magicCircle.currentState === 1) { // COLLAPSING
                    if (now - this.stateCounters.lastStateChange > 1000) { // Min charge time
                        this.magicCircle.explode();
                        if (statusEl) {
                            statusEl.innerText = window.i18n.t('LOGIN_ACTION_RELEASE');
                            statusEl.style.color = "#ffaa00";
                        }
                    } else {
                        if (statusEl) statusEl.innerText = "CHARGING... HOLD...";
                    }
                } else if (this.magicCircle.currentState === 0) {
                    if (statusEl) {
                        statusEl.innerText = window.i18n.t('LOGIN_ACTION_CHARGE');
                        statusEl.style.color = "#ffffff";
                    }
                }
            }
        } else {
            // Reset counters if hand lost
            this.stateCounters.fistFrames = 0;
            this.stateCounters.openFrames = 0;

            if (statusEl && this.magicCircle.currentState === 0) {
                statusEl.innerText = window.i18n.t('LOGIN_ACTION_BEGIN');
            }
        }
    }

    async triggerUnlock() {
        const now = Date.now();
        if (this.isUnlocked || this.isAuthenticating || (now - this.lastAuthAttempt < 3000)) return;

        this.isAuthenticating = true;
        this.lastAuthAttempt = now;
        const statusEl = this.container.querySelector('.hud-status');

        // 1. Authenticate with Backend
        if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_VERIFYING');

        try {
            // SECURITY: Instead of sending hardcoded password, we send the MOVEMENT LOG
            // The server will "replay" the log to verify the gesture was actually performed.
            await unlockWithRitual(this.ritualLog, this.ritualNonce);

            this.isUnlocked = true;
            if (statusEl) statusEl.innerText = window.i18n.t('LOGIN_STATUS_GRANTED');

            // 2. Explode rings (Visual Reward)
            this.magicCircles.forEach(mc => mc.explode());

            // 3. Stop camera immediately to free resources
            this.handTracker.stop();

            // 4. UI Transition
            this.container.classList.add('portal-opening');

            // 5. Reveal App
            setTimeout(() => {
                this.container.style.display = 'none';
                this.renderer.setAnimationLoop(null);
                if (this.onUnlock) this.onUnlock();
            }, 500);

        } catch (e) {
            console.error("Authentication failed:", e);
            this.isAuthenticating = false;
            this.unlockTriggered = false; // Reset trigger
            if (statusEl) {
                statusEl.innerText = window.i18n.t('LOGIN_STATUS_FAILED');
                statusEl.style.color = "red";
            }
            // Reset state??
            // Maybe reset to Sphere after delay
            setTimeout(() => {
                this.magicCircle.reset(); // If reset method exists, or just manually set state
            }, 2000);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
