#!/bin/sh
set -e

REPO="gupsammy/EzyCopy"
BINARY="ezycopy"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="darwin" ;;
  linux) OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Get latest version
VERSION=$(curl -sSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | tr -d 'v')
if [ -z "$VERSION" ]; then
  echo "Failed to get latest version"
  exit 1
fi

# Download and install
EXT="tar.gz"
[ "$OS" = "windows" ] && EXT="zip"

URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY}_${VERSION}_${OS}_${ARCH}.${EXT}"
echo "Downloading ${BINARY} v${VERSION} for ${OS}/${ARCH}..."

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

curl -sSL "$URL" -o "$TMP/archive.$EXT"

if [ "$EXT" = "zip" ]; then
  unzip -q "$TMP/archive.$EXT" -d "$TMP"
else
  tar -xzf "$TMP/archive.$EXT" -C "$TMP"
fi

echo "Installing to ${INSTALL_DIR}/${BINARY}..."
sudo mv "$TMP/$BINARY" "$INSTALL_DIR/$BINARY"
sudo chmod +x "$INSTALL_DIR/$BINARY"

echo "Done! Run '${BINARY} --help' to get started."
