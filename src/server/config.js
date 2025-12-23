import 'dotenv/config';

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
        tokenExpiry: '7d'
    },
    db: {
        path: getEnv('DB_PATH', false, 'data/ai_course.sqlite')
    },
    ai: {
        arkApiKey: getEnv('ARK_API_KEY', false, '') || getEnv('DECART_API_KEY', false, ''), // Support both for now
        dashscopeApiKey: getEnv('DASHSCOPE_API_KEY', false, ''),
        tencent: {
            secretId: getEnv('TENCENT_SECRET_ID', false, ''),
            secretKey: getEnv('TENCENT_SECRET_KEY', false, ''),
            bucket: getEnv('TENCENT_COS_BUCKET', false, ''),
            region: getEnv('TENCENT_COS_REGION', false, 'ap-beijing')
        }
    }
};

// Check for missing AI keys in production
if (config.env === 'production') {
    if (!config.ai.arkApiKey) console.warn("WARN: ARK_API_KEY missing - AI features will fail.");
}

export default config;
