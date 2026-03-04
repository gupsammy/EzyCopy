package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"time"

	"github.com/gupsammy/EzyCopy/extractor"
	"github.com/gupsammy/EzyCopy/output"
	"github.com/spf13/cobra"
)

var (
	Version = "2.0.0"

	// Persistent flags (shared across root + subcommands)
	outputFlag  string
	noImages    bool
	timeout     time.Duration
	browserFlag bool
	browserWS   string
	typeFlag    string
	jsonFlag    bool
	quiet       bool
	verbose     bool
	noColor     bool

	// Root-only flags
	clipboardFlag bool
)

var rootCmd = &cobra.Command{
	Use:   "ezycopy <url>",
	Short: "Extract web content as markdown",
	Long: `EzyCopy extracts article content from web pages and converts it to markdown.

By default, uses fast HTTP fetch. Use --browser for JS-heavy sites (Twitter, SPAs)
or authenticated content (uses your Chrome profile).

Content is printed to stdout. Use -c to copy to clipboard, -o to save to a file.
Use --json for structured JSON output.`,
	Args:    cobra.ExactArgs(1),
	Version: Version,
	RunE:    runRoot,

	SilenceUsage:  true,
	SilenceErrors: true,
}

func init() {
	// Persistent flags — available to root and all subcommands
	pf := rootCmd.PersistentFlags()
	pf.StringVarP(&outputFlag, "output", "o", "", "Save to file (directory auto-generates name)")
	pf.BoolVar(&noImages, "no-images", false, "Strip image links from output")
	pf.DurationVarP(&timeout, "timeout", "t", 30*time.Second, "Page load timeout")
	pf.BoolVar(&browserFlag, "browser", false, "Use Chrome browser (for JS-heavy or authenticated sites)")
	pf.StringVar(&browserWS, "browser-ws", "", "Connect to existing Chrome via DevTools WebSocket URL")
	pf.StringVar(&typeFlag, "type", "", "Content type hint: article, github")
	pf.BoolVar(&jsonFlag, "json", false, "Emit JSON output instead of raw markdown")
	pf.BoolVarP(&quiet, "quiet", "q", false, "Suppress progress messages")
	pf.BoolVarP(&verbose, "verbose", "v", false, "Debug output to stderr")
	pf.BoolVar(&noColor, "no-color", false, "Disable ANSI colors")

	// Root-only flags
	rootCmd.Flags().BoolVarP(&clipboardFlag, "clipboard", "c", false, "Copy output to clipboard")

	// browser-ws implies browser
	rootCmd.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {
		if browserWS != "" {
			browserFlag = true
		}
		// Respect NO_COLOR env
		if os.Getenv("NO_COLOR") != "" {
			noColor = true
		}
		return nil
	}
}

// Execute sets up signal handling and runs the root command.
func Execute() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	// Second Ctrl-C forces exit
	go func() {
		<-ctx.Done()
		// Context cancelled by first signal; wait for second
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, os.Interrupt)
		<-sig
		os.Exit(130)
	}()

	rootCmd.SetContext(ctx)

	if err := rootCmd.Execute(); err != nil {
		// Check for batch error with explicit exit code
		if be, ok := err.(*batchError); ok {
			os.Exit(be.code)
		}
		exitCode := ExitPartial
		if isUsageError(err) {
			exitCode = ExitInvalidUsage
		}
		writeFatalError(err, exitCode)
		os.Exit(exitCode)
	}
}

func runRoot(cmd *cobra.Command, args []string) error {
	start := time.Now()
	inputURL := args[0]

	if _, err := url.ParseRequestURI(inputURL); err != nil {
		return &UsageError{Msg: fmt.Sprintf("invalid URL: %s", inputURL)}
	}

	// Fetch page
	var pageResult *extractor.PageResult
	var err error
	if browserFlag {
		if !quiet {
			fmt.Fprintln(os.Stderr, "Fetching page (browser)...")
		}
		if browserWS != "" {
			// Use BrowserPool to connect to existing Chrome via DevTools WebSocket
			pool, poolErr := extractor.NewBrowserPool(browserWS)
			if poolErr != nil {
				return fmt.Errorf("failed to connect to browser: %w", poolErr)
			}
			defer pool.Close()
			pageResult, err = pool.FetchPage(cmd.Context(), inputURL, timeout)
		} else {
			pageResult, err = extractor.FetchPage(inputURL, timeout)
		}
	} else {
		if !quiet {
			fmt.Fprintln(os.Stderr, "Fetching page...")
		}
		pageResult, err = extractor.FetchPageHTTP(cmd.Context(), inputURL, timeout, 0)
	}
	if err != nil {
		return fmt.Errorf("failed to fetch page: %w", err)
	}

	// Extract article
	if !quiet {
		fmt.Fprintln(os.Stderr, "Extracting content...")
	}
	article, err := extractor.ExtractArticle(pageResult.HTML, pageResult.URL)
	if err != nil {
		return fmt.Errorf("failed to extract content: %w", err)
	}

	// Convert to markdown
	includeImages := !noImages
	markdown, err := extractor.FormatArticle(article, includeImages)
	if err != nil {
		return fmt.Errorf("failed to convert to markdown: %w", err)
	}

	durationMs := time.Since(start).Milliseconds()

	// JSON output
	if jsonFlag {
		result := SingleResult{
			OriginalURL: inputURL,
			FinalURL:    pageResult.URL,
			Title:       article.Title,
			Author:      article.Byline,
			Type:        resolveType(),
			ContentType: pageResult.ContentType,
			Markdown:    markdown,
			DurationMs:  durationMs,
			ExtractedAt: time.Now().UTC().Format(time.RFC3339),
		}
		enc := json.NewEncoder(os.Stdout)
		enc.SetEscapeHTML(false)
		return enc.Encode(result)
	}

	// Default: raw markdown to stdout
	fmt.Println(markdown)

	// Copy to clipboard if requested
	if clipboardFlag {
		if err := output.CopyToClipboard(markdown); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: failed to copy to clipboard: %v\n", err)
		} else if !quiet {
			fmt.Fprintln(os.Stderr, "Copied to clipboard!")
		}
	}

	// Save to file if requested
	if outputFlag != "" {
		filePath, err := output.ResolveOutputPath(outputFlag, article.Title)
		if err != nil {
			return fmt.Errorf("failed to resolve output path: %w", err)
		}
		if err := output.WriteToFile(filePath, markdown); err != nil {
			return fmt.Errorf("failed to write file: %w", err)
		}
		if !quiet {
			fmt.Fprintf(os.Stderr, "Saved to: %s\n", filePath)
		}
	}

	return nil
}

func resolveType() string {
	if typeFlag != "" {
		return typeFlag
	}
	return "article"
}

func writeFatalError(err error, exitCode int) {
	fe := FatalError{
		Error:   "runtime_error",
		Message: err.Error(),
	}
	if exitCode == ExitInvalidUsage {
		fe.Error = "invalid_usage"
		fe.Hint = "ezycopy --help"
	}
	// Only write structured JSON if stderr is not a TTY or noColor is set
	if noColor || !isTTY(os.Stderr) {
		json.NewEncoder(os.Stderr).Encode(fe)
	} else {
		fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
	}
}

func isTTY(f *os.File) bool {
	info, err := f.Stat()
	if err != nil {
		return false
	}
	return info.Mode()&os.ModeCharDevice != 0
}
