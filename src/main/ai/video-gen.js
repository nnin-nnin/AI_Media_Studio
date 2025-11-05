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
  resolution = "1080p",
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

    // 创建生成任务
    const create_result = await client.contentGeneration.tasks.create({
      model: model,
      content: content,
    });

    const task_id = create_result.id;
    console.error(`✅ 任务已创建，任务ID: ${task_id}`);

    // 轮询
    while (true) {
      const result = await client.contentGeneration.tasks.get({ task_id: task_id });
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
          const response = await axios.get(video_url, { responseType: "arraybuffer" });
          fs.writeFileSync(output_path, response.data);
          console.error(`💾 已保存到本地: ${output_path}`);
        } catch (dl_err) {
          console.error("⚠️ 下载失败，但生成成功。请手动用浏览器打开上面的视频URL保存。");
          console.error("下载错误详情:", dl_err);
        }

        return video_url;

      } else if (status === "failed") {
        console.error("❌ 视频生成失败");
        console.error("错误信息: ", result);
        return null;

      } else {
        console.error(`⌛ 当前状态: ${status}，${poll_interval}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, poll_interval * 1000));
      }
    }
  } catch (error) {
    console.error("视频生成过程中出现错误:", error);
    return null;
  }
}