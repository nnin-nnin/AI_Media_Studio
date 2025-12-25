// Redis connection configuration
import IORedis from 'ioredis';
import config from '../config.js';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required by BullMQ
};

// Create a reused connection for the Queue (Producer)
// Only create if we are NOT in memory mode (default is Redis mode unless explicitly false)
const shouldConnect = process.env.USE_REDIS_QUEUE !== 'false';

export const connection = shouldConnect ? new IORedis(redisConfig) : null;

if (!shouldConnect) {
    console.log('[Redis] Connection skipped (Memory Mode active).');
}

export default redisConfig;
