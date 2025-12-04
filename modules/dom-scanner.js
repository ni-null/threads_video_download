// DOM 掃描模組
window.ThreadsDownloaderDOM = window.ThreadsDownloaderDOM || {};

// 掃描頁面中的 video 和 img 標籤
window.ThreadsDownloaderDOM.scanDOM = function(mediaItems) {
  const { logDebug, updatePopup } = window.ThreadsDownloaderUtils;
  // 掃描 video 標籤 - 主要重點
  document.querySelectorAll('video').forEach(video => {
    // 獲取縮圖 - 多種方式
    let poster = video.poster || video.getAttribute('data-poster') || '';
    
    // 如果沒有 poster，嘗試找最近的 img 標籤
    if (!poster) {
      const parentDiv = video.closest('div');
      if (parentDiv) {
        const nearbyImg = parentDiv.querySelector('img');
        if (nearbyImg && nearbyImg.src) {
          poster = nearbyImg.src;
        }
      }
    }
    
    // 檢查 video 標籤的 src
    const videoSrc = video.src || video.currentSrc;
    if (videoSrc && videoSrc.startsWith('blob:')) {
      logDebug('Found blob video (需要特殊處理):', videoSrc);
    } else if (videoSrc && !mediaItems.some(item => item.url === videoSrc)) {
      mediaItems.push({
        url: videoSrc,
        type: 'video',
        poster: poster,
        timestamp: new Date().toLocaleTimeString()
      });
      logDebug('Video found (video tag) with poster:', { videoSrc, poster });
      console.log('🎥 Video found (video tag):', videoSrc, 'Poster:', poster);
      updatePopup(mediaItems);
    }
    
    // 檢查 video 內的 source 標籤
    video.querySelectorAll('source').forEach(source => {
      const src = source.src || source.getAttribute('data-src');
      if (src && !mediaItems.some(item => item.url === src)) {
        mediaItems.push({
          url: src,
          type: 'video',
          poster: poster,
          timestamp: new Date().toLocaleTimeString()
        });
        logDebug('Video found (source tag) with poster:', { src, poster });
        console.log('🎥 Video found (source tag):', src, 'Poster:', poster);
        updatePopup(mediaItems);
      }
    });
  });
  
  // 掃描其他可能包含影片的元素
  window.ThreadsDownloaderDOM.scanForHiddenVideos(mediaItems);
};

// 掃描隱藏的影片源
window.ThreadsDownloaderDOM.scanForHiddenVideos = function(mediaItems) {
  const { logDebug, updatePopup } = window.ThreadsDownloaderUtils;
  // 檢查 data 屬性中可能包含的影片 URL
  document.querySelectorAll('[data-video-url], [data-src*="video"], [data-source*="video"]').forEach(el => {
    const videoUrl = el.getAttribute('data-video-url') || 
                    el.getAttribute('data-src') || 
                    el.getAttribute('data-source');
    if (videoUrl && !mediaItems.some(item => item.url === videoUrl)) {
      mediaItems.push({
        url: videoUrl,
        type: 'video',
        timestamp: new Date().toLocaleTimeString()
      });
      logDebug('Video found in data attribute:', videoUrl);
      console.log('🎥 Video found in data attribute:', videoUrl);
      updatePopup(mediaItems);
    }
  });
  
  // 監聽 Performance API 記錄的資源 - 重點找影片
  if (window.performance && window.performance.getEntries) {
    window.performance.getEntries().forEach(entry => {
      const url = entry.name;
      // 只檢測影片相關的 URL
      if ((url.includes('video') || url.includes('.mp4') || url.includes('.webm') || url.includes('.m3u8')) && 
          !mediaItems.some(item => item.url === url)) {
        mediaItems.push({
          url: url,
          type: 'video',
          timestamp: new Date().toLocaleTimeString()
        });
        logDebug('Video found in Performance API:', url);
        console.log('🎥 Video found in Performance API:', url);
        updatePopup(mediaItems);
      }
    });
  }
};

// 設置 DOM 觀察器
window.ThreadsDownloaderDOM.setupDOMObserver = function(mediaItems) {
  const observer = new MutationObserver(() => {
    window.ThreadsDownloaderDOM.scanDOM(mediaItems);
  });
  
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-src', 'poster']
  });
  
  return observer;
};
