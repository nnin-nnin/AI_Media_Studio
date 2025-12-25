import AIService from '../ai/ai-service.js';
import AssetStore from '../asset-store.js';
import logger from '../utils/logger.js';

/**
 * Process a Video Generation Job
 * @param {Object} job - { id, data: { userId, prompt, ... } }
 */
export async function processVideoJob(job) {
    logger.info(`[Processor] Processing Video Job ${job.id}`);

    // 1. Execute AI Logic
    const result = await AIService.generateVideo(job.data);

    if (result.status === 'error') {
        throw new Error(result.message);
    }

    // 2. Auto-save to Asset Store
    if (result.video_url) {
        try {
            await AssetStore.add({
                userId: job.data.userId || 1,
                type: 'video',
                url: result.video_url,
                prompt: job.data.prompt || 'Async Video Generation',
                metadata: JSON.stringify({ jobId: job.id, source: 'async-worker' })
            });
            logger.info(`[Processor] Video Job ${job.id} saved to assets.`);
        } catch (e) {
            logger.error(`[Processor] Failed to auto-save asset for job ${job.id}`, e.message);
        }
    }

    return result;
}

/**
 * Process a Voice Cloning Job
 * @param {Object} job - { id, data: { userId, text, ... } }
 */
export async function processVoiceJob(job) {
    logger.info(`[Processor] Processing Voice Job ${job.id}`);

    const result = await AIService.cloneVoice(job.data);

    if (result.status === 'error') {
        throw new Error(result.message);
    }

    if (result.audio_url) {
        try {
            await AssetStore.add({
                userId: job.data.userId || 1,
                type: 'audio',
                url: result.audio_url,
                prompt: job.data.text || 'Async Voice Clone',
                metadata: JSON.stringify({ jobId: job.id, source: 'async-worker' })
            });
            logger.info(`[Processor] Voice Job ${job.id} saved to assets.`);
        } catch (e) {
            logger.error(`[Processor] Failed to auto-save voice for job ${job.id}`, e.message);
        }
    }

    return result;
}
