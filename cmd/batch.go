package cmd

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gupsammy/EzyCopy/batch"
	"github.com/gupsammy/EzyCopy/extractor"
	"github.com/gupsammy/EzyCopy/output"
	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"
)

var (
	fileFlag     string
	concurrency  int
	rateLimit    time.Duration
	retries      int
	retryDelay   time.Duration
	failFast     bool
	skipExisting bool
	maxBodySize  string
)

func init() {
	batchCmd := &cobra.Command{
		Use:   "batch [url...]",
		Short: "Extract multiple URLs to NDJSON",
		Long: `Extract multiple URLs in parallel, streaming results as NDJSON (one JSON object per line).

Input sources (mutually exclusive):
  Positional args:  ezycopy batch https://a.com https://b.com
  File:             ezycopy batch --file urls.txt
  Stdin:            cat urls.txt | ezycopy batch -

Output is always NDJSON to stdout. Progress goes to stderr.`,
		RunE: runBatch,
	}

	f := batchCmd.Flags()
	f.StringVarP(&fileFlag, "file", "f", "", "Read URLs from file (one per line)")
	f.IntVarP(&concurrency, "concurrency", "j", 3, "Max parallel extractions")
	f.DurationVar(&rateLimit, "rate-limit", 1*time.Second, "Min delay between requests to same domain")
	f.IntVar(&retries, "retries", 2, "Retry count on transient failures")
	f.DurationVar(&retryDelay, "retry-delay", 3*time.Second, "Base delay between retries (exponential backoff)")
	f.BoolVar(&failFast, "fail-fast", false, "Stop on first error")
	f.BoolVar(&skipExisting, "skip-existing", false, "Skip URLs whose output file already exists (requires -o)")
	f.StringVar(&maxBodySize, "max-body-size", "10MB", "Max HTTP response body size")

	rootCmd.AddCommand(batchCmd)
}

func runBatch(cmd *cobra.Command, args []string) error {
	ctx := cmd.Context()

	// Collect URLs from mutually exclusive sources
	urls, err := collectURLs(args)
	if err != nil {
		return err
	}
	if len(urls) == 0 {
		return &UsageError{Msg: "no URLs provided", Hint: "ezycopy batch --help"}
	}

	// Parse max body size
	bodyLimit, err := parseByteSize(maxBodySize)
	if err != nil {
		return &UsageError{Msg: fmt.Sprintf("invalid --max-body-size: %v", err)}
	}

	// Validate retries
	if retries < 0 {
		return &UsageError{Msg: "--retries must be non-negative"}
	}

	// Setup concurrency primitives
	limiter := batch.NewDomainLimiter(rateLimit)
	retryCfg := &batch.RetryConfig{
		MaxAttempts: retries + 1, // retries=2 means 3 total attempts
		InitDelay:   retryDelay,
	}

	// Setup browser pool if needed
	var pool *extractor.BrowserPool
	if browserFlag {
		pool, err = extractor.NewBrowserPool(browserWS)
		if err != nil {
			return fmt.Errorf("failed to start browser: %w", err)
		}
		defer pool.Close()
	}

	// Validate output directory if set
	if outputFlag != "" {
		if err := os.MkdirAll(outputFlag, 0755); err != nil {
			return fmt.Errorf("failed to create output directory: %w", err)
		}
	}

	// Results channel — buffered to avoid blocking workers
	results := make(chan BatchResult, len(urls))

	// Writer goroutine — single writer to stdout, no interleaving
	var writerWg sync.WaitGroup
	writerWg.Add(1)
	var okCount, errCount int
	var errCodes []string
	go func() {
		defer writerWg.Done()
		enc := json.NewEncoder(os.Stdout)
		enc.SetEscapeHTML(false)
		for r := range results {
			enc.Encode(r)
			if r.Status == "ok" {
				okCount++
			} else {
				errCount++
				errCodes = append(errCodes, r.Error)
			}
		}
	}()

	// Worker pool
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(concurrency)

	for i, u := range urls {
		seq := i
		rawURL := u

		// With --fail-fast, stop scheduling new jobs once context is cancelled
		if failFast && gctx.Err() != nil {
			break
		}

		g.Go(func() error {
			result := fetchAndExtract(gctx, seq, rawURL, limiter, retryCfg, pool, bodyLimit)
			results <- result

			// Write to file if output dir is set and extraction succeeded
			if outputFlag != "" && result.Status == "ok" && result.Title != nil {
				writeResultToFile(result)
			}

			if !quiet {
				status := "ok"
				if result.Status == "error" {
					status = result.Error
				}
				fmt.Fprintf(os.Stderr, "[%d/%d] %s (%s)\n", seq+1, len(urls), rawURL, status)
			}

			if failFast && result.Status == "error" {
				return fmt.Errorf("failed: %s", rawURL)
			}
			return nil
		})
	}

	// Wait for all workers, then close results channel
	_ = g.Wait()
	close(results)
	writerWg.Wait()

	// Summary to stderr
	if !quiet {
		total := okCount + errCount
		if errCount > 0 {
			unique := uniqueStrings(errCodes)
			fmt.Fprintf(os.Stderr, "%d URLs: %d ok, %d failed (%s)\n", total, okCount, errCount, strings.Join(unique, ", "))
		} else {
			fmt.Fprintf(os.Stderr, "%d URLs: %d ok\n", total, okCount)
		}
	}

	// Exit code
	if errCount == len(urls) {
		return &batchError{code: ExitTotalFailure}
	}
	if errCount > 0 {
		return &batchError{code: ExitPartial}
	}
	return nil
}

func fetchAndExtract(ctx context.Context, seq int, rawURL string, limiter *batch.DomainLimiter, retryCfg *batch.RetryConfig, pool *extractor.BrowserPool, maxBody int64) BatchResult {
	start := time.Now()
	result := BatchResult{
		Seq:         seq,
		OriginalURL: rawURL,
		Type:        resolveType(),
		ExtractedAt: time.Now().UTC().Format(time.RFC3339),
	}

	var pageResult *extractor.PageResult
	var extractErr error

	err := retryCfg.Do(ctx, func() error {
		if err := limiter.Wait(ctx, rawURL); err != nil {
			return err
		}

		if pool != nil {
			pageResult, extractErr = pool.FetchPage(ctx, rawURL, timeout)
		} else {
			pageResult, extractErr = extractor.FetchPageHTTP(ctx, rawURL, timeout, maxBody)
		}
		return extractErr
	}, isRetryable)

	if err != nil {
		result.Status = "error"
		result.DurationMs = time.Since(start).Milliseconds()
		var ee *extractor.ExtractionError
		if errors.As(err, &ee) {
			result.Error = ee.Code
			result.Message = ee.Message
		} else {
			result.Error = "fetch_failed"
			result.Message = err.Error()
		}
		return result
	}

	// Extract article
	article, err := extractor.ExtractArticle(pageResult.HTML, pageResult.URL)
	if err != nil {
		result.Status = "error"
		result.Error = "extract_failed"
		result.Message = err.Error()
		result.FinalURL = pageResult.URL
		result.ContentType = pageResult.ContentType
		result.DurationMs = time.Since(start).Milliseconds()
		return result
	}

	// Convert to markdown
	includeImages := !noImages
	markdown, err := extractor.FormatArticle(article, includeImages)
	if err != nil {
		result.Status = "error"
		result.Error = "format_failed"
		result.Message = err.Error()
		result.FinalURL = pageResult.URL
		result.ContentType = pageResult.ContentType
		result.DurationMs = time.Since(start).Milliseconds()
		return result
	}

	title := article.Title
	result.Status = "ok"
	result.FinalURL = pageResult.URL
	result.Title = &title
	result.ContentType = pageResult.ContentType
	result.Markdown = markdown
	result.DurationMs = time.Since(start).Milliseconds()
	return result
}

// isRetryable returns true for transient errors worth retrying.
func isRetryable(err error) bool {
	var ee *extractor.ExtractionError
	if errors.As(err, &ee) {
		// Don't retry content-type or body-size errors
		switch ee.Code {
		case "unsupported_content_type", "body_too_large":
			return false
		}
		// Retry 5xx errors
		if strings.HasPrefix(ee.Code, "http_5") {
			return true
		}
	}
	// Retry generic fetch errors (timeouts, connection resets)
	return true
}

func collectURLs(args []string) ([]string, error) {
	hasArgs := len(args) > 0
	hasFile := fileFlag != ""

	// Args and --file are explicitly provided and mutually exclusive
	if hasArgs && hasFile {
		return nil, &UsageError{
			Msg:  "cannot use both positional args and --file",
			Hint: "ezycopy batch --help",
		}
	}

	if hasArgs {
		// Special case: "ezycopy batch -" means stdin
		if len(args) == 1 && args[0] == "-" {
			return readURLsFromReader(os.Stdin)
		}
		return args, nil
	}

	if hasFile {
		f, err := os.Open(fileFlag)
		if err != nil {
			return nil, fmt.Errorf("failed to open URL file: %w", err)
		}
		defer f.Close()
		return readURLsFromReader(f)
	}

	// No args and no --file: try stdin if it's a pipe
	if isPipeInput() {
		return readURLsFromReader(os.Stdin)
	}

	return nil, nil
}

func readURLsFromReader(r *os.File) ([]string, error) {
	var urls []string
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		urls = append(urls, line)
	}
	return urls, scanner.Err()
}

func isPipeInput() bool {
	info, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return info.Mode()&os.ModeCharDevice == 0
}

func writeResultToFile(result BatchResult) {
	if result.Title == nil || *result.Title == "" {
		return
	}

	// Use output package's resolve path for consistent naming
	filePath, err := output.ResolveOutputPath(outputFlag, *result.Title)
	if err != nil {
		return
	}

	if skipExisting {
		if _, err := os.Stat(filePath); err == nil {
			return // File exists, skip
		}
	}

	// Handle collisions by appending -2, -3, etc.
	filePath = resolveCollision(filePath)

	_ = output.WriteToFile(filePath, result.Markdown)
}

func resolveCollision(path string) string {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return path
	}

	ext := filepath.Ext(path)
	base := strings.TrimSuffix(path, ext)

	for i := 2; i < 1000; i++ {
		candidate := fmt.Sprintf("%s-%d%s", base, i, ext)
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
	return path
}

func parseByteSize(s string) (int64, error) {
	s = strings.TrimSpace(strings.ToUpper(s))
	if s == "0" {
		return 0, nil
	}

	// Check longest suffixes first to avoid "MB" matching "B"
	suffixes := []struct {
		suffix string
		mult   int64
	}{
		{"GB", 1024 * 1024 * 1024},
		{"MB", 1024 * 1024},
		{"KB", 1024},
		{"B", 1},
	}

	for _, entry := range suffixes {
		if strings.HasSuffix(s, entry.suffix) {
			numStr := strings.TrimSuffix(s, entry.suffix)
			var n int64
			_, err := fmt.Sscanf(numStr, "%d", &n)
			if err != nil {
				return 0, fmt.Errorf("cannot parse %q", s)
			}
			return n * entry.mult, nil
		}
	}

	// Plain number = bytes
	var n int64
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}

func uniqueStrings(ss []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, s := range ss {
		if !seen[s] {
			seen[s] = true
			result = append(result, s)
		}
	}
	return result
}

// sanitizeFilenameForBatch creates a filesystem-safe filename from a title.
var unsafeCharsRe = regexp.MustCompile(`[^a-zA-Z0-9]+`)

func sanitizeFilenameForBatch(title string) string {
	if len(title) > 50 {
		title = title[:50]
	}
	safe := unsafeCharsRe.ReplaceAllString(title, "-")
	safe = strings.Trim(safe, "-")
	if safe == "" {
		safe = "untitled"
	}
	return safe + ".md"
}

// batchError carries an exit code without a user-visible message.
type batchError struct {
	code int
}

func (e *batchError) Error() string {
	return fmt.Sprintf("batch completed with exit code %d", e.code)
}
