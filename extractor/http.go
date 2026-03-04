package extractor

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// supportedContentTypes lists MIME types we can meaningfully extract.
var supportedContentTypes = []string{
	"text/html",
	"application/xhtml+xml",
	"text/plain",
	"text/xml",
}

// FetchPageHTTP fetches a page using simple HTTP (no JavaScript execution).
// Pass maxBodySize=0 to disable the body size limit.
func FetchPageHTTP(ctx context.Context, url string, timeout time.Duration, maxBodySize int64) (*PageResult, error) {
	client := &http.Client{
		Timeout: timeout,
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, &ExtractionError{
			Code:    fmt.Sprintf("http_%d", resp.StatusCode),
			Message: fmt.Sprintf("HTTP %d: %s", resp.StatusCode, resp.Status),
		}
	}

	// Content-Type pre-check
	ct := resp.Header.Get("Content-Type")
	if ct != "" && !isHTMLContentType(ct) {
		return nil, &ExtractionError{
			Code:    "unsupported_content_type",
			Message: fmt.Sprintf("Content-Type %s is not supported", ct),
		}
	}

	// Read body with optional size limit
	var reader io.Reader = resp.Body
	if maxBodySize > 0 {
		reader = io.LimitReader(resp.Body, maxBodySize+1)
	}

	body, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if maxBodySize > 0 && int64(len(body)) > maxBodySize {
		return nil, &ExtractionError{
			Code:    "body_too_large",
			Message: fmt.Sprintf("response body exceeds %d bytes", maxBodySize),
		}
	}

	return &PageResult{
		HTML:        string(body),
		URL:         resp.Request.URL.String(),
		ContentType: ct,
	}, nil
}

// ExtractionError wraps per-URL errors with a machine-readable code.
type ExtractionError struct {
	Code    string
	Message string
}

func (e *ExtractionError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// isHTMLContentType checks if the Content-Type is one we can extract from.
func isHTMLContentType(ct string) bool {
	ct = strings.ToLower(ct)
	for _, supported := range supportedContentTypes {
		if strings.HasPrefix(ct, supported) {
			return true
		}
	}
	return false
}
