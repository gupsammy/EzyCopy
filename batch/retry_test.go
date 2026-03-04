package batch

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestRetryConfig_NoRetryOnSuccess(t *testing.T) {
	rc := &RetryConfig{MaxAttempts: 3, InitDelay: 10 * time.Millisecond}
	calls := 0

	err := rc.Do(context.Background(), func() error {
		calls++
		return nil
	}, func(error) bool { return true })

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calls != 1 {
		t.Errorf("expected 1 call, got %d", calls)
	}
}

func TestRetryConfig_RetriesOnTransientError(t *testing.T) {
	rc := &RetryConfig{MaxAttempts: 3, InitDelay: 10 * time.Millisecond}
	calls := 0

	err := rc.Do(context.Background(), func() error {
		calls++
		if calls < 3 {
			return errors.New("transient")
		}
		return nil
	}, func(error) bool { return true })

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calls != 3 {
		t.Errorf("expected 3 calls, got %d", calls)
	}
}

func TestRetryConfig_StopsOnNonRetryable(t *testing.T) {
	rc := &RetryConfig{MaxAttempts: 5, InitDelay: 10 * time.Millisecond}
	calls := 0
	permanent := errors.New("permanent")

	err := rc.Do(context.Background(), func() error {
		calls++
		return permanent
	}, func(err error) bool { return err.Error() != "permanent" })

	if err != permanent {
		t.Fatalf("expected permanent error, got %v", err)
	}
	if calls != 1 {
		t.Errorf("expected 1 call (no retry), got %d", calls)
	}
}

func TestRetryConfig_ExponentialBackoff(t *testing.T) {
	rc := &RetryConfig{MaxAttempts: 3, InitDelay: 50 * time.Millisecond}
	calls := 0

	start := time.Now()
	rc.Do(context.Background(), func() error {
		calls++
		return errors.New("fail")
	}, func(error) bool { return true })

	elapsed := time.Since(start)
	// Expected: 50ms + 100ms = 150ms minimum
	if elapsed < 130*time.Millisecond {
		t.Errorf("expected >= 150ms for exponential backoff, got %v", elapsed)
	}
}

func TestRetryConfig_ContextCancellation(t *testing.T) {
	rc := &RetryConfig{MaxAttempts: 10, InitDelay: 5 * time.Second}
	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	err := rc.Do(ctx, func() error {
		return errors.New("fail")
	}, func(error) bool { return true })

	if err == nil {
		t.Error("expected error from cancelled context")
	}
}
