import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Update Aobing with the working voice ID
    const workingId = "cosyvoice-v3-plus-myvoice-dfdddc3553c047d6964ed5b102499754";
    const updated = await prisma.character.update({
        where: { id: 10 },
        data: { voice_id: workingId }
    });
    console.log(`Updated character ${updated.name} (ID: ${updated.id}) with working voice ID: ${workingId}`);

    // 2. List all characters to verify
    const chars = await prisma.character.findMany();
    console.log("\nCurrent character list:");
    console.log(JSON.stringify(chars, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
