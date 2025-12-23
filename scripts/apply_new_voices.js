import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const jsonPath = path.join(process.cwd(), 'scripts', 'new_voices.json');

async function main() {
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: ${jsonPath} not found. Please run scripts/bulk_enroll_voices.py first.`);
        process.exit(1);
    }

    const newVoices = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`Loaded ${newVoices.length} new voice mappings.`);

    for (const voice of newVoices) {
        const { char_name_part, voice_id } = voice;

        // Find character by partial name match
        const characters = await prisma.character.findMany({
            where: {
                name: {
                    contains: char_name_part
                }
            }
        });

        if (characters.length > 0) {
            for (const char of characters) {
                await prisma.character.update({
                    where: { id: char.id },
                    data: { voice_id: voice_id }
                });
                console.log(`✅ Updated character: ${char.name} (ID: ${char.id}) -> ${voice_id}`);
            }
        } else {
            console.warn(`⚠️ No character found matching: ${char_name_part}`);
        }
    }

    console.log('\nAll updates completed.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
