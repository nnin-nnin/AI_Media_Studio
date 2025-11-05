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

import { textToImage } from "./image-gen.js";

async function main() {
  try {
    // 生成图片
    const imageUrl = await textToImage({
      prompt: "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬",
      size: "2K",
      model: "doubao-seedream-4-0-250828"
    });
    
    // 以 JSON 格式输出结果，便于前端解析
    const result = {
      status: "success",
      image_url: imageUrl
    };
    console.log(JSON.stringify(result));
    
  } catch (error) {
    // 以 JSON 格式输出错误信息
    const errorResult = {
      status: "error",
      message: error.message
    };
    console.log(JSON.stringify(errorResult));
    
    console.error(`\n❌ 图片生成过程中出现错误: ${error.message}`);
    process.exit(1);
  }
}

main();