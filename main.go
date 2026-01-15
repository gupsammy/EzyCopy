package main

import (
	"fmt"
	"net/url"
	"os"
	"time"

	"github.com/gupsammy/EzyCopyCLI/extractor"
	"github.com/gupsammy/EzyCopyCLI/output"
	"github.com/spf13/cobra"
)

var (
	version = "0.1.0"

	outputFlag   string
	noImages     bool
	timeout      time.Duration
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "ezycopy <url>",
		Short: "Extract web content as markdown",
		Long: `EzyCopy extracts article content from web pages and converts it to markdown.
Uses your Chrome browser profile for authentication (Twitter, paywalled sites, etc).

By default, content is printed to stdout and copied to clipboard.
Use -o to save to a file instead.`,
		Args:    cobra.ExactArgs(1),
		Version: version,
		RunE:    run,
	}

	rootCmd.Flags().StringVarP(&outputFlag, "output", "o", "", "Save to file (directory auto-generates name)")
	rootCmd.Flags().BoolVar(&noImages, "no-images", false, "Strip image links from output")
	rootCmd.Flags().DurationVarP(&timeout, "timeout", "t", 30*time.Second, "Page load timeout")

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
	fmt.Fprintln(os.Stderr, "Fetching page...")
	pageResult, err := extractor.FetchPage(inputURL, timeout)
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

	// Copy to clipboard
	if err := output.CopyToClipboard(markdown); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: failed to copy to clipboard: %v\n", err)
	} else {
		fmt.Fprintln(os.Stderr, "Copied to clipboard!")
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
