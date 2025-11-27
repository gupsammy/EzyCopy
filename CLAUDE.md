# EzyCopy

Manifest V3 Chrome extension that extracts webpage content to Markdown using Readability.js + Turndown.js.

## Project Structure

```
lib/
  readability.js         → Mozilla Readability for content extraction
  turndown.js            → HTML-to-Markdown converter
  turndown-plugin-gfm.js → GFM support (tables, strikethrough)
  ezycopy.js             → Shared extraction logic

popup.html/popup.js      → Extension popup UI
background.js            → Service worker (context menu only)
content-script.js        → Right-click menu handler
manifest.json            → Extension configuration (v2.0)
icons/                   → Extension icons (16, 48, 128px)
```

## Architecture

**Two Trigger Methods:**
- Popup button → `popup.js` injects libs + calls `extractContent()` + `generateFilename()`
- Right-click menu → `background.js` injects libs + `content-script.js`

**Data Flow:**
1. Inject `lib/*.js` scripts into page context
2. `extractContent()` uses Readability to extract article content
3. Turndown converts HTML to Markdown (with GFM tables/strikethrough)
4. `generateFilename()` creates safe filename from title + date
5. Images embedded as `![alt](url)` - no local download
6. Markdown saved via `window.showSaveFilePicker()`

## Key Libraries

- **Readability.js** - Mozilla's article extraction (used in Firefox Reader View)
- **Turndown** - HTML to Markdown converter
- **turndown-plugin-gfm** - GitHub Flavored Markdown (tables, strikethrough, task lists)

## Content Extraction

All extraction logic lives in `lib/ezycopy.js`. Supports:
- Headings, paragraphs, lists (nested)
- Images with proper `![alt](url)` syntax
- Links `[text](url)`
- Tables (GFM)
- Code blocks (fenced)
- Bold, italic, strikethrough
- Blockquotes

## Development

Reload extension: `chrome://extensions/` → Developer mode → Reload
