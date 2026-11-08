package recognize

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// GeminiConfig points the client at Gemini directly or at the relay
// (deploy/gemini-relay.Caddyfile), which adds the API key itself.
type GeminiConfig struct {
	BaseURL    string // e.g. http://127.0.0.1:8090 (the tunnel to the relay)
	Model      string // e.g. gemini-3.8-flash
	APIKey     string // empty when the relay adds it
	RelayToken string // sent as X-Relay-Token; empty without a relay
	// ThinkingLevel trades accuracy for time on Gemini 3 models: "minimal",
	// "low", "medium" or "high". Empty keeps the model's default.
	ThinkingLevel string
}

type gemini struct {
	cfg  GeminiConfig
	http *http.Client
}

func newGemini(cfg GeminiConfig) *gemini {
	return &gemini{cfg: cfg, http: &http.Client{Timeout: 75 * time.Second}}
}

// Usage is logged per request to keep an eye on cost.
type usage struct {
	PromptTokens int `json:"promptTokenCount"`
	OutputTokens int `json:"candidatesTokenCount"`
}

// errUnreadable: Gemini answered, but with nothing usable (blocked, empty,
// not JSON). Retrying the same file will not help.
var errUnreadable = errors.New("model returned no usable answer")

// generate sends one file with the prompts and decodes the JSON answer
// into out. A 429 or 5xx is retried once.
func (g *gemini) generate(ctx context.Context, file []byte, mimeType, system, user string,
	schema map[string]any, out any) (usage, error) {
	genConfig := map[string]any{
		"responseMimeType": "application/json",
		"responseSchema":   schema,
	}
	if g.cfg.ThinkingLevel != "" {
		genConfig["thinkingConfig"] = map[string]any{"thinkingLevel": g.cfg.ThinkingLevel}
	}
	body, err := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []any{map[string]any{"text": system}}},
		"contents": []any{map[string]any{
			"role": "user",
			"parts": []any{
				map[string]any{"inline_data": map[string]any{
					"mime_type": mimeType,
					"data":      base64.StdEncoding.EncodeToString(file),
				}},
				map[string]any{"text": user},
			},
		}},
		"generationConfig": genConfig,
	})
	if err != nil {
		return usage{}, err
	}

	var resp *generateResponse
	for attempt := 0; ; attempt++ {
		var retry bool
		resp, retry, err = g.post(ctx, body)
		if err == nil || !retry || attempt == 1 {
			break
		}
		select {
		case <-ctx.Done():
			return usage{}, ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
	if err != nil {
		return usage{}, err
	}

	text, err := resp.text()
	if err != nil {
		return resp.Usage, err
	}
	if err := json.Unmarshal([]byte(text), out); err != nil {
		return resp.Usage, fmt.Errorf("%w: %v", errUnreadable, err)
	}
	return resp.Usage, nil
}

func (g *gemini) post(ctx context.Context, body []byte) (resp *generateResponse, retry bool, err error) {
	url := strings.TrimRight(g.cfg.BaseURL, "/") + "/v1beta/models/" + g.cfg.Model + ":generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, false, err
	}
	req.Header.Set("Content-Type", "application/json")
	if g.cfg.APIKey != "" {
		req.Header.Set("X-Goog-Api-Key", g.cfg.APIKey)
	}
	if g.cfg.RelayToken != "" {
		req.Header.Set("X-Relay-Token", g.cfg.RelayToken)
	}

	res, err := g.http.Do(req)
	if err != nil {
		return nil, ctx.Err() == nil, fmt.Errorf("gemini request: %w", err)
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return nil, true, fmt.Errorf("gemini response: %w", err)
	}
	if res.StatusCode != http.StatusOK {
		retry = res.StatusCode == http.StatusTooManyRequests || res.StatusCode >= 500
		return nil, retry, fmt.Errorf("gemini status %d: %s", res.StatusCode, truncate(string(raw), 500))
	}

	resp = new(generateResponse)
	if err := json.Unmarshal(raw, resp); err != nil {
		return nil, false, fmt.Errorf("gemini response: %w", err)
	}
	return resp, false, nil
}

type generateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
	PromptFeedback struct {
		BlockReason string `json:"blockReason"`
	} `json:"promptFeedback"`
	Usage usage `json:"usageMetadata"`
}

func (r *generateResponse) text() (string, error) {
	if r.PromptFeedback.BlockReason != "" {
		return "", fmt.Errorf("%w: blocked (%s)", errUnreadable, r.PromptFeedback.BlockReason)
	}
	if len(r.Candidates) == 0 {
		return "", fmt.Errorf("%w: no candidates", errUnreadable)
	}
	c := r.Candidates[0]
	var b strings.Builder
	for _, p := range c.Content.Parts {
		b.WriteString(p.Text)
	}
	if b.Len() == 0 {
		return "", fmt.Errorf("%w: empty (finish %s)", errUnreadable, c.FinishReason)
	}
	if c.FinishReason != "" && c.FinishReason != "STOP" {
		return "", fmt.Errorf("%w: finish %s", errUnreadable, c.FinishReason)
	}
	return b.String(), nil
}
