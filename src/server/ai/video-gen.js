// video-gen.js
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";

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
 * Helper for axios calls with retry logic to handle ECONNRESET and transient network errors
 * @param {Object} config - Axios config
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} Axios response
 */
async function axiosWithRetry(config, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios({
        ...config,
        timeout: 60000, // 60s timeout for safety
        headers: {
          ...config.headers,
          'Connection': 'close' // Disable keep-alive to avoid ECONNRESET on stale sockets
        }
      });
    } catch (error) {
      lastError = error;
      const isRetryable = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || (error.response && error.response.status >= 500);

      if (isRetryable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(`⚠️ API call failed (${error.code || (error.response && error.response.status)}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * 生成视频
 * @param {Object} options - 视频生成选项
 * @param {string} options.prompt - 描述你想要的视频画面/风格
 * @param {string} [options.model="doubao-seedance-1-0-pro-fast-251015"] - 模型 ID
 * @param {string} [options.image_url=null] - 可选首帧参考图 URL
 * @param {number} [options.duration=10] - 目标时长(秒)
 * @param {string} [options.resolution="1080p"] - 分辨率
 * @param {boolean} [options.loop=true] - 希望视频可循环衔接
 * @param {string} [options.camera_move="forward-slow"] - 镜头运动
 * @param {boolean} [options.watermark=false] - 是否加水印
 * @param {string} [options.output_path="output_video.mp4"] - 本地保存文件名
 * @param {number} [options.poll_interval=3] - 轮询间隔（秒）
 * @returns {Promise<string|null>} 成功返回视频URL，失败返回null
 */
export async function generateVideo({
  prompt,
  model = "doubao-seedance-1-0-pro-fast-251015",
  image_url = null,
  duration = 10,
  resolution = "720p", // 修改默认分辨率为720p，该模型支持
  loop = true,
  camera_move = "forward-slow",
  watermark = false,
  output_path = "output_video.mp4",
  poll_interval = 3,
}) {
  try {
    // fast 模型时长保护
    const max_supported_for_fast = 5;
    if (model.includes("fast") && duration > max_supported_for_fast) {
      console.error(`⚠️ 模型 ${model} 可能不支持 ${duration}s，已自动降到 ${max_supported_for_fast}s`);
      duration = max_supported_for_fast;
    }

    // 组装最终提示词（控制参数拼在后面）
    const full_prompt = (
      `${prompt} ` +
      `--resolution ${resolution} ` +
      `--duration ${duration} ` +
      `--loop ${String(loop).toLowerCase()} ` +
      `--cameramove ${camera_move} ` +
      `--watermark ${String(watermark).toLowerCase()}`
    );

    console.error("🎬 创建视频生成任务中...");

    // 支持文字 + 可选首帧图
    const content = [{ type: "text", text: full_prompt }];
    if (image_url) {
      content.push({
        type: "image_url",
        image_url: { url: image_url }
      });
    }

    // 创建生成任务 - 使用正确的API调用方式
    console.error("正在调用API创建视频生成任务...");

    // 直接使用axios调用API，而不是OpenAI SDK（因为视频生成API与标准聊天API不同）
    // 使用 axiosWithRetry 增强鲁棒性
    const response = await axiosWithRetry({
      method: 'post',
      url: "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
      data: {
        model: model,
        content: content,
      },
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    // 检查API响应
    if (!response || !response.data) {
      console.error("❌ API调用失败，未返回结果");
      return null;
    }

    console.error("API返回结果:", JSON.stringify(response.data, null, 2));

    // 检查任务ID是否存在
    if (!response.data.id) {
      console.error("❌ API返回结果中未包含任务ID");
      return null;
    }

    const task_id = response.data.id;
    console.error(`✅ 任务已创建，任务ID: ${task_id}`);

    // 轮询
    while (true) {
      // 使用 axiosWithRetry 轮询任务状态
      const statusResponse = await axiosWithRetry({
        method: 'get',
        url: `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${task_id}`,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const result = statusResponse.data;
      const status = result.status;

      if (status === "succeeded") {
        console.error("✅ 视频生成成功！");

        // 获取视频URL
        let video_url = null;
        if (result.content && result.content.video_url) {
          video_url = result.content.video_url;
        }

        if (!video_url) {
          console.error("⚠️ 没拿到视频URL");
          return null;
        }

        console.error(`📹 视频地址: ${video_url}`);

        // 下载保存到本地
        try {
          const downloadResponse = await axiosWithRetry({
            method: 'get',
            url: video_url,
            responseType: "arraybuffer"
          });
          fs.writeFileSync(output_path, downloadResponse.data);
          console.error(`💾 已保存到本地: ${output_path}`);
        } catch (dl_err) {
          console.error("⚠️ 下载失败，但生成成功。请手动用浏览器打开上面的视频URL保存。");
          console.error("下载错误详情:", dl_err);
        }
        if (!video_url) {
          console.error("Video Generation Task Succeeded but NO URL found in result:", JSON.stringify(result, null, 2));
          return null;
        }
        return video_url;

      } else if (status === "failed") {
        console.error("❌ 视频生成失败", JSON.stringify(result, null, 2));
        const failureReason = result.failure_reason || (result.error && result.error.message) || "Unknown failure during video generation";
        throw new Error(failureReason);

      } else {
        console.error(`⌛ 当前状态: ${status}，${poll_interval}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, poll_interval * 1000));
      }
    }
  } catch (error) {
    console.error("视频生成过程中出现错误:", error);
    let errorMsg = error.message;
    // 如果是API错误，输出详细信息
    if (error.response && error.response.data && error.response.data.error) {
      console.error("API错误响应:", error.response.status, error.response.data);
      errorMsg = error.response.data.error.message || errorMsg;
    }
    throw new Error(errorMsg);
  }
}