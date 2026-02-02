<p align="center">
  <img src="extensions/ezycopy/icons/icon128.png" alt="EzyCopy" width="100" height="100">
</p>

<h1 align="center">EzyCopy</h1>

<p align="center">
  <strong>Extract web content as clean markdown</strong><br>
  Available as a CLI tool and Chrome extension
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/ezycopy/eojoeelojbibilgaghngogekokppkfpb"><img src="https://img.shields.io/chrome-web-store/v/eojoeelojbibilgaghngogekokppkfpb?label=Chrome%20Web%20Store" alt="Chrome Web Store"></a>
  <a href="https://github.com/gupsammy/EzyCopy/releases/latest"><img src="https://img.shields.io/github/v/release/gupsammy/EzyCopy" alt="Release"></a>
  <a href="https://go.dev/"><img src="https://img.shields.io/github/go-mod/go-version/gupsammy/EzyCopy" alt="Go Version"></a>
  <a href="https://goreportcard.com/report/github.com/gupsammy/EzyCopy"><img src="https://goreportcard.com/badge/github.com/gupsammy/EzyCopy" alt="Go Report Card"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/gupsammy/EzyCopy" alt="License"></a>
</p>

---

## Features

- **Smart extraction** — Uses Mozilla Readability to pull article content
- **Clean markdown** — Outputs GitHub Flavored Markdown with preserved structure
- **Images included** — Keeps inline image links by default
- **Authenticated access** — Uses your Chrome profile for logged-in content (Twitter, paywalled sites)
- **Clipboard ready** — Automatically copies output to clipboard

## Installation

### Quick Install (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/gupsammy/EzyCopy/main/install.sh | sh
```

### Download Binary

Download the latest release for your platform:

**[Latest Release](https://github.com/gupsammy/EzyCopy/releases/latest)**

Available for macOS (Intel & Apple Silicon), Linux, and Windows.

### With Go

Requires [Go 1.21+](https://go.dev/dl/)

```bash
go install github.com/gupsammy/EzyCopy@latest
```

### From Source

```bash
git clone https://github.com/gupsammy/EzyCopy.git
cd EzyCopy
go build -o ezycopy .
```

## Usage

```bash
# Extract article and copy to clipboard
ezycopy https://example.com/article

# Use Chrome for JS-heavy sites (Twitter, SPAs)
ezycopy --browser https://x.com/user/status/123

# Save to file (auto-generates filename from title)
ezycopy https://example.com/article -o ~/Downloads/

# Save to specific file
ezycopy https://example.com/article -o article.md

# Strip images from output
ezycopy https://example.com/article --no-images

# Longer timeout for slow pages
ezycopy https://example.com/article -t 60s
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--browser` | — | `false` | Use Chrome (for JS-heavy or authenticated sites) |
| `--output` | `-o` | — | Output file or directory |
| `--no-images` | — | `false` | Remove image links from markdown |
| `--timeout` | `-t` | `30s` | Page load timeout |
| `--help` | `-h` | — | Show help |
| `--version` | — | — | Show version |

## How It Works

By default, ezycopy uses fast HTTP fetching — no browser overhead, instant results. This works great for most articles and blogs.

For JS-heavy sites (Twitter/X, SPAs) or authenticated content, use `--browser` to render pages in headless Chrome:

- JavaScript renders correctly before extraction
- Your existing Chrome sessions provide authentication
- Dynamic content loads before extraction

On first `--browser` run, it will use your installed Chrome. If Chrome isn't available, it downloads a compatible Chromium automatically.

## Requirements

- macOS, Linux, or Windows
- Google Chrome (only needed for `--browser` mode)

---

## Chrome Extension

<p align="center">
  <a href="https://chromewebstore.google.com/detail/ezycopy/eojoeelojbibilgaghngogekokppkfpb">
    <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" alt="Available in the Chrome Web Store" width="200">
  </a>
</p>

Extract and save any webpage as clean, formatted Markdown — directly from your browser.

**Features:**
- One-click extraction from toolbar or right-click menu
- Removes ads, navigation, and clutter automatically
- Full GitHub Flavored Markdown support (tables, code blocks, images)
- Privacy focused — all processing happens locally

<p align="center">
  <a href="https://chromewebstore.google.com/detail/ezycopy/eojoeelojbibilgaghngogekokppkfpb"><strong>Install from Chrome Web Store →</strong></a>
</p>

See [extensions/ezycopy/](extensions/ezycopy/) for manual installation and development instructions.

## Repository Structure

```
EzyCopy/
├── main.go              # CLI entry point
├── extractor/           # Content extraction logic
├── output/              # Output handling (clipboard, file)
├── extensions/ezycopy/  # Chrome extension
├── skills/ezycopy/      # Claude Code skill
└── ...
```

## Uninstall

```bash
curl -sSL https://raw.githubusercontent.com/gupsammy/EzyCopy/main/uninstall.sh | sh
```

## License

[MIT](LICENSE)
