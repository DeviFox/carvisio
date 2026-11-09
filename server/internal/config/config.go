// Package config reads server settings from environment variables.
// For local development, values may also come from a .env file;
// variables already set in the environment always take precedence.
package config

import (
	"bufio"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL    string
	HTTPAddr       string
	AppURL         string   // frontend base URL, used in email links
	CookieSecure   bool     // set the Secure flag on the session cookie
	TrustProxy     bool     // take the client IP from X-Real-IP
	AllowedOrigins []string // frontend origins allowed to call the API (CORS + CSRF check)

	// Document recognition through OpenRouter. Off while the key is empty.
	OpenRouterAPIKey string
	OpenRouterModel  string
	OpenRouterEffort string // reasoning effort: low, medium, high; empty = model default
}

func Load() (Config, error) {
	if err := loadDotEnv(".env"); err != nil {
		return Config{}, err
	}

	cfg := Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		HTTPAddr:       getenv("HTTP_ADDR", ":8080"),
		AppURL:         strings.TrimRight(os.Getenv("APP_URL"), "/"),
		AllowedOrigins: splitList(os.Getenv("ALLOWED_ORIGINS")),

		OpenRouterAPIKey: os.Getenv("OPENROUTER_API_KEY"),
		OpenRouterModel:  getenv("OPENROUTER_MODEL", "anthropic/claude-haiku-5.5"),
		OpenRouterEffort: os.Getenv("OPENROUTER_REASONING_EFFORT"),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if cfg.AppURL == "" {
		return Config{}, errors.New("APP_URL is required")
	}

	switch cfg.OpenRouterEffort {
	case "", "low", "medium", "high":
	default:
		return Config{}, fmt.Errorf("OPENROUTER_REASONING_EFFORT: %q is not low, medium or high", cfg.OpenRouterEffort)
	}

	var err error
	if cfg.CookieSecure, err = getbool("COOKIE_SECURE", true); err != nil {
		return Config{}, err
	}
	if cfg.TrustProxy, err = getbool("TRUST_PROXY", false); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func getenv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback
}

func getbool(key string, fallback bool) (bool, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback, nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return false, fmt.Errorf("%s: %q is not a boolean", key, v)
	}
	return b, nil
}

// splitList parses "a, b,c" into ["a" "b" "c"].
func splitList(s string) []string {
	var out []string
	for item := range strings.SplitSeq(s, ",") {
		if item = strings.TrimSpace(item); item != "" {
			out = append(out, item)
		}
	}
	return out
}

// loadDotEnv sets KEY=VALUE pairs from path into the process environment.
// A missing file is not an error: in production, variables come from the
// environment directly.
func loadDotEnv(path string) error {
	f, err := os.Open(path)
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for n := 1; scanner.Scan(); n++ {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			return fmt.Errorf("%s:%d: expected KEY=VALUE", path, n)
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)

		if _, set := os.LookupEnv(key); set {
			continue
		}
		if err := os.Setenv(key, value); err != nil {
			return err
		}
	}
	return scanner.Err()
}
