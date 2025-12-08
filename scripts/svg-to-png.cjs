const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// SVG to PNG 轉換配置
const SIZES = [16, 48, 128, 256];
const SVG_SOURCE = path.join(__dirname, '../icons/tr.svg');
const OUTPUT_DIR = path.join(__dirname, '../icons');

/**
 * 使用 ImageMagick 將 SVG 轉換為 PNG
 * @param {number} size - 輸出圖片大小
 */
async function convertSvgToPng(size) {
  const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
  
  // 使用 ImageMagick 的 convert 指令
  const command = `magick convert -background none -density 300 -resize ${size}x${size} "${SVG_SOURCE}" "${outputFile}"`;
  
  try {
    console.log(`正在轉換 ${size}x${size} PNG...`);
    await execAsync(command);
    console.log(`✓ 已生成: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`✗ 轉換 ${size}x${size} 失敗:`, error.message);
    return false;
  }
}

/**
 * 使用 sharp (備選方案 - 更輕量級)
 */
async function convertSvgToPngSharp(size) {
  try {
    const sharp = require('sharp');
    const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    console.log(`正在轉換 ${size}x${size} PNG...`);
    
    await sharp(SVG_SOURCE, { density: 300 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputFile);
    
    console.log(`✓ 已生成: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`✗ 轉換 ${size}x${size} 失敗:`, error.message);
    return false;
  }
}

/**
 * 使用 Inkscape 進行轉換 (最高品質)
 */
async function convertSvgToPngInkscape(size) {
  const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
  
  // Inkscape 指令
  const command = `inkscape --export-filename="${outputFile}" --export-width=${size} --export-height=${size} --export-background-opacity=0 "${SVG_SOURCE}"`;
  
  try {
    console.log(`正在轉換 ${size}x${size} PNG...`);
    await execAsync(command);
    console.log(`✓ 已生成: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`✗ 轉換 ${size}x${size} 失敗:`, error.message);
    return false;
  }
}

/**
 * 主程式 - 自動選擇最佳可用工具
 */
async function main() {
  console.log('🎨 SVG to PNG 轉換工具\n');
  console.log(`來源: ${SVG_SOURCE}`);
  console.log(`輸出目錄: ${OUTPUT_DIR}`);
  console.log(`轉換大小: ${SIZES.join(', ')}px\n`);
  
  // 檢查 SVG 檔案是否存在
  if (!fs.existsSync(SVG_SOURCE)) {
    console.error(`✗ 錯誤: SVG 檔案不存在: ${SVG_SOURCE}`);
    process.exit(1);
  }
  
  let results = [];
  let converter = null;
  
  // 嘗試使用 Inkscape (最高品質，適合擴展程式)
  try {
    console.log('正在檢查 Inkscape...');
    await execAsync('inkscape --version');
    console.log('✓ 偵測到 Inkscape\n');
    converter = convertSvgToPngInkscape;
  } catch (e) {
    // 嘗試使用 ImageMagick
    try {
      console.log('正在檢查 ImageMagick...');
      await execAsync('magick -version');
      console.log('✓ 偵測到 ImageMagick\n');
      converter = convertSvgToPng;
    } catch (e2) {
      // 使用 sharp (需要 npm install sharp)
      try {
        console.log('正在檢查 sharp...');
        require.resolve('sharp');
        console.log('✓ 偵測到 sharp\n');
        converter = convertSvgToPngSharp;
      } catch (e3) {
        console.error('✗ 錯誤: 找不到可用的轉換工具');
        console.error('  請安裝以下其中之一:');
        console.error('  1. Inkscape: https://inkscape.org/');
        console.error('  2. ImageMagick: https://imagemagick.org/');
        console.error('  3. sharp: npm install sharp');
        process.exit(1);
      }
    }
  }
  
  // 轉換所有大小
  for (const size of SIZES) {
    const success = await converter(size);
    results.push({ size, success });
  }
  
  // 顯示總結
  console.log('\n📊 轉換結果:');
  const successCount = results.filter(r => r.success).length;
  console.log(`成功: ${successCount}/${results.length}`);
  
  if (successCount === results.length) {
    console.log('\n✓ 所有轉換完成！');
    process.exit(0);
  } else {
    console.log('\n✗ 部分轉換失敗');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('✗ 致命錯誤:', err);
  process.exit(1);
});
