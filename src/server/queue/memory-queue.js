import logger from '../utils/logger.js';

/**
 * In-Memory Queue for Development/Standalone Mode.
 * Mimics basic BullMQ 'add' functionality.
 */
export class MemoryQueue {
    constructor(queueName, processor) {
        this.name = queueName;
        this.processor = processor;
        this.jobs = new Map(); // Store job state
    }

    async add(jobName, data, opts) {
        const jobId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        const job = {
            id: jobId,
            name: jobName,
            data: data,
            state: 'waiting',
            returnvalue: null,
            failedReason: null,
            getState: async function () { return this.state; }
        };

        this.jobs.set(jobId, job);
        logger.info(`[MemoryQueue:${this.name}] Job added: ${jobId}`, { mode: 'IN_MEMORY' });

        setImmediate(async () => {
            try {
                job.state = 'active';
                logger.info(`[MemoryQueue:${this.name}] Starting Job ${jobId}...`);
                const result = await this.processor(job);
                job.state = 'completed';
                job.returnvalue = result;
                logger.info(`[MemoryQueue:${this.name}] Job ${jobId} Completed.`);
            } catch (e) {
                job.state = 'failed';
                job.failedReason = e.message;
                logger.error(`[MemoryQueue:${this.name}] Job ${jobId} Failed`, { error: e.message });
            }
        });

        return job;
    }

    async getJob(jobId) {
        return this.jobs.get(jobId);
    }
}
