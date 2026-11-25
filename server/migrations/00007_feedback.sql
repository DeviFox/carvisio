-- +goose Up
-- Messages from the in-app feedback form. Guests write too, so user_id is
-- optional; the email is only where to answer, if the visitor left one.
-- No IP address is kept: rate limits live in memory.
CREATE TABLE feedback (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        REFERENCES users (id) ON DELETE SET NULL,
    email       text        CHECK (char_length(email) <= 254),
    message     text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
    page        text        CHECK (char_length(page) <= 300),
    app_version text        CHECK (char_length(app_version) <= 40),
    user_agent  text        CHECK (char_length(user_agent) <= 300),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_created_at_idx ON feedback (created_at DESC);

-- +goose Down
DROP TABLE feedback;
