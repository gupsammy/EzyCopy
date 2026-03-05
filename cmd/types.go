package cmd

// Exit codes
const (
	ExitOK           = 0
	ExitPartial      = 1 // One or more URLs failed (batch: partial; root: extraction failed)
	ExitInvalidUsage = 2 // Bad flag, missing arg, conflicting input sources
	ExitTotalFailure = 3 // All URLs failed (batch only)
)

// SingleResult is the JSON output for the root command with --json.
type SingleResult struct {
	OriginalURL string `json:"original_url"`
	FinalURL    string `json:"final_url"`
	Title       string `json:"title"`
	Author      string `json:"author,omitempty"`
	Type        string `json:"type"`
	ContentType string `json:"content_type"`
	Markdown    string `json:"markdown"`
	DurationMs  int64  `json:"duration_ms"`
	ExtractedAt string `json:"extracted_at"`
}

// BatchResult is one line of NDJSON output from the batch subcommand.
type BatchResult struct {
	Seq         int    `json:"seq"`
	OriginalURL string `json:"original_url"`
	FinalURL    string `json:"final_url,omitempty"`
	Title       *string `json:"title"` // null on error
	Type        string `json:"type"`
	ContentType string `json:"content_type,omitempty"`
	Status      string `json:"status"` // "ok" or "error"
	Error       string `json:"error,omitempty"`
	Message     string `json:"message,omitempty"`
	Markdown    string `json:"markdown,omitempty"`
	DurationMs  int64  `json:"duration_ms"`
	ExtractedAt string `json:"extracted_at"`
}

// FatalError is the structured error written to stderr for usage/config errors.
type FatalError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Hint    string `json:"hint,omitempty"`
}

// UsageError indicates invalid CLI usage (exit code 2).
type UsageError struct {
	Msg  string
	Hint string
}

func (e *UsageError) Error() string {
	return e.Msg
}

func isUsageError(err error) bool {
	_, ok := err.(*UsageError)
	return ok
}

