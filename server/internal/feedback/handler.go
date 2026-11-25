// Package feedback takes messages from the in-app feedback form: it saves
// each one to the database, then forwards it by email to the owner.
package feedback

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/DeviFox/carfolio/server/internal/auth"
	"github.com/DeviFox/carfolio/server/internal/httpx"
	"github.com/DeviFox/carfolio/server/internal/mailer"
	"github.com/DeviFox/carfolio/server/internal/ratelimit"
)

const (
	maxMessageRunes = 2000
	maxEmailLen     = 254
	maxPageLen      = 300
	maxVersionLen   = 40
	maxAgentLen     = 300
	maxBodyBytes    = 16 << 10 // 16 KiB: 2000 characters of any script fit with room
	sendTimeout     = 30 * time.Second
)

type Options struct {
	To         string // the owner's inbox; empty = save only, send nothing
	TrustProxy bool
}

type Handler struct {
	store   *Store
	mailer  mailer.Mailer
	log     *slog.Logger
	opts    Options
	limiter *ratelimit.Limiter
}

func NewHandler(store *Store, m mailer.Mailer, log *slog.Logger, opts Options) *Handler {
	return &Handler{
		store:  store,
		mailer: m,
		log:    log,
		opts:   opts,
		// A person writes a few messages at most; a script writes hundreds.
		limiter: ratelimit.New(5, time.Hour),
	}
}

// Routes registers the endpoint behind optionalUser
// (auth.Handler.OptionalUser): guests can write, signed-in users are known.
func (h *Handler) Routes(mux *http.ServeMux, optionalUser func(http.Handler) http.Handler) {
	mux.Handle("POST /api/feedback", optionalUser(http.HandlerFunc(h.create)))
}

type input struct {
	Message    string `json:"message"`
	Email      string `json:"email"`
	Page       string `json:"page"`
	AppVersion string `json:"appVersion"`
	// Honeypot: hidden from people, filled in by form-spamming bots.
	Website string `json:"website"`
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var in input
	if err := httpx.ReadJSONWith(w, r, &in, httpx.ReadOptions{MaxBytes: maxBodyBytes}); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if !h.limiter.Allow(httpx.ClientIP(r, h.opts.TrustProxy)) {
		httpx.Error(w, http.StatusTooManyRequests, "too many messages, try again later")
		return
	}
	// A bot gets the same answer as a person, so it has nothing to tune against.
	if in.Website != "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	e := Entry{
		Message:    strings.TrimSpace(in.Message),
		Email:      strings.ToLower(strings.TrimSpace(in.Email)),
		Page:       clip(strings.TrimSpace(in.Page), maxPageLen),
		AppVersion: clip(strings.TrimSpace(in.AppVersion), maxVersionLen),
		UserAgent:  clip(r.UserAgent(), maxAgentLen),
	}
	if msg := validate(e); msg != "" {
		httpx.Error(w, http.StatusUnprocessableEntity, msg)
		return
	}
	if u := auth.UserFrom(r.Context()); u.ID != "" {
		e.UserID = u.ID
		if e.Email == "" {
			e.Email = u.Email
		}
	}

	if err := h.store.Create(r.Context(), &e); err != nil {
		h.log.Error("request failed", "op", "save feedback", "err", err)
		httpx.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	// The message is safe in the database: the visitor does not wait for
	// the mail server, and a failed send loses nothing.
	if h.opts.To != "" {
		go h.send(e)
	}
	w.WriteHeader(http.StatusNoContent)
}

func validate(e Entry) string {
	n := utf8.RuneCountInString(e.Message)
	switch {
	case n == 0:
		return "message is required"
	case n > maxMessageRunes:
		return fmt.Sprintf("message is longer than %d characters", maxMessageRunes)
	case !utf8.ValidString(e.Message):
		return "message is not valid text"
	}
	if e.Email != "" {
		addr, err := mail.ParseAddress(e.Email)
		if err != nil || addr.Address != e.Email || len(e.Email) > maxEmailLen {
			return "invalid email"
		}
	}
	if e.Page != "" && !strings.HasPrefix(e.Page, "/") {
		return "invalid page"
	}
	return ""
}

func (h *Handler) send(e Entry) {
	ctx, cancel := context.WithTimeout(context.Background(), sendTimeout)
	defer cancel()

	err := h.mailer.Send(ctx, mailer.Message{
		To:      h.opts.To,
		ReplyTo: e.Email, // "Reply" in the inbox answers the visitor directly
		Subject: "Отзыв carvisio: " + subjectLine(e.Message),
		Body:    body(e),
	})
	if err != nil {
		h.log.Error("feedback email failed", "id", e.ID, "err", err)
	}
}

func body(e Entry) string {
	or := func(v, fallback string) string {
		if v == "" {
			return fallback
		}
		return v
	}
	account := "гость"
	if e.UserID != "" {
		account = e.UserID
	}
	var b strings.Builder
	b.WriteString(e.Message)
	b.WriteString("\n\n—\n")
	fmt.Fprintf(&b, "Ответить: %s\n", or(e.Email, "адрес не оставлен"))
	fmt.Fprintf(&b, "Аккаунт: %s\n", account)
	fmt.Fprintf(&b, "Страница: %s\n", or(e.Page, "—"))
	fmt.Fprintf(&b, "Версия: %s\n", or(e.AppVersion, "—"))
	fmt.Fprintf(&b, "Устройство: %s\n", or(e.UserAgent, "—"))
	fmt.Fprintf(&b, "Время: %s\n", e.CreatedAt.UTC().Format("2006-01-02 15:04 UTC"))
	fmt.Fprintf(&b, "ID: %s\n", e.ID)
	return b.String()
}

// subjectLine is the start of the message on one line, so the inbox list
// already says what it is about.
func subjectLine(msg string) string {
	line := strings.Join(strings.Fields(msg), " ")
	return clip(line, 60)
}

// clip cuts s to at most n characters (not bytes), marking the cut with "…".
func clip(s string, n int) string {
	if utf8.RuneCountInString(s) <= n {
		return s
	}
	r := []rune(s)
	return string(r[:n-1]) + "…"
}
