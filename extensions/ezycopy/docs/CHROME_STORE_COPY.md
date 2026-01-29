# Chrome Web Store Submission Copy

Everything you need to copy for the Chrome Web Store submission.

---

## Tester Notes (for Reviewer)

Copy this into the "Notes to Reviewer" field when submitting:

```
HOW TO TEST EZYCOPY:

1. Navigate to any article page. Recommended test pages:
   - https://en.wikipedia.org/wiki/Markdown
   - https://medium.com (any article)
   - https://dev.to (any article)
   - Any news article or blog post

2. There are TWO ways to use the extension:

   METHOD A - Popup Button:
   - Click the EzyCopy extension icon in the toolbar
   - A popup opens with settings toggles:
     • "Copy to clipboard" - copies markdown to clipboard
     • "Download .md" - saves file to Downloads/EzyCopy/
     • "Include images" - preserves image references
   - Click the "EzyCopy" button to extract the page content

   METHOD B - Right-Click Menu:
   - Right-click anywhere on the page
   - Click "EzyCopy" in the context menu
   - Content is instantly extracted using your saved settings

3. After extraction, you will see TWO confirmation indicators:
   - A green toast notification in the top-right corner (e.g., "Copied & saved to Downloads!")
   - A green checkmark (✓) badge on the extension icon

4. Verify the output:
   - If "Copy to clipboard" is enabled: paste into any text editor to see the markdown
   - If "Download .md" is enabled: check Downloads/EzyCopy/[article-title]-[date].md

IMPORTANT NOTES:
- The extension ONLY works on regular web pages (http/https)
- It does NOT work on: chrome:// pages, the new tab page, Chrome Web Store, or PDF files
- Toast notification and badge are visible for 5 seconds
- Settings persist between uses (stored locally via chrome.storage.local)

STORAGE PERMISSION:
The "storage" permission saves user preferences (the toggle settings in the popup).
No personal data or browsing history is stored. All settings are local to the browser.
```

---

## Store Listing Tab

### Short Description (132 chars max)

```
Extract and save any webpage as clean Markdown. One-click article extraction with full formatting support.
```

### Full Description

```
EzyCopy - Save Any Webpage as Clean Markdown

Instantly extract and save article content from any webpage as a beautifully formatted Markdown file. Perfect for researchers, writers, students, and anyone who wants to save web content for offline reading or note-taking.

FEATURES

• One-Click Extraction - Click the extension icon to instantly extract and save the main content
• Right-Click Menu - Right-click anywhere on a page to save it
• Clean Output - Removes ads, navigation, and clutter automatically
• Full Markdown Support - Headings, lists, links, images, tables, code blocks, and more
• Saves Images - Preserves inline images with proper references
• Smart Filenames - Automatically generates filenames from the article title and date
• Works Offline - All processing happens locally in your browser

PRIVACY FOCUSED

EzyCopy processes everything locally in your browser. No data is ever sent to external servers. No tracking, no analytics, no accounts required.

Built with Mozilla's Readability (the same technology behind Firefox Reader View) and Turndown for reliable, high-quality extraction.
```

### Category

```
Productivity
```

---

## Privacy Practices Tab

### Single Purpose Description

```
Extract and save webpage article content as Markdown files
```

### Privacy Policy URL

```
https://raw.githubusercontent.com/gupsammy/EzyCopy/main/extensions/ezycopy/PRIVACY_POLICY.md
```

### Permission Justifications

#### activeTab

```
Required to access the current webpage content when the user clicks the extension icon or uses the context menu. Only accesses the tab the user explicitly activates the extension on.
```

#### scripting

```
Required to inject the content extraction libraries (Readability.js and Turndown.js) into the webpage to extract and convert the article content to Markdown.
```

#### contextMenus

```
Provides users an alternative way to trigger content extraction via right-click menu, improving accessibility and user experience.
```

#### storage

```
Stores user preferences locally (such as toggle settings for copy to clipboard, download, and include images). No personal data is stored.
```

#### downloads

```
Required to save the generated Markdown file to the user's Downloads folder.
```

### Data Use Disclosures

**Does your extension collect user data?**
- Select: **No, I do not collect user data**

If asked about specific data types, select **No** for all:
- Personally identifiable information: No
- Health information: No
- Financial information: No
- Authentication information: No
- Personal communications: No
- Location: No
- Web history: No
- User activity: No
- Website content: No

**Note on Website Content:** The extension reads webpage content to extract and convert it to markdown, but this processing happens entirely locally in the browser. The content is immediately saved as a local file and is never transmitted to any external server. No data is collected, stored remotely, or shared with third parties.

### Certifications

Check all boxes confirming:
- Your extension's use of data complies with the Chrome Web Store User Data Policy
- Your use of data complies with the Limited Use requirements

---

## Distribution Tab

- **Visibility**: Public
- **Countries**: All countries
- **Pricing**: Free

---

## Assets Locations

```
Promo tile (440x280):
extensions/ezycopy/assets/promo-tile-440x280.png

Screenshot 1 (1280x800):
extensions/ezycopy/assets/screenshot-1-1280x800.png

Screenshot 2 (1280x800):
extensions/ezycopy/assets/screenshot-2-1280x800.png

Screenshot 3 (1280x800):
extensions/ezycopy/assets/screenshot-3-1280x800.png
```
