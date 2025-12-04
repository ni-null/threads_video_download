// Threads Video Downloader - 主入口檔案
// 所有模組已透過 manifest.json 載入

(function() {
  // 等待所有模組載入完成
  if (!window.ThreadsDownloaderUtils || 
      !window.ThreadsDownloaderButton) {
    console.error('[Threads Downloader] 模組載入失敗，請檢查 manifest.json 中的載入順序');
    return;
  }

  const { logDebug } = window.ThreadsDownloaderUtils;
  const { addDownloadButtons } = window.ThreadsDownloaderButton;
  
  logDebug('Content script starting...');
  
  // 定期檢查並添加下載按鈕
  setInterval(addDownloadButtons, 1000);
  
  // 初始添加 - 多次嘗試確保載入
  setTimeout(addDownloadButtons, 500);
  setTimeout(addDownloadButtons, 1500);
  setTimeout(addDownloadButtons, 3000);
  
  // 如果頁面已經載入完成，立即執行
  if (document.readyState === 'complete') {
    logDebug('Document already loaded, adding buttons immediately');
    addDownloadButtons();
  }
  
  console.log('Threads Downloader content script loaded');
  logDebug('Content script fully loaded and ready');
})();
