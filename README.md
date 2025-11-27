# EzyCopy Chrome Extension

EzyCopy extracts webpage content and saves it as clean Markdown files. It uses Mozilla's Readability.js (the same engine behind Firefox Reader View) for intelligent content extraction and Turndown.js for high-quality Markdown conversion.

## Features

- Extracts main article content, filtering out ads, navigation, and clutter
- Converts to GitHub Flavored Markdown (tables, strikethrough, task lists)
- Preserves images as `![alt](url)` references
- Two ways to trigger: popup button or right-click context menu
- Suggests filenames based on page title and date

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gupsammy/EzyCopy.git
   ```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the EzyCopy directory

## Usage

**Via Popup:**
1. Click the EzyCopy icon in your toolbar
2. Click "Save Content"
3. Choose where to save the `.md` file

**Via Right-Click:**
1. Right-click anywhere on a page
2. Select "EzyCopy - Save as Markdown"
3. Choose where to save the `.md` file

## Project Structure

```
EzyCopy/
├── manifest.json         # Extension configuration (Manifest V3)
├── popup.html/js         # Popup UI and logic
├── background.js         # Service worker (context menu)
├── content-script.js     # Right-click menu handler
├── lib/
│   ├── readability.js    # Mozilla Readability
│   ├── turndown.js       # HTML to Markdown converter
│   ├── turndown-plugin-gfm.js  # GFM support
│   └── ezycopy.js        # Shared extraction logic
└── icons/                # Extension icons
```

## Permissions

- `activeTab` - Access current page content
- `scripting` - Inject extraction scripts
- `contextMenus` - Right-click menu integration

## Requirements

- Chrome 88+ (Manifest V3 support)

## License

MIT License
