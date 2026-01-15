---
name: ezycopy
description: >
  Extract clean web content as markdown using ezycopy CLI. Use when user asks to
  "extract this webpage", "save this article", "copy clean content from URL",
  "get markdown from this link", "convert webpage to markdown",
  provides a URL to extract content from, or wants to save web content to clipboard
  or file without ads and clutter.
---

# EzyCopy CLI

Extracts clean markdown from URLs using headless Chrome + Mozilla Readability. Handles JS-heavy sites and authenticated content via Chrome profile cookies.

## Usage

```
ezycopy <URL> [flags]
```

**Flags:**
- `-o <path>` — Save to file/directory (default: clipboard)
- `--no-images` — Strip image links
- `-t <duration>` — Timeout (default: 30s)

## Install

If not installed: `go install github.com/gupsammy/EzyCopyCLI@latest`

First run auto-downloads Chromium if Chrome unavailable.
