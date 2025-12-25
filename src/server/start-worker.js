import './config.js'; // Load dotenv

// Check Mode
if (process.env.USE_REDIS_QUEUE === 'false') {
    console.log('[Worker] USE_REDIS_QUEUE is false. Skipping standalone worker process.');
    process.exit(0);
}

// Dynamic import to prevent eager loading of 'worker.js' (which imports BullMQ)
// This ensures that in memory mode, BullMQ code is never executed in this process.
import('./queue/worker.js').then(() => {
    console.log('[Worker] Worker process logic loaded (Redis Mode).');
}).catch(err => {
    console.error('[Worker] Failed to load worker logic:', err);
    process.exit(1);
});
