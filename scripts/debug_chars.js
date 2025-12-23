import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const chars = await prisma.character.findMany();
    console.log(JSON.stringify(chars, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
