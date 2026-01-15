package extractor

import (
	"regexp"
	"strings"

	md "github.com/JohannesKaufmann/html-to-markdown/v2"
)

// imagePattern matches markdown image syntax: ![alt](url) or ![alt](url "title")
var imagePattern = regexp.MustCompile(`!\[[^\]]*\]\([^)]+\)`)

// ToMarkdown converts HTML content to GitHub Flavored Markdown
func ToMarkdown(html string) (string, error) {
	markdown, err := md.ConvertString(html)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(markdown), nil
}

// StripImages removes all markdown image references from content
func StripImages(markdown string) string {
	// Remove image syntax
	result := imagePattern.ReplaceAllString(markdown, "")

	// Clean up any resulting double blank lines
	doubleBlank := regexp.MustCompile(`\n{3,}`)
	result = doubleBlank.ReplaceAllString(result, "\n\n")

	return strings.TrimSpace(result)
}

// FormatArticle formats the extracted article as markdown with metadata
func FormatArticle(article *Article, includeImages bool) (string, error) {
	// Convert HTML content to markdown
	body, err := ToMarkdown(article.Content)
	if err != nil {
		return "", err
	}

	// Strip images if requested
	if !includeImages {
		body = StripImages(body)
	}

	// Build formatted output
	var parts []string

	// Title
	parts = append(parts, "# "+article.Title)
	parts = append(parts, "")

	// Source URL
	parts = append(parts, "Source: "+article.URL)

	// Author if available
	if article.Byline != "" {
		parts = append(parts, "Author: "+article.Byline)
	}

	parts = append(parts, "")

	// Body content
	parts = append(parts, body)

	return strings.Join(parts, "\n"), nil
}
