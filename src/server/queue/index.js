import { Queue } from 'bullmq';
import { connection } from './connection.js';
import { MemoryQueue } from './memory-queue.js';
import { processVideoJob, processVoiceJob } from './processors.js';

// Configuration: Default to Redis unless explicitly disabled
// Or we could try to detect? Auto-detection is hard synchronously.
// Let's rely on an ENV var or a default setting.
// For the user request "I want no docker", we can add USE_REDIS_QUEUE=false to .env
// OR we can make it default false for now? No, commercial goal = true.
const USE_REDIS = process.env.USE_REDIS_QUEUE !== 'false';

let videoQueue, voiceQueue;

if (USE_REDIS) {
    console.log('[Queue] Mode: REDIS (BullMQ)');
    videoQueue = new Queue('video-generation', { connection });
    voiceQueue = new Queue('voice-cloning', { connection });
} else {
    console.log('[Queue] Mode: IN-MEMORY (Standalone)');
    // In memory mode, we MUST provide the processor because there is no external worker
    videoQueue = new MemoryQueue('video-generation', processVideoJob);
    voiceQueue = new MemoryQueue('voice-cloning', processVoiceJob);
}

export { videoQueue, voiceQueue };

/**
 * Add a video generation job
 */
export async function addVideoJob(data) {
    return await videoQueue.add('generate-video', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200
    });
}

/**
 * Add a voice cloning job
 */
export async function addVoiceJob(data) {
    return await voiceQueue.add('clone-voice', data, {
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200
    });
}
