#!/bin/sh
set -e

BINARY="ezycopy"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

if [ -f "$INSTALL_DIR/$BINARY" ]; then
  echo "Removing ${INSTALL_DIR}/${BINARY}..."
  sudo rm "$INSTALL_DIR/$BINARY"
  echo "Done! ${BINARY} has been uninstalled."
else
  echo "${BINARY} not found in ${INSTALL_DIR}"
  exit 1
fi
