package extractor

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

// PageResult contains the fetched page data
type PageResult struct {
	HTML string
	URL  string // Final URL after redirects
}

// getDefaultChromeProfile returns the path to Chrome's default user data directory
func getDefaultChromeProfile() string {
	var userDataDir string

	switch runtime.GOOS {
	case "darwin":
		home, _ := os.UserHomeDir()
		userDataDir = filepath.Join(home, "Library", "Application Support", "Google", "Chrome")
	case "windows":
		userDataDir = filepath.Join(os.Getenv("LOCALAPPDATA"), "Google", "Chrome", "User Data")
	case "linux":
		home, _ := os.UserHomeDir()
		userDataDir = filepath.Join(home, ".config", "google-chrome")
	}

	return userDataDir
}

// FetchPage loads a URL using Chrome with the user's profile for authentication
func FetchPage(url string, timeout time.Duration) (*PageResult, error) {
	userDataDir := getDefaultChromeProfile()

	// Check if Chrome profile exists
	if _, err := os.Stat(userDataDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("Chrome profile not found at %s", userDataDir)
	}

	// Find Chrome executable
	chromePath, found := launcher.LookPath()
	if !found {
		return nil, fmt.Errorf("Chrome not found. Please install Google Chrome")
	}

	// Launch Chrome with user's profile
	// Note: Chrome must not be running, or we need to use a different approach
	l := launcher.New().
		Bin(chromePath).
		UserDataDir(userDataDir).
		Headless(true).
		Set("disable-gpu").
		Set("no-sandbox")

	controlURL, err := l.Launch()
	if err != nil {
		// If Chrome is already running with this profile, try without user data
		// This is a common issue - Chrome locks its profile
		return fetchWithoutProfile(url, timeout)
	}

	browser := rod.New().ControlURL(controlURL)
	if err := browser.Connect(); err != nil {
		return nil, fmt.Errorf("failed to connect to Chrome: %w", err)
	}
	defer browser.MustClose()

	return loadPage(browser, url, timeout)
}

// fetchWithoutProfile fetches the page using Rod's managed browser (no auth)
func fetchWithoutProfile(url string, timeout time.Duration) (*PageResult, error) {
	browser := rod.New()
	if err := browser.Connect(); err != nil {
		return nil, fmt.Errorf("failed to launch browser: %w", err)
	}
	defer browser.MustClose()

	return loadPage(browser, url, timeout)
}

// loadPage navigates to URL and extracts HTML
func loadPage(browser *rod.Browser, url string, timeout time.Duration) (*PageResult, error) {
	page := browser.MustPage()
	defer page.MustClose()

	// Set timeout for navigation
	page = page.Timeout(timeout)

	// Navigate to URL
	if err := page.Navigate(url); err != nil {
		return nil, fmt.Errorf("failed to navigate to %s: %w", url, err)
	}

	// Wait for page to be ready
	if err := page.WaitLoad(); err != nil {
		return nil, fmt.Errorf("page load timeout: %w", err)
	}

	// Additional wait for dynamic content (like Twitter)
	time.Sleep(2 * time.Second)

	// Get the final URL (after any redirects)
	info, err := page.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get page info: %w", err)
	}

	// Extract HTML
	html, err := page.HTML()
	if err != nil {
		return nil, fmt.Errorf("failed to extract HTML: %w", err)
	}

	return &PageResult{
		HTML: html,
		URL:  info.URL,
	}, nil
}
