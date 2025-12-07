import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const productDir = path.join(rootDir, 'product');

console.log('🧹 清理 product 資料夾...');

// 刪除整個 product 資料夾
if (fs.existsSync(productDir)) {
  fs.rmSync(productDir, { recursive: true, force: true });
  console.log('✅ product 資料夾已清空');
} else {
  console.log('ℹ️  product 資料夾不存在，跳過清理');
}

console.log('✨ 清理完成');
