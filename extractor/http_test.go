package extractor

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestFetchPageHTTP_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte("<html><body>Hello</body></html>"))
	}))
	defer srv.Close()

	result, err := FetchPageHTTP(context.Background(), srv.URL, 5*time.Second, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(result.HTML, "Hello") {
		t.Errorf("expected HTML to contain 'Hello', got %q", result.HTML)
	}
	if result.ContentType != "text/html" {
		t.Errorf("expected content-type 'text/html', got %q", result.ContentType)
	}
}

func TestFetchPageHTTP_RejectsNonHTML(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/pdf")
		w.Write([]byte("%PDF-1.4"))
	}))
	defer srv.Close()

	_, err := FetchPageHTTP(context.Background(), srv.URL, 5*time.Second, 0)
	if err == nil {
		t.Fatal("expected error for non-HTML content type")
	}

	var ee *ExtractionError
	if !errors.As(err, &ee) {
		t.Fatalf("expected ExtractionError, got %T: %v", err, err)
	}
	if ee.Code != "unsupported_content_type" {
		t.Errorf("expected code 'unsupported_content_type', got %q", ee.Code)
	}
}

func TestFetchPageHTTP_BodySizeLimit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(strings.Repeat("x", 1000)))
	}))
	defer srv.Close()

	_, err := FetchPageHTTP(context.Background(), srv.URL, 5*time.Second, 500)
	if err == nil {
		t.Fatal("expected error for body exceeding limit")
	}

	var ee *ExtractionError
	if !errors.As(err, &ee) {
		t.Fatalf("expected ExtractionError, got %T: %v", err, err)
	}
	if ee.Code != "body_too_large" {
		t.Errorf("expected code 'body_too_large', got %q", ee.Code)
	}
}

func TestFetchPageHTTP_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	_, err := FetchPageHTTP(context.Background(), srv.URL, 5*time.Second, 0)
	if err == nil {
		t.Fatal("expected error for 500 response")
	}

	var ee *ExtractionError
	if !errors.As(err, &ee) {
		t.Fatalf("expected ExtractionError, got %T: %v", err, err)
	}
	if ee.Code != "http_500" {
		t.Errorf("expected code 'http_500', got %q", ee.Code)
	}
}

func TestFetchPageHTTP_ContextCancellation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(5 * time.Second)
	}))
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	_, err := FetchPageHTTP(ctx, srv.URL, 10*time.Second, 0)
	if err == nil {
		t.Fatal("expected error from cancelled context")
	}
}

func TestFetchPageHTTP_FollowsRedirects(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/final", http.StatusMovedPermanently)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte("<html>Final</html>"))
	}))
	defer srv.Close()

	result, err := FetchPageHTTP(context.Background(), srv.URL, 5*time.Second, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.HasSuffix(result.URL, "/final") {
		t.Errorf("expected final URL to end with '/final', got %q", result.URL)
	}
}

func TestIsHTMLContentType(t *testing.T) {
	tests := []struct {
		ct   string
		want bool
	}{
		{"text/html", true},
		{"text/html; charset=utf-8", true},
		{"application/xhtml+xml", true},
		{"text/plain", true},
		{"text/xml", true},
		{"application/pdf", false},
		{"image/png", false},
		{"application/json", false},
		{"", false},
	}
	for _, tt := range tests {
		got := isHTMLContentType(tt.ct)
		if got != tt.want {
			t.Errorf("isHTMLContentType(%q) = %v, want %v", tt.ct, got, tt.want)
		}
	}
}
