// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ezycopy-save-content",
    title: "EzyCopy - Save as Markdown",
    contexts: ["page", "selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ezycopy-save-content") {
    // Inject libraries first, then the content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "lib/readability.js",
        "lib/turndown.js",
        "lib/turndown-plugin-gfm.js",
        "lib/ezycopy.js",
        "content-script.js",
      ],
    });
  }
});
