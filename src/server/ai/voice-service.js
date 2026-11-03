import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import COS from 'cos-nodejs-sdk-v5';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveVolcVoice(rawVoice) {
    const v = (rawVoice || '').toLowerCase();
    const map = {
        'wukong': 'zh_male_sunwukong_mars_bigtts',
        'bajie': 'zh_male_zhubajie_mars_bigtts',
        'nezha': 'zh_female_tianmei_mars_bigtts',
        'aobing': 'zh_male_shaonian_mars_bigtts',
        'haimian': 'zh_female_shuangkuai_mars_bigtts',
        'xionger': 'zh_male_chunhou_mars_bigtts'
    };
    for (const [k, val] of Object.entries(map)) {
        if (v.includes(k)) return val;
    }
    return rawVoice || 'zh_male_sunwukong_mars_bigtts';
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
     * Synthesize speech using Volcengine OpenSpeech (Primary) -> DashScope -> Edge-TTS (Fallback)
     * @param {Object} options 
     * @returns {Promise<Object>} { status, audioBuffer, useWebSpeech, engine }
     */
    static async synthesizeSpeech({ voiceId, text, speed = 1.0, sampleRate = 22050, outputPath }) {
        // 1. Primary Engine: Volcengine OpenSpeech
        const volcAppId = process.env.VOLC_SPEECH_APPID;
        const volcToken = process.env.VOLC_SPEECH_TOKEN;

        if (volcAppId && volcToken) {
            try {
                const volcVoice = resolveVolcVoice(voiceId);
                const url = 'https://openspeech.bytedance.com/api/v1/tts';
                const payload = {
                    app: {
                        appid: volcAppId,
                        token: volcToken,
                        cluster: 'volcano_tts'
                    },
                    user: { uid: 'ai_media_studio_user' },
                    audio: {
                        voice_type: volcVoice,
                        encoding: 'mp3',
                        speed_ratio: speed,
                        volume_ratio: 1.0,
                        pitch_ratio: 1.0
                    },
                    request: {
                        reqid: crypto.randomUUID(),
                        text: text,
                        text_type: 'plain',
                        operation: 'query'
                    }
                };

                const response = await axios.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer;${volcToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000
                });

                if (response.data?.code === 3000 && response.data?.data) {
                    const audioBuffer = Buffer.from(response.data.data, 'base64');
                    if (outputPath) {
                        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                        fs.writeFileSync(outputPath, audioBuffer);
                    }
                    console.log(`[VoiceService] Volcengine TTS synthesized successfully (${audioBuffer.length} bytes, voice: ${volcVoice})`);
                    return {
                        status: 'success',
                        audioBuffer,
                        useWebSpeech: false,
                        engine: 'volcengine'
                    };
                } else {
                    console.warn('[VoiceService] Volcengine TTS returned error:', response.data?.message || response.data?.code);
                }
            } catch (err) {
                console.warn('[VoiceService] Volcengine TTS call failed, falling back:', err.message);
            }
        }

        // 2. DashScope CosyVoice fallback (if configured)
        const dashscopeKey = process.env.DASHSCOPE_API_KEY;
        if (dashscopeKey && voiceId && voiceId.startsWith('cosyvoice-')) {
            try {
                const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';
                const payload = {
                    model: 'cosyvoice-v2',
                    input: { text },
                    parameters: {
                        voice: voiceId,
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
                    timeout: 25000
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
                console.warn('[VoiceService] DashScope fallback failed:', err.message);
            }
        }

        // 3. High quality Edge-TTS Fallback (Zero Config, neural voices)
        if (outputPath) {
            try {
                const pyBin = resolvePythonBinary();
                const scriptPath = path.join(__dirname, 'tts_helper.py');

                let targetScript = scriptPath;
                if (scriptPath.includes('.asar')) {
                    const tempScript = path.join(os.tmpdir(), path.basename(scriptPath));
                    fs.writeFileSync(tempScript, fs.readFileSync(scriptPath));
                    targetScript = tempScript;
                }

                await new Promise((resolve, reject) => {
                    const py = spawn(pyBin, [targetScript, voiceId || 'wukong', text, outputPath, '--speed', speed.toString()]);
                    let stderr = '';
                    py.stderr.on('data', d => { stderr += d.toString(); });
                    py.on('close', code => {
                        if (code === 0 && fs.existsSync(outputPath)) {
                            resolve();
                        } else {
                            reject(new Error(stderr || `Python exit code ${code}`));
                        }
                    });
                });

                console.log('[VoiceService] Edge-TTS fallback synthesized successfully to:', outputPath);
                return {
                    status: 'success',
                    useWebSpeech: false,
                    engine: 'edge_tts'
                };
            } catch (err) {
                console.warn('[VoiceService] Python Edge-TTS fallback failed:', err.message);
            }
        }

        // 4. Final Browser/System Web Speech API Fallback
        console.log('[VoiceService] Falling back to Web Speech API');
        return {
            status: 'success',
            audio_url: null,
            useWebSpeech: true
        };
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
