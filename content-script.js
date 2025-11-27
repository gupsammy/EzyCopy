// This script is injected after the lib scripts (readability, turndown, ezycopy)
// extractContent() and generateFilename() are available from lib/ezycopy.js

(async function saveContent() {
  try {
    // Extract content and generate filename using shared functions from ezycopy.js
    const { content } = extractContent();
    const suggestedName = generateFilename(content);

    // Show file picker dialog
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName,
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

    // Show success feedback
    showFeedback("Content saved successfully!", "#4caf50");
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
