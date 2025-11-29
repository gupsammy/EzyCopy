// This script is injected after the lib scripts (readability, turndown, ezycopy, platform)
// extractContent(), formatContent(), generateFilename(), generateSubfolder(),
// extractImagesFromHtml(), and rewriteImagePaths() are available from lib/

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
 * Copy content to clipboard
 */
async function copyContentToClipboard(content) {
  await navigator.clipboard.writeText(content);
  return true;
}

/**
 * Download markdown file via background script
 */
async function downloadMarkdownFile(content, filename) {
  const result = await chrome.runtime.sendMessage({
    action: 'downloadMarkdown',
    content: content,
    filename: filename
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to save markdown');
  }
  return result;
}

/**
 * Main execution
 */
(async function ezycopy() {
  try {
    // Get settings from background script
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const { copyToClipboard: shouldCopy, downloadMarkdown: shouldDownload, includeImages } = settings;
    const { selectiveCopy, downloadImagesLocally } = settings.experimental || {};

    // Extract content (respects selectiveCopy and includeImages settings)
    const extraction = extractContent({ selectiveCopy, includeImages });

    let clipboardContent = null;
    let downloadContent = null;
    let imageCount = 0;

    // Format for clipboard (lean - no metadata except title)
    if (shouldCopy) {
      clipboardContent = formatContent(extraction, 'clipboard', settings);
    }

    // Format for download (full metadata)
    if (shouldDownload) {
      downloadContent = formatContent(extraction, 'download', settings);

      // Handle image downloads if all conditions met
      if (includeImages && downloadImagesLocally && extraction.html) {
        const images = extractImagesFromHtml(extraction.html);
        if (images.length > 0) {
          showFeedback(`Downloading ${images.length} images...`, "#2196F3");

          const subfolder = generateSubfolder(extraction.title);
          const imageResult = await chrome.runtime.sendMessage({
            action: 'downloadImages',
            images: images,
            subfolder: subfolder
          });

          if (imageResult.downloadedCount > 0) {
            downloadContent = rewriteImagePaths(downloadContent, imageResult.urlToPathMap);
            imageCount = imageResult.downloadedCount;
          }
        }
      }
    }

    const filename = generateFilename(extraction.title);

    // Execute outputs
    let copiedToClipboard = false;
    let savedToFile = false;

    if (clipboardContent) {
      await copyContentToClipboard(clipboardContent);
      copiedToClipboard = true;
    }

    if (downloadContent) {
      await downloadMarkdownFile(downloadContent, filename);
      savedToFile = true;
    }

    // Show success feedback
    const successMsg = buildSuccessMessage(copiedToClipboard, savedToFile, imageCount, extraction.isSelection);
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
