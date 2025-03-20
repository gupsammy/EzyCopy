// Function to extract the content from the active tab
async function saveContent() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Inject the content script to extract the content
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractContent,
    });

    const { content, imageUrls } = result;

    // Create suggested filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const suggestedName = `webpage-content-${timestamp}.md`;

    try {
      // Show file picker dialog
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

      // Download images
      if (imageUrls.length > 0) {
        // Create a subdirectory name based on the markdown filename
        const mdFileName = handle.name.split(".")[0]; // Remove .md extension
        const imagesDir = `${mdFileName}-images/`;

        for (const imageInfo of imageUrls) {
          try {
            // Download the image using chrome.downloads API with the subdirectory
            await chrome.downloads.download({
              url: imageInfo.url,
              filename: imagesDir + imageInfo.filename,
              saveAs: false,
            });
          } catch (error) {
            console.error("Error downloading image:", imageInfo.url, error);
          }
        }
      }

      // Show a notification to the user
      chrome.action.setBadgeText({ text: "✓" });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
    } catch (error) {
      // User cancelled the file picker or other error
      console.error("Error saving content:", error);
    }
  } catch (error) {
    console.error("Error executing content script:", error);
  }
}

// Function to be injected into the page
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
    // Instead of directly calling saveContent, inject and execute a content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"],
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "downloadImages") {
    const { imageUrls, imagesDir } = message;

    // Download all images
    imageUrls.forEach(async (imageInfo) => {
      try {
        await chrome.downloads.download({
          url: imageInfo.url,
          filename: imagesDir + imageInfo.filename,
          saveAs: false,
        });
      } catch (error) {
        console.error("Error downloading image:", imageInfo.url, error);
      }
    });

    // Show a notification to the user
    chrome.action.setBadgeText({ text: "✓" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);
  }
});
