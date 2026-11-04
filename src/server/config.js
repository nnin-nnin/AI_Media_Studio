import dotenv from 'dotenv';
import fs from 'fs';

// If ENV_FILE_PATH is set (e.g. Electron desktop user data), strictly load from user config.
// Otherwise, fall back to standard project .env in development.
if (process.env.ENV_FILE_PATH) {
    if (fs.existsSync(process.env.ENV_FILE_PATH)) {
        dotenv.config({ path: process.env.ENV_FILE_PATH });
    }
} else {
    dotenv.config();
}

const getEnv = (key, required = false, fallback = undefined) => {
    const value = process.env[key];
    if (value === undefined) {
        if (required) {
            throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
        }
        return fallback;
    }
    return value;
};

const config = {
    env: getEnv('NODE_ENV', false, 'development'),
    debug: getEnv('DEBUG', false, 'false') === 'true',
    port: parseInt(getEnv('PORT', false, '3000'), 10),
    auth: {
        // Only require JWT_SECRET in production. In dev, use a fallback if missing.
        jwtSecret: process.env.NODE_ENV === 'production'
            ? getEnv('JWT_SECRET', true)
            : (getEnv('JWT_SECRET', false) || 'dev-unsafe-secret'),
        tokenExpiry: '7d',
        skipAuth: getEnv('SKIP_AUTH', false, 'false') === 'true'
    },
    db: {
        path: getEnv('DB_PATH', false, 'data/ai_course.sqlite')
    },
    ai: {
        arkApiKey: getEnv('ARK_API_KEY', false, ''),
        decartApiKey: getEnv('DECART_API_KEY', false, ''),
        dashscopeApiKey: getEnv('DASHSCOPE_API_KEY', false, '')
    }
};

// Check for missing AI keys in production
if (config.env === 'production') {
    if (!config.ai.arkApiKey) console.warn("WARN: ARK_API_KEY missing - AI features will fail.");
}

export default config;
