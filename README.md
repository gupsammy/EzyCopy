# EzyCopyCLI

[![Go Version](https://img.shields.io/github/go-mod/go-version/gupsammy/EzyCopyCLI)](https://go.dev/)
[![Release](https://img.shields.io/github/v/release/gupsammy/EzyCopyCLI)](https://github.com/gupsammy/EzyCopyCLI/releases/latest)
[![License](https://img.shields.io/github/license/gupsammy/EzyCopyCLI)](LICENSE)
[![Go Report Card](https://goreportcard.com/badge/github.com/gupsammy/EzyCopyCLI)](https://goreportcard.com/report/github.com/gupsammy/EzyCopyCLI)

A command-line tool for extracting web content as clean markdown. Companion to the [EzyCopy Chrome Extension](https://github.com/gupsammy/EzyCopy).

## Features

- **Smart extraction** — Uses Mozilla Readability to pull article content
- **Clean markdown** — Outputs GitHub Flavored Markdown with preserved structure
- **Images included** — Keeps inline image links by default
- **Authenticated access** — Uses your Chrome profile for logged-in content (Twitter, paywalled sites)
- **Clipboard ready** — Automatically copies output to clipboard

## Installation

### Download Binary

Download the latest release for your platform:

**[Latest Release](https://github.com/gupsammy/EzyCopyCLI/releases/latest)**

Available for macOS (Intel & Apple Silicon), Linux, and Windows.

### With Go

```bash
go install github.com/gupsammy/EzyCopyCLI@latest
```

### From Source

```bash
git clone https://github.com/gupsammy/EzyCopyCLI.git
cd EzyCopyCLI
go build -o ezycopy .
```

## Usage

```bash
# Extract article and copy to clipboard
ezycopy https://example.com/article

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
| `--output` | `-o` | — | Output file or directory |
| `--no-images` | — | `false` | Remove image links from markdown |
| `--timeout` | `-t` | `30s` | Page load timeout |
| `--help` | `-h` | — | Show help |
| `--version` | — | — | Show version |

## How It Works

ezycopy renders pages in a headless Chrome browser before extraction. This means:

- JavaScript-heavy sites (Twitter/X, SPAs) render correctly
- Your existing Chrome sessions provide authentication
- Dynamic content loads before extraction

On first run, it will use your installed Chrome. If Chrome isn't available, it downloads a compatible Chromium automatically.

## Requirements

- macOS, Linux, or Windows
- Google Chrome recommended (Chromium works too)

## Related

- [EzyCopy Chrome Extension](https://github.com/gupsammy/EzyCopy) — Browser extension with the same extraction capabilities

## License

[MIT](LICENSE)
