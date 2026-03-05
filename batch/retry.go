package batch

import (
	"context"
	"time"
)

// RetryConfig controls exponential backoff retry behavior.
type RetryConfig struct {
	MaxAttempts int           // Total attempts (1 = no retry)
	InitDelay   time.Duration // Delay before first retry; doubles each attempt
}

// Do executes fn with retries on error. It uses exponential backoff and
// respects context cancellation. Only retries if shouldRetry returns true.
func (rc *RetryConfig) Do(ctx context.Context, fn func() error, shouldRetry func(error) bool) error {
	var lastErr error
	delay := rc.InitDelay

	for attempt := 0; attempt < rc.MaxAttempts; attempt++ {
		lastErr = fn()
		if lastErr == nil {
			return nil
		}

		if !shouldRetry(lastErr) {
			return lastErr
		}

		// Don't sleep after the last attempt
		if attempt < rc.MaxAttempts-1 {
			select {
			case <-time.After(delay):
				delay *= 2
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}
	return lastErr
}
