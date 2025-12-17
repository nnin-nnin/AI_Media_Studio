import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

// 获取当前文件的目录
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const inputPath = path.resolve(__dirname, 'src/renderer/styles.css');
const outputPath = path.resolve(__dirname, 'src/renderer/output.css');

// 读取输入CSS文件
const css = fs.readFileSync(inputPath, 'utf8');

// 处理CSS
postcss([
  tailwindcss(),
  autoprefixer
])
.process(css, { from: inputPath, to: outputPath })
.then(result => {
  fs.writeFileSync(outputPath, result.css);
  console.log('Build complete.');
})
.catch(err => {
  console.error(err);
  process.exit(1);
});