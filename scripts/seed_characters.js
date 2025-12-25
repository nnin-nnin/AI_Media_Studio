import prisma from '../src/server/db/database.js';
import logger from '../src/server/utils/logger.js';

async function seedCharacters() {
    console.log("🌱 Seeding Anime Characters...");

    const characters = [
        {
            name: "敖丙 (Aobing)",
            voice_id: "cosyvoice-v3-plus-myvoice-159d5cae740d41688e544d9a24a935eb",
            description: "温润如玉的仙子之音，展现东海太子的文雅气质。",
            avatar: "/assets/system/avatars/avatar_aobing.png"
        },
        {
            name: "海绵宝宝 (SpongeBob)",
            voice_id: "cosyvoice-v3-plus-myvoice-e00438fbb96c4741a5f122baf4266220",
            description: "充满阳光与活力的声音，时刻准备好开始新的一天！",
            avatar: "/assets/system/avatars/avatar_haimian.png"
        },
        {
            name: "哪吒 (Nezha)",
            voice_id: "cosyvoice-v3-plus-myvoice-5a6801b007634a4381a5bc227811dd36",
            description: "灵动活泼的童声，展现小英雄的不羁与纯真。",
            avatar: "/assets/system/avatars/avatar_nezha.png"
        },
        {
            name: "熊二 (Xiong Er)",
            voice_id: "cosyvoice-v3-plus-myvoice-5173c9ba990242db88c24cae7b80e7a2",
            description: "憨厚老实的男中音，虽然有点小迷糊，但非常有爱心。",
            avatar: "/assets/system/avatars/avatar_xionger.png"
        },
        {
            name: "孙悟空 (Wukong)",
            voice_id: "cosyvoice-v3-plus-myvoice-ccb35d98d56d4771802f2d9de424e033",
            description: "齐天大圣，火眼金睛，声音充满自信与霸气。",
            avatar: "/assets/system/avatars/avatar_wukong.png"
        },
        {
            name: "猪八戒 (Bajie)",
            voice_id: "cosyvoice-v3-plus-myvoice-0abc064fa7534e3295adefaa39872454",
            description: "天蓬元帅，贪吃懒做但心地善良，声音憨厚有趣。",
            avatar: "/assets/system/avatars/avatar_bajie.png"
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
