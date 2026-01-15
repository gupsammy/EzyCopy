package output

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// sanitizeFilename creates a safe filename from a title
func sanitizeFilename(title string) string {
	// Limit to 50 characters
	if len(title) > 50 {
		title = title[:50]
	}

	// Replace non-alphanumeric characters with dashes
	re := regexp.MustCompile(`[^a-zA-Z0-9]+`)
	safe := re.ReplaceAllString(title, "-")

	// Clean up multiple dashes and trim
	safe = regexp.MustCompile(`-+`).ReplaceAllString(safe, "-")
	safe = strings.Trim(safe, "-")

	// Add date suffix
	date := time.Now().Format("2006-01-02")
	return safe + "-" + date + ".md"
}

// ResolveOutputPath determines the final output path
// If path is a directory, generates filename from title
// If path is a file, uses it directly
func ResolveOutputPath(outputFlag string, title string) (string, error) {
	// Expand ~ to home directory
	if strings.HasPrefix(outputFlag, "~") {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		outputFlag = filepath.Join(home, outputFlag[1:])
	}

	// Clean the path
	outputFlag = filepath.Clean(outputFlag)

	// Check if it's a directory
	info, err := os.Stat(outputFlag)
	if err == nil && info.IsDir() {
		// It's a directory - generate filename
		filename := sanitizeFilename(title)
		return filepath.Join(outputFlag, filename), nil
	}

	// It's a file path (or doesn't exist yet)
	// Ensure it has .md extension
	if !strings.HasSuffix(strings.ToLower(outputFlag), ".md") {
		outputFlag += ".md"
	}

	return outputFlag, nil
}

// WriteToFile writes content to the specified path
func WriteToFile(path string, content string) error {
	// Ensure directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(path, []byte(content), 0644)
}
