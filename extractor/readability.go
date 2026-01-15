package extractor

import (
	"net/url"
	"strings"

	readability "github.com/go-shiori/go-readability"
)

// Article contains extracted article content
type Article struct {
	Title   string
	Byline  string
	Content string // HTML content
	URL     string
}

// ExtractArticle uses Readability to extract the main content from HTML
func ExtractArticle(html string, pageURL string) (*Article, error) {
	parsedURL, err := url.Parse(pageURL)
	if err != nil {
		return nil, err
	}

	article, err := readability.FromReader(strings.NewReader(html), parsedURL)
	if err != nil {
		return nil, err
	}

	return &Article{
		Title:   article.Title,
		Byline:  article.Byline,
		Content: article.Content,
		URL:     pageURL,
	}, nil
}
