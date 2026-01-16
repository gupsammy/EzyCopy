<p align="center">
  <img src="icons/icon128.png" alt="EzyCopy Logo" width="80" height="80">
</p>

<h1 align="center">EzyCopy</h1>

<p align="center">
  <strong>Perfect copy without the mess</strong>
</p>

<p align="center">
  <a href="https://github.com/gupsammy/EzyCopy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-green.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Chrome-88%2B-yellow.svg" alt="Chrome 88+">
  <a href="https://github.com/gupsammy/EzyCopy/issues"><img src="https://img.shields.io/github/issues/gupsammy/EzyCopy" alt="Issues"></a>
</p>

<p align="center">
  Extract and save any webpage as clean, formatted Markdown — with just a click.
</p>

---

## Features

- **One-click extraction** — Click the icon or right-click any page
- **Clean output** — Removes ads, navigation, and clutter automatically
- **Full Markdown support** — Headings, lists, links, images, tables, code blocks
- **GitHub Flavored Markdown** — Tables, strikethrough, task lists
- **Saves images too** — Preserves inline images with proper `![alt](url)` references
- **Smart filenames** — Auto-generates names from page title and date
- **Privacy focused** — All processing happens locally, no data sent anywhere

## Installation

### From Chrome Web Store

Coming soon!

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gupsammy/EzyCopy.git
   ```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `extensions/ezycopy` folder

## Usage

**Via Popup:**
1. Click the EzyCopy icon in your toolbar
2. Configure options (copy to clipboard, download, include images)
3. Click **Copy** or **Download**

**Via Right-Click:**
1. Right-click anywhere on a page
2. Select **EzyCopy**
3. Content is saved based on your settings

## How It Works

EzyCopy uses [Mozilla's Readability.js](https://github.com/mozilla/readability) (the same engine behind Firefox Reader View) for intelligent content extraction, and [Turndown.js](https://github.com/mixmark-io/turndown) for high-quality Markdown conversion.

```
Webpage → Readability.js → Clean HTML → Turndown.js → Markdown
```

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Access current page when you activate the extension |
| `scripting` | Inject extraction scripts into the page |
| `contextMenus` | Right-click menu option |
| `storage` | Save your preferences locally |
| `downloads` | Save Markdown files to Downloads |

## Privacy

EzyCopy does **not** collect, store, or transmit any data. All processing happens locally in your browser. See our [Privacy Policy](PRIVACY_POLICY.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with care for researchers, writers, and anyone who saves web content.
</p>
