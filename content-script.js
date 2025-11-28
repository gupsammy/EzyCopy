// This script is injected after the lib scripts (readability, turndown, ezycopy)
// extractContent(), extractContentWithImages(), and generateFilename() are available from lib/ezycopy.js

/**
 * Rewrite image URLs in markdown with local file paths
 */
function rewriteImagePaths(markdown, urlToPathMap) {
  let result = markdown;

  for (const [originalUrl, localPath] of Object.entries(urlToPathMap)) {
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedUrl}((?:\\s+"[^"]*")?\\))`, 'g');
    result = result.replace(regex, `$1${localPath}$2`);
  }

  return result;
}

/**
 * Build success message based on actions performed
 */
function buildSuccessMessage(copied, saved, imageCount, isSelection) {
  const prefix = isSelection ? "Selection " : "";

  if (copied && saved) {
    return imageCount > 0
      ? `${prefix}Copied & saved with ${imageCount} images!`
      : `${prefix}Copied & saved!`;
  } else if (copied) {
    return `${prefix}Copied to clipboard!`;
  } else {
    return imageCount > 0
      ? `${prefix}Saved with ${imageCount} images!`
      : `${prefix}Saved to Downloads/EzyCopy!`;
  }
}

/**
 * Main execution
 */
(async function ezycopy() {
  try {
    // Get settings from background script
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const { copyToClipboard, downloadMarkdown, downloadImagesLocally } = settings;

    // Determine if we need images (only if downloading with images enabled)
    const needImages = downloadMarkdown && downloadImagesLocally;

    // Extract content (selection-aware extraction handled by ezycopy.js)
    const extractionResult = needImages
      ? extractContentWithImages()
      : extractContent();

    let { content, images, subfolder, isSelection } = extractionResult;
    const filename = generateFilename(content);

    let copiedToClipboard = false;
    let savedToFile = false;
    let imageCount = 0;

    // 1. Copy to clipboard if enabled
    if (copyToClipboard) {
      await navigator.clipboard.writeText(content);
      copiedToClipboard = true;
    }

    // 2. Download markdown if enabled
    if (downloadMarkdown) {
      // Handle image downloads if enabled
      if (needImages && images && images.length > 0) {
        showFeedback(`Downloading ${images.length} images...`, "#2196F3");

        const imageResult = await chrome.runtime.sendMessage({
          action: 'downloadImages',
          images: images,
          subfolder: subfolder
        });

        if (imageResult.downloadedCount > 0) {
          content = rewriteImagePaths(content, imageResult.urlToPathMap);
          imageCount = imageResult.downloadedCount;
        }
      }

      // Save markdown file
      const mdResult = await chrome.runtime.sendMessage({
        action: 'downloadMarkdown',
        content: content,
        filename: filename
      });

      if (mdResult.success) {
        savedToFile = true;
      } else {
        throw new Error(mdResult.error || 'Failed to save markdown');
      }
    }

    // 3. Show success feedback
    const successMsg = buildSuccessMessage(copiedToClipboard, savedToFile, imageCount, isSelection);
    showFeedback(successMsg, "#4caf50");

  } catch (error) {
    if (error.name === "AbortError") {
      return; // User cancelled
    }
    console.error("EzyCopy error:", error);
    showFeedback("Error: " + error.message, "#f44336");
  }
})();

/**
 * Show toast notification on page
 */
function showFeedback(message, bgColor) {
  // Inject keyframes animation if not already present
  if (!document.getElementById('ezycopy-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ezycopy-toast-styles';
    style.textContent = `
      @keyframes ezycopySlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes ezycopySlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Map colors to design system
  const colorMap = {
    '#4caf50': '#2E7D32',
    '#f44336': '#D32F2F',
    '#2196F3': '#1976D2'
  };
  const finalColor = colorMap[bgColor] || bgColor;

  // Choose icon based on color
  const isSuccess = finalColor === '#2E7D32';
  const isProgress = finalColor === '#1976D2';
  const icon = isSuccess ? '\u2713' : (isProgress ? '\u21BB' : '\u2717');

  // Build toast
  const feedback = document.createElement("div");
  feedback.className = 'ezycopy-toast';
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${finalColor};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    animation: ezycopySlideIn 0.3s ease forwards;
  `;

  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;
  iconSpan.style.cssText = "margin-right: 8px; font-weight: bold;";

  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;

  feedback.appendChild(iconSpan);
  feedback.appendChild(messageSpan);

  // Remove any existing toast before showing new one
  const existingToast = document.querySelector('.ezycopy-toast');
  if (existingToast) existingToast.remove();

  document.body.appendChild(feedback);

  // Auto-dismiss after 3 seconds (unless it's a progress message)
  if (!isProgress) {
    setTimeout(() => {
      feedback.style.animation = 'ezycopySlideOut 0.3s ease forwards';
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }
}
