package output

import "github.com/atotto/clipboard"

// CopyToClipboard copies the content to the system clipboard
func CopyToClipboard(content string) error {
	return clipboard.WriteAll(content)
}
