// 網絡請求攔截模組
// 此模組用於攔截並捕獲 Threads 頁面上的影片網絡請求
window.ThreadsDownloaderNetwork = window.ThreadsDownloaderNetwork || {};

/**
 * 設置網絡攔截器 - 核心方法 ✅ (被 content.js 使用)
 * 
 * 功能：攔截頁面上的所有網絡請求，自動檢測並收集影片 URL
 * 使用兩種攔截方式：
 *   1. Fetch API 攔截 - 捕獲使用 fetch() 發起的請求
 *   2. XMLHttpRequest 攔截 - 捕獲使用 XHR 發起的請求
 * 
 * @param {Array} mediaItems - 媒體項目陣列的引用，用於儲存檢測到的影片資訊
 * 
 * 呼叫位置：content.js (第 25 行)
 * 呼叫方式：setupNetworkInterceptors(mediaItems);
 */
window.ThreadsDownloaderNetwork.setupNetworkInterceptors = function(mediaItems) {
  const { logDebug, updatePopup } = window.ThreadsDownloaderUtils;
  
  // ===== 方法 1: Fetch API 攔截器 ===== ✅ 有效
  // 用途：攔截 Threads 使用 fetch() 載入的影片資源
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const promise = originalFetch.apply(this, args);
    
    // 檢查 URL 是否包含影片相關的關鍵字
    const url = args[0];
    if (typeof url === 'string' && (
      url.includes('video') || 
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.mov') ||
      url.includes('.m3u8') ||
      url.includes('playback')
    )) {
      promise.then(response => {
        const contentType = response.headers.get('content-type') || '';
        // 確認回應是影片類型
        if (contentType.includes('video') || url.includes('.mp4') || url.includes('.webm')) {
          const mediaUrl = response.url || url;
          
          // 避免重複添加相同的影片 URL
          if (!mediaItems.some(item => item.url === mediaUrl)) {
            mediaItems.push({
              url: mediaUrl,
              type: 'video',
              timestamp: new Date().toLocaleTimeString()
            });
            logDebug('Video detected via Fetch:', mediaUrl);
            console.log('🎥 Video detected via Fetch:', mediaUrl);
            updatePopup(mediaItems);
          }
        }
      }).catch(() => {});
    }
    
    return promise;
  };
  
  // ===== 方法 2: XMLHttpRequest 攔截器 ===== ✅ 有效
  // 用途：攔截使用舊式 XHR API 載入的影片資源（提供額外覆蓋）
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string' && (
      url.includes('video') || 
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('playback')
    )) {
      this.addEventListener('load', function() {
        try {
          const contentType = this.getResponseHeader('content-type') || '';
          // 確認回應是影片類型
          if (contentType.includes('video') || url.includes('.mp4') || url.includes('.webm')) {
            // 避免重複添加相同的影片 URL
            if (!mediaItems.some(item => item.url === url)) {
              mediaItems.push({
                url: url,
                type: 'video',
                timestamp: new Date().toLocaleTimeString()
              });
              logDebug('Video detected via XHR:', url);
              console.log('🎥 Video detected via XHR:', url);
              updatePopup(mediaItems);
            }
          }
        } catch (e) {
          // 靜默處理錯誤，避免影響正常請求
        }
      });
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };
};
