// ai-service.js
// 直接在主进程中调用AI功能，避免子进程通信开销

import { imageToImage } from './image-gen.js';
import { generateVideo } from './video-gen.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from "openai";
import axios from "axios";
import logger from '../utils/logger.js';
import VoiceService from './voice-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getUploadsDir() {
  return process.env.UPLOADS_DIR || (process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, '..', '..', '..', 'data', 'uploads'));
}

// 动态获取 Ark OpenAI 客户端，支持在网页端热更新 API Key 后立即生效
function getArkClient() {
  const currentKey = process.env.ARK_API_KEY;
  if (!currentKey) {
    throw new Error("未配置【火山方舟 API Key (ARK_API_KEY)】，无法生成图片或视频。\n获取方式：\n1. 访问火山方舟控制台：https://console.volcengine.com/ark\n2. 在「API Key 管理」中创建密钥 (sk-...)；\n3. 点击软件左下角【服务配置】填入保存即可。");
  }
  return new OpenAI({
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: currentKey,
  });
}

if (!process.env.ARK_API_KEY) {
  console.warn("[AIService] WARNING: ARK_API_KEY is missing! Configure it via the web UI settings.");
} else {
  console.log("[AIService] ARK_API_KEY found.");
}

/**
 * AI服务类，封装所有AI功能调用
 */
class AIService {
  /**
   * 生成图片
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 结果对象
   */
  static async generateImage(options) {
    try {
      const imageUrl = await this.textToImage(options);

      if (!imageUrl) throw new Error("AI service returned an empty URL");
      return {
        status: 'success',
        image_url: imageUrl
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * 文本到图像生成
   * @param {Object} options - 生成选项
   * @returns {Promise<string>} 图像URL
   */
  static async textToImage(options) {
    const {
      prompt,
      model = "doubao-seedream-4-0-250828",
      width = 1024,
      height = 1024,
      saveTo
    } = options;

    const arkClient = getArkClient();
    const resp = await arkClient.images.generate({
      model,
      prompt,
      n: 1,
      size: `${width}x${height}`
    });

    const url = resp.data[0].url;
    if (saveTo) await this.download(url, saveTo);
    return url;
  }

  /**
   * 下载文件
   * @param {string} url - 文件URL
   * @param {string} outPath - 保存路径
   */
  static async download(url, outPath) {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, data);
  }

  /**
   * 编辑图片
   * @param {Object} options - 编辑选项
   * @returns {Promise<Object>} 结果对象
   */
  static async editImage(options) {
    const imageUrl = await imageToImage(options);

    if (!imageUrl) throw new Error("AI service returned an empty URL");
    return {
      status: 'success',
      image_url: imageUrl
    };
  }

  /**
   * 生成视频
   * @param {Object} options - 视频生成选项
   * @returns {Promise<Object>} 结果对象
   */
  static async generateVideo(options) {
    try {
      const fileName = `video_${Date.now()}.mp4`;
      const outPath = path.join(getUploadsDir(), fileName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      // Inject the calculated output_path into options
      const videoResult = await generateVideo({
        ...options,
        output_path: outPath
      });

      if (!videoResult) throw new Error("AI service returned an empty result");

      // If generateVideo returned a path that is our outPath, return the public URL
      return {
        status: 'success',
        video_url: `/uploads/${fileName}`
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * 克隆声音
   * @param {Object} options - 声音克隆选项
   * @returns {Promise<Object>} 结果对象
   */
  static async cloneVoice(options) {
    const requiredEnvs = ["DASHSCOPE_API_KEY"];

    const envStatus = {};
    requiredEnvs.forEach(key => {
      envStatus[key] = process.env[key] ? 'PRESENT' : 'MISSING';
    });

    console.log("[AIService] Voice Generation Env Check:", JSON.stringify(envStatus, null, 2));

    const mode = options.mode || 'clone';
    const voiceId = options.voiceId;

    // Path A: Pure Text-to-Speech using a preset voiceId
    if (mode === 'text' && voiceId) {
      console.log(`[AIService] Mode=Text. Using preset voice synthesis for ID: ${voiceId}`);
      return await this.generateCharacterSpeech(voiceId, options.text, options);
    }

    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    // Only switch to mock if EVERYTHING is missing AND we are in debug mode.
    // If the user has some keys, they probably want the real thing.
    if (missingEnvs.length === requiredEnvs.length && process.env.DEBUG === 'true') {
      console.log("[AIService] All credentials missing & DEBUG=true. Falling back to Mock Mode.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        status: 'success',
        isMock: true,
        audio_url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3"
      };
    }

    if (missingEnvs.length > 0) {
      throw new Error(`Missing required environment variables for real voice cloning: ${missingEnvs.join(', ')}. Please check your terminal environment.`);
    }

    try {
      // 创建临时音频文件
      const tempDir = path.join(__dirname, '..', '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 从数据URL提取音频数据
      const audioDataUrl = options.audio;
      const audioBuffer = this.dataURLToBuffer(audioDataUrl);

      // 保存音频到临时文件
      const audioExt = this.getAudioExtension(audioDataUrl);
      let audioFilePath = path.join(tempDir, `input_audio_${Date.now()}.${audioExt}`);
      fs.writeFileSync(audioFilePath, audioBuffer);

      // --- Normalize Audio if ffmpeg is available ---
      try {
        const inputStats = fs.statSync(audioFilePath);
        console.log(`[AIService] Input audio size: ${inputStats.size} bytes`);

        const normalizedPath = path.join(tempDir, `norm_audio_${Date.now()}.wav`);
        await this.convertToStandardWav(audioFilePath, normalizedPath);

        if (fs.existsSync(normalizedPath)) {
          const normStats = fs.statSync(normalizedPath);
          console.log(`[AIService] Normalized WAV size: ${normStats.size} bytes`);

          if (normStats.size < 1000) {
            console.warn("[AIService] WARNING: Normalized audio is suspiciously small!");
          }

          fs.unlinkSync(audioFilePath); // Remove original dirty format
          audioFilePath = normalizedPath;
          console.log("[AIService] Audio normalized to WAV via ffmpeg");
        }
      } catch (normErr) {
        console.warn("[AIService] Audio normalization failed, using raw file:", normErr.message);
      }

      // 生成输出文件路径（直接保存到 data/uploads 避免大体积 Base64 往返传输）
      const outputFileName = `voice_${Date.now()}.mp3`;
      const uploadsDir = getUploadsDir();
      fs.mkdirSync(uploadsDir, { recursive: true });
      const outputFilePath = path.join(uploadsDir, outputFileName);

      // 1. 上传音频获取公网访问 URL
      console.log(`[AIService] Uploading audio sample...`);
      const audioUrl = await VoiceService.uploadToCos(audioFilePath);
      console.log(`[AIService] Uploaded audio sample: ${audioUrl}`);

      // 2. 调用阿里百炼 CosyVoice 声音克隆服务训练音色
      const model = options.model || 'cosyvoice-v2';
      const voiceId = await VoiceService.enrollVoice(audioUrl, model);
      console.log(`[AIService] Voice enrolled successfully. Voice ID: ${voiceId}`);

      // 3. 若传入试听文本，立即合成样音
      let publicAudioUrl = '';
      if (options.text) {
        const synthRes = await VoiceService.synthesizeSpeech({
          voiceId,
          text: options.text,
          outputPath: outputFilePath
        });
        if (synthRes.status === 'success' && fs.existsSync(outputFilePath)) {
          publicAudioUrl = `/uploads/${outputFileName}`;
        }
      }

      // 清理临时输入文件
      if (fs.existsSync(audioFilePath)) {
        try { fs.unlinkSync(audioFilePath); } catch {}
      }

      return {
        status: 'success',
        audio_url: publicAudioUrl,
        voice_id: voiceId
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * 将数据URL转换为Buffer
   * @param {string} dataUrl - 数据URL
   * @returns {Buffer} 数据Buffer
   */
  static dataURLToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('无效的数据URL格式');
    }
    return Buffer.from(matches[2], 'base64');
  }

  /**
   * 获取音频文件扩展名
   * @param {string} dataUrl - 数据URL
   * @returns {string} 扩展名
   */
  static getAudioExtension(dataUrl) {
    if (dataUrl.startsWith('data:audio/wav')) return 'wav';
    if (dataUrl.startsWith('data:audio/mp3')) return 'mp3';
    if (dataUrl.startsWith('data:audio/mpeg')) return 'mp3';
    if (dataUrl.startsWith('data:audio/webm')) return 'webm';
    if (dataUrl.startsWith('data:audio/ogg')) return 'ogg';
    // Fallback for generic audio type
    if (dataUrl.includes('audio/webm')) return 'webm';
    return 'wav'; // Default fallback
  }

  /**
   * 使用ffmpeg将音频转换为标准WAV格式 (16k, mono)
   */
  static async convertToStandardWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      // -ar 16000 (Sample Rate 16k)
      // -ac 1 (Mono)
      // -y (Overwrite)
      const args = ['-i', inputPath, '-ar', '16000', '-ac', '1', '-y', outputPath];
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => stderr += data.toString());

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed (code ${code}): ${stderr}`));
      });

      ffmpeg.on('error', (err) => reject(err));
    });
  }

  /**
   * Character Speech Generation (TTS)
   * Pure Node.js implementation calling Volcengine OpenSpeech / DashScope or gracefully falling back to Edge-TTS / Web Speech API
   */
  static async generateCharacterSpeech(voiceId, text, options = {}) {
    const fileName = `chat_${Date.now()}.mp3`;
    const outPath = path.join(getUploadsDir(), fileName);

    const synthRes = await VoiceService.synthesizeSpeech({
      voiceId,
      text,
      speed: options.speed || 1.0,
      sampleRate: options.sampleRate || 22050,
      outputPath: outPath
    });

    if (synthRes.status === 'success' && !synthRes.useWebSpeech && fs.existsSync(outPath)) {
      return {
        status: 'success',
        audio_url: `/uploads/${fileName}`
      };
    }

    return {
      status: 'success',
      audio_url: null,
      useWebSpeech: true
    };
  }

  static async speechToText(audioFilePath) {
    return VoiceService.speechToText(audioFilePath);
  }

  /**
   * AI Chat Completion
   * @param {string} prompt - User message
   * @param {string} systemPrompt - System personality
   * @returns {Promise<string>} AI response
   */
  static async chat(prompt, systemPrompt = "You are a helpful AI assistant.") {
    try {
      const arkClient = getArkClient();
      const response = await arkClient.chat.completions.create({
        model: "doubao-1-5-pro-32k-250115", // A common Ark endpoint ID pattern or model name
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Chat Error:", error.message);
      // Fallback for demo: just return original text if LLM fails
      return `AI: ${prompt}`;
    }
  }

  /**
   * 获取可选模型列表（支持分类过滤）
   * @param {string} type - 模型类型: 'image', 'video', 'audio', or null for all
   * @returns {Promise<Object>} 结果对象
   */
  static async listModels(type = null) {
    try {
      console.log(`Fetching ${type || 'all'} models from Ark API...`);
      const arkClient = getArkClient();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("ARK API Timeout")), 5000)
      );

      const response = await Promise.race([
        arkClient.models.list(),
        timeoutPromise
      ]);

      console.log("Ark API response received:", !!response);

      let models = response.data.map(m => ({
        id: m.id,
        name: m.id
      }));

      // 按类型过滤 (Filter by type)
      if (type) {
        const filters = {
          'image': ['seedream', 'seededit', 'cv-', 'image'],
          'video': ['seedance', 'video'],
          'audio': ['cosyvoice', 'voice', 'audio']
        };
        const keywords = filters[type] || [];
        models = models.filter(m =>
          keywords.some(kw => m.id.toLowerCase().includes(kw))
        );
      }

      return {
        status: 'success',
        models
      };
    } catch (error) {
      console.error("List Models Error:", error.message);

      // Fallback: 根据类型返回过滤后的默认值
      const allFallbacks = [
        { id: "doubao-seedream-4-0-250828", name: "Doubao Image (Seedream 4.0 通用稳定版)", type: 'image' },
        { id: "doubao-seedream-5-0-260128", name: "Doubao Image (Seedream 5.0 旗舰版)", type: 'image' },
        { id: "doubao-seedance-1-0-pro-fast-251015", name: "Doubao Video (Seedance 1.0 Fast 极速版)", type: 'video' },
        { id: "doubao-seedance-2-0-fast-260128", name: "Doubao Video (Seedance 2.0 Fast 旗舰版)", type: 'video' },
        { id: "cosyvoice-v3", name: "CosyVoice V3 (标准语音)", type: 'audio' }
      ];

      const filteredFallbacks = type
        ? allFallbacks.filter(m => m.type === type)
        : allFallbacks;

      return {
        status: 'success',
        models: filteredFallbacks.map(({ id, name }) => ({ id, name })),
        warning: "Failed to fetch remote models, using defaults."
      };
    }
  }
}

export default AIService;