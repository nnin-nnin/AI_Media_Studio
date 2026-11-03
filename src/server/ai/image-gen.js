// image-gen.js
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import axios from "axios"; // 仅用于把返回的URL落盘

// 动态获取 OpenAI (Ark) 客户端，支持运行时热更新 API Key 且不在启动时崩溃
function getArkClient() {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error("未配置 ARK_API_KEY，请点击页面左下角【⚙️ API 配置】填写密钥");
  }
  return new OpenAI({
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: apiKey,
  });
}


// 图生图（image-to-image）
// 支持传本地文件路径或已经是 dataURL 的字符串
export async function imageToImage({
  prompt,
  image,
  model = "doubao-seedream-4-0-250828",
  strength = 0.75,
  watermark = false,
  saveTo,
}) {
  const client = getArkClient();
  console.log("Image原图为...", image);
  const resp = await client.images.generate({
    model,
    prompt,
    image: image,
    strength: strength,
    watermark: watermark,
  });
  if (!resp.data || !resp.data[0] || !resp.data[0].url) {
    console.error("AI Response missing URL:", JSON.stringify(resp, null, 2));
  }
  const url = resp.data[0]?.url;
  if (saveTo && url) await download(url, saveTo);
  return url;
}



async function download(url, outPath) {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, data);
}