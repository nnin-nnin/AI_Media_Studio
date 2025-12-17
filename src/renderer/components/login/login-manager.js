// src/renderer/components/login/login-manager.js
import * as THREE from 'three';
import { MagicCircle } from './magic-circle.js';
import { HandTracker } from './hand-tracker.js';

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

        this.init();
    }

    init() {
        this.setupUI();
        this.setupThreeJS();
        this.setupMediaPipe();
        this.animate();
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
        if (title) title.innerText = "BIOMETRIC SYNC REQUIRED";
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
        if (statusEl) statusEl.innerText = "INITIALIZING SENSORS...";

        this.handTracker = new HandTracker(this.videoElement, (data) => {
            this.handleHandData(data);
        });

        try {
            await this.handTracker.init();
            if (statusEl) statusEl.innerText = "SENSORS ACTIVE. SHOW HANDS.";
        } catch (e) {
            console.error(e);
            if (statusEl) {
                statusEl.innerText = "CAMERA BLOCKED. CLICK ANYWHERE TO START.";
                statusEl.style.color = "red";
                statusEl.style.pointerEvents = "auto";
                statusEl.style.cursor = "pointer";

                // Add one-time click listener to retry
                const retry = async () => {
                    statusEl.innerText = "RETRYING SENSORS...";
                    try {
                        await this.handTracker.init();
                        statusEl.innerText = "SENSORS ACTIVE.";
                        statusEl.style.color = "#ffaa00";
                        document.removeEventListener('click', retry);
                    } catch (err) {
                        statusEl.innerText = "FAILED AGAIN. CHECK PERMISSIONS.";
                    }
                };
                document.addEventListener('click', retry);
            }
        }
    }

    handleHandData(data) {
        if (this.isUnlocked) return;

        const statusEl = this.container.querySelector('.hud-status');
        const now = Date.now();

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
                            if (statusEl) statusEl.innerText = "SECURITY DISENGAGED.";
                            this.triggerUnlock();
                        }
                    } else {
                        if (statusEl) statusEl.innerText = "HOLD STABLE...";
                    }
                } else {
                    this.stateCounters.unlockHoldStart = 0; // Reset if hands come closer
                    if (statusEl) statusEl.innerText = "EXPAND MATRIX TO 100%...";
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
                        statusEl.innerText = "ENERGY COLLAPSING... MAINTAIN FIST";
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
                            statusEl.innerText = "RELEASE DETECTED. CASTING ARRAY...";
                            statusEl.style.color = "#ffaa00";
                        }
                    } else {
                        if (statusEl) statusEl.innerText = "CHARGING... HOLD...";
                    }
                } else if (this.magicCircle.currentState === 0) {
                    if (statusEl) {
                        statusEl.innerText = "MAKE A FIST TO CHARGE ENERGY";
                        statusEl.style.color = "#ffffff";
                    }
                }
            }
        } else {
            // Reset counters if hand lost
            this.stateCounters.fistFrames = 0;
            this.stateCounters.openFrames = 0;

            if (statusEl && this.magicCircle.currentState === 0) {
                statusEl.innerText = "SHOW HAND TO BEGIN RITUAL";
            }
        }
    }

    triggerUnlock() {
        if (this.isUnlocked) return;
        this.isUnlocked = true;

        const statusEl = this.container.querySelector('.hud-status');
        if (statusEl) statusEl.innerText = "ACCESS GRANTED.";

        // Explode rings
        this.magicCircles.forEach(mc => mc.explode());

        // Stop camera immediately to free resources
        this.handTracker.stop();

        // UI Transition
        this.container.classList.add('portal-opening');

        // Fast Unlock (0.5s instead of 1.5s)
        setTimeout(() => {
            this.container.style.display = 'none';
            // Stop Three.js loop
            this.renderer.setAnimationLoop(null);
            if (this.onUnlock) this.onUnlock();
        }, 500);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
