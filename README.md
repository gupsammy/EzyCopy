# EzyCopy

[![Go Version](https://img.shields.io/github/go-mod/go-version/gupsammy/EzyCopy)](https://go.dev/)
[![Release](https://img.shields.io/github/v/release/gupsammy/EzyCopy)](https://github.com/gupsammy/EzyCopy/releases/latest)
[![License](https://img.shields.io/github/license/gupsammy/EzyCopy)](LICENSE)
[![Go Report Card](https://goreportcard.com/badge/github.com/gupsammy/EzyCopy)](https://goreportcard.com/report/github.com/gupsammy/EzyCopy)

Extract web content as clean markdown. Available as a CLI tool and Chrome extension.

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

## Chrome Extension

The Chrome extension provides the same extraction capabilities directly in your browser. See [extensions/ezycopy/](extensions/ezycopy/) for installation instructions.

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
