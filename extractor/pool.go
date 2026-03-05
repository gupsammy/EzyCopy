package extractor

import (
	"context"
	"fmt"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

// BrowserPool manages a shared Chrome instance for batch extraction.
// Unlike FetchPage (root command), this uses an ephemeral profile —
// no user data, safer for concurrent tab access.
type BrowserPool struct {
	browser  *rod.Browser
	launcher *launcher.Launcher // nil when using external Chrome via --browser-ws
}

// NewBrowserPool creates a browser pool. If wsURL is non-empty, it connects
// to an existing Chrome instance. Otherwise, it launches an ephemeral headless Chrome.
func NewBrowserPool(wsURL string) (*BrowserPool, error) {
	pool := &BrowserPool{}

	if wsURL != "" {
		browser := rod.New().ControlURL(wsURL)
		if err := browser.Connect(); err != nil {
			return nil, fmt.Errorf("failed to connect to Chrome at %s: %w", wsURL, err)
		}
		pool.browser = browser
	} else {
		l := launcher.New().Headless(true).Set("disable-gpu").Set("no-sandbox")
		controlURL, err := l.Launch()
		if err != nil {
			return nil, fmt.Errorf("failed to launch Chrome: %w", err)
		}
		pool.launcher = l

		browser := rod.New().ControlURL(controlURL)
		if err := browser.Connect(); err != nil {
			l.Cleanup()
			return nil, fmt.Errorf("failed to connect to Chrome: %w", err)
		}
		pool.browser = browser
	}

	return pool, nil
}

// FetchPage opens a new tab, navigates to the URL, extracts HTML, and closes the tab.
// Safe for concurrent use — each call gets its own tab.
func (bp *BrowserPool) FetchPage(ctx context.Context, url string, timeout time.Duration) (*PageResult, error) {
	page, err := bp.browser.Page(proto.TargetCreateTarget{URL: "about:blank"})
	if err != nil {
		return nil, fmt.Errorf("failed to create tab: %w", err)
	}
	defer func() {
		_ = page.Close()
	}()

	page = page.Context(ctx).Timeout(timeout)

	if err := page.Navigate(url); err != nil {
		return nil, fmt.Errorf("failed to navigate to %s: %w", url, err)
	}

	if err := page.WaitLoad(); err != nil {
		return nil, fmt.Errorf("page load timeout: %w", err)
	}

	// WaitStable replaces the old time.Sleep(2s) — waits for DOM to stabilize
	if err := page.WaitStable(300 * time.Millisecond); err != nil {
		// Non-fatal: page may be interactive enough
	}

	info, err := page.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get page info: %w", err)
	}

	html, err := page.HTML()
	if err != nil {
		return nil, fmt.Errorf("failed to extract HTML: %w", err)
	}

	return &PageResult{
		HTML:        html,
		URL:         info.URL,
		ContentType: "text/html",
	}, nil
}

// Close shuts down the browser. Only call after all FetchPage calls have returned.
func (bp *BrowserPool) Close() {
	if bp.browser != nil {
		_ = bp.browser.Close()
	}
	if bp.launcher != nil {
		bp.launcher.Cleanup()
	}
}
