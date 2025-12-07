# release.ps1 - 一鍵發布腳本

Write-Host "🚀 開始發布流程..." -ForegroundColor Green

# 清理舊的構建
Write-Host "`n📁 步驟 1: 清理舊的構建..." -ForegroundColor Yellow
npm run clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 清理失敗" -ForegroundColor Red
    exit 1
}

# 構建新版本
Write-Host "`n📦 步驟 2: 構建新版本..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 構建失敗" -ForegroundColor Red
    exit 1
}

# 檢查 product 資料夾是否存在
if (-not (Test-Path ".\product")) {
    Write-Host "❌ product 資料夾不存在" -ForegroundColor Red
    exit 1
}

# 獲取版本號
if (Test-Path ".\product\manifest.json") {
    $manifest = Get-Content .\product\manifest.json | ConvertFrom-Json
    $version = $manifest.version
}
else {
    Write-Host "❌ manifest.json 不存在" -ForegroundColor Red
    exit 1
}

# 壓縮
Write-Host "`n📦 步驟 3: 壓縮為 ZIP..." -ForegroundColor Yellow
$zipName = "threads-video-downloader-v$version.zip"

# 刪除舊的 ZIP（如果存在）
if (Test-Path ".\$zipName") {
    Remove-Item ".\$zipName" -Force
}

Compress-Archive -Path .\product\* -DestinationPath ".\$zipName" -Force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 壓縮失敗" -ForegroundColor Red
    exit 1
}

# 顯示檔案大小
$zipSize = (Get-Item ".\$zipName").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "`n✅ 發布完成！" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 檔案名稱: $zipName" -ForegroundColor Cyan
Write-Host "📊 檔案大小: $zipSizeMB MB" -ForegroundColor Cyan
Write-Host "📂 位置: $(Get-Location)\$zipName" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`n📤 下一步:" -ForegroundColor Yellow
Write-Host "   1. 前往 Chrome Web Store Developer Dashboard" -ForegroundColor White
Write-Host "      https://chrome.google.com/webstore/devconsole/" -ForegroundColor Gray
Write-Host "   2. 上傳 $zipName" -ForegroundColor White
Write-Host "   3. 填寫商店資訊並提交審核" -ForegroundColor White
Write-Host ""
