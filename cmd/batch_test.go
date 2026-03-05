package cmd

import (
	"testing"
)

func TestParseByteSize(t *testing.T) {
	tests := []struct {
		input string
		want  int64
		err   bool
	}{
		{"10MB", 10 * 1024 * 1024, false},
		{"1GB", 1024 * 1024 * 1024, false},
		{"512KB", 512 * 1024, false},
		{"100B", 100, false},
		{"0", 0, false},
		{"1024", 1024, false},
		{"invalid", 0, true},
	}
	for _, tt := range tests {
		got, err := parseByteSize(tt.input)
		if tt.err {
			if err == nil {
				t.Errorf("parseByteSize(%q) expected error", tt.input)
			}
			continue
		}
		if err != nil {
			t.Errorf("parseByteSize(%q) unexpected error: %v", tt.input, err)
			continue
		}
		if got != tt.want {
			t.Errorf("parseByteSize(%q) = %d, want %d", tt.input, got, tt.want)
		}
	}
}

func TestUniqueStrings(t *testing.T) {
	input := []string{"a", "b", "a", "c", "b"}
	got := uniqueStrings(input)
	if len(got) != 3 || got[0] != "a" || got[1] != "b" || got[2] != "c" {
		t.Errorf("uniqueStrings(%v) = %v, want [a b c]", input, got)
	}
}

func TestResolveCollision(t *testing.T) {
	// Non-existent file — should return as-is
	path := "/tmp/ezycopy-test-nonexistent-file-abc123.md"
	got := resolveCollision(path)
	if got != path {
		t.Errorf("resolveCollision(%q) = %q, want same path", path, got)
	}
}
