// Storage configuration
const STORAGE_KEY = 'ezycopy_settings';
const DEFAULT_SETTINGS = {
  copyToClipboard: true,
  downloadMarkdown: false,
  downloadImagesLocally: false
};

// Base folder for downloads (relative to Downloads folder)
const EZYCOPY_FOLDER = 'EzyCopy';
const IMAGES_SUBFOLDER = 'images';

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ezycopy-save-content",
    title: "EzyCopy - Extract Content",
    contexts: ["page", "selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ezycopy-save-content") {
    // Inject libraries first, then the content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "lib/readability.js",
        "lib/turndown.js",
        "lib/turndown-plugin-gfm.js",
        "lib/ezycopy.js",
        "lib/platform.js",
        "content-script.js",
      ],
    });
  }
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || DEFAULT_SETTINGS;
}

/**
 * Generate safe filename from URL
 */
function sanitizeImageFilename(url, index) {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop() || `image-${index}`;

    // Remove query string if present
    filename = filename.split('?')[0];

    // Decode URI components
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // Keep as-is if decode fails
    }

    // Replace unsafe characters
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure it has an extension
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)) {
      filename += '.png';
    }

    // Truncate if too long
    if (filename.length > 200) {
      const ext = filename.match(/\.[^.]+$/)?.[0] || '.png';
      filename = filename.substring(0, 200 - ext.length) + ext;
    }

    return filename;
  } catch (e) {
    return `image-${index}.png`;
  }
}

/**
 * Download a single image and return its local path
 */
function downloadImage(imageUrl, savePath) {
  return new Promise((resolve) => {
    chrome.downloads.download(
      {
        url: imageUrl,
        filename: savePath,
        conflictAction: 'uniquify'
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          console.error('Download failed for:', imageUrl, chrome.runtime.lastError);
          resolve({ success: false, originalUrl: imageUrl });
          return;
        }

        // Listen for download completion to get the actual file path
        let timeoutId = null;
        const listener = (delta) => {
          if (delta.id !== downloadId) return;

          if (delta.state && delta.state.current === 'complete') {
            clearTimeout(timeoutId);
            chrome.downloads.onChanged.removeListener(listener);
            // Get the actual file path
            chrome.downloads.search({ id: downloadId }, (results) => {
              if (results && results.length > 0) {
                resolve({
                  success: true,
                  originalUrl: imageUrl,
                  localPath: results[0].filename
                });
              } else {
                resolve({ success: false, originalUrl: imageUrl });
              }
            });
          } else if (delta.state && delta.state.current === 'interrupted') {
            clearTimeout(timeoutId);
            chrome.downloads.onChanged.removeListener(listener);
            resolve({ success: false, originalUrl: imageUrl });
          }
        };

        chrome.downloads.onChanged.addListener(listener);

        // Timeout after 30 seconds
        timeoutId = setTimeout(() => {
          chrome.downloads.onChanged.removeListener(listener);
          resolve({ success: false, originalUrl: imageUrl, error: 'timeout' });
        }, 30000);
      }
    );
  });
}

/**
 * Download markdown file
 * Uses data URL instead of blob URL because service workers don't support URL.createObjectURL
 */
function downloadMarkdown(content, filename) {
  return new Promise((resolve) => {
    // Create a data URL for the content (service workers don't support URL.createObjectURL)
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const url = `data:text/markdown;base64,${base64Content}`;

    const savePath = `${EZYCOPY_FOLDER}/${filename}`;

    chrome.downloads.download(
      {
        url: url,
        filename: savePath,
        conflictAction: 'uniquify'
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          resolve({ success: false, error: chrome.runtime.lastError?.message });
          return;
        }

        const listener = (delta) => {
          if (delta.id !== downloadId) return;

          if (delta.state && delta.state.current === 'complete') {
            chrome.downloads.onChanged.removeListener(listener);
            chrome.downloads.search({ id: downloadId }, (results) => {
              if (results && results.length > 0) {
                resolve({ success: true, path: results[0].filename });
              } else {
                resolve({ success: true });
              }
            });
          } else if (delta.state && delta.state.current === 'interrupted') {
            chrome.downloads.onChanged.removeListener(listener);
            resolve({ success: false, error: 'Download interrupted' });
          }
        };

        chrome.downloads.onChanged.addListener(listener);
      }
    );
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    loadSettings().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.action === 'downloadImages') {
    const { images, subfolder } = message;

    // Download all images in parallel
    const downloadPromises = images.map((img, index) => {
      const filename = sanitizeImageFilename(img.src, index);
      const savePath = `${EZYCOPY_FOLDER}/${IMAGES_SUBFOLDER}/${subfolder}/${filename}`;
      return downloadImage(img.src, savePath);
    });

    Promise.all(downloadPromises).then((results) => {
      // Build URL to path mapping for successful downloads
      const urlToPathMap = {};
      let successCount = 0;

      results.forEach((result) => {
        if (result.success && result.localPath) {
          urlToPathMap[result.originalUrl] = result.localPath;
          successCount++;
        }
      });

      sendResponse({
        success: true,
        urlToPathMap,
        totalImages: images.length,
        downloadedCount: successCount
      });
    });

    return true; // Keep channel open for async response
  }

  if (message.action === 'downloadMarkdown') {
    const { content, filename } = message;
    downloadMarkdown(content, filename).then(sendResponse);
    return true; // Keep channel open for async response
  }
});
