import { Worker } from 'bullmq';
import { connection } from './connection.js';
import { processVideoJob, processVoiceJob } from './processors.js';
import logger from '../utils/logger.js';

// --- Video Worker ---
// Just a thin wrapper around the processor
const videoWorker = new Worker('video-generation', async job => {
    return await processVideoJob(job);
}, { connection });

videoWorker.on('completed', async (job, result) => {
    logger.info(`[Worker] Video Job ${job.id} completed! URL: ${result.video_url}`);
    // Auto-save logic is now handled inside the processor!
});

videoWorker.on('failed', (job, err) => {
    logger.error(`[Worker] Video Job ${job.id} failed`, err);
});

// --- Voice Worker ---
const voiceWorker = new Worker('voice-cloning', async job => {
    return await processVoiceJob(job);
}, { connection });

voiceWorker.on('completed', async (job, result) => {
    logger.info(`[Worker] Voice Job ${job.id} completed! URL: ${result.audio_url}`);
});

logger.info("[Worker] Worker process started. Listening for jobs...");
