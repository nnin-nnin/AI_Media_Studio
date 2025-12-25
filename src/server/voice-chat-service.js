import prisma from './db/database.js';
import AIService from './ai/ai-service.js';
import logger from './utils/logger.js';

class VoiceChatService {
    async listCharacters() {
        return prisma.character.findMany();
    }

    async generateCharacterVoice(characterId, text, options = {}) {
        const character = await prisma.character.findUnique({
            where: { id: parseInt(characterId) }
        });

        if (!character) {
            throw new Error("Character not found");
        }

        logger.info("Character Voice Read-back", {
            character: character.name,
            text: text,
            options: options
        });

        // Simply generate Speech for the user's text (Parrot Mode)
        const result = await AIService.generateCharacterSpeech(character.voice_id, text, options);

        return {
            ...result,
            characterName: character.name,
            text: text
        };
    }

    async createCharacter(data) {
        const { name, voice_id, avatar, description } = data;
        return prisma.character.create({
            data: {
                name,
                voice_id,
                avatar: avatar || '/assets/system/avatars/avatar_default.png',
                description: description || 'User cloned voice'
            }
        });
    }
}

export default new VoiceChatService();
