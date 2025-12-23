import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

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

