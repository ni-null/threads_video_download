document.addEventListener('DOMContentLoaded', () => {
  const mediaList = document.getElementById('mediaList');
  const refreshBtn = document.getElementById('refreshBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusText = document.getElementById('statusText');
  const mediaCount = document.getElementById('mediaCount');
  const debugInfo = document.getElementById('debugInfo');
  
  let currentMediaItems = [];
  
  // 調試日誌函數
  function logDebug(message, data = null) {
    const logMsg = '[DEBUG-POPUP] ' + message + (data ? ' ' + JSON.stringify(data) : '');
    console.log(logMsg);
    if (debugInfo) {
      debugInfo.textContent = 'Debug: ' + message;
    }
  }
  
  logDebug('Popup initialized');
  
  // 載入儲存的媒體資料
  function loadMediaData() {
    logDebug('Loading from storage...');
    chrome.storage.local.get(['mediaItems'], (result) => {
      logDebug('Storage result:', result);
      currentMediaItems = result.mediaItems || [];
      logDebug('Loaded items from storage:', currentMediaItems.length);
      displayMediaItems();
    });
  }
  
  // 從 content script 獲取媒體資料
  function fetchMediaFromContent() {
    logDebug('Fetching from content script...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      logDebug('Active tabs:', tabs);
      if (!tabs[0]) {
        logDebug('No active tab found');
        loadMediaData();
        return;
      }
      
      logDebug('Sending message to tab:', tabs[0].id);
      try {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'getMedia' },
          (response) => {
            logDebug('Response received:', response);
            
            // 檢查是否有錯誤
            if (chrome.runtime.lastError) {
              logDebug('Runtime error:', chrome.runtime.lastError.message);
              loadMediaData();
              return;
            }
            
            // 檢查是否收到回應
            if (response && response.mediaItems && Array.isArray(response.mediaItems)) {
              logDebug('Valid response, items:', response.mediaItems.length);
              currentMediaItems = response.mediaItems;
              chrome.storage.local.set({ mediaItems: currentMediaItems });
              displayMediaItems();
            } else {
              logDebug('Invalid response structure:', response);
              loadMediaData();
            }
          }
        );
      } catch (error) {
        logDebug('Error sending message:', error.message);
        loadMediaData();
      }
    });
  }
  
  // 顯示媒體項目
  function displayMediaItems() {
    logDebug('Displaying items. Total:', currentMediaItems.length);
    
    // 只顯示影片
    const videoItems = currentMediaItems.filter(item => item.type === 'video');
    
    mediaList.innerHTML = '';
    mediaCount.textContent = videoItems.length;
    
    if (videoItems.length === 0) {
      logDebug('No video items to display');
      statusText.textContent = '未檢測到影片，請播放影片或滾動頁面';
      mediaList.innerHTML = '<p class="empty">暫無影片項目<br><small>提示：請在 Threads 上播放影片</small></p>';
      downloadAllBtn.disabled = true;
      return;
    }
    
    logDebug('Rendering', videoItems.length, 'video items');
    statusText.textContent = `已檢測到 ${videoItems.length} 個影片`;
    downloadAllBtn.disabled = false;
    
    videoItems.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'media-item';
      
      const typeIcon = '🎥';
      const typeLabel = '影片';
      
      // 提取檔案名
      let filename = 'video';
      try {
        const url = new URL(item.url);
        const pathname = url.pathname;
        filename = pathname.split('/').pop() || `video_${index}`;
      } catch (e) {
        filename = `video_${index}`;
      }
      
      const urlDisplay = item.url.length > 50 
        ? item.url.substring(0, 47) + '...' 
        : item.url;
      
      // 創建縮圖 - 使用 canvas 截取影片第一幀
      const thumbnailId = `thumbnail-${index}`;
      const thumbnailHtml = `
        <div class="video-thumbnail-container">
          <canvas id="${thumbnailId}" class="video-thumbnail" width="80" height="80"></canvas>
          <div class="video-thumbnail-placeholder">🎬</div>
        </div>
      `;
      
      div.innerHTML = `
        ${thumbnailHtml}
        <div class="media-info">
          <div class="media-header">
            <span class="media-type">${typeIcon} ${typeLabel}</span>
            <span class="media-time">${item.timestamp || ''}</span>
          </div>
          <div class="media-url" title="${item.url}">${urlDisplay}</div>
        </div>
        <div class="media-actions">
          <button class="btn-action btn-download" data-index="${index}" title="下載">⬇️</button>
          <button class="btn-action btn-copy" data-index="${index}" title="複製連結">📋</button>
        </div>
      `;
      
      mediaList.appendChild(div);
      
      // 生成縮圖
      generateThumbnail(item.url, thumbnailId);
    });
    
    // 綁定下載按鈕
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        downloadMedia(videoItems[index], index);
      });
    });
    
    // 綁定複製按鈕
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        const url = videoItems[index].url;
        navigator.clipboard.writeText(url).then(() => {
          e.target.textContent = '✅';
          setTimeout(() => {
            e.target.textContent = '📋';
          }, 2000);
        });
      });
    });
  }
  
  // 從影片 URL 生成縮圖
  function generateThumbnail(videoUrl, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const video = document.createElement('video');
    
    // 設置 CORS
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    
    // 當影片可以播放時截取第一幀
    video.addEventListener('loadeddata', () => {
      try {
        // 設置 canvas 尺寸
        const aspectRatio = video.videoWidth / video.videoHeight;
        let width = 80;
        let height = 80;
        
        if (aspectRatio > 1) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
        
        const offsetX = (80 - width) / 2;
        const offsetY = (80 - height) / 2;
        
        // 繪製影片第一幀
        ctx.drawImage(video, offsetX, offsetY, width, height);
        
        // 隱藏佔位符
        const placeholder = canvas.parentElement.querySelector('.video-thumbnail-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
        canvas.style.display = 'block';
        
        logDebug('Thumbnail generated for:', videoUrl);
      } catch (error) {
        logDebug('Failed to generate thumbnail:', error.message);
      }
    });
    
    video.addEventListener('error', (e) => {
      logDebug('Video load error for thumbnail:', e);
      // 保持顯示佔位符
    });
    
    // 開始載入影片
    video.load();
    
    // 嘗試播放一小段來觸發截圖
    video.currentTime = 0.1;
  }
  
  // 下載單個媒體
  function downloadMedia(item, index) {
    try {
      const url = new URL(item.url);
      const pathname = url.pathname;
      let filename = pathname.split('/').pop() || `${item.type}_${index}`;
      
      // 確保有正確的副檔名
      if (!filename.match(/\.(mp4|webm|mov|jpg|jpeg|png|gif)$/i)) {
        const ext = item.type === 'video' ? '.mp4' : '.jpg';
        filename += ext;
      }
      
      // 使用 CORS 代理或直接下載
      chrome.downloads.download({
        url: item.url,
        filename: `Threads/${filename}`,
        saveAs: false
      }, (downloadId) => {
        if (downloadId) {
          console.log('Download started:', downloadId);
          showNotification(`開始下載: ${filename}`);
        } else if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError);
          showNotification(`下載失敗: ${chrome.runtime.lastError.message}`);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      showNotification(`下載錯誤: ${error.message}`);
    }
  }
  
  // 下載全部媒體
  function downloadAll() {
    const videoItems = currentMediaItems.filter(item => item.type === 'video');
    if (videoItems.length === 0) return;
    
    let completed = 0;
    videoItems.forEach((item, index) => {
      setTimeout(() => {
        downloadMedia(item, index);
        completed++;
      }, index * 500); // 延遲下載以避免伺服器拒絕
    });
    
    showNotification(`正在下載 ${videoItems.length} 個影片...`);
  }
  
  // 顯示通知
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // 事件監聽
  refreshBtn.addEventListener('click', () => {
    logDebug('Refresh button clicked');
    statusText.textContent = '重新掃描中...';
    mediaList.innerHTML = '';
    fetchMediaFromContent();
  });
  
  downloadAllBtn.addEventListener('click', downloadAll);
  
  clearBtn.addEventListener('click', () => {
    logDebug('Clear button clicked');
    currentMediaItems = [];
    chrome.storage.local.set({ mediaItems: [] });
    displayMediaItems();
    showNotification('已清除所有媒體項目');
  });
  
  // 初始載入 - 先嘗試從 content script 獲取
  logDebug('Initial load starting...');
  fetchMediaFromContent();
  
  // 每 1.5 秒自動刷新一次，同時檢查新媒體
  const refreshInterval = setInterval(() => {
    logDebug('Auto-refresh triggered');
    fetchMediaFromContent();
  }, 1500);
  
  logDebug('Popup setup complete');
});
