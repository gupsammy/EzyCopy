package batch

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestDomainLimiter_EnforcesDelay(t *testing.T) {
	limiter := NewDomainLimiter(100 * time.Millisecond)
	ctx := context.Background()

	start := time.Now()

	// First request should not wait
	if err := limiter.Wait(ctx, "https://example.com/a"); err != nil {
		t.Fatal(err)
	}

	// Second request to same domain should wait ~100ms
	if err := limiter.Wait(ctx, "https://example.com/b"); err != nil {
		t.Fatal(err)
	}

	elapsed := time.Since(start)
	if elapsed < 90*time.Millisecond {
		t.Errorf("expected >= 100ms delay, got %v", elapsed)
	}
}

func TestDomainLimiter_DifferentDomains(t *testing.T) {
	limiter := NewDomainLimiter(200 * time.Millisecond)
	ctx := context.Background()

	start := time.Now()

	// Two different domains should not block each other
	if err := limiter.Wait(ctx, "https://a.com/page"); err != nil {
		t.Fatal(err)
	}
	if err := limiter.Wait(ctx, "https://b.com/page"); err != nil {
		t.Fatal(err)
	}

	elapsed := time.Since(start)
	if elapsed > 50*time.Millisecond {
		t.Errorf("different domains should not wait, got %v", elapsed)
	}
}

func TestDomainLimiter_ContextCancellation(t *testing.T) {
	limiter := NewDomainLimiter(5 * time.Second)
	ctx, cancel := context.WithCancel(context.Background())

	// First request to establish the domain
	if err := limiter.Wait(ctx, "https://example.com/a"); err != nil {
		t.Fatal(err)
	}

	// Cancel before second request completes
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	err := limiter.Wait(ctx, "https://example.com/b")
	if err == nil {
		t.Error("expected context cancellation error")
	}
}

func TestDomainLimiter_ConcurrentSameDomain(t *testing.T) {
	limiter := NewDomainLimiter(50 * time.Millisecond)
	ctx := context.Background()

	start := time.Now()
	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			limiter.Wait(ctx, "https://same.com/page")
		}()
	}
	wg.Wait()

	elapsed := time.Since(start)
	// 3 requests with 50ms delay = at least ~100ms (first is free, second waits, third waits)
	if elapsed < 80*time.Millisecond {
		t.Errorf("expected >= 100ms for 3 concurrent same-domain requests, got %v", elapsed)
	}
}

func TestExtractDomain(t *testing.T) {
	tests := []struct {
		url    string
		domain string
	}{
		{"https://example.com/path", "example.com"},
		{"http://sub.example.com:8080/page", "sub.example.com"},
		{"not-a-url", ""},
	}
	for _, tt := range tests {
		got := extractDomain(tt.url)
		if got != tt.domain {
			t.Errorf("extractDomain(%q) = %q, want %q", tt.url, got, tt.domain)
		}
	}
}
