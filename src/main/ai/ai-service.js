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
const apiKey = process.env.ARK_API_KEY;
if (!apiKey) {
  throw new Error("请设置 ARK_API_KEY 环境变量");
}

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
      const videoUrl = await generateVideo(options);

      return {
        status: 'success',
        video_url: videoUrl
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
      const audioFilePath = path.join(tempDir, `input_audio_${Date.now()}.${audioExt}`);
      fs.writeFileSync(audioFilePath, audioBuffer);

      // 生成输出文件路径
      const outputFilePath = path.join(tempDir, `output_voice_${Date.now()}.mp3`);

      // 获取Python脚本路径
      const scriptPath = path.join(__dirname, 'voice-clone.py');

      // 检查Python脚本是否存在
      if (!fs.existsSync(scriptPath)) {
        throw new Error('声音克隆脚本不存在');
      }

      // 使用虚拟环境中的Python
      const venvPythonPath = path.join(__dirname, '..', '..', '..', '.venv', 'bin', 'python');
      const pythonPath = fs.existsSync(venvPythonPath) ? venvPythonPath : (process.env.PYTHON_PATH || 'python3');

      const args = [scriptPath, audioFilePath, options.text, outputFilePath];

      const result = await this.executePythonScript(pythonPath, args);

      if (result.status === 'success') {
        // 读取生成的音频文件并转换为数据URL
        if (fs.existsSync(outputFilePath)) {
          const outputBuffer = fs.readFileSync(outputFilePath);
          const outputDataUrl = `data:audio/mpeg;base64,${outputBuffer.toString('base64')}`;

          // 清理临时文件
          fs.unlinkSync(audioFilePath);
          fs.unlinkSync(outputFilePath);

          return {
            status: 'success',
            audio_url: outputDataUrl
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
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
    return 'wav'; // 默认
  }

  /**
   * 执行Python脚本
   * @param {string} command - 命令
   * @param {Array} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  static executePythonScript(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);

      let stdoutData = '';
      let stderrData = '';

      process.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      process.on('close', (code) => {
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
          resolve({
            status: 'error',
            message: `Python脚本执行失败: ${stderrData || '未知错误'}`
          });
        }
      });

      process.on('error', (error) => {
        reject({
          status: 'error',
          message: `执行Python脚本时出错: ${error.message}`
        });
      });
    });
  }
}

export default AIService;