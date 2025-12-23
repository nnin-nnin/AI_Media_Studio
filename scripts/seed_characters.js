import prisma from '../src/server/db/database.js';
import logger from '../src/server/utils/logger.js';

async function seedCharacters() {
    console.log("🌱 Seeding Anime Characters...");

    const characters = [
        {
            name: "敖丙 (Aobing)",
            voice_id: "cosyvoice-v3-plus-myvoice-1a34e653693d459f99599e1f9ea61826",
            description: "温润如玉的仙子之音，展现东海太子的文雅气质。",
            avatar: "http://localhost:3000/uploads/avatar_aobing.png"
        },
        {
            name: "海绵宝宝 (SpongeBob)",
            voice_id: "cosyvoice-v3-plus-myvoice-45d959a519c447f9a7b7984130a3e316",
            description: "充满阳光与活力的声音，时刻准备好开始新的一天！",
            avatar: "http://localhost:3000/uploads/avatar_haimian.png"
        },
        {
            name: "哪吒 (Nezha)",
            voice_id: "cosyvoice-v3-plus-myvoice-2a9a9a4287a0435aa27e6b16143bdf48",
            description: "灵动活泼的童声，展现小英雄的不羁与纯真。",
            avatar: "http://localhost:3000/uploads/avatar_nezha.png"
        },
        {
            name: "熊二 (Xiong Er)",
            voice_id: "cosyvoice-v3-plus-myvoice-241c583daa93472fb5c2030aced758d5",
            description: "憨厚老实的男中音，虽然有点小迷糊，但非常有爱心。",
        },
        {
            name: "孙悟空 (Wukong)",
            voice_id: "cosyvoice-v3-plus-myvoice-c640996fb279445d996ece4b95cf039f",
            description: "齐天大圣，火眼金睛，声音充满自信与霸气。",
            avatar: "http://localhost:3000/uploads/avatar_wukong.png"
        },
        {
            name: "猪八戒 (Bajie)",
            voice_id: "cosyvoice-v3-plus-myvoice-89ace754ace042a79f833dab5aaa5a0a",
            description: "天蓬元帅，贪吃懒做但心地善良，声音憨厚有趣。",
            avatar: "http://localhost:3000/uploads/avatar_bajie.png"
        }
    ];

    for (const char of characters) {
        await prisma.character.upsert({
            where: { name: char.name },
            update: char,
            create: char
        });
        console.log(`✅ Character [${char.name}] synced.`);
    }

    console.log("✨ Seeding Complete!");
    process.exit(0);
}

seedCharacters().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
