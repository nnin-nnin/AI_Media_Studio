import * as THREE from 'three';

export const MAGIC_STATES = {
    SPHERE: 0,
    COLLAPSING: 1,
    EXPLODING: 2,
    HEXAGRAM: 3,
    COMPLEX: 4
};

export class MagicCircle {
    constructor(scene) {
        this.scene = scene;
        this.particleSystem = null;
        this.particleCount = 45000;

        // Data Arrays
        this.positions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.sizes = new Float32Array(this.particleCount);
        this.randoms = new Float32Array(this.particleCount * 3);

        // State matching refs/magic.html
        this.currentState = 0; // 0:SPHERE, 1:COLLAPSING, 2:EXPLODING, 3:HEXAGRAM, 4:COMPLEX

        this.time = 0;
        this.animationProgress = 0;
        this.expansionProgress = 0;

        // Interaction State
        this.interaction = {
            indexFingerX: 0.5,
            pinchDistance: 0,
            handDistance: 0,
            twoHandsDetected: false,
            handDetected: false
        };

        this.init();
    }

    init() {
        const geometry = new THREE.BufferGeometry();
        const color = new THREE.Color();

        for (let i = 0; i < this.particleCount; i++) {
            // Initial Sphere State - 80% surface, 20% internal
            const r = 300 * (Math.random() > 0.2 ? 1 : Math.cbrt(Math.random()));
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            this.positions[i * 3] = x;
            this.positions[i * 3 + 1] = y;
            this.positions[i * 3 + 2] = z;
            this.targetPositions[i * 3] = x; this.targetPositions[i * 3 + 1] = y; this.targetPositions[i * 3 + 2] = z;

            // Initial Color: Magma Orange
            color.setHSL(0.05 + Math.random() * 0.05, 1.0, 0.5);
            this.colors[i * 3] = color.r;
            this.colors[i * 3 + 1] = color.g;
            this.colors[i * 3 + 2] = color.b;

            this.sizes[i] = Math.random() * 4 + 2; // Slightly larger range
            this.randoms[i * 3] = (Math.random() - 0.5);
            this.randoms[i * 3 + 1] = (Math.random() - 0.5);
            this.randoms[i * 3 + 2] = (Math.random() - 0.5);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: true
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
        this.setVisible(true);
    }

    reset() {
        this.currentState = 0; // SPHERE
        this.expansionProgress = 0;
        this.animationProgress = 0;
        this.particleSystem.scale.setScalar(1);
        this.particleSystem.rotation.set(0, 0, 0);
        // Reset positions to original sphere positions
        const positions = this.particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < this.particleCount * 3; i++) {
            positions[i] = this.positions[i];
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    setInteractionState(state) {
        this.interaction = { ...this.interaction, ...state };
    }

    // --- State Generators ---
    generateCollapseTargets() {
        for (let i = 0; i < this.particleCount; i++) {
            // Singularity - High density center
            const r = Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            this.targetPositions[i * 3 + 2] = r * Math.cos(phi);
        }
    }

    generateHexagramTargets() {
        const r = 400; // Larger radius
        let idx = 0;

        const addLine = (x1, y1, x2, y2, count) => {
            for (let i = 0; i < count; i++) {
                if (idx >= this.particleCount) return;
                const t = Math.random();
                const jitter = 2;
                this.targetPositions[idx * 3] = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
                this.targetPositions[idx * 3 + 1] = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter;
                this.targetPositions[idx * 3 + 2] = (Math.random() - 0.5) * jitter;
                idx++;
            }
        };

        const angles1 = [0, 120, 240].map(d => d * Math.PI / 180);
        const angles2 = [60, 180, 300].map(d => d * Math.PI / 180);
        const getPt = (angle) => ({ x: r * Math.sin(angle), y: r * Math.cos(angle) });
        const pts1 = angles1.map(getPt);
        const pts2 = angles2.map(getPt);
        const particlesPerLine = Math.floor((this.particleCount * 0.5) / 6);

        for (let i = 0; i < 3; i++) {
            const p1 = pts1[i]; const p2 = pts1[(i + 1) % 3]; addLine(p1.x, p1.y, p2.x, p2.y, particlesPerLine);
            const p3 = pts2[i]; const p4 = pts2[(i + 1) % 3]; addLine(p3.x, p3.y, p4.x, p4.y, particlesPerLine);
        }

        // Ring
        const ringParticles = Math.floor(this.particleCount * 0.3);
        for (let i = 0; i < ringParticles; i++) {
            if (idx >= this.particleCount) break;
            const theta = Math.random() * Math.PI * 2;
            const ringR = r * 1.1;
            this.targetPositions[idx * 3] = ringR * Math.cos(theta);
            this.targetPositions[idx * 3 + 1] = ringR * Math.sin(theta);
            this.targetPositions[idx * 3 + 2] = 0;
            idx++;
        }

        // Fill remaining
        while (idx < this.particleCount) {
            const theta = Math.random() * Math.PI * 2;
            const randR = Math.random() * r;
            this.targetPositions[idx * 3] = randR * Math.cos(theta);
            this.targetPositions[idx * 3 + 1] = randR * Math.sin(theta);
            this.targetPositions[idx * 3 + 2] = (Math.random() - 0.5) * 20;
            idx++;
        }
    }

    generateComplexCircleTargets() {
        let idx = 0;
        const R_OUTER = 180; // Smaller base, expands with interaction

        // Helpers
        const addCircle = (cx, cy, r, count, zOffset = 0) => {
            for (let i = 0; i < count; i++) {
                if (idx >= this.particleCount) return;
                const theta = Math.random() * Math.PI * 2;
                this.targetPositions[idx * 3] = cx + r * Math.cos(theta);
                this.targetPositions[idx * 3 + 1] = cy + r * Math.sin(theta);
                this.targetPositions[idx * 3 + 2] = zOffset;
                idx++;
            }
        };

        const addLine = (x1, y1, x2, y2, count) => {
            for (let i = 0; i < count; i++) {
                if (idx >= this.particleCount) return;
                const t = Math.random();
                this.targetPositions[idx * 3] = x1 + (x2 - x1) * t;
                this.targetPositions[idx * 3 + 1] = y1 + (y2 - y1) * t;
                this.targetPositions[idx * 3 + 2] = 0;
                idx++;
            }
        };

        const addPolygon = (cx, cy, r, sides, count, rotationOffset = 0) => {
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = (i * 360 / sides + rotationOffset) * Math.PI / 180;
                points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
            }
            const particlesPerLine = Math.floor(count / sides);
            for (let i = 0; i < sides; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % sides];
                addLine(p1.x, p1.y, p2.x, p2.y, particlesPerLine);
            }
        };

        // 1. Double Outer Ring
        addCircle(0, 0, R_OUTER, 3000);
        addCircle(0, 0, R_OUTER * 0.95, 2000);

        // 2. 5 Satellite Circles + Triangles
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 18) * Math.PI / 180;
            const cx = R_OUTER * Math.cos(angle);
            const cy = R_OUTER * Math.sin(angle);
            const r_small = 30;
            addCircle(cx, cy, r_small, 600);
            addPolygon(cx, cy, r_small * 0.8, 3, 400, -90);
        }

        // 3. Central Hexagram
        const r_hex = R_OUTER * 0.6;
        addPolygon(0, 0, r_hex, 3, 1500, 30);
        addPolygon(0, 0, r_hex, 3, 1500, 90);

        // 4. Rune Band
        const r_rune = R_OUTER * 0.75;
        for (let i = 0; i < 3000; i++) {
            if (idx >= this.particleCount) break;
            const theta = Math.random() * Math.PI * 2;
            const r_offset = (Math.random() - 0.5) * 20;
            this.targetPositions[idx * 3] = (r_rune + r_offset) * Math.cos(theta);
            this.targetPositions[idx * 3 + 1] = (r_rune + r_offset) * Math.sin(theta);
            this.targetPositions[idx * 3 + 2] = 0;
            idx++;
        }

        // 5. Central Decoration
        addCircle(0, 0, R_OUTER * 0.2, 600);

        // 5.5 Ancient Runes
        const R_TEXT = 100;
        const CHAR_COUNT = 8;
        const CHAR_SIZE = 22;
        for (let i = 0; i < CHAR_COUNT; i++) {
            const angle = (i * 360 / CHAR_COUNT) * Math.PI / 180;
            const cx = R_TEXT * Math.cos(angle);
            const cy = R_TEXT * Math.sin(angle);
            const strokes = 3 + Math.floor(Math.random() * 2);
            for (let s = 0; s < strokes; s++) {
                if (idx >= this.particleCount) break;
                const x1 = cx + (Math.floor(Math.random() * 3) - 1) * CHAR_SIZE * 0.4;
                const y1 = cy + (Math.floor(Math.random() * 3) - 1) * CHAR_SIZE * 0.4;
                const x2 = cx + (Math.floor(Math.random() * 3) - 1) * CHAR_SIZE * 0.4;
                const y2 = cy + (Math.floor(Math.random() * 3) - 1) * CHAR_SIZE * 0.4;
                if (x1 !== x2 || y1 !== y2) addLine(x1, y1, x2, y2, 40);
            }
        }

        // 6. 5 Sub-Magic Circles (Interleaved)
        const R_SUB = 280;
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 + 18) * Math.PI / 180;
            const cx = R_SUB * Math.cos(angle);
            const cy = R_SUB * Math.sin(angle);
            addCircle(cx, cy, 40, 800);
            addPolygon(cx, cy, 25, 3, 300, i * 72);
            addPolygon(cx, cy, 25, 3, 300, i * 72 + 60);
        }

        // 6.5 Scattered Particles
        const scatterCount = 2000;
        for (let i = 0; i < scatterCount; i++) {
            if (idx >= this.particleCount) break;
            const theta = Math.random() * Math.PI * 2;
            const r = 180 + Math.random() * 170;
            this.targetPositions[idx * 3] = r * Math.cos(theta);
            this.targetPositions[idx * 3 + 1] = r * Math.sin(theta);
            this.targetPositions[idx * 3 + 2] = (Math.random() - 0.5) * 50;
            idx++;
        }

        // 7. Energy Connections & Nebula
        // A. Beams
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 + 18) * Math.PI / 180;
            const x1 = R_OUTER * Math.cos(angle);
            const y1 = R_OUTER * Math.sin(angle);
            const x2 = R_SUB * Math.cos(angle);
            const y2 = R_SUB * Math.sin(angle);
            addLine(x1, y1, x2, y2, 150);
        }

        // B. Spiral Nebula
        const R_START = 280;
        const R_RING = 420;
        while (idx < this.particleCount) {
            const isRing = Math.random() > 0.4;
            let r, theta, z;

            if (isRing) {
                const ringWidth = 40;
                const rnd = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
                r = R_RING + rnd * ringWidth * 2;
                theta = Math.random() * Math.PI * 2;
                z = (Math.random() - 0.5) * 15;
            } else {
                const armIndex = Math.floor(Math.random() * 5);
                const armAngleBase = (armIndex * 72 + 18) * Math.PI / 180;
                const t = Math.random();
                r = R_START + t * (R_RING - R_START);
                const angleOffset = t * 0.6;
                const width = 0.15 + t * 0.2;
                theta = armAngleBase + angleOffset + (Math.random() - 0.5) * width;
                z = (Math.random() - 0.5) * 20;
            }
            this.targetPositions[idx * 3] = r * Math.cos(theta);
            this.targetPositions[idx * 3 + 1] = r * Math.sin(theta);
            this.targetPositions[idx * 3 + 2] = z;
            idx++;
        }
    }

    // --- Actions ---

    collapse() {
        if (this.currentState === 1) return;
        this.currentState = 1;
        this.generateCollapseTargets();
    }

    explode() {
        if (this.currentState === 2) return;
        this.currentState = 2;
        this.generateHexagramTargets();
        this.animationProgress = 0;
        this.particleSystem.rotation.set(0, 0, 0);
    }

    becomeComplex() {
        if (this.currentState === 3) {
            this.currentState = 4; // COMPLEX_CIRCLE
            this.generateComplexCircleTargets();
            this.expansionProgress = 0;
        }
    }

    // --- Update Loop ---

    update(dt) {
        this.time += dt || 0.05;
        const positions = this.particleSystem.geometry.attributes.position.array;
        const colors = this.particleSystem.geometry.attributes.color.array;

        if (this.currentState === 0) { // SPHERE
            // Interact: Rotate with finger
            if (this.interaction.handDetected) {
                const targetRotationY = (this.interaction.indexFingerX - 0.5) * 0.2;
                this.particleSystem.rotation.y += targetRotationY;
            } else {
                this.particleSystem.rotation.y += 0.005;
            }

            // High-fidelity constant breathing
            for (let i = 0; i < this.particleCount; i++) {
                const scale = 1 + Math.sin(this.time + this.positions[i * 3] * 0.01) * 0.002;
                positions[i * 3] = this.positions[i * 3] * scale;
                positions[i * 3 + 1] = this.positions[i * 3 + 1] * scale;
                positions[i * 3 + 2] = this.positions[i * 3 + 2] * scale;
            }

        } else if (this.currentState === 1) { // COLLAPSING
            const speed = 0.15;
            // Color Cycle: Orange -> Red -> Platinum
            const cycle = (Math.sin(this.time * 0.5) + 1) / 2;
            let tr, tg, tb;
            if (cycle < 0.33) { tr = 1.0; tg = 0.5; tb = 0.0; }
            else if (cycle < 0.66) { tr = 1.0; tg = 0.0; tb = 0.0; }
            else { tr = 1.0; tg = 0.9; tb = 0.6; }

            for (let i = 0; i < this.particleCount; i++) {
                // Lerp pos
                positions[i * 3] += (this.targetPositions[i * 3] - positions[i * 3]) * speed;
                positions[i * 3 + 1] += (this.targetPositions[i * 3 + 1] - positions[i * 3 + 1]) * speed;
                positions[i * 3 + 2] += (this.targetPositions[i * 3 + 2] - positions[i * 3 + 2]) * speed;

                // Solar Storm: Eject particles
                if (Math.random() < 0.05) {
                    const stormScale = 100 + Math.random() * 100;
                    positions[i * 3] += this.randoms[i * 3] * stormScale;
                    positions[i * 3 + 1] += this.randoms[i * 3 + 1] * stormScale;
                    positions[i * 3 + 2] += this.randoms[i * 3 + 2] * stormScale;
                }

                colors[i * 3] += (tr - colors[i * 3]) * 0.1;
                colors[i * 3 + 1] += (tg - colors[i * 3 + 1]) * 0.1;
                colors[i * 3 + 2] += (tb - colors[i * 3 + 2]) * 0.1;
            }

        } else if (this.currentState === 2) { // EXPLODING
            this.animationProgress += 0.03;
            const speed = 0.1;
            for (let i = 0; i < this.particleCount; i++) {
                positions[i * 3] += (this.targetPositions[i * 3] - positions[i * 3]) * speed;
                positions[i * 3 + 1] += (this.targetPositions[i * 3 + 1] - positions[i * 3 + 1]) * speed;
                positions[i * 3 + 2] += (this.targetPositions[i * 3 + 2] - positions[i * 3 + 2]) * speed;
                colors[i * 3] += (1.0 - colors[i * 3]) * 0.05;
                colors[i * 3 + 1] += (0.3 - colors[i * 3 + 1]) * 0.05;
                colors[i * 3 + 2] += (0.0 - colors[i * 3 + 2]) * 0.05;
            }
            this.particleSystem.rotation.z += 0.1;
            if (this.animationProgress > 1.5) this.currentState = 3;

        } else if (this.currentState === 3) { // HEXAGRAM
            const tempColor = new THREE.Color();

            // Interaction: Rotate & Scale
            if (this.interaction.handDetected) {
                const rotationSpeed = (this.interaction.indexFingerX - 0.5) * 0.15;
                this.particleSystem.rotation.z += rotationSpeed;

                let targetScale = 1.0;
                if (this.interaction.pinchDistance > 0.02) {
                    targetScale = 0.5 + (this.interaction.pinchDistance * 5);
                }
                this.particleSystem.scale.setScalar(
                    this.particleSystem.scale.x + (targetScale - this.particleSystem.scale.x) * 0.1
                );
            } else {
                this.particleSystem.rotation.z += 0.005;
            }

            for (let i = 0; i < this.particleCount; i++) {
                positions[i * 3] += (Math.random() - 0.5) * 2; // Micro-jitter
                positions[i * 3 + 1] += (Math.random() - 0.5) * 2;

                const px = positions[i * 3];
                const py = positions[i * 3 + 1];
                const angle = Math.atan2(py, px);
                const dist = Math.sqrt(px * px + py * py);

                // Complex Wave Math
                const wave = Math.sin(angle * 3 + dist * 0.005 - this.time * 0.1);
                const hue = 0.06 + 0.06 * wave;
                const lightness = 0.6 + 0.2 * Math.sin(dist * 0.01 - this.time * 0.1);
                tempColor.setHSL(hue, 1.0, lightness);

                colors[i * 3] += (tempColor.r - colors[i * 3]) * 0.05;
                colors[i * 3 + 1] += (tempColor.g - colors[i * 3 + 1]) * 0.05;
                colors[i * 3 + 2] += (tempColor.b - colors[i * 3 + 2]) * 0.05;
            }

        } else if (this.currentState === 4) { // COMPLEX
            // Interaction: Expansion
            let targetExpansion = 1.0;
            if (this.interaction.twoHandsDetected) {
                targetExpansion = Math.max(0, Math.min(1, (this.interaction.handDistance - 0.1) * 2.5));
            } else if (this.interaction.handDetected) {
                targetExpansion = Math.max(0, Math.min(1, (this.interaction.pinchDistance - 0.02) * 8.0));
            }
            this.expansionProgress += (targetExpansion - this.expansionProgress) * 0.03;

            // Interaction: Rotation
            if (this.interaction.handDetected) {
                const rotationSpeed = (this.interaction.indexFingerX - 0.5) * 0.15;
                this.particleSystem.rotation.z += rotationSpeed;
            } else {
                this.particleSystem.rotation.z -= 0.002;
            }

            const maxRadius = 500;
            const currentVisibleRadius = maxRadius * this.expansionProgress;
            const tempColor = new THREE.Color();

            for (let i = 0; i < this.particleCount; i++) {
                const tx = this.targetPositions[i * 3];
                const ty = this.targetPositions[i * 3 + 1];
                const tz = this.targetPositions[i * 3 + 2];
                const distToCenter = Math.sqrt(tx * tx + ty * ty);

                let ax = 0, ay = 0, az = 0;
                if (distToCenter < currentVisibleRadius) { ax = tx; ay = ty; az = tz; }

                positions[i * 3] += (ax - positions[i * 3]) * 0.05;
                positions[i * 3 + 1] += (ay - positions[i * 3 + 1]) * 0.05;
                positions[i * 3 + 2] += (az - positions[i * 3 + 2]) * 0.05;

                // Color Wave: Cyan -> Blue -> Purple
                const px = positions[i * 3];
                const py = positions[i * 3 + 1];
                const angle = Math.atan2(py, px);
                const dist = Math.sqrt(px * px + py * py);

                const wave = Math.sin(angle * 5 + dist * 0.01 - this.time * 0.1);
                const hue = 0.6 + 0.1 * wave;
                const lightness = 0.6 + 0.3 * Math.sin(dist * 0.02 - this.time * 0.1);

                tempColor.setHSL(hue, 1.0, lightness);
                if (distToCenter > currentVisibleRadius) tempColor.multiplyScalar(0);

                colors[i * 3] += (tempColor.r - colors[i * 3]) * 0.1;
                colors[i * 3 + 1] += (tempColor.g - colors[i * 3 + 1]) * 0.1;
                colors[i * 3 + 2] += (tempColor.b - colors[i * 3 + 2]) * 0.1;
            }
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }

    setVisible(visible) {
        if (this.particleSystem) {
            this.particleSystem.visible = visible;
        }
    }

    setPosition(x, y, z) {
        if (this.particleSystem) {
            this.particleSystem.position.set(x, y, z);
        }
    }
}
