const levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const currentLevel = process.env.DEBUG === 'true' ? levels.DEBUG : levels.INFO;

const formatMessage = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
    });
};

const logger = {
    debug: (message, meta = {}) => {
        if (currentLevel <= levels.DEBUG) {
            console.debug(formatMessage('DEBUG', message, meta));
        }
    },
    info: (message, meta = {}) => {
        if (currentLevel <= levels.INFO) {
            console.log(formatMessage('INFO', message, meta));
        }
    },
    warn: (message, meta = {}) => {
        if (currentLevel <= levels.WARN) {
            console.warn(formatMessage('WARN', message, meta));
        }
    },
    error: (message, meta = {}) => {
        if (currentLevel <= levels.ERROR) {
            console.error(formatMessage('ERROR', message, meta));
        }
    }
};

export default logger;
