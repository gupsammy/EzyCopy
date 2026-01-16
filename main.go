package main

import (
	"fmt"
	"net/url"
	"os"
	"time"

	"github.com/gupsammy/EzyCopy/extractor"
	"github.com/gupsammy/EzyCopy/output"
	"github.com/spf13/cobra"
)

var (
	version = "0.2.0"

	outputFlag    string
	noImages      bool
	timeout       time.Duration
	browserFlag   bool
	clipboardFlag bool
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "ezycopy <url>",
		Short: "Extract web content as markdown",
		Long: `EzyCopy extracts article content from web pages and converts it to markdown.

By default, uses fast HTTP fetch. Use --browser for JS-heavy sites (Twitter, SPAs)
or authenticated content (uses your Chrome profile).

Content is printed to stdout. Use -c to copy to clipboard, -o to save to a file.`,
		Args:    cobra.ExactArgs(1),
		Version: version,
		RunE:    run,
	}

	rootCmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Save to file (directory auto-generates name)")
	rootCmd.Flags().BoolVar(&noImages, "no-images", false, "Strip image links from output")
	rootCmd.Flags().DurationVarP(&timeout, "timeout", "t", 30*time.Second, "Page load timeout")
	rootCmd.Flags().BoolVar(&browserFlag, "browser", false, "Use Chrome browser (for JS-heavy or authenticated sites)")
	rootCmd.Flags().BoolVarP(&clipboardFlag, "clipboard", "c", false, "Copy output to clipboard")

	if err := rootCmd.Execute(); err != nil {
		os.Exit(2)
	}
}

func run(cmd *cobra.Command, args []string) error {
	inputURL := args[0]

	// Validate URL
	if _, err := url.ParseRequestURI(inputURL); err != nil {
		return fmt.Errorf("invalid URL: %s", inputURL)
	}

	// Fetch page
	var pageResult *extractor.PageResult
	var err error
	if browserFlag {
		fmt.Fprintln(os.Stderr, "Fetching page (browser)...")
		pageResult, err = extractor.FetchPage(inputURL, timeout)
	} else {
		fmt.Fprintln(os.Stderr, "Fetching page...")
		pageResult, err = extractor.FetchPageHTTP(inputURL, timeout)
	}
	if err != nil {
		return fmt.Errorf("failed to fetch page: %w", err)
	}

	// Extract article
	fmt.Fprintln(os.Stderr, "Extracting content...")
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

	// Output to stdout
	fmt.Println(markdown)

	// Copy to clipboard if requested
	if clipboardFlag {
		if err := output.CopyToClipboard(markdown); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: failed to copy to clipboard: %v\n", err)
		} else {
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

		fmt.Fprintf(os.Stderr, "Saved to: %s\n", filePath)
	}

	return nil
}
