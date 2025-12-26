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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从环境变量中获取API密钥，如果未设置则抛出错误
console.log("[AIService] Checking ARK_API_KEY...");
const apiKey = process.env.ARK_API_KEY;
if (!apiKey) {
  console.error("[AIService] CRITICAL ERROR: ARK_API_KEY is missing!");
  throw new Error("请设置 ARK_API_KEY 环境变量");
}
console.log("[AIService] ARK_API_KEY found.");

const client = new OpenAI({
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  apiKey: apiKey,
});

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
      model = "ep-20250209095657-p2j9r",
      width = 1024,
      height = 1024,
      saveTo
    } = options;

    const resp = await client.images.generate({
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
      const outPath = path.join(__dirname, '..', '..', '..', 'data', 'uploads', fileName);
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
    // Standard names used in our scripts
    const requiredEnvs = ["DASHSCOPE_API_KEY", "TENCENT_SECRET_ID", "TENCENT_SECRET_KEY", "TENCENT_COS_BUCKET"];

    // Mapping for alternative names (e.g. TENCENTCLOUD_ prefix is official)
    const aliases = {
      "TENCENT_SECRET_ID": ["TENCENTCLOUD_SECRET_ID"],
      "TENCENT_SECRET_KEY": ["TENCENTCLOUD_SECRET_KEY"]
    };

    // Fill missing ones from aliases
    requiredEnvs.forEach(key => {
      if (!process.env[key] && aliases[key]) {
        const alias = aliases[key].find(a => process.env[a]);
        if (alias) {
          process.env[key] = process.env[alias];
          console.log(`[AIService] Environment: Aliasing ${alias} -> ${key}`);
        }
      }
    });

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

      // 生成输出文件路径
      const outputFilePath = path.join(tempDir, `output_voice_${Date.now()}.mp3`);

      // 获取Python脚本路径
      const scriptPath = path.join(__dirname, 'voice-clone.py');

      // 检查Python脚本是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error('声音克隆脚本不存在: ' + scriptPath);
      }

      // 使用虚拟环境中的Python
      const venvPythonPath = path.join(__dirname, '..', '..', '..', '.venv', 'bin', 'python');
      const pythonPath = fs.existsSync(venvPythonPath) ? venvPythonPath : (process.env.PYTHON_PATH || 'python3');

      // Add model to arguments if provided
      const model = options.model || 'cosyvoice-v2';
      const args = [scriptPath, audioFilePath, options.text, outputFilePath, `--model=${model}`];

      console.log(`[AIService] Starting real Voice Cloning with Python: ${pythonPath}`);
      const result = await this.executePythonScript(pythonPath, args);

      if (result.status === 'success') {
        // 读取生成的音频文件并转换为数据URL
        if (fs.existsSync(outputFilePath)) {
          const outputBuffer = fs.readFileSync(outputFilePath);
          const outputDataUrl = `data:audio/mpeg;base64,${outputBuffer.toString('base64')}`;

          // 清理临时文件
          fs.unlinkSync(audioFilePath);
          fs.unlinkSync(outputFilePath);

          console.log("Voice Cloning Succeeded, returning audio data URL (length: " + outputDataUrl.length + ")");
          return {
            status: 'success',
            audio_url: outputDataUrl,
            voice_id: result.voice_id
          };
        } else {
          throw new Error('音频文件生成失败');
        }
      } else {
        throw new Error(result.message);
      }
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
   * 执行Python脚本
   * @param {string} command - 命令 (已弃用，强制使用 python3)
   * @param {Array} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  static async executePythonScript(command, args) {
    return new Promise((resolve, reject) => {
      // In development, we use 'uv run' to ensure the correct environment
      // In production, we might use a specific python path
      let pythonPath = 'uv';
      let combinedArgs = ['run', '--project', path.join(__dirname, '..', '..', '..'), command || 'python3', ...args];

      console.log(`[AIService] Spawning via UV: ${pythonPath} ${combinedArgs.join(' ')}`);

      console.log(`[AIService] Spawning via UV: ${pythonPath} ${combinedArgs.join(' ')}`);

      // Determine if we need a CLEAN environment (no proxy)
      // Voice Cloning (voice-clone.py) uses WebSocket and often fails with proxy
      // Other scripts (like asr_helper.py) generally use HTTP REST and might REQUIRE proxy
      const isVoiceClone = args.some(arg => arg && arg.includes('voice-clone.py'));

      let spawnEnv = { ...process.env };

      if (isVoiceClone) {
        console.log("[AIService] Detected Voice Cloning: Stripping Proxy Env Vars to ensure WebSocket stability.");
        delete spawnEnv.HTTP_PROXY;
        delete spawnEnv.HTTPS_PROXY;
        delete spawnEnv.ALL_PROXY;
        delete spawnEnv.http_proxy;
        delete spawnEnv.https_proxy;
        delete spawnEnv.all_proxy;
      } else {
        console.log(`[AIService] Standard Execution (Proxy retained if present)`);
      }

      const pyProcess = spawn(pythonPath, combinedArgs, {
        env: spawnEnv,
      });

      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pyProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // 尝试解析stdout中的JSON结果
            const result = JSON.parse(stdoutData.trim());
            resolve(result);
          } catch (e) {
            // 如果解析失败，返回原始数据
            resolve({
              status: 'success',
              raw_output: stdoutData,
              raw_error: stderrData
            });
          }
        } else {
          console.error(`[AIService] Python script failed with code ${code}. Stderr: ${stderrData}`);
          resolve({
            status: 'error',
            message: `Python脚本执行失败: ${stderrData || '未知错误'}`
          });
        }
      });

      pyProcess.on('error', (error) => {
        reject({
          status: 'error',
          message: `执行Python脚本时出错: ${error.message}`
        });
      });
    });
  }

  /**
   * Character Speech Generation (TTS)
   * Calls DashScope (or similar) using a specific voice_id
   */
  static async generateCharacterSpeech(voiceId, text, options = {}) {
    try {
      const fileName = `chat_${Date.now()}.mp3`;
      const outPath = path.join(__dirname, '..', '..', '..', 'data', 'uploads', fileName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const scriptPath = path.join(__dirname, 'tts_helper.py');
      const args = [scriptPath, voiceId, text, outPath];

      if (options.speed) {
        args.push('--speed', options.speed.toString());
      }
      if (options.sampleRate) {
        args.push('--sample_rate', options.sampleRate.toString());
      }

      const result = await this.executePythonScript('python3', args);

      if (result.status === 'success') {
        return {
          status: 'success',
          audio_url: `/uploads/${fileName}`
        };
      } else {
        throw new Error(result.message || 'TTS generation failed');
      }
    } catch (error) {
      console.error("Character TTS Error:", error.message);
      throw error;
    }
  }

  static async speechToText(audioFilePath) {
    try {
      const scriptPath = path.join(__dirname, 'asr_helper.py');
      // Use python3 or a configured path
      const result = await this.executePythonScript('python3', [scriptPath, audioFilePath]);

      if (result.status === 'success') {
        return {
          status: 'success',
          text: result.text
        };
      } else {
        throw new Error(result.message || 'Speech recognition failed');
      }
    } catch (error) {
      console.error("ASR Error:", error.message);
      throw error;
    }
  }

  /**
   * AI Chat Completion
   * @param {string} prompt - User message
   * @param {string} systemPrompt - System personality
   * @returns {Promise<string>} AI response
   */
  static async chat(prompt, systemPrompt = "You are a helpful AI assistant.") {
    try {
      const response = await client.chat.completions.create({
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("ARK API Timeout")), 5000)
      );

      const response = await Promise.race([
        client.models.list(),
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
        { id: "doubao-seedream-4-0-250828", name: "Doubao Image (Seedream 4.0)", type: 'image' },
        { id: "doubao-seedance-1-0-pro-fast-251015", name: "Doubao Video (Seedance 1.0 Fast)", type: 'video' },
        { id: "cosyvoice-v3", name: "CosyVoice V3 (Standard)", type: 'audio' }
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