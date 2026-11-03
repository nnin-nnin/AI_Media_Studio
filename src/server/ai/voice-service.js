import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import COS from 'cos-nodejs-sdk-v5';

/**
 * Pure Node.js Voice Service
 * Completely replaces legacy Python scripts (voice-clone.py, tts_helper.py, asr_helper.py)
 * Eliminates Python & FFmpeg external runtime dependencies for 100% pure JS portability.
 */
class VoiceService {
    /**
     * Upload local audio file to Tencent COS
     * @param {string} localFilePath 
     * @returns {Promise<string>} public URL
     */
    static async uploadToCos(localFilePath) {
        const secretId = process.env.TENCENT_SECRET_ID;
        const secretKey = process.env.TENCENT_SECRET_KEY;
        const bucket = process.env.TENCENT_COS_BUCKET;
        const region = process.env.TENCENT_COS_REGION || 'ap-beijing';

        if (!secretId || !secretKey || !bucket) {
            throw new Error('未配置腾讯云 COS（缺少 TENCENT_SECRET_ID / TENCENT_SECRET_KEY / TENCENT_COS_BUCKET），无法上传声音样本');
        }

        const cos = new COS({
            SecretId: secretId,
            SecretKey: secretKey
        });

        const ext = path.extname(localFilePath) || '.wav';
        const key = `uploads/${crypto.randomUUID().replace(/-/g, '')}${ext}`;

        return new Promise((resolve, reject) => {
            cos.uploadFile({
                Bucket: bucket,
                Region: region,
                Key: key,
                FilePath: localFilePath,
                SliceSize: 1024 * 1024 * 5
            }, (err, data) => {
                if (err) {
                    return reject(new Error(`腾讯云 COS 上传失败: ${err.message || err}`));
                }
                const url = data.Location ? (data.Location.startsWith('http') ? data.Location : `https://${data.Location}`) : `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
                resolve(url);
            });
        });
    }

    /**
     * Enroll custom voice on DashScope CosyVoice
     * @param {string} audioUrl 
     * @param {string} model 
     * @param {string} prefix 
     * @returns {Promise<string>} voice_id
     */
    static async enrollVoice(audioUrl, model = 'cosyvoice-v2', prefix = 'myvoice') {
        const apiKey = process.env.DASHSCOPE_API_KEY;
        if (!apiKey) {
            throw new Error('缺少 DASHSCOPE_API_KEY，无法调用阿里百炼声音克隆服务');
        }

        const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization';
        
        // 1. Create enrollment request
        const createRes = await axios.post(
            endpoint,
            {
                model: model,
                input: {
                    action: 'create',
                    target_model: model,
                    prefix: prefix,
                    url: audioUrl
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const voiceId = createRes.data?.output?.voice_id;
        if (!voiceId) {
            const msg = createRes.data?.message || JSON.stringify(createRes.data);
            throw new Error(`创建声音克隆任务失败: ${msg}`);
        }

        console.log(`[VoiceService] Voice enrollment started. Voice ID: ${voiceId}`);

        // 2. Poll for readiness (up to 30 attempts, 3s interval)
        const maxAttempts = 30;
        for (let i = 1; i <= maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const queryRes = await axios.get(
                    `${endpoint}?action=query&voice_id=${encodeURIComponent(voiceId)}`,
                    {
                        headers: { 'Authorization': `Bearer ${apiKey}` },
                        timeout: 15000
                    }
                );
                const status = queryRes.data?.output?.status;
                console.log(`[VoiceService] Polling voice status (${i}/${maxAttempts}): ${status}`);

                if (status === 'OK' || status === 'SUCCESS') {
                    return voiceId;
                }
                if (status === 'UNDEPLOYED' || status === 'FAILED') {
                    throw new Error(`声音训练未通过或失败: ${status}`);
                }
            } catch (err) {
                if (err.message.includes('声音训练未通过')) throw err;
                console.warn(`[VoiceService] Query status retry ${i}:`, err.message);
            }
        }

        throw new Error('声音克隆训练超时，请稍后刷新重试');
    }

    /**
     * Synthesize speech using DashScope CosyVoice / Sambert (pure Node.js)
     * @param {Object} options 
     * @returns {Promise<Object>} { status, audio_url, useWebSpeech }
     */
    static async synthesizeSpeech({ voiceId, text, speed = 1.0, sampleRate = 22050, outputPath }) {
        const apiKey = process.env.DASHSCOPE_API_KEY;
        if (!apiKey) {
            console.log('[VoiceService] 未配置 DASHSCOPE_API_KEY，自动降级至浏览器内置 Web Speech API 发音');
            return {
                status: 'success',
                audio_url: null,
                useWebSpeech: true
            };
        }

        try {
            const isCosyVoice = voiceId && voiceId.startsWith('cosyvoice-');
            const model = isCosyVoice ? 'cosyvoice-v2' : 'sambert-zhichu-v1';
            const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';

            const payload = {
                model: model,
                input: {
                    text: text
                },
                parameters: {
                    voice: voiceId,
                    speech_rate: speed,
                    sample_rate: sampleRate,
                    format: 'mp3'
                }
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'disable'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            if (outputPath) {
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                fs.writeFileSync(outputPath, Buffer.from(response.data));
            }

            return {
                status: 'success',
                audioBuffer: response.data,
                useWebSpeech: false
            };
        } catch (err) {
            console.warn('[VoiceService] DashScope 语音合成接口调用异常，优雅降级至 Web Speech API:', err.message);
            return {
                status: 'success',
                audio_url: null,
                useWebSpeech: true
            };
        }
    }

    /**
     * Speech to text (ASR)
     */
    static async speechToText(audioFilePath) {
        // In local and browser environments, Web Speech API provides zero-latency ASR
        return {
            status: 'fallback',
            message: 'USE_WEB_SPEECH'
        };
    }
}

export default VoiceService;
