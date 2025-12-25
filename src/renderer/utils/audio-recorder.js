/**
 * audio-recorder.js
 * Utility for capturing audio from the microphone using MediaRecorder API.
 */

export class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
    }

    async start(deviceId = null) {
        try {
            console.log(`[AudioRecorder] Requesting microphone access (DeviceID: ${deviceId || 'System Default'})...`);

            const constraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("[AudioRecorder] Microphope access granted for stream:", this.stream.id);

            // Diagnostics: Check track status
            this.stream.getAudioTracks().forEach(track => {
                console.log(`[AudioRecorder] Track: ${track.label}, Enabled: ${track.enabled}, Muted: ${track.muted}, State: ${track.readyState}`);
                track.onended = () => console.warn("[AudioRecorder] Track ended unexpectedly");
                track.onmute = () => console.warn("[AudioRecorder] Track muted unexpectedly");
            });

            // Check for supported mime types
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
        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                console.warn("[AudioRecorder] Cannot stop: recorder not active.");
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                console.log("[AudioRecorder] Stopped. Total chunks:", this.audioChunks.length);
                const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
                console.log("[AudioRecorder] Generated blob, size:", audioBlob.size, "type:", audioBlob.type);

                // Stop all tracks in the stream to release the microphone
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }

                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    get isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    }
}
