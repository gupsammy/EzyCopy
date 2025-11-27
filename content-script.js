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
  const feedback = document.createElement("div");
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
  `;
  document.body.appendChild(feedback);
  setTimeout(() => {
    feedback.style.opacity = "0";
    feedback.style.transition = "opacity 0.5s";
    setTimeout(() => feedback.remove(), 500);
  }, 3000);
}
