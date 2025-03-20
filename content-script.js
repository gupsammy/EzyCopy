// This script will be injected into the page when the context menu item is clicked

// Function to extract the content
function extractContent() {
  // Helper function to clean text
  function cleanText(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, "\n")
      .trim();
  }

  // Get the page title
  const title = document.title;

  // Get the main content
  const article = document.querySelector("article") || document.body;

  // Remove unwanted elements
  const elementsToRemove = article.querySelectorAll(
    "script, style, iframe, nav, footer, header, aside"
  );
  elementsToRemove.forEach((element) => element.remove());

  // Initialize content with title and source
  let content = `# ${title}\n\nSource: ${window.location.href}\n\n`;

  // Collect image URLs (only PNG and JPG)
  const imageUrls = [];

  // Process all elements in document order
  function processNode(node) {
    // Skip if node was removed or is null
    if (!node || !node.parentNode) return;

    // Process different types of nodes
    switch (node.nodeName.toLowerCase()) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        const level = node.nodeName[1];
        const headingText = cleanText(node.textContent);
        content += `${"#".repeat(level)} ${headingText}\n\n`;
        break;

      case "p":
        const paragraphText = cleanText(node.textContent);
        if (paragraphText) content += `${paragraphText}\n\n`;
        break;

      case "ul":
      case "ol":
        node.querySelectorAll("li").forEach((item) => {
          const listItemText = cleanText(item.textContent);
          content += `- ${listItemText}\n`;
        });
        content += "\n";
        break;

      case "img":
        const src = node.src;
        // Handle both regular image URLs and Google Docs image URLs
        if (
          src &&
          (src.endsWith(".png") ||
            src.endsWith(".jpg") ||
            src.endsWith(".jpeg") ||
            src.includes("googleusercontent.com"))
        ) {
          // For Google Docs images, generate a more meaningful filename
          if (src.includes("googleusercontent.com")) {
            const timestamp = new Date().getTime();
            imageUrls.push({
              url: src,
              filename: `gdoc_image_${timestamp}.png`,
            });
          } else {
            // For regular images, keep the original filename
            const originalFilename = src
              .split("/")
              .pop()
              .replace(/[^a-zA-Z0-9.-]/g, "_");
            imageUrls.push({
              url: src,
              filename: originalFilename,
            });
          }
        }
        break;

      default:
        // For other elements, process their children
        node.childNodes.forEach((child) => processNode(child));
    }
  }

  // Start processing from the article/body
  Array.from(article.children).forEach((child) => processNode(child));

  return { content, imageUrls };
}

// Main function to save content
async function saveContent() {
  try {
    // Extract content directly (we're already in the page context)
    const { content, imageUrls } = extractContent();

    // Create suggested filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const suggestedName = `webpage-content-${timestamp}.md`;

    try {
      // Show file picker dialog - this works in content script context
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: "Markdown File",
            accept: {
              "text/markdown": [".md"],
            },
          },
        ],
      });

      // Create a writable stream for markdown
      const writable = await handle.createWritable();

      // Write the content
      await writable.write(content);
      await writable.close();

      // Download images through the extension
      if (imageUrls.length > 0) {
        // Create a subdirectory name based on the markdown filename
        const mdFileName = handle.name.split(".")[0]; // Remove .md extension
        const imagesDir = `${mdFileName}-images/`;

        // Send message to background script to download images
        chrome.runtime.sendMessage({
          action: "downloadImages",
          imageUrls: imageUrls,
          imagesDir: imagesDir,
        });
      }

      // Show a temporary visual feedback in the page
      const feedback = document.createElement("div");
      feedback.textContent = "Content saved successfully!";
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(feedback);
      setTimeout(() => {
        feedback.style.opacity = "0";
        feedback.style.transition = "opacity 0.5s";
        setTimeout(() => feedback.remove(), 500);
      }, 3000);
    } catch (error) {
      console.error("Error saving content:", error);
      // Show error message on page if needed
    }
  } catch (error) {
    console.error("Error executing content script:", error);
  }
}

// Execute the save content function immediately when script is injected
saveContent();
