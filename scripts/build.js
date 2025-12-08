import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { build } from "esbuild"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, "..")
const productDir = path.join(rootDir, "product")

// 需要壓縮的 JS 檔案
const jsFiles = ["background.js", "content.js", "popup.js", "modules/utils.js", "modules/filename-generator.js", "modules/media-extractor.js", "modules/download-button.js", "modules/media-position-finder.js", "modules/media-overlay-button.js"]

// 需要直接複製的靜態檔案和資料夾
const staticFiles = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "privacy-policy.html",
  "lib/jszip.min.js", // 第三方庫，已經是壓縮版
]

const staticDirs = ["icons", "image", "_locales", "lib"]

console.log("🚀 開始構建發布版本...\n")

// 步驟 1: 清理 product 資料夾
console.log("📁 步驟 1: 清理 product 資料夾")
if (fs.existsSync(productDir)) {
  fs.rmSync(productDir, { recursive: true, force: true })
  console.log("   ✅ 已清空 product 資料夾")
}
fs.mkdirSync(productDir, { recursive: true })
console.log("   ✅ 已創建 product 資料夾\n")

// 步驟 2: 壓縮 JS 檔案
console.log("📦 步驟 2: 壓縮 JS 檔案")
for (const jsFile of jsFiles) {
  const inputPath = path.join(rootDir, jsFile)
  const outputPath = path.join(productDir, jsFile)
  const outputDir = path.dirname(outputPath)

  // 確保輸出目錄存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  try {
    // 先讀取原始代碼並移除 debug 日誌
    let sourceCode = fs.readFileSync(inputPath, "utf-8")
    sourceCode = removeDebugLogs(sourceCode)

    // 將處理後的代碼寫入臨時檔案
    const tempPath = outputPath + ".temp.js"
    fs.writeFileSync(tempPath, sourceCode)

    // 使用 esbuild 進行壓縮
    await build({
      entryPoints: [tempPath],
      bundle: false, // 不打包，保持原有結構
      minify: true, // 壓縮
      target: "es2020",
      format: "iife", // 立即執行函數
      outfile: outputPath,
      write: true, // 直接寫入
    }).then(() => {

      // 刪除臨時檔案
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }

      console.log(`   ✅ ${jsFile}`)
    })
  } catch (error) {
    console.error(`   ❌ ${jsFile} 處理失敗:`, error.message)
    process.exit(1)
  }
}
console.log("")

// 步驟 3: 複製靜態檔案
console.log("📋 步驟 3: 複製靜態檔案")
for (const file of staticFiles) {
  const sourcePath = path.join(rootDir, file)
  const destPath = path.join(productDir, file)
  const destDir = path.dirname(destPath)

  if (fs.existsSync(sourcePath)) {
    // 確保目標目錄存在
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    fs.copyFileSync(sourcePath, destPath)
    console.log(`   ✅ ${file}`)
  } else {
    console.warn(`   ⚠️  ${file} 不存在，跳過`)
  }
}
console.log("")

// 步驟 4: 複製靜態資料夾
console.log("📂 步驟 4: 複製靜態資料夾")
for (const dir of staticDirs) {
  const sourcePath = path.join(rootDir, dir)
  const destPath = path.join(productDir, dir)

  if (fs.existsSync(sourcePath)) {
    copyDirRecursive(sourcePath, destPath)
    console.log(`   ✅ ${dir}/`)
  } else {
    console.warn(`   ⚠️  ${dir}/ 不存在，跳過`)
  }
}
console.log("")

// 步驟 5: 計算檔案大小
console.log("📊 步驟 5: 統計資訊")
const totalSize = getDirSize(productDir)
const filesTotalSize = getTotalFileSize(rootDir, [...jsFiles, ...staticFiles])
console.log(`   原始 JS 檔案大小: ${formatSize(filesTotalSize)}`)
console.log(`   產品資料夾總大小: ${formatSize(totalSize)}`)
console.log(`   壓縮率: ${((1 - totalSize / filesTotalSize) * 100).toFixed(1)}%`)
console.log("")

console.log("✨ 構建完成！發布檔案位於: product/")
console.log("📦 現在可以將 product/ 資料夾打包為 .zip 檔案並上傳到 Chrome Web Store\n")

// ========== 輔助函數 ==========

/**
 * 移除 debug 日誌 (在壓縮之前處理原始碼)
 */
function removeDebugLogs(code) {
  // 移除 logDebug() 整行調用
  code = code.replace(/^.*logDebug\s*\(.*\)\s*$/gm, "")

  // 移除 console.log 和 console.warn 整行 (保留 console.error)
  code = code.replace(/^.*console\.(log|warn)\s*\(.*\)\s*$/gm, "")

  // 移除多餘的空行
  code = code.replace(/\n\s*\n\s*\n+/g, "\n\n")

  return code
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function getDirSize(dirPath) {
  let totalSize = 0

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      totalSize += getDirSize(fullPath)
    } else {
      totalSize += fs.statSync(fullPath).size
    }
  }

  return totalSize
}

function getTotalFileSize(baseDir, files) {
  let totalSize = 0

  for (const file of files) {
    const filePath = path.join(baseDir, file)
    if (fs.existsSync(filePath)) {
      totalSize += fs.statSync(filePath).size
    }
  }

  return totalSize
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
  return (bytes / (1024 * 1024)).toFixed(2) + " MB"
}
