# 快速開始指南

## 安裝步驟

### Step 1: 打開 Chrome 擴充功能頁面
```
在 Chrome 地址欄輸入並進入：
chrome://extensions/
```

### Step 2: 啟用開發者模式
- 右上角找到「開發人員模式」開關
- 點擊打開（會變成藍色）

### Step 3: 加載外掛
- 點擊左上角的「加載未封裝的擴充功能」
- 選擇 `threads_video_download` 資料夾
- 確認選擇

### Step 4: 驗證安裝
- 擴充功能列表中應該出現「Threads 影片下載器」
- 右上角工具欄應該出現外掛圖標（紫色播放按鈕）

## 使用步驟

### 第一次使用

1. **訪問 Threads**
   ```
   https://www.threads.com/?hl=zh-tw
   ```

2. **打開外掛**
   - 點擊 Chrome 工具欄右上角的外掛圖標
   - 會彈出一個窗口顯示「掃描中...」

3. **瀏覽內容**
   - 滾動 Threads 首頁
   - 外掛會自動檢測頁面上的所有影片和圖片

4. **查看檢測結果**
   - 外掛窗口會實時更新
   - 顯示找到的媒體數量和列表

5. **下載媒體**
   - 📋 複製連結：將 URL 複製到剪貼簿
   - ⬇️ 下載：下載單個檔案
   - 下載全部：一次下載所有檔案

## 問題排除

### Q: 沒有看到外掛圖標？
**A:** 
1. 檢查 `chrome://extensions/` 中外掛是否啟用
2. 刷新外掛（External Extensions 下點擊刷新按鈕）
3. 重啟 Chrome

### Q: 沒有檢測到媒體？
**A:**
1. 確保在 `https://www.threads.com/?hl=zh-tw` 上
2. 打開 F12 開發者工具，檢查 Console（控制台）
3. 應該看到類似 "Threads Downloader content script loaded" 的信息
4. 滾動頁面加載更多內容

### Q: 下載失敗怎麼辦？
**A:**
1. 檢查 Chrome 的下載設置
2. 確保 Downloads 資料夾有寫入權限
3. 某些媒體可能受 CORS 保護，無法直接下載
4. 嘗試在新標籤直接打開 URL

### Q: 如何卸載外掛？
**A:**
1. 進入 `chrome://extensions/`
2. 找到「Threads 影片下載器」
3. 點擊右下角的「移除」按鈕

## 開發者模式提示

### 查看外掛日誌
1. 進入 `chrome://extensions/`
2. 找到「Threads 影片下載器」
3. 點擊「Service Worker」查看背景日誌
4. 或按 F12 在網頁上查看 Content Script 日誌

### 修改代碼後更新外掛
1. 修改任何 JavaScript 文件後
2. 在 `chrome://extensions/` 中點擊 Threads 外掛下的刷新按鈕
3. 刷新 Threads 網頁讓新代碼生效

### 調試技巧

**在頁面控制台中手動測試：**
```javascript
// 查看已檢測到的媒體
console.log(window.ThreadsDownloader.getMediaItems());

// 清除媒體列表
window.ThreadsDownloader.clearMediaItems();

// 查看儲存的資料
chrome.storage.local.get(['mediaItems'], console.log);
```

## 性能優化建議

- 長時間使用可能會積累很多媒體項目
- 定期使用「清除列表」按鈕
- 如果外掛變慢，重新啟用它
- 不瀏覽 Threads 時可以禁用外掛

## 安全性說明

✅ **本外掛是安全的，因為：**
- 代碼完全開源，可以審計
- 只在 `threads.com` 上運行
- 只有複製和下載功能，不會修改網頁內容
- 不會竊取任何個人信息
- 不會與第三方服務器通信

## 更新外掛

未來如有更新：
1. 重新下載最新代碼
2. 在 `chrome://extensions/` 中刷新
3. 或卸載舊版本後重新安裝新版本

---

有任何問題？檢查 README.md 或提交 Issue！
