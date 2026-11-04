import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDashScopeVoice(rawVoice) {
    const v = (rawVoice || '').toLowerCase();
    if (rawVoice && (rawVoice.startsWith('cosyvoice-') || rawVoice.startsWith('myvoice') || rawVoice.startsWith('voice_'))) {
        return rawVoice;
    }
    const map = {
        'wukong': 'longshuo',       // 磁性成熟男声 / 齐天大圣
        'bajie': 'longyuan',        // 幽默圆润男声 / 猪八戒
        'nezha': 'longmiao',        // 灵动少年音 / 哪吒
        'aobing': 'longfei',        // 清亮温润公子 / 敖丙
        'haimian': 'longxiaocheng', // 欢快搞怪童声 / 海绵宝宝
        'xionger': 'longhua'        // 憨厚男声 / 熊二
    };
    for (const [k, val] of Object.entries(map)) {
        if (v.includes(k)) return val;
    }
    return 'longxiaochun'; // 默认阿里原厂高保真女声
}

function resolvePythonBinary() {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const candidates = [
        path.join(projectRoot, '.venv', 'bin', 'python'),
        path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
        path.join(process.cwd(), '.venv', 'bin', 'python'),
        path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
        process.env.PYTHON_PATH,
        '/opt/homebrew/bin/python3',
        '/usr/local/bin/python3',
        'python3',
        'python'
    ].filter(Boolean);

    for (const c of candidates) {
        if (c.includes(path.sep) && fs.existsSync(c)) return c;
    }
    return 'python3';
}

/**
 * Pure Node.js Voice Service
 * Completely replaces legacy Python scripts (voice-clone.py, tts_helper.py, asr_helper.py)
 * Eliminates Python & FFmpeg external runtime dependencies for 100% pure JS portability.
 */
class VoiceService {
    /**
     * Deprecated stub for previous COS audio upload
     * @param {string} localFilePath 
     * @returns {Promise<string>} public URL
     */
    static async uploadToCos(localFilePath) {
        throw new Error('腾讯云 COS 已在全新火山引擎架构中彻底弃用。请使用系统内置的火山 OpenSpeech 语音合成引擎。');
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
            throw new Error('未配置【阿里云百炼 API Key (DASHSCOPE_API_KEY)】，无法进行声音克隆。\n获取方式：\n1. 访问阿里云百炼控制台：https://bailian.console.aliyun.com/\n2. 点击右上角创建 API-Key (sk-...)；\n3. 点击软件左下角【服务配置】填入保存即可。');
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
     * Synthesize speech using Aliyun DashScope CosyVoice
     * @param {Object} options 
     * @returns {Promise<Object>} { status, audioBuffer, useWebSpeech, engine }
     */
    static async synthesizeSpeech({ voiceId, text, speed = 1.0, sampleRate = 22050, outputPath }) {
        const dashscopeKey = process.env.DASHSCOPE_API_KEY;
        if (!dashscopeKey) {
            throw new Error('未配置【阿里云百炼 API Key (DASHSCOPE_API_KEY)】，无法进行语音合成。\n获取方式：\n1. 访问阿里云百炼控制台：https://bailian.console.aliyun.com/\n2. 点击右上角创建 API-Key (sk-...)；\n3. 点击软件左下角【服务配置】填入保存即可。');
        }

        try {
            const voice = resolveDashScopeVoice(voiceId);
            const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';
            const payload = {
                model: 'cosyvoice-v2',
                input: { text },
                parameters: {
                    voice: voice,
                    speech_rate: speed,
                    sample_rate: sampleRate,
                    format: 'mp3'
                }
            };
            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${dashscopeKey}`,
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
                useWebSpeech: false,
                engine: 'dashscope'
            };
        } catch (err) {
            const errDetail = err.response?.data ? Buffer.from(err.response.data).toString() : err.message;
            console.error('[VoiceService] DashScope CosyVoice synthesis failed:', errDetail);
            throw new Error(`阿里云百炼语音合成失败: ${err.message}`);
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
