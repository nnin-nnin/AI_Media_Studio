import prisma from '../src/server/db/database.js';

export async function seedCharacters() {
    console.log("🌱 Seeding Anime Characters...");

    const characters = [
        {
            name: "敖丙 (Aobing)",
            voice_id: "zh_male_shaonian_mars_bigtts",
            description: "温润如玉的仙子之音，展现东海太子的文雅气质。",
            avatar: "/system/avatars/avatar_aobing.png"
        },
        {
            name: "海绵宝宝 (SpongeBob)",
            voice_id: "zh_female_shuangkuai_mars_bigtts",
            description: "充满阳光与活力的声音，时刻准备好开始新的一天！",
            avatar: "/system/avatars/avatar_haimian.png"
        },
        {
            name: "哪吒 (Nezha)",
            voice_id: "zh_female_tianmei_mars_bigtts",
            description: "灵动活泼的童声，展现小英雄的不羁与纯真。",
            avatar: "/system/avatars/avatar_nezha.png"
        },
        {
            name: "熊二 (Xiong Er)",
            voice_id: "zh_male_chunhou_mars_bigtts",
            description: "憨厚老实的男中音，虽然有点小迷糊，但非常有爱心。",
            avatar: "/system/avatars/avatar_xionger.png"
        },
        {
            name: "孙悟空 (Wukong)",
            voice_id: "zh_male_sunwukong_mars_bigtts",
            description: "齐天大圣，火眼金睛，声音充满自信与霸气。",
            avatar: "/system/avatars/avatar_wukong.png"
        },
        {
            name: "猪八戒 (Bajie)",
            voice_id: "zh_male_zhubajie_mars_bigtts",
            description: "天蓬元帅，贪吃懒做但心地善良，声音憨厚有趣。",
            avatar: "/system/avatars/avatar_bajie.png"
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
}
