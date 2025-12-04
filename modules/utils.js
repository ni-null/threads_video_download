// 工具函數模組
// 使用全域命名空間來避免衝突
window.ThreadsDownloaderUtils = window.ThreadsDownloaderUtils || {};

// 調試日誌函數
window.ThreadsDownloaderUtils.logDebug = function(message, data = null) {
  console.log('[DEBUG-CONTENT]', message, data || '');
};

// 顯示頁面通知
window.ThreadsDownloaderUtils.showPageNotification = function(message) {
  // 移除舊通知
  const oldNotification = document.querySelector('.threads-download-notification');
  if (oldNotification) oldNotification.remove();
  
  const notification = document.createElement('div');
  notification.className = 'threads-download-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 100000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  
  // 添加動畫
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  if (!document.querySelector('style[data-threads-download]')) {
    style.setAttribute('data-threads-download', 'true');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 從元素向上遍歷 DOM，找到最近的 Threads 貼文連結
 * @param {HTMLElement} element - 起始元素
 * @returns {Object|null} - { username, postId, url } 或 null
 */
window.ThreadsDownloaderUtils.findPostInfoFromElement = function(element) {
  if (!element) return null;
  
  let current = element;
  let depth = 0;
  const maxDepth = 15;
  
  while (current && depth < maxDepth) {
    // 在當前節點及其子節點中查找 Threads 貼文連結
    const links = current.querySelectorAll ? current.querySelectorAll('a[href*="/post/"]') : [];
    
    for (const link of links) {
      const href = link.href;
      const postInfo = window.ThreadsDownloaderUtils.parseThreadsUrl(href);
      if (postInfo) {
        return postInfo;
      }
    }
    
    current = current.parentElement;
    depth++;
  }
  
  // 如果沒找到，嘗試從當前頁面 URL 解析
  return window.ThreadsDownloaderUtils.parseThreadsUrl(window.location.href);
};

/**
 * 解析 Threads URL 獲取用戶名和貼文 ID
 * @param {string} url - Threads URL
 * @returns {Object|null} - { username, postId, url } 或 null
 */
window.ThreadsDownloaderUtils.parseThreadsUrl = function(url) {
  if (!url) return null;
  
  try {
    // Threads URL 格式: https://www.threads.net/@username/post/postId
    const match = url.match(/@([^/]+)\/post\/([^/?#]+)/);
    if (match) {
      return {
        username: match[1],
        postId: match[2],
        url: url
      };
    }
  } catch (e) {
    window.ThreadsDownloaderUtils.logDebug('Error parsing URL:', e);
  }
  
  return null;
};
