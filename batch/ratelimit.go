package batch

import (
	"context"
	"net/url"
	"sync"
	"time"
)

// DomainLimiter enforces a minimum delay between requests to the same domain.
type DomainLimiter struct {
	mu       sync.Mutex
	minDelay time.Duration
	last     map[string]time.Time
}

// NewDomainLimiter creates a rate limiter with the given minimum delay per domain.
func NewDomainLimiter(minDelay time.Duration) *DomainLimiter {
	return &DomainLimiter{
		minDelay: minDelay,
		last:     make(map[string]time.Time),
	}
}

// Wait blocks until it's safe to make a request to the given URL's domain.
// It reserves the slot before returning, so concurrent callers are serialized per domain.
func (d *DomainLimiter) Wait(ctx context.Context, rawURL string) error {
	domain := extractDomain(rawURL)

	d.mu.Lock()
	lastReq, ok := d.last[domain]
	now := time.Now()

	if ok {
		elapsed := now.Sub(lastReq)
		if elapsed < d.minDelay {
			wait := d.minDelay - elapsed
			// Reserve the slot before releasing the lock
			d.last[domain] = now.Add(wait)
			d.mu.Unlock()

			select {
			case <-time.After(wait):
				return nil
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}

	d.last[domain] = now
	d.mu.Unlock()
	return nil
}

func extractDomain(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	return u.Hostname()
}
