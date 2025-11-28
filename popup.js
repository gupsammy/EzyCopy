// Storage configuration
const STORAGE_KEY = 'ezycopy_settings';
const DEFAULT_SETTINGS = {
  downloadImagesLocally: false
};

// Load settings from chrome.storage.local
async function loadSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || DEFAULT_SETTINGS;
}

// Save settings to chrome.storage.local
async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

// Update status display with appropriate styling
function setStatus(statusDiv, message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
}

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

document.addEventListener("DOMContentLoaded", async function () {
  const saveButton = document.getElementById("saveContent");
  const statusDiv = document.getElementById("status");
  const downloadImagesToggle = document.getElementById("downloadImages");

  // Initialize toggle state from storage
  const settings = await loadSettings();
  downloadImagesToggle.checked = settings.downloadImagesLocally;

  // Handle toggle changes
  downloadImagesToggle.addEventListener("change", async (e) => {
    const currentSettings = await loadSettings();
    currentSettings.downloadImagesLocally = e.target.checked;
    await saveSettings(currentSettings);
  });

  // Handle save button click
  saveButton.addEventListener("click", async () => {
    try {
      saveButton.disabled = true;
      const currentSettings = await loadSettings();
      const downloadImages = currentSettings.downloadImagesLocally;

      setStatus(statusDiv, "Extracting content...", "extracting");

      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Inject libraries first
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "lib/readability.js",
          "lib/turndown.js",
          "lib/turndown-plugin-gfm.js",
          "lib/ezycopy.js",
        ],
      });

      if (downloadImages) {
        // Extract content WITH images
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const data = extractContentWithImages();
            return {
              content: data.content,
              images: data.images,
              subfolder: data.subfolder,
              suggestedName: generateFilename(data.content)
            };
          },
        });

        let { content, images, subfolder, suggestedName } = result;

        // Download images if there are any
        if (images && images.length > 0) {
          setStatus(statusDiv, `Downloading ${images.length} images...`, "extracting");

          const imageResult = await chrome.runtime.sendMessage({
            action: 'downloadImages',
            images: images,
            subfolder: subfolder
          });

          if (imageResult.downloadedCount > 0) {
            // Rewrite image paths in markdown
            content = rewriteImagePaths(content, imageResult.urlToPathMap);
            setStatus(statusDiv, `Downloaded ${imageResult.downloadedCount}/${imageResult.totalImages} images. Saving markdown...`, "extracting");
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
          setStatus(statusDiv, `Saved to Downloads/EzyCopy${imageInfo}!`, "success");
        } else {
          throw new Error(mdResult.error || 'Failed to save markdown');
        }

      } else {
        // Original behavior: file picker, no image download
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const { content } = extractContent();
            return { content, suggestedName: generateFilename(content) };
          },
        });

        const { content, suggestedName } = result;

        try {
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

          setStatus(statusDiv, "Saved successfully!", "success");
        } catch (error) {
          if (error.name === "AbortError") {
            setStatus(statusDiv, "Save cancelled", "cancelled");
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus(statusDiv, "Error: " + error.message, "error");
    } finally {
      saveButton.disabled = false;
    }
  });
});
