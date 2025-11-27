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
      setStatus(statusDiv, "Extracting content...", "extracting");

      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Inject libraries first, then extract content
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "lib/readability.js",
          "lib/turndown.js",
          "lib/turndown-plugin-gfm.js",
          "lib/ezycopy.js",
        ],
      });

      // Now call extractContent and generateFilename from ezycopy.js
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const { content } = extractContent();
          return { content, suggestedName: generateFilename(content) };
        },
      });

      const { content, suggestedName } = result;

      try {
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

        setStatus(statusDiv, "Saved successfully!", "success");
      } catch (error) {
        if (error.name === "AbortError") {
          setStatus(statusDiv, "Save cancelled", "cancelled");
        } else {
          throw error;
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
