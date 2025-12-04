// 下載按鈕模組
window.ThreadsDownloaderButton = window.ThreadsDownloaderButton || {};

// 在貼文旁邊添加下載按鈕
window.ThreadsDownloaderButton.addDownloadButtons = function() {
  const { logDebug, showPageNotification } = window.ThreadsDownloaderUtils;
  logDebug('addDownloadButtons called');
  
  let buttonsAdded = 0;
  
  // 方法1: 通過 SVG path 找分享按鈕
  const sharePathSnippets = [
    "M15.6097 4.09082L6.65039 9.11104",  // 原始的分享圖標
    "M4.5 12C4.5 7.30558",  // 另一個可能的分享圖標
    "share",  // SVG 可能包含 share 這個詞
  ];
  
  const svgs = document.querySelectorAll('svg');
  logDebug('Total SVGs found:', svgs.length);
  
  // 儲存已處理的容器，避免重複添加
  const processedContainers = new Set();
  
  svgs.forEach((svg, svgIndex) => {
    const svgContent = svg.innerHTML.toLowerCase();
    const hasShareIcon = sharePathSnippets.some(snippet => 
      svg.innerHTML.includes(snippet) || svgContent.includes(snippet.toLowerCase())
    );
    
    if (hasShareIcon) {
      logDebug('Share icon found at SVG index:', svgIndex);
      
      // 嘗試多種方式找到按鈕容器
      let btnContainer = null;
      let postContainer = null;
      
      // 嘗試1: 找 role="button" 的父元素
      const roleButton = svg.closest('div[role="button"]');
      if (roleButton) {
        btnContainer = roleButton.parentElement;
        logDebug('Found via role="button"');
      }
      
      // 嘗試2: 找 button 標籤的父元素
      if (!btnContainer) {
        const button = svg.closest('button');
        if (button) {
          btnContainer = button.parentElement;
          logDebug('Found via button tag');
        }
      }
      
      // 嘗試3: 直接使用 SVG 的父層
      if (!btnContainer) {
        let parent = svg.parentElement;
        let depth = 0;
        // 向上找3層
        while (parent && depth < 3) {
          const siblings = parent.children;
          if (siblings.length >= 3) { // 通常按鈕組有多個按鈕
            btnContainer = parent;
            logDebug('Found via parent traversal at depth:', depth);
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      
      if (btnContainer) {
        // 避免重複處理
        if (processedContainers.has(btnContainer)) {
          logDebug('Container already processed');
          return;
        }
        
        // 檢查是否已經有下載按鈕
        if (btnContainer.querySelector('.threads-download-btn')) {
          logDebug('Button already exists');
          return;
        }
        
        processedContainers.add(btnContainer);
        
        // 找到該貼文的容器 - 優先找最近的 article 或有明確邊界的容器
        postContainer = btnContainer.closest('article') || 
                       btnContainer.closest('[role="article"]');
        
        // 如果沒找到 article，向上找到包含當前按鈕但不包含其他分享按鈕的最小容器
        if (!postContainer) {
          let parent = btnContainer.parentElement;
          let searchDepth = 0;
          while (parent && searchDepth < 8) {
            // 檢查這個容器是否包含多個分享按鈕（如果是，說明包含了多個貼文）
            const shareButtons = parent.querySelectorAll('svg');
            let shareCount = 0;
            shareButtons.forEach(svg => {
              if (svg.innerHTML.includes('M15.6097 4.09082L6.65039 9.11104')) {
                shareCount++;
              }
            });
            
            // 如果只有一個分享按鈕，且包含 video 或 img，就是正確的容器
            if (shareCount === 1 && (parent.querySelector('video') || parent.querySelector('img[src*="cdninstagram"]'))) {
              postContainer = parent;
              logDebug('Post container found via boundary detection at depth:', searchDepth);
              break;
            }
            parent = parent.parentElement;
            searchDepth++;
          }
        }
        
        logDebug('Post container found:', !!postContainer);
        
        // 創建按鈕
        if (postContainer) {
          window.ThreadsDownloaderButton.createDownloadButton(btnContainer, postContainer);
          buttonsAdded++;
          logDebug('Download button created successfully');
        } else {
          logDebug('Warning: Creating button without post container');
          window.ThreadsDownloaderButton.createDownloadButton(btnContainer, document.body);
          buttonsAdded++;
        }
      } else {
        logDebug('Could not find button container');
      }
    }
  });
  
  logDebug('Total buttons added this round:', buttonsAdded);
};

// 創建下載按鈕
window.ThreadsDownloaderButton.createDownloadButton = function(btnContainer, postContainer) {
  const { logDebug } = window.ThreadsDownloaderUtils;
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.marginLeft = '6px';
  
  const btn = document.createElement('button');
  btn.className = 'threads-download-btn';
  btn.innerHTML = '⬇️';
  btn.title = '下載影片';
  btn.style.cssText = `
    padding: 6px 10px;
    border-radius: 20px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;
  
  // 滑鼠效果
  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#f0f0f0';
    btn.style.transform = 'scale(1.05)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = '#fff';
    btn.style.transform = 'scale(1)';
  });
  
  // 創建下拉選單
  const menu = document.createElement('div');
  menu.className = 'threads-download-menu';
  menu.style.cssText = `
    display: none;
    position: fixed;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 200px;
    max-width: 300px;
    z-index: 999999;
    padding: 8px 0;
    max-height: 400px;
    overflow-y: auto;
  `;
  
  // 點擊按鈕切換選單
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 關閉其他選單
    document.querySelectorAll('.threads-download-menu').forEach(m => {
      if (m !== menu) m.style.display = 'none';
    });
    
    // 切換當前選單
    if (menu.style.display === 'none') {
      const media = window.ThreadsDownloaderButton.extractMediaFromPost(postContainer);
      window.ThreadsDownloaderButton.updateDownloadMenu(menu, media);
      
      // 計算按鈕位置，將選單定位在按鈕下方
      const btnRect = btn.getBoundingClientRect();
      menu.style.top = (btnRect.bottom + 4) + 'px';
      menu.style.left = btnRect.left + 'px';
      
      menu.style.display = 'block';
    } else {
      menu.style.display = 'none';
    }
  });
  
  wrapper.appendChild(btn);
  wrapper.appendChild(menu);
  btnContainer.appendChild(wrapper);
  
  // 將選單掛載到 body 而不是 wrapper，確保不受父元素影響
  document.body.appendChild(menu);
  
  // 滾動時更新選單位置
  let scrollTimeout;
  const updateMenuPosition = () => {
    if (menu.style.display === 'block') {
      const btnRect = btn.getBoundingClientRect();
      menu.style.top = (btnRect.bottom + 4) + 'px';
      menu.style.left = btnRect.left + 'px';
    }
  };
  
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateMenuPosition, 10);
  }, true);
  
  // 點擊外部關閉選單
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
};

// 從貼文中提取所有媒體（影片和相片）
window.ThreadsDownloaderButton.extractMediaFromPost = function(postContainer) {
  const media = { videos: [], images: [] };
  
  // 找出所有嵌套的子貼文容器（article 或 role="article"），避免抓到它們的內容
  const nestedPosts = Array.from(postContainer.querySelectorAll('article, [role="article"]'))
    .filter(article => article !== postContainer);
  
  // 檢查元素是否屬於嵌套貼文
  const isInNestedPost = (element) => {
    return nestedPosts.some(nested => nested.contains(element));
  };
  
  // 提取影片
  const videoElements = postContainer.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    // 跳過屬於嵌套貼文的影片
    if (isInNestedPost(video)) {
      return;
    }
    
    const src = video.src || video.currentSrc;
    const sourceTag = video.querySelector('source');
    const sourceSrc = sourceTag ? sourceTag.src : null;
    const videoUrl = src || sourceSrc;
    
    if (videoUrl && videoUrl !== 'about:blank') {
      let poster = video.poster || video.getAttribute('data-poster') || '';
      if (!poster) {
        const parentDiv = video.closest('div');
        if (parentDiv) {
          const nearbyImg = parentDiv.querySelector('img');
          if (nearbyImg && nearbyImg.src) {
            poster = nearbyImg.src;
          }
        }
      }
      
      media.videos.push({
        index: media.videos.length + 1,
        url: videoUrl,
        poster: poster,
        element: video,
        postContainer: postContainer,
        type: 'video'
      });
    }
  });
  
  // 提取相片 - 只提取 <picture> 標籤內的圖片
  const pictureElements = postContainer.querySelectorAll('picture');
  const imageUrls = new Set();
  
  pictureElements.forEach((picture) => {
    // 跳過屬於嵌套貼文的圖片
    if (isInNestedPost(picture)) {
      return;
    }
    
    // 在 picture 標籤內找 img
    const img = picture.querySelector('img');
    if (!img) return;
    
    const imgUrl = img.src || img.getAttribute('data-src');
    
    // 排除太小的圖片和重複的圖片
    if (imgUrl && 
        !imageUrls.has(imgUrl) && 
        img.naturalWidth > 100 && 
        img.naturalHeight > 100 &&
        (imgUrl.includes('cdninstagram') || imgUrl.includes('fbcdn'))) {
      imageUrls.add(imgUrl);
      
      media.images.push({
        index: media.images.length + 1,
        url: imgUrl,
        thumbnail: imgUrl,
        element: img,
        postContainer: postContainer,
        type: 'image'
      });
    }
  });
  
  return media;
};

// 舊版函數保持兼容
window.ThreadsDownloaderButton.extractVideosFromPost = function(postContainer) {
  const media = window.ThreadsDownloaderButton.extractMediaFromPost(postContainer);
  return media.videos;
};

// 更新下載選單（支援 tab 切換）
window.ThreadsDownloaderButton.updateDownloadMenu = function(menu, media) {
  menu.innerHTML = '';
  
  const totalCount = media.videos.length + media.images.length;
  
  if (totalCount === 0) {
    const noMedia = document.createElement('div');
    noMedia.textContent = '此貼文無媒體';
    noMedia.style.cssText = `
      padding: 12px 16px;
      color: #666;
      font-size: 14px;
      text-align: center;
    `;
    menu.appendChild(noMedia);
    return;
  }
  
  // Tab 容器
  const tabContainer = document.createElement('div');
  tabContainer.style.cssText = `
    display: flex;
    border-bottom: 2px solid #eee;
    padding: 0 8px;
  `;
  
  // 創建三個 tab
  const tabs = [
    { id: 'all', label: `全部 (${totalCount})`, filter: 'all' },
    { id: 'videos', label: `影片 (${media.videos.length})`, filter: 'video' },
    { id: 'images', label: `相片 (${media.images.length})`, filter: 'image' }
  ];
  
  let activeTab = 'all';
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = `
    max-height: 350px;
    overflow-y: auto;
  `;
  
  // 渲染內容的函數
  const renderContent = (filter) => {
    contentContainer.innerHTML = '';
    let items = [];
    
    if (filter === 'all') {
      items = [...media.videos, ...media.images];
      
      // 在「全部」tab 頂部添加打包下載按鈕
      if (items.length > 1) {
        const downloadAllBtn = document.createElement('div');
        downloadAllBtn.style.cssText = `
          margin: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        `;
        downloadAllBtn.innerHTML = `📦 全部下載 (${items.length} 個檔案)`;
        
        downloadAllBtn.addEventListener('mouseenter', () => {
          downloadAllBtn.style.transform = 'translateY(-1px)';
          downloadAllBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });
        
        downloadAllBtn.addEventListener('mouseleave', () => {
          downloadAllBtn.style.transform = 'translateY(0)';
          downloadAllBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        });
        
        downloadAllBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.ThreadsDownloaderButton.downloadAllAsZip(items, downloadAllBtn);
        });
        
        contentContainer.appendChild(downloadAllBtn);
      }
    } else if (filter === 'video') {
      items = media.videos;
    } else if (filter === 'image') {
      items = media.images;
    }
    
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = filter === 'video' ? '無影片' : '無相片';
      empty.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #999;
        font-size: 14px;
      `;
      contentContainer.appendChild(empty);
      return;
    }
    
    items.forEach(item => {
      window.ThreadsDownloaderButton.createMediaItem(contentContainer, item, menu);
    });
  };
  
  // 創建 tab 按鈕
  tabs.forEach(tab => {
    const tabBtn = document.createElement('div');
    tabBtn.textContent = tab.label;
    tabBtn.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
      color: #666;
      user-select: none;
    `;
    
    if (tab.id === activeTab) {
      tabBtn.style.color = '#667eea';
      tabBtn.style.borderBottomColor = '#667eea';
    }
    
    // Hover 效果
    tabBtn.addEventListener('mouseenter', () => {
      if (tab.id !== activeTab) {
        tabBtn.style.color = '#333';
      }
    });
    
    tabBtn.addEventListener('mouseleave', () => {
      if (tab.id !== activeTab) {
        tabBtn.style.color = '#666';
      }
    });
    
    tabBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止冒泡導致選單關閉
      activeTab = tab.id;
      
      // 更新所有 tab 樣式
      Array.from(tabContainer.children).forEach((child, i) => {
        if (tabs[i].id === activeTab) {
          child.style.color = '#667eea';
          child.style.borderBottomColor = '#667eea';
        } else {
          child.style.color = '#666';
          child.style.borderBottomColor = 'transparent';
        }
      });
      
      // 渲染對應內容
      renderContent(tab.filter);
    });
    
    tabContainer.appendChild(tabBtn);
  });
  
  menu.appendChild(tabContainer);
  menu.appendChild(contentContainer);
  
  // 初始渲染
  renderContent('all');
};

// 創建單個媒體項目
window.ThreadsDownloaderButton.createMediaItem = function(container, item, menu) {
  const { findPostInfoFromElement } = window.ThreadsDownloaderUtils;
  
  // 生成檔名
  let filename;
  const postInfo = findPostInfoFromElement(item.postContainer || item.element);
  const ext = item.type === 'video' ? '.mp4' : '.jpg';
  
  if (postInfo && postInfo.username && postInfo.postId) {
    filename = `@${postInfo.username}-${postInfo.postId}-${item.index}${ext}`;
  } else {
    filename = `threads_${item.type}_${item.index}${ext}`;
  }
  
  // 創建項目元素
  const itemDiv = document.createElement('div');
  itemDiv.style.cssText = `
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  // 縮圖
  const thumbnail = document.createElement('img');
  thumbnail.src = item.type === 'video' ? (item.poster || '') : item.thumbnail;
  thumbnail.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
    background: #f0f0f0;
  `;
  
  if (!thumbnail.src) {
    const icon = document.createElement('span');
    icon.textContent = item.type === 'video' ? '🎬' : '🖼️';
    icon.style.fontSize = '24px';
    itemDiv.appendChild(icon);
  } else {
    itemDiv.appendChild(thumbnail);
  }
  
  // 標籤
  const label = document.createElement('span');
  label.textContent = `${item.type === 'video' ? '影片' : '相片'} ${item.index}`;
  label.style.flex = '1';
  itemDiv.appendChild(label);
  
  // 下載圖標
  const downloadIcon = document.createElement('span');
  downloadIcon.textContent = '⬇️';
  itemDiv.appendChild(downloadIcon);
  
  // 事件監聽
  itemDiv.addEventListener('mouseenter', () => {
    itemDiv.style.background = '#f5f5f5';
  });
  
  itemDiv.addEventListener('mouseleave', () => {
    itemDiv.style.background = 'transparent';
  });
  
  itemDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 使用 Chrome Downloads API 下載
    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: item.url,
      filename: filename
    }, (response) => {
      if (response && response.success) {
        itemDiv.style.background = '#e8f5e9';
        downloadIcon.textContent = '✅';
        
        const { showPageNotification } = window.ThreadsDownloaderUtils;
        showPageNotification(`開始下載: ${filename}`);
        
        setTimeout(() => {
          itemDiv.style.background = 'transparent';
          downloadIcon.textContent = '⬇️';
        }, 1500);
      } else {
        itemDiv.style.background = '#ffebee';
        downloadIcon.textContent = '❌';
        
        const { showPageNotification } = window.ThreadsDownloaderUtils;
        showPageNotification(`下載失敗: ${filename}`);
        
        setTimeout(() => {
          itemDiv.style.background = 'transparent';
          downloadIcon.textContent = '⬇️';
        }, 2000);
      }
    });
    
    menu.style.display = 'none';
  });
  
  container.appendChild(itemDiv);
};

// 打包下載所有媒體為 ZIP
window.ThreadsDownloaderButton.downloadAllAsZip = async function(items, buttonElement) {
  const { findPostInfoFromElement, showPageNotification } = window.ThreadsDownloaderUtils;
  
  // 檢查 JSZip 是否可用
  if (typeof JSZip === 'undefined') {
    showPageNotification('❌ JSZip 未載入,無法打包下載');
    return;
  }
  
  // 更新按鈕狀態
  const originalText = buttonElement.innerHTML;
  buttonElement.style.pointerEvents = 'none';
  buttonElement.style.opacity = '0.7';
  
  try {
    const zip = new JSZip();
    let completed = 0;
    const total = items.length;
    
    // 取得貼文資訊用於 ZIP 檔名
    const postInfo = findPostInfoFromElement(items[0].postContainer || items[0].element);
    const zipFilename = postInfo && postInfo.username && postInfo.postId 
      ? `@${postInfo.username}-${postInfo.postId}.zip`
      : `threads_media_${Date.now()}.zip`;
    
    buttonElement.innerHTML = `⏳ 下載中... 0/${total}`;
    
    // 逐個下載並添加到 ZIP
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ext = item.type === 'video' ? '.mp4' : '.jpg';
      const filename = postInfo && postInfo.username && postInfo.postId
        ? `@${postInfo.username}-${postInfo.postId}-${item.index}${ext}`
        : `threads_${item.type}_${item.index}${ext}`;
      
      try {
        // 使用 fetch 下載檔案
        const response = await fetch(item.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        zip.file(filename, blob);
        
        completed++;
        buttonElement.innerHTML = `⏳ 下載中... ${completed}/${total}`;
      } catch (error) {
        console.error(`下載失敗: ${filename}`, error);
        // 繼續處理其他檔案
      }
    }
    
    if (completed === 0) {
      throw new Error('所有檔案下載失敗');
    }
    
    // 生成 ZIP
    buttonElement.innerHTML = `📦 打包中...`;
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // 觸發下載
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 成功提示
    buttonElement.innerHTML = `✅ 完成! (${completed}/${total})`;
    showPageNotification(`✅ 已下載 ${completed} 個檔案: ${zipFilename}`);
    
    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.style.pointerEvents = 'auto';
      buttonElement.style.opacity = '1';
    }, 2000);
    
  } catch (error) {
    console.error('打包下載失敗:', error);
    buttonElement.innerHTML = `❌ 失敗`;
    showPageNotification(`❌ 打包下載失敗: ${error.message}`);
    
    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.style.pointerEvents = 'auto';
      buttonElement.style.opacity = '1';
    }, 2000);
  }
};

// 下載影片
window.ThreadsDownloaderButton.downloadVideoFromPage = function(url, filename) {
  const { showPageNotification } = window.ThreadsDownloaderUtils;
  // 創建隱藏的 a 標籤下載
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // 顯示通知
  showPageNotification(`開始下載: ${filename}`);
};
