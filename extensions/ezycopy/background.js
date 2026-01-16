// Shared settings/helpers
importScripts('settings.js');
importScripts('file-helpers.js');
importScripts('injection-files.js');

const { sanitizeImageFilename, EZYCOPY_FOLDER, IMAGES_SUBFOLDER } = self.EzyCopyFiles;
const { CONTENT_SCRIPTS } = self.EzyCopyInjection;
const { loadSettings } = self.EzyCopySettings;

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ezycopy-save-content",
    title: "EzyCopy",
    contexts: ["page", "selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ezycopy-save-content") {
    // Inject libraries first, then the content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: CONTENT_SCRIPTS,
    });
  }
});

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
      // Relative path from markdown file (in EzyCopy/) to image
      const relativePath = `${IMAGES_SUBFOLDER}/${subfolder}/${filename}`;
      return downloadImage(img.src, savePath).then(result => ({
        ...result,
        relativePath
      }));
    });

    Promise.all(downloadPromises).then((results) => {
      // Build URL to path mapping for successful downloads (using relative paths)
      const urlToPathMap = {};
      let successCount = 0;

      results.forEach((result) => {
        if (result.success) {
          // Use relative path for markdown compatibility with any viewer
          urlToPathMap[result.originalUrl] = result.relativePath;
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
