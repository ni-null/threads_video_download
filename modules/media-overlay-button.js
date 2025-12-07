// 媒體覆蓋按鈕模組 - 在媒體左下角顯示下載按鈕
window.ThreadsDownloaderOverlay = window.ThreadsDownloaderOverlay || {}

// 已處理的媒體元素（避免重複處理）
window.ThreadsDownloaderOverlay._processedMedia = window.ThreadsDownloaderOverlay._processedMedia || new WeakSet()

// 擴充功能上下文失效標誌
window.ThreadsDownloaderOverlay._contextInvalidated = false

// Debug 模式標誌（預設關閉）
window.ThreadsDownloaderOverlay._debugMode = false

/**
 * Debug 日誌函數
 * @param {...any} args - 日誌參數
 */
function logDebug(...args) {
  if (window.ThreadsDownloaderOverlay._debugMode) {
    console.log("[Overlay]", ...args)
  }
}

/**
 * 主要入口：為所有媒體添加左下角下載按鈕
 */
window.ThreadsDownloaderOverlay.addMediaOverlayButtons = function () {
  // 如果上下文已失效,停止處理
  if (window.ThreadsDownloaderOverlay._contextInvalidated) {
    return
  }

  logDebug("開始添加媒體覆蓋按鈕")

  // 處理影片
  window.ThreadsDownloaderOverlay.processVideos()

  // 處理圖片（picture 標籤內的）
  window.ThreadsDownloaderOverlay.processImages()
}

/**
 * 處理所有影片元素
 */
window.ThreadsDownloaderOverlay.processVideos = function () {
  // 查詢所有 video 元素，包括隱藏的
  const videos = document.querySelectorAll("video")
  logDebug("找到影片元素數量:", videos.length)

  videos.forEach((video, index) => {
    // 跳過已處理的
    if (window.ThreadsDownloaderOverlay._processedMedia.has(video)) {
      logDebug(`影片 ${index} 已處理，跳過`)
      return
    }

    const src = video.src || video.currentSrc || video.querySelector("source")?.src
    if (!src || src === "about:blank") {
      logDebug(`影片 ${index} 沒有有效 src，跳過`)
      return
    }

    // 找到媒體容器（需要有 position: relative 的父元素）
    // 對於輪播，先找到輪播容器本身
    let mediaContainer = window.ThreadsDownloaderOverlay.findMediaContainer(video)

    // 如果沒找到，嘗試找到輪播容器（可能是 role="region" 或其他指示符）
    if (!mediaContainer) {
      let temp = video.parentElement
      let depth = 0
      while (temp && depth < 20) {
        const style = window.getComputedStyle(temp)
        // 尋找可能是輪播容器的祖先 - 檢查是否有 overflow hidden 和足夠大的尺寸
        if (style.overflow === "hidden" && temp.offsetWidth > 200 && temp.offsetHeight > 200) {
          mediaContainer = temp
          if (style.position === "static") {
            temp.style.position = "relative"
          }
          logDebug(`影片 ${index} 找到輪播容器於深度 ${depth}`)
          break
        }
        temp = temp.parentElement
        depth++
      }
    }

    if (!mediaContainer) {
      logDebug(`影片 ${index} 找不到媒體容器，跳過`)
      return
    }

    // 檢查此影片是否已經有按鈕（而不是檢查容器中是否有任何按鈕）
    // 多個媒體可能共享同一個容器
    const existingButton = mediaContainer.querySelector(".threads-overlay-btn[data-video-src='" + src.replace(/'/g, "\\'") + "']")
    if (existingButton) {
      logDebug(`影片 ${index} 已有按鈕，標記為已處理`)
      window.ThreadsDownloaderOverlay._processedMedia.add(video)
      return
    }

    // 獲取縮圖
    let poster = video.poster || ""
    if (!poster) {
      // 嘗試從外層容器找縮圖
      let searchContainer = video.parentElement
      let depth = 0
      while (searchContainer && depth < 8 && !poster) {
        const img = searchContainer.querySelector('img[src*="cdninstagram"], img[src*="fbcdn"]')
        if (img && img.src && img !== video) {
          poster = img.src
          break
        }
        searchContainer = searchContainer.parentElement
        depth++
      }
    }

    // 創建覆蓋按鈕
    window.ThreadsDownloaderOverlay.createOverlayButton(mediaContainer, {
      type: "video",
      url: src,
      poster: poster,
      element: video,
    })

    window.ThreadsDownloaderOverlay._processedMedia.add(video)
    logDebug(`影片 ${index} 成功添加按鈕`)
  })
}

/**
 * 處理所有圖片元素
 */
window.ThreadsDownloaderOverlay.processImages = function () {
  const pictures = document.querySelectorAll("picture")
  logDebug("找到 picture 元素數量:", pictures.length)

  pictures.forEach((picture, index) => {
    const img = picture.querySelector("img")
    if (!img) {
      logDebug(`picture ${index} 沒有 img，跳過`)
      return
    }

    // 跳過已處理的
    if (window.ThreadsDownloaderOverlay._processedMedia.has(img)) {
      logDebug(`picture ${index} 中的 img 已處理，跳過`)
      return
    }

    const imgUrl = img.src || img.getAttribute("data-src")
    if (!imgUrl || !(imgUrl.includes("cdninstagram") || imgUrl.includes("fbcdn"))) {
      logDebug(`picture ${index} 中的 img URL 無效，跳過`)
      return
    }

    // 檢查圖片尺寸
    if (img.naturalWidth > 0 && (img.naturalWidth <= 100 || img.naturalHeight <= 100)) {
      logDebug(`picture ${index} 中的 img 尺寸過小，跳過`)
      window.ThreadsDownloaderOverlay._processedMedia.add(img)
      return
    }

    // 找到媒體容器
    const mediaContainer = window.ThreadsDownloaderOverlay.findMediaContainer(picture)
    if (!mediaContainer) {
      logDebug(`picture ${index} 找不到媒體容器，跳過`)
      return
    }

    // 檢查此圖片是否已經有按鈕（而不是檢查容器中是否有任何按鈕）
    // 多個媒體可能共享同一個容器
    const existingButton = mediaContainer.querySelector(".threads-overlay-btn[data-image-src='" + imgUrl.replace(/'/g, "\\'") + "']")
    if (existingButton) {
      logDebug(`picture ${index} 已有按鈕，標記為已處理`)
      window.ThreadsDownloaderOverlay._processedMedia.add(img)
      return
    }

    // 創建覆蓋按鈕
    window.ThreadsDownloaderOverlay.createOverlayButton(mediaContainer, {
      type: "image",
      url: imgUrl,
      thumbnail: imgUrl,
      element: img,
    })

    window.ThreadsDownloaderOverlay._processedMedia.add(img)
    logDebug(`picture ${index} 成功添加按鈕`)
  })
}

/**
 * 找到適合放置覆蓋按鈕的媒體容器
 * 對於 Threads，我們需要找到最接近媒體元素的有 --x-borderRadius 或 --x-aspectRatio 的容器
 * 這對於輪播式媒體很重要 - 每個媒體應該有自己的按鈕，而不是共享同一個
 * @param {HTMLElement} element
 * @returns {HTMLElement|null}
 */
window.ThreadsDownloaderOverlay.findMediaContainer = function (element) {
  if (!element) return null

  let parent = element.parentElement
  let depth = 0
  let closestContainer = null
  let foundGridContainer = false

  // 先找最近的有 Threads CSS 變數的容器（針對單個媒體的容器）
  while (parent && depth < 15) {
    // 檢查是否有 Threads 特有的 CSS 變數（--x-borderRadius 或 --x-aspectRatio）
    const styleStr = parent.style.cssText || ""
    const hasBorderRadiusVar = styleStr.includes("--x-borderRadius")
    const hasAspectRatioVar = styleStr.includes("--x-aspectRatio")

    // 對於輪播 Grid 容器，會有 --x-gridTemplateColumns
    if (styleStr.includes("--x-gridTemplateColumns")) {
      foundGridContainer = true
      logDebug(`找到 Grid 輪播容器於深度 ${depth}`)
      // 對於 Grid 容器，不要直接使用它，而是使用其直接子元素作為媒體容器
      // Grid 容器內的每個媒體應該有自己的子容器
      break
    }

    // 如果有這些 CSS 變數，這是 Threads 的媒體容器 - 應該是我們要找的
    if ((hasBorderRadiusVar || hasAspectRatioVar) && parent.offsetWidth > 100 && parent.offsetHeight > 50) {
      logDebug(`找到媒體容器於深度 ${depth}，類名: ${parent.className.substring(0, 50)}`)
      closestContainer = parent
      // 找到了最近的 Threads 容器，停止向上查找
      // 這確保對於輪播式媒體，每個媒體使用其最接近的容器
      break
    }

    parent = parent.parentElement
    depth++
  }

  // 如果找到了 Threads 風格的容器，使用它
  if (closestContainer) {
    const style = window.getComputedStyle(closestContainer)
    if (style.position === "static") {
      closestContainer.style.position = "relative"
    }
    return closestContainer
  }

  // 如果找到了 Grid 容器但還沒有找到媒體容器
  // 往上再找一層，可能有實際的媒體包裝器
  if (foundGridContainer && parent) {
    // Grid 的直接父元素之一應該是實際的媒體容器
    let temp = element.parentElement
    while (temp && temp !== parent && depth < 10) {
      const style = window.getComputedStyle(temp)
      if (temp.offsetWidth > 100 && temp.offsetHeight > 50) {
        if (style.position === "relative" || style.position === "absolute") {
          closestContainer = temp
          break
        }
      }
      temp = temp.parentElement
    }
    if (closestContainer) {
      const style = window.getComputedStyle(closestContainer)
      if (style.position === "static") {
        closestContainer.style.position = "relative"
      }
      return closestContainer
    }
  }

  // 備用：尋找有 position 和合理尺寸的容器
  parent = element.parentElement
  depth = 0
  while (parent && depth < 15) {
    const style = window.getComputedStyle(parent)

    if (parent.offsetWidth > 100 && parent.offsetHeight > 100) {
      if (style.position === "relative" || style.position === "absolute") {
        closestContainer = parent
        logDebug(`找到 position:relative 容器於深度 ${depth}`)
        break
      } else if (style.borderRadius && style.borderRadius !== "0px") {
        closestContainer = parent
        logDebug(`找到 borderRadius 容器於深度 ${depth}`)
        break
      }
    }

    parent = parent.parentElement
    depth++
  }

  if (closestContainer) {
    const style = window.getComputedStyle(closestContainer)
    if (style.position === "static") {
      closestContainer.style.position = "relative"
    }
    return closestContainer
  }

  // 備用：直接使用元素的父容器
  if (element.parentElement) {
    const parentStyle = window.getComputedStyle(element.parentElement)
    if (parentStyle.position === "static") {
      element.parentElement.style.position = "relative"
    }
    logDebug("使用備用：元素的直接父容器")
    return element.parentElement
  }

  logDebug("找不到任何合適的媒體容器")
  return null
}

/**
 * 創建覆蓋在媒體左下角的下載按鈕
 * @param {HTMLElement} container - 媒體容器
 * @param {Object} mediaInfo - 媒體資訊
 */
window.ThreadsDownloaderOverlay.createOverlayButton = function (container, mediaInfo) {
  const { findPostInfoFromElement, showPageNotification, i18n } = window.ThreadsDownloaderUtils

  logDebug("創建覆蓋按鈕，容器:", container.className, "媒體類型:", mediaInfo.type)

  // 檢查擴充功能上下文是否有效
  let downloadIconUrl
  try {
    downloadIconUrl = chrome.runtime.getURL("image/download-white.svg")
  } catch (error) {
    console.warn("Threads Downloader: 擴充功能上下文已失效")
    window.ThreadsDownloaderOverlay._contextInvalidated = true
    // 斷開 DOM 觀察器
    if (window.ThreadsDownloaderScanner && window.ThreadsDownloaderScanner._observer) {
      window.ThreadsDownloaderScanner._observer.disconnect()
    }
    return null
  }

  const btn = document.createElement("button")
  btn.className = "threads-overlay-btn"
  btn.innerHTML = `<img src="${downloadIconUrl}" alt="下載" style="width: 16px; height: 16px;">`
  btn.title = mediaInfo.type === "video" ? i18n("downloadVideo") : i18n("downloadImage")
  // 添加數據屬性以便識別
  if (mediaInfo.type === "video") {
    btn.setAttribute("data-video-src", mediaInfo.url)
  } else {
    btn.setAttribute("data-image-src", mediaInfo.url)
  }
  btn.style.cssText = `
    position: absolute;
    left: 12px;
    bottom: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: white;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `

  // 使用事件委派來處理 hover
  // 追蹤滑鼠是否在容器或按鈕上
  let isHovering = false

  const showButton = () => {
    isHovering = true
    btn.style.opacity = "1"
    btn.style.pointerEvents = "auto"
  }

  const hideButton = () => {
    isHovering = false
    // 稍微延遲隱藏，讓使用者有時間移動到按鈕上
    setTimeout(() => {
      if (!isHovering) {
        btn.style.opacity = "0"
        btn.style.pointerEvents = "none"
      }
    }, 100)
  }

  // 容器的 hover 事件
  container.addEventListener("mouseenter", showButton)
  container.addEventListener("mouseleave", hideButton)

  // 按鈕的 hover 事件（保持顯示）
  btn.addEventListener("mouseenter", () => {
    isHovering = true
    btn.style.background = "rgba(0, 0, 0, 0.5)"
    btn.style.transform = "scale(1.1)"
  })

  btn.addEventListener("mouseleave", () => {
    btn.style.background = "rgba(0, 0, 0, 0.3)"
    btn.style.transform = "scale(1)"
    hideButton()
  })

  // 點擊下載
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    e.preventDefault()

    // 生成檔名
    const ext = mediaInfo.type === "video" ? ".mp4" : ".jpg"
    let filename

    // 先找到貼文容器（包含 /post/ 連結的容器）
    let postContainer = mediaInfo.element
    let depth = 0
    while (postContainer && depth < 20) {
      if (postContainer.querySelector && postContainer.querySelector('a[href*="/post/"]')) {
        break
      }
      postContainer = postContainer.parentElement
      depth++
    }

    // 從貼文容器取得貼文資訊
    let postInfo = null
    if (postContainer) {
      const postLink = postContainer.querySelector('a[href*="/post/"]')
      if (postLink && postLink.href) {
        const match = postLink.href.match(/@([^/]+)\/post\/([^/?#]+)/)
        if (match) {
          postInfo = {
            username: match[1],
            postId: match[2],
          }
        }
      }
    }

    // 如果還是沒找到，嘗試從頁面 URL 解析
    if (!postInfo) {
      const pageMatch = window.location.href.match(/@([^/]+)\/post\/([^/?#]+)/)
      if (pageMatch) {
        postInfo = {
          username: pageMatch[1],
          postId: pageMatch[2],
        }
      }
    }

    // 計算此媒體在貼文中的索引
    let mediaIndex = 1
    if (postContainer && mediaInfo.element) {
      // 取得貼文中所有同類型的媒體
      const allMedia = mediaInfo.type === "video" ? postContainer.querySelectorAll("video") : postContainer.querySelectorAll("picture img")

      // 找出當前媒體的索引
      for (let i = 0; i < allMedia.length; i++) {
        if (allMedia[i] === mediaInfo.element) {
          mediaIndex = i + 1
          break
        }
      }
    }

    if (postInfo && postInfo.username && postInfo.postId) {
      filename = `@${postInfo.username}-${postInfo.postId}-${mediaIndex}${ext}`
    } else {
      filename = `threads_${mediaInfo.type}_${Date.now()}-${mediaIndex}${ext}`
    }

    // 使用 Chrome Downloads API 下載
    chrome.runtime.sendMessage(
      {
        action: "downloadVideo",
        url: mediaInfo.url,
        filename: filename,
      },
      (response) => {
        if (response && response.success) {
          btn.innerHTML = "✅"
          showPageNotification(i18n("downloadStarted", filename))

          setTimeout(() => {
            btn.innerHTML = `<img src="${downloadIconUrl}" alt="下載" style="width: 20px; height: 20px;">`
          }, 1500)
        } else {
          btn.innerHTML = "❌"
          showPageNotification(i18n("downloadFailed", filename))

          setTimeout(() => {
            btn.innerHTML = `<img src="${downloadIconUrl}" alt="下載" style="width: 20px; height: 20px;">`
          }, 2000)
        }
      }
    )
  })

  container.appendChild(btn)
  return btn
}
