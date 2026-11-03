import prisma from './db/database.js';
import AIService from './ai/ai-service.js';
import logger from './utils/logger.js';

class VoiceChatService {
    async listCharacters(category = null) {
        if (category) {
            return prisma.character.findMany({
                where: { category }
            });
        }
        return prisma.character.findMany();
    }

    async generateCharacterVoice(characterId, text, options = {}) {
        const character = await prisma.character.findUnique({
            where: { id: parseInt(characterId) }
        });

        if (!character) {
            throw new Error("Character not found");
        }

        logger.info("Character Voice Generation", {
            character: character.name,
            text: text,
            options: options
        });

        let spokenText = text;
        if (options.useLLM !== false) {
            const systemPrompt = `You are roleplaying as ${character.name} (${character.description || 'a friendly character'}). Keep your reply natural, in-character, and concise (1-2 sentences) suitable for spoken voice output.`;
            const aiReply = await AIService.chat(text, systemPrompt);
            if (aiReply && !aiReply.startsWith('AI: ')) {
                spokenText = aiReply;
            }
        }

        const result = await AIService.generateCharacterSpeech(character.voice_id, spokenText, options);

        return {
            ...result,
            characterName: character.name,
            text: spokenText
        };
    }

    async createCharacter(data) {
        const { name, voice_id, avatar, description, category } = data;
        return prisma.character.create({
            data: {
                name,
                voice_id,
                avatar: avatar || '/assets/system/avatars/avatar_default.png',
                description: description || 'User cloned voice',
                category: category || 'system'
            }
        });
    }
}

export default new VoiceChatService();
