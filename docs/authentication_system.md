# Authentication System Documentation (Hardened)

This document describes the "Magic Circle" authentication system. This module combines 3D visuals, computer vision hand tracking, and **Secure Server-Side Ritual Verification** to protect the application.

## Architecture Overview

The system consists of three main components:
1.  **LoginManager (`login-manager.js`)**: The central controller that coordinates the UI, 3D scene, and hand tracking logic. It implements the "Gesture State Machine" and records a `ritualLog`.
2.  **HandTracker (`hand-tracker.js`)**: Wraps MediaPipe Hands to detect landmarks and calculate abstract gestures (fist, pinch, hand distance).
3.  **MagicCircle (`magic-circle.js`)**: A Three.js particle system that renders the visual feedback for each state.
4.  **AuthService (`auth-service.js`)**: The backend service that "replays" the movement logs to verify the ritual authenticity.

---

## 1. Gesture State Machine (Secure Verification)

The logic is now verified on the **Backend** to prevent bypasses. 

### How Verification Works
1.  **Session Nonce**: On startup, the `LoginManager` requests a one-time nonce from the server (`/api/auth/ritual-session`).
2.  **Ritual Logging**: Every frame of hand tracking (fist state, distance, expansion) is recorded into a `ritualLog`.
3.  **Encapsulated Handshake**: When the ritual is complete, the `ritualLog` and `nonce` are sent to the server.
4.  **Backend Replay**: The `AuthService.verifyRitual()` method re-runs the state machine logic on the raw logs. If the sequence is valid, a JWT is issued.

### Secure States & Transitions

| Stage | Required Action | Logic Check (Backend) |
| :--- | :--- | :--- |
| **1. Charge** | Make a **Fist**. | Consistent fist detection for > 10 data points. |
| **2. Cast** | **Open Hand** after charge. | Transition from Fist to Open with > 1s duration. |
| **3. Align** | Show **Two Hands** and pull apart. | `twoHandsDetected` flag + `handDistance > 0.4`. |
| **4. Unlock** | **Hold Expansion** (> 95%). | `expansionProgress > 0.95` held for > 1s. |

---

## 2. Computer Vision Layer (`HandTracker`)

Located in `hand-tracker.js`, this class uses **MediaPipe Hands** to analyze video input. The raw data captured here is what forms the `ritualLog`.

**Safety**: The `stop()` method ensures the tracking loop terminates cleanly before the `hands` instance is destroyed, preventing WebGL crashes.

---

## 3. Visual Effects (`MagicCircle`)

Located in `magic-circle.js`, this is a high-performance **Three.js Particle System** with ~45,000 particles.

### Particle Logic
Instead of standard meshes, it uses raw `Float32Array` buffers for position and color.
*   **`targetPositions`**: Each particle has a destination.
*   **`update()` Loop**: Particles lerp (interpolate) towards their target positions every frame.

---

## 4. Backend Integration

When the "Unlock" state is confirmed:
1.  `LoginManager.triggerUnlock()` is called.
2.  It sends the `ritualLog` and `nonce` to `/api/auth/ritual-unlock`.
3.  The server validates the movements and returns a **JWT Token**.
4.  The frontend stores this token and reveals the main app UI.

---

## 5. Security (Hardened)

> [!NOTE]
> **Server-Verified Rituals**
> This system is now secure against browser-console bypasses and hardcoded credential theft.

### Key Protections
1.  **Zero Hardcoded Passwords**: The frontend no longer knows the password. It only knows how to perform the ritual.
2.  **Nonce Protection**: Each ritual session is tied to a one-time-use nonce. An attacker cannot "replay" a previous ritual log.
3.  **Logic Continuity**: The server requires a complete, contiguous sequence of landmarks that matches the ritual's timing and spatial requirements.

### Limitations
*   **Video Playback**: A professional hacker could still bypass this by playing a recorded *video* of the correct gesture into their webcam. This is a common limitation of biometrics.

## Troubleshooting

### "Camera Blocked"
*   **Cause**: Browser denies camera access on non-secure origins (HTTP).
*   **Fix**: Use `localhost` or serve via **HTTPS**.

### "BindingError"
*   **Cause**: MediaPipe trying to process a frame after the component unmounted.
*   **Fix**: Ensure `HandTracker.stop()` sets `isRunning = false`.
