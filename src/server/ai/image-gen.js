// image-gen.js
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import axios from "axios"; // 仅用于把返回的URL落盘

// 从环境变量中获取API密钥，如果未设置则抛出错误
const apiKey = process.env.ARK_API_KEY;
if (!apiKey) {
  throw new Error("请设置 ARK_API_KEY 环境变量");
}

const client = new OpenAI({
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  apiKey: apiKey,
});


// 图生图（image-to-image）
// 支持传本地文件路径或已经是 dataURL 的字符串
export async function imageToImage({
  prompt,
  image,
  model = "doubao-seedream-4-0-250828",
  watermark = false,
  saveTo,
}) {
  console.log("Image原图为...", image);
  const resp = await client.images.generate({
    model,
    prompt,
    image: image,
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