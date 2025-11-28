// Shared settings utilities for EzyCopy (used by background + popup)
(function () {
  // Avoid redefinition when loaded multiple times
  if (self.EzyCopySettings) return;

  const STORAGE_KEY = 'ezycopy_settings';
  const DEFAULT_SETTINGS = {
    copyToClipboard: true,
    downloadMarkdown: true,
    includeImages: true,
    experimental: {
      selectiveCopy: false,
      downloadImagesLocally: false,
    },
  };

  // Load settings from chrome.storage.local with migration support
  async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] || {};

    return {
      copyToClipboard: stored.copyToClipboard ?? DEFAULT_SETTINGS.copyToClipboard,
      downloadMarkdown: stored.downloadMarkdown ?? DEFAULT_SETTINGS.downloadMarkdown,
      includeImages: stored.includeImages ?? DEFAULT_SETTINGS.includeImages,
      experimental: {
        selectiveCopy: stored.experimental?.selectiveCopy ?? false,
        downloadImagesLocally: stored.experimental?.downloadImagesLocally ?? false,
      },
    };
  }

  // Save settings to chrome.storage.local
  async function saveSettings(settings) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  }

  self.EzyCopySettings = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
  };
})();
