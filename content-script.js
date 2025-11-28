// This script is injected after the lib scripts (readability, turndown, ezycopy, platform)
// extractContent(), extractContentWithImages(), and generateFilename() are available from lib/ezycopy.js

/**
 * Rewrite image URLs in markdown with local file paths
 */
function rewriteImagePaths(markdown, urlToPathMap) {
  let result = markdown;

  for (const [originalUrl, localPath] of Object.entries(urlToPathMap)) {
    // Escape special regex characters in the URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match markdown image syntax: ![alt](url) or ![alt](url "title")
    const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedUrl}((?:\\s+"[^"]*")?\\))`, 'g');
    result = result.replace(regex, `$1${localPath}$2`);
  }

  return result;
}

(async function saveContent() {
  try {
    // Get settings from background script
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const downloadImages = settings?.downloadImagesLocally || false;

    if (downloadImages) {
      // Extract content WITH images
      const data = extractContentWithImages();
      let content = data.content;
      const images = data.images;
      const subfolder = data.subfolder;
      const suggestedName = generateFilename(content);

      // Download images if there are any
      if (images && images.length > 0) {
        showFeedback(`Downloading ${images.length} images...`, "#2196F3");

        const imageResult = await chrome.runtime.sendMessage({
          action: 'downloadImages',
          images: images,
          subfolder: subfolder
        });

        if (imageResult.downloadedCount > 0) {
          // Rewrite image paths in markdown
          content = rewriteImagePaths(content, imageResult.urlToPathMap);
        }
      }

      // Save markdown to EzyCopy folder via background
      const mdResult = await chrome.runtime.sendMessage({
        action: 'downloadMarkdown',
        content: content,
        filename: suggestedName
      });

      if (mdResult.success) {
        const imageInfo = images && images.length > 0
          ? ` with ${images.length} images`
          : '';
        showFeedback(`Saved to Downloads/EzyCopy${imageInfo}!`, "#4caf50");
      } else {
        throw new Error(mdResult.error || 'Failed to save markdown');
      }

    } else {
      // Original behavior: file picker, no image download
      const { content } = extractContent();
      const suggestedName = generateFilename(content);

      // Show file picker dialog (defaults to Downloads folder)
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        startIn: 'downloads',
        types: [
          {
            description: "Markdown File",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });

      // Write the content
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      showFeedback("Content saved successfully!", "#4caf50");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      // User cancelled - no feedback needed
      return;
    }
    console.error("EzyCopy error:", error);
    showFeedback("Error: " + error.message, "#f44336");
  }
})();

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

  // Map old colors to new design system
  const colorMap = {
    '#4caf50': '#2E7D32',
    '#f44336': '#D32F2F'
  };
  const finalColor = colorMap[bgColor] || bgColor;

  // Choose icon based on color (success or error)
  const isSuccess = finalColor === '#2E7D32';
  const icon = isSuccess ? '\u2713' : '\u2717';

  // Build toast using safe DOM methods
  const feedback = document.createElement("div");
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
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.animation = 'ezycopySlideOut 0.3s ease forwards';
    setTimeout(() => feedback.remove(), 300);
  }, 3000);
}
