document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("saveContent");
  const statusDiv = document.getElementById("status");

  saveButton.addEventListener("click", async () => {
    try {
      saveButton.disabled = true;
      statusDiv.textContent = "Extracting content...";

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

      // Now call extractContent which is defined in ezycopy.js
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => extractContent(),
      });

      const { content } = result;

      // Create suggested filename from page title
      const pageTitle = content.split("\n")[0].replace(/^#\s*/, "").trim();
      const safeTitle = pageTitle.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "-");
      const timestamp = new Date().toISOString().slice(0, 10);
      const suggestedName = `${safeTitle}-${timestamp}.md`;

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

        statusDiv.textContent = "Saved successfully!";
      } catch (error) {
        if (error.name === "AbortError") {
          statusDiv.textContent = "Save cancelled";
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error:", error);
      statusDiv.textContent = "Error: " + error.message;
    } finally {
      saveButton.disabled = false;
    }
  });
});
