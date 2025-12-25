import logger from '../utils/logger.js';

/**
 * In-Memory Queue for Development/Standalone Mode.
 * Mimics basic BullMQ 'add' functionality.
 */
export class MemoryQueue {
    constructor(queueName, processor) {
        this.name = queueName;
        this.processor = processor; // The async function to run
    }

    /**
     * Add a job to the memory queue.
     * In this simple version, we start it almost immediately (next tick).
     */
    async add(jobName, data, opts) {
        const jobId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        const jobSim = {
            id: jobId,
            name: jobName,
            data: data
        };

        logger.info(`[MemoryQueue:${this.name}] Job added: ${jobId}`, { mode: 'IN_MEMORY' });

        // Execute asynchronously to simulate queue behavior (don't block the API response)
        setImmediate(async () => {
            try {
                logger.info(`[MemoryQueue:${this.name}] Starting Job ${jobId}...`);
                await this.processor(jobSim);
                logger.info(`[MemoryQueue:${this.name}] Job ${jobId} Completed.`);
            } catch (e) {
                logger.error(`[MemoryQueue:${this.name}] Job ${jobId} Failed`, { error: e.message });
            }
        });

        // Return immediately like BullMQ
        return jobSim;
    }
}
