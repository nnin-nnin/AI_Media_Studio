// src/renderer/components/login/hand-tracker.js
// Imports removed to fallback to global CDN scripts for simpler browser integration
// import { Hands } from '@mediapipe/hands';
// import { Camera } from '@mediapipe/camera_utils';

export class HandTracker {
    constructor(videoElement, onResultsCallback) {
        this.videoElement = videoElement;
        this.onResultsCallback = onResultsCallback;
        this.hands = null;
        this.camera = null;
    }

    async init() {
        const Hands = window.Hands;
        const Camera = window.Camera;

        if (!Hands || !Camera) {
            console.error("MediaPipe globals not found. Ensure scripts are loaded in index.html");
            throw new Error("MediaPipe not loaded");
        }

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.3,
            minTrackingConfidence: 0.3
        });

        this.hands.onResults(this.onResults.bind(this));

        if (this.videoElement) {
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 1280,
                height: 720
            });
            await this.camera.start();
        }
    }

    onResults(results) {
        // Analyze gesture
        let gestureData = {
            found: false,
            handDetected: false,
            twoHandsDetected: false,
            isFist: false,
            indexFingerX: 0.5,
            pinchDistance: 0,
            handDistance: 0,
            hands: [] // For 3D mapping if needed
        };

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            gestureData.found = true;
            gestureData.handDetected = true;

            const handLandmarks = results.multiHandLandmarks[0]; // Primary hand
            const wrist = handLandmarks[0];
            const indexTip = handLandmarks[8];
            const thumbTip = handLandmarks[4];

            // 1. Index Finger Position (Normalized 0-1, flipped if needed for mirror)
            // Assuming video is mirrored, x is reversed? Usually MediaPipe returns normalized 0-1.
            // In refs/magic.html: indexFingerX = 1 - indexTip.x;
            gestureData.indexFingerX = 1 - indexTip.x;

            // 2. Pinch Distance (Thumb to Index)
            // Simple Euclidean distance in normalized space (aspect ratio might skew slightly but ok for interaction)
            gestureData.pinchDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

            // 3. Fist Detection
            const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
            let avgDist = 0;
            tips.forEach(idx => {
                const tip = handLandmarks[idx];
                const dist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
                avgDist += dist;
            });
            avgDist /= 4;

            // Strict fist threshold
            if (avgDist < 0.25) {
                gestureData.isFist = true;
            }

            // 4. Two Hands Detection
            if (results.multiHandLandmarks.length === 2) {
                gestureData.twoHandsDetected = true;
                const hand2Landmarks = results.multiHandLandmarks[1];
                const wrist2 = hand2Landmarks[0];
                gestureData.handDistance = Math.hypot(wrist.x - wrist2.x, wrist.y - wrist2.y);
            }

            // Map to abstract data
            gestureData.hands = results.multiHandLandmarks.map(lm => {
                return { x: lm[0].x, y: lm[0].y, z: lm[0].z };
            });
        }

        this.onResultsCallback(gestureData);
    }

    stop() {
        if (this.camera) this.camera.stop();
        if (this.hands) this.hands.close();
    }
}
