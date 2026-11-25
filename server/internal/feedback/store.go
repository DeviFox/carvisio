package feedback

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Entry is one message from the form, as stored. Empty strings are kept as
// NULL, so "not given" stays distinct from anything a visitor typed.
type Entry struct {
	ID         string
	UserID     string
	Email      string
	Message    string
	Page       string
	AppVersion string
	UserAgent  string
	CreatedAt  time.Time
}

type Store struct {
	db *pgxpool.Pool
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{db: db}
}

// Create saves e and fills in its ID and CreatedAt.
func (s *Store) Create(ctx context.Context, e *Entry) error {
	return s.db.QueryRow(ctx, `
		INSERT INTO feedback (user_id, email, message, page, app_version, user_agent)
		VALUES (NULLIF($1, '')::uuid, NULLIF($2, ''), $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''))
		RETURNING id, created_at`,
		e.UserID, e.Email, e.Message, e.Page, e.AppVersion, e.UserAgent,
	).Scan(&e.ID, &e.CreatedAt)
}
