import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('./generated/client/index.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');
const defaultDbPath = path.join(projectRoot, 'data', 'ai_course.sqlite');

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${defaultDbPath}`;
}

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function connect() {
    try {
        await prisma.$connect();
        logger.info("[Database] Prisma Connected");
    } catch (e) {
        logger.error("[Database] Connection Failed", e);
    }
}

connect();

export default prisma;

