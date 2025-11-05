#!/usr/bin/env node

// 检查环境变量
if (!process.env.ARK_API_KEY) {
  const result = {
    status: "error",
    message: "请设置 ARK_API_KEY 环境变量"
  };
  console.log(JSON.stringify(result));
  console.error("❌ 错误：请设置 ARK_API_KEY 环境变量");
  console.error("您可以使用 export ARK_API_KEY='your_api_key_here' 命令设置");
  process.exit(1);
}

import { generateVideo } from "./video-gen.js";
import path from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    // 你的"落日飞车 / citypop / 蓝粉色主调 / 拼贴艺术 / 70s复古"故事：
    const prompt = (
      "A retro 1970s citypop animation of a car driving along a seaside highway at sunset. " +
      "The camera moves slowly forward and sideways, showing the glowing coastline, pink-blue sky, " +
      "a distant futuristic city skyline, and gentle ocean waves reflecting neon light. " +
      "Stars begin to appear in the dusk sky. " +
      "The mood is dreamy, nostalgic, and warm — like a citypop album cover brought to life. " +
      "The art style blends collage, avant-garde experimental composition, and expressive brushwork " +
      "inspired by Käthe Kollwitz, with pastel blue and pink tones, playful retro 70s aesthetics, " +
      "and subtle film grain. " +
      "落日飞车，汽车在海边公路上，水平构图，能看到远方的落日和城市，有星星，海岸线，" +
      "citypop艺术风格，凯特·科洛维茨式的表现力，蓝粉色主调，前卫拼贴艺术。"
    );

    // 生成视频
    const videoUrl = await generateVideo({
      prompt: prompt,
      model: "doubao-seedance-1-0-pro-fast-251015",  // 你的可用模型
      image_url: null,          // 如果你有参考首帧图可放公网URL；否则 null
      duration: 5,              // fast 模型安全时长
      resolution: "1080p",      // "720p" / "1080p" / "2K"
      loop: true,
      camera_move: "forward-slow",
      watermark: false,
      output_path: path.join(__dirname, "sunset_road.mp4"),
      poll_interval: 3,
    });
    
    if (videoUrl) {
      // 以 JSON 格式输出结果，便于前端解析
      const result = {
        status: "success",
        video_url: videoUrl
      };
      console.log(JSON.stringify(result));
    } else {
      // 以 JSON 格式输出错误信息
      const errorResult = {
        status: "error",
        message: "视频生成失败"
      };
      console.log(JSON.stringify(errorResult));
      process.exit(1);
    }
    
  } catch (error) {
    // 以 JSON 格式输出错误信息
    const errorResult = {
      status: "error",
      message: error.message
    };
    console.log(JSON.stringify(errorResult));
    
    console.error(`\n❌ 视频生成过程中出现错误: ${error.message}`);
    process.exit(1);
  }
}

main();