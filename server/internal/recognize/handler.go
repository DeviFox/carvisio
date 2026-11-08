// Package recognize turns a photo or PDF of a receipt, a work order or a
// handwritten note into a draft of service records. Gemini reads the
// document; the draft goes back to the browser for review and is never
// stored here, and neither is the file.
package recognize

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/DeviFox/carfolio/server/internal/auth"
	"github.com/DeviFox/carfolio/server/internal/httpx"
	"github.com/DeviFox/carfolio/server/internal/ratelimit"
)

const (
	maxFileBytes    = 8 << 20 // the browser downsizes photos well below this
	maxContextBytes = 128 << 10
	maxBodyBytes    = maxFileBytes + maxContextBytes + 64<<10 // + multipart overhead
	dailyLimit      = 30                                      // recognitions per user
	maxInFlight     = 4                                       // concurrent Gemini calls; each holds the file in memory
	requestTimeout  = 90 * time.Second
)

type Handler struct {
	gemini  *gemini // nil when not configured
	limiter *ratelimit.Limiter
	slots   chan struct{}
	log     *slog.Logger
	now     func() time.Time
}

// NewHandler returns a handler that answers 503 when cfg has no BaseURL.
func NewHandler(cfg GeminiConfig, log *slog.Logger) *Handler {
	h := &Handler{
		limiter: ratelimit.New(dailyLimit, 24*time.Hour),
		slots:   make(chan struct{}, maxInFlight),
		log:     log,
		now:     time.Now,
	}
	if cfg.BaseURL != "" {
		h.gemini = newGemini(cfg)
	}
	return h
}

func (h *Handler) Routes(mux *http.ServeMux, requireUser func(http.Handler) http.Handler) {
	mux.Handle("POST /api/recognize", requireUser(http.HandlerFunc(h.recognize)))
}

func (h *Handler) recognize(w http.ResponseWriter, r *http.Request) {
	if h.gemini == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "recognition is not configured")
		return
	}
	user := auth.UserFrom(r.Context())

	file, mimeType, rc, status, msg := readRequest(w, r)
	if status != 0 {
		httpx.Error(w, status, msg)
		return
	}
	// Counted only for well-formed requests, so a wrong file type does not
	// use up the owner's quota.
	if !h.limiter.Allow(user.ID) {
		httpx.Error(w, http.StatusTooManyRequests, "daily recognition limit reached")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()
	select {
	case h.slots <- struct{}{}:
		defer func() { <-h.slots }()
	case <-ctx.Done():
		httpx.Error(w, http.StatusServiceUnavailable, "recognition is busy, try again")
		return
	}

	start := h.now()
	today := start.UTC()
	var out modelOutput
	use, err := h.gemini.generate(ctx, file, mimeType, systemPrompt, userPrompt(rc.Components, today),
		responseSchema(rc.Components), &out)
	logAttrs := []any{"user", user.ID, "mime", mimeType, "bytes", len(file),
		"ms", time.Since(start).Milliseconds(), "promptTokens", use.PromptTokens, "outputTokens", use.OutputTokens}
	if err != nil {
		h.log.Warn("recognition failed", append(logAttrs, "err", err)...)
		if errors.Is(err, errUnreadable) {
			httpx.Error(w, http.StatusUnprocessableEntity, "could not read the document")
		} else {
			httpx.Error(w, http.StatusBadGateway, "recognition unavailable, try again later")
		}
		return
	}

	res := normalize(out, rc.Components, today)
	h.log.Info("recognized", append(logAttrs, "items", len(res.Items))...)
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, res)
}

// readRequest parses the multipart body: "file" (the document) and
// "context" (JSON, see Context). A non-zero status means the request is
// refused with msg.
func readRequest(w http.ResponseWriter, r *http.Request) (file []byte, mimeType string, rc Context, status int, msg string) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	mr, err := r.MultipartReader()
	if err != nil {
		return nil, "", rc, http.StatusBadRequest, "expected multipart/form-data"
	}

	var gotContext bool
	for {
		part, err := mr.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return tooLargeOr(err, "invalid multipart body")
		}
		switch part.FormName() {
		case "file":
			if file != nil {
				return nil, "", rc, http.StatusBadRequest, "only one file is allowed"
			}
			if file, err = readPart(part, maxFileBytes); err != nil {
				return tooLargeOr(err, "invalid file")
			}
		case "context":
			data, err := readPart(part, maxContextBytes)
			if err != nil {
				return tooLargeOr(err, "invalid context")
			}
			dec := json.NewDecoder(bytes.NewReader(data))
			dec.DisallowUnknownFields()
			if err := dec.Decode(&rc); err != nil {
				return nil, "", rc, http.StatusBadRequest, "context: invalid JSON"
			}
			gotContext = true
		}
		part.Close()
	}

	switch {
	case len(file) == 0:
		return nil, "", rc, http.StatusBadRequest, "file is required"
	case !gotContext:
		return nil, "", rc, http.StatusBadRequest, "context is required"
	}
	if err := rc.Validate(); err != nil {
		return nil, "", rc, http.StatusBadRequest, err.Error()
	}
	if mimeType = detectType(file); mimeType == "" {
		return nil, "", rc, http.StatusUnsupportedMediaType, "supported files: JPEG, PNG, WebP, HEIC, PDF"
	}
	return file, mimeType, rc, 0, ""
}

var errPartTooLarge = errors.New("part too large")

func readPart(p *multipart.Part, max int64) ([]byte, error) {
	data, err := io.ReadAll(io.LimitReader(p, max+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > max {
		return nil, errPartTooLarge
	}
	return data, nil
}

func tooLargeOr(err error, msg string) ([]byte, string, Context, int, string) {
	var maxErr *http.MaxBytesError
	if errors.Is(err, errPartTooLarge) || errors.As(err, &maxErr) {
		return nil, "", Context{}, http.StatusRequestEntityTooLarge, "file is too large (max 8 MB)"
	}
	return nil, "", Context{}, http.StatusBadRequest, msg
}

// detectType sniffs the file instead of trusting the client's
// Content-Type. Returns "" for anything Gemini should not get.
func detectType(b []byte) string {
	switch t := http.DetectContentType(b); t {
	case "image/jpeg", "image/png", "image/webp", "application/pdf":
		return t
	}
	// HEIC (iPhone photos): an ISO BMFF "ftyp" box with a HEIF brand.
	if len(b) >= 12 && string(b[4:8]) == "ftyp" {
		switch string(b[8:12]) {
		case "heic", "heix", "heim", "heis", "hevc", "hevx":
			return "image/heic"
		case "mif1", "msf1":
			return "image/heif"
		}
	}
	return ""
}
