// Storage configuration
const STORAGE_KEY = 'ezycopy_settings';
const DEFAULT_SETTINGS = {
  copyToClipboard: true,
  downloadMarkdown: false,
  downloadImagesLocally: false
};

// Ensure at least one output method is active
function enforceAtLeastOneActive(settings, changedToggle) {
  if (changedToggle === 'copyToClipboard' && !settings.copyToClipboard && !settings.downloadMarkdown) {
    settings.downloadMarkdown = true;
  }
  if (changedToggle === 'downloadMarkdown' && !settings.downloadMarkdown && !settings.copyToClipboard) {
    settings.copyToClipboard = true;
  }
  return settings;
}

// Load settings from chrome.storage.local
async function loadSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || DEFAULT_SETTINGS;
}

// Save settings to chrome.storage.local
async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

document.addEventListener("DOMContentLoaded", async function () {
  // DOM elements
  const ezycopyBtn = document.getElementById("ezycopyBtn");
  const copyToClipboardToggle = document.getElementById("copyToClipboard");
  const downloadMarkdownToggle = document.getElementById("downloadMarkdown");
  const downloadImagesToggle = document.getElementById("downloadImages");
  const imageToggleRow = document.getElementById("imageToggleRow");

  // Update image toggle visibility based on download markdown state
  function updateImageToggleVisibility(downloadEnabled) {
    if (downloadEnabled) {
      imageToggleRow.classList.remove("hidden");
    } else {
      imageToggleRow.classList.add("hidden");
    }
  }

  // Initialize toggle states from storage
  const settings = await loadSettings();
  copyToClipboardToggle.checked = settings.copyToClipboard;
  downloadMarkdownToggle.checked = settings.downloadMarkdown;
  downloadImagesToggle.checked = settings.downloadImagesLocally;
  updateImageToggleVisibility(settings.downloadMarkdown);

  // Handle copy to clipboard toggle
  copyToClipboardToggle.addEventListener("change", async (e) => {
    let currentSettings = await loadSettings();
    currentSettings.copyToClipboard = e.target.checked;
    currentSettings = enforceAtLeastOneActive(currentSettings, 'copyToClipboard');
    await saveSettings(currentSettings);
    // Sync UI if enforcement changed the other toggle
    downloadMarkdownToggle.checked = currentSettings.downloadMarkdown;
    updateImageToggleVisibility(currentSettings.downloadMarkdown);
  });

  // Handle download markdown toggle
  downloadMarkdownToggle.addEventListener("change", async (e) => {
    let currentSettings = await loadSettings();
    currentSettings.downloadMarkdown = e.target.checked;
    currentSettings = enforceAtLeastOneActive(currentSettings, 'downloadMarkdown');
    await saveSettings(currentSettings);
    // Sync UI if enforcement changed the other toggle
    copyToClipboardToggle.checked = currentSettings.copyToClipboard;
    updateImageToggleVisibility(currentSettings.downloadMarkdown);
  });

  // Handle download images toggle
  downloadImagesToggle.addEventListener("change", async (e) => {
    const currentSettings = await loadSettings();
    currentSettings.downloadImagesLocally = e.target.checked;
    await saveSettings(currentSettings);
  });

  // Handle EzyCopy button click - inject content script and close popup
  ezycopyBtn.addEventListener("click", async () => {
    try {
      ezycopyBtn.disabled = true;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Inject libs + content-script (same as context menu)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "lib/readability.js",
          "lib/turndown.js",
          "lib/turndown-plugin-gfm.js",
          "lib/ezycopy.js",
          "lib/platform.js",
          "content-script.js",
        ],
      });

      // Toast on page handles all feedback - close popup
      window.close();

    } catch (error) {
      console.error("EzyCopy error:", error);
      // Re-enable button on error so user can retry
      ezycopyBtn.disabled = false;
    }
  });
});
