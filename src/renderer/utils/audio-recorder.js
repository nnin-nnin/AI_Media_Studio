/**
 * audio-recorder.js
 * Utility for capturing audio from the microphone using MediaRecorder API.
 */

export class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.processor = null;
        this.volumes = []; // Track RMS volumes
    }

    async start(deviceId = null) {
        try {
            console.log(`[AudioRecorder] Requesting microphone access (Requested DeviceID: ${deviceId || 'Auto'})...`);

            // --- Smart Device Selection Logic ---
            let targetDeviceId = deviceId;
            if (!targetDeviceId) {
                // Enumerate to find a better default than "BlackHole" if present
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');

                console.log("[AudioRecorder] Available Inputs:", audioInputs.map(d => `${d.label} (${d.deviceId})`));

                // 1. Try to find the system default if it's NOT BlackHole
                const defaultDevice = audioInputs.find(d => d.deviceId === 'default');
                if (defaultDevice && !defaultDevice.label.toLowerCase().includes('blackhole')) {
                    // Default is safe
                    // targetDeviceId = undefined; // Use system default behavior
                } else {
                    // Default is suspicious or missing labels (permission issue? but we are about to ask) or is BlackHole
                    // 2. Look for "Built-in" or regular mic
                    const betterDevice = audioInputs.find(d =>
                        !d.label.toLowerCase().includes('blackhole') &&
                        !d.label.toLowerCase().includes('virtual') &&
                        d.deviceId !== 'default' &&
                        d.deviceId !== 'communications'
                    );

                    if (betterDevice) {
                        console.log(`[AudioRecorder] Auto-switching from virtual/default to: ${betterDevice.label}`);
                        targetDeviceId = betterDevice.deviceId;
                    }
                }
            }

            const constraints = {
                audio: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const track = this.stream.getAudioTracks()[0];
            console.log(`[AudioRecorder] Microphone access granted. Using: ${track.label} (ID: ${track.id})`);

            // Setup Volume Analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            source.connect(this.analyser);

            this.volumes = [];
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Simple polling for volume (RMS-ish)
            this._volumeInterval = setInterval(() => {
                this.analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / bufferLength);
                this.volumes.push(rms);
            }, 100);

            // Diagnostics: Check track status
            this.stream.getAudioTracks().forEach(track => {
                console.log(`[AudioRecorder] Track: ${track.label}, Enabled: ${track.enabled}, Muted: ${track.muted}, State: ${track.readyState}`);
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            console.log("[AudioRecorder] Using mimeType:", mimeType);
            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            console.log("[AudioRecorder] Recording started.");
            return true;
        } catch (error) {
            console.error("[AudioRecorder] Start error:", error);
            throw error;
        }
    }

    stop() {
        console.log("[AudioRecorder] Stopping recording...");
        if (this._volumeInterval) clearInterval(this._volumeInterval);

        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                console.warn("[AudioRecorder] Cannot stop: recorder not active.");
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = async () => {
                console.log("[AudioRecorder] Stopped. Total chunks:", this.audioChunks.length);
                const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });

                // Calculate average volume
                const avgVolume = this.volumes.length > 0
                    ? this.volumes.reduce((a, b) => a + b, 0) / this.volumes.length
                    : 0;
                const maxVolume = this.volumes.length > 0 ? Math.max(...this.volumes) : 0;

                console.log("[AudioRecorder] Generated blob, size:", audioBlob.size, "Avg Volume:", avgVolume.toFixed(4), "Peak:", maxVolume.toFixed(4));

                // Cleanup Tracks
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                if (this.audioContext && this.audioContext.state !== 'closed') {
                    await this.audioContext.close();
                }

                resolve({
                    blob: audioBlob,
                    avgVolume: avgVolume,
                    maxVolume: maxVolume
                });
            };

            this.mediaRecorder.stop();
        });
    }

    get isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    }
}
