const { loadSettings, saveSettings } = window.EzyCopySettings;

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


document.addEventListener("DOMContentLoaded", async function () {
  // DOM elements - main settings
  const ezycopyBtn = document.getElementById("ezycopyBtn");
  const copyToClipboardToggle = document.getElementById("copyToClipboard");
  const downloadMarkdownToggle = document.getElementById("downloadMarkdown");
  const includeImagesToggle = document.getElementById("includeImages");

  // DOM elements - experimental settings
  const selectiveCopyToggle = document.getElementById("selectiveCopy");
  const downloadImagesLocallyToggle = document.getElementById("downloadImagesLocally");
  const downloadImagesRow = document.getElementById("downloadImagesRow");

  // Update download images toggle visibility
  // Only visible when BOTH download markdown AND include images are enabled
  function updateDownloadImagesVisibility(downloadMarkdown, includeImages) {
    if (downloadMarkdown && includeImages) {
      downloadImagesRow.classList.remove("hidden");
    } else {
      downloadImagesRow.classList.add("hidden");
    }
  }

  // Initialize toggle states from storage
  const settings = await loadSettings();
  copyToClipboardToggle.checked = settings.copyToClipboard;
  downloadMarkdownToggle.checked = settings.downloadMarkdown;
  includeImagesToggle.checked = settings.includeImages;
  selectiveCopyToggle.checked = settings.experimental.selectiveCopy;
  downloadImagesLocallyToggle.checked = settings.experimental.downloadImagesLocally;
  updateDownloadImagesVisibility(settings.downloadMarkdown, settings.includeImages);

  // Handle copy to clipboard toggle
  copyToClipboardToggle.addEventListener("change", async (e) => {
    let currentSettings = await loadSettings();
    currentSettings.copyToClipboard = e.target.checked;
    currentSettings = enforceAtLeastOneActive(currentSettings, 'copyToClipboard');
    await saveSettings(currentSettings);
    // Sync UI if enforcement changed the other toggle
    downloadMarkdownToggle.checked = currentSettings.downloadMarkdown;
    updateDownloadImagesVisibility(currentSettings.downloadMarkdown, currentSettings.includeImages);
  });

  // Handle download markdown toggle
  downloadMarkdownToggle.addEventListener("change", async (e) => {
    let currentSettings = await loadSettings();
    currentSettings.downloadMarkdown = e.target.checked;
    currentSettings = enforceAtLeastOneActive(currentSettings, 'downloadMarkdown');
    await saveSettings(currentSettings);
    // Sync UI if enforcement changed the other toggle
    copyToClipboardToggle.checked = currentSettings.copyToClipboard;
    updateDownloadImagesVisibility(currentSettings.downloadMarkdown, currentSettings.includeImages);
  });

  // Handle selective copy toggle
  selectiveCopyToggle.addEventListener("change", async (e) => {
    const currentSettings = await loadSettings();
    currentSettings.experimental.selectiveCopy = e.target.checked;
    await saveSettings(currentSettings);
  });

  // Handle include images toggle
  includeImagesToggle.addEventListener("change", async (e) => {
    const currentSettings = await loadSettings();
    currentSettings.includeImages = e.target.checked;
    await saveSettings(currentSettings);
    updateDownloadImagesVisibility(currentSettings.downloadMarkdown, e.target.checked);
  });

  // Handle download images locally toggle
  downloadImagesLocallyToggle.addEventListener("change", async (e) => {
    const currentSettings = await loadSettings();
    currentSettings.experimental.downloadImagesLocally = e.target.checked;
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
          ...window.EzyCopyInjection.CONTENT_SCRIPTS,
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
