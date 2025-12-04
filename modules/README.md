# Threads Video Downloader - 模組說明

## 📁 檔案結構

```
modules/
├── utils.js                    # 工具函數模組
├── network-interceptor.js      # 網絡請求攔截模組
├── dom-scanner.js             # DOM 掃描模組
└── download-button.js         # 下載按鈕模組
```

## 🔧 模組說明

### 1. utils.js - 工具函數模組

**命名空間**: `window.ThreadsDownloaderUtils`

**功能**:

- `logDebug(message, data)` - 調試日誌輸出
- `showPageNotification(message)` - 顯示頁面通知
- `updatePopup(mediaItems)` - 更新 popup 數據

---

### 2. network-interceptor.js - 網絡請求攔截模組

**命名空間**: `window.ThreadsDownloaderNetwork`

**功能**:

- `setupNetworkInterceptors(mediaItems)` - 設置 Fetch 和 XHR 攔截器
  - 攔截所有影片相關的網絡請求
  - 自動提取影片 URL

---

### 3. dom-scanner.js - DOM 掃描模組

**命名空間**: `window.ThreadsDownloaderDOM`

**功能**:

- `scanDOM(mediaItems)` - 掃描頁面中的影片元素
  - 掃描 `<video>` 標籤
  - 掃描 `<source>` 標籤
  - 提取縮圖
- `scanForHiddenVideos(mediaItems)` - 掃描隱藏的影片源
  - 檢查 data 屬性
  - 使用 Performance API
- `setupDOMObserver(mediaItems)` - 設置 MutationObserver
  - 監聽 DOM 變化
  - 自動掃描新加入的元素

---

### 4. download-button.js - 下載按鈕模組

**命名空間**: `window.ThreadsDownloaderButton`

**功能**:

- `addDownloadButtons()` - 在貼文旁添加下載按鈕
  - 尋找分享按鈕位置
  - 創建下載按鈕
- `createDownloadButton(btnContainer, postContainer)` - 創建下載按鈕 UI
  - 創建按鈕和下拉選單
  - 處理點擊事件
- `extractVideosFromPost(postContainer)` - 從貼文提取影片
- `updateDownloadMenu(menu, videos)` - 更新下載選單內容
- `downloadVideoFromPage(url, filename)` - 執行下載操作

---

## 🔄 載入順序

在 `manifest.json` 中，檔案按以下順序載入：

```json
"js": [
  "modules/utils.js",              // 1. 先載入工具函數
  "modules/network-interceptor.js", // 2. 網絡攔截器
  "modules/dom-scanner.js",         // 3. DOM 掃描器
  "modules/download-button.js",     // 4. 下載按鈕
  "content.js"                      // 5. 最後載入主程式
]
```

## 💡 使用方式

所有模組透過全域命名空間暴露，避免衝突：

```javascript
// 在 content.js 中使用
const { logDebug, updatePopup } = window.ThreadsDownloaderUtils;
const { setupNetworkInterceptors } = window.ThreadsDownloaderNetwork;
const { scanDOM, setupDOMObserver } = window.ThreadsDownloaderDOM;
const { addDownloadButtons } = window.ThreadsDownloaderButton;
```

## 🎯 設計原則

1. **模組化**: 每個檔案負責單一職責
2. **命名空間**: 使用全域物件避免變數衝突
3. **相依性**: 模組之間透過命名空間互相引用
4. **載入順序**: 依賴的模組必須先載入

## 🔒 為什麼不使用 ES6 模組？

Chrome 擴充功能的 content scripts 不支援 ES6 的 `import/export` 語法，因此使用：

- 全域命名空間 (`window.*`) 來組織代碼
- `manifest.json` 控制載入順序
- 立即執行函數避免污染全域作用域
