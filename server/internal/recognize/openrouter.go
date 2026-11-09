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

const defaultBaseURL = "https://openrouter.ai/api/v1"

// Config selects the model behind OpenRouter. OpenRouter is reachable from
// Russia and fronts many vendors, so the model is a setting, not code.
type Config struct {
	APIKey  string // empty turns recognition off
	Model   string // e.g. anthropic/claude-haiku-5.5
	BaseURL string // empty means OpenRouter; tests point it elsewhere
	// ReasoningEffort trades accuracy for time: "low", "medium" or "high".
	// Empty keeps the model's default.
	ReasoningEffort string
}

type openRouter struct {
	cfg  Config
	http *http.Client
}

func newOpenRouter(cfg Config) *openRouter {
	if cfg.BaseURL == "" {
		cfg.BaseURL = defaultBaseURL
	}
	return &openRouter{cfg: cfg, http: &http.Client{Timeout: 75 * time.Second}}
}

// usage is logged per request to keep an eye on cost.
type usage struct {
	PromptTokens int     `json:"prompt_tokens"`
	OutputTokens int     `json:"completion_tokens"`
	Cost         float64 `json:"cost"` // USD, as billed by OpenRouter
}

// errUnreadable: the model answered, but with nothing usable (refused,
// cut off, not JSON). Retrying the same file will not help.
var errUnreadable = errors.New("model returned no usable answer")

// maxOutputTokens bounds the answer (and OpenRouter's credit reservation):
// a long work order is a few thousand tokens of JSON plus reasoning.
const maxOutputTokens = 8000

// generate sends one file with the prompts and decodes the JSON answer
// into out. A 429 or 5xx is retried once.
func (o *openRouter) generate(ctx context.Context, file []byte, mimeType, system, user string,
	schema map[string]any, out any) (usage, error) {
	req := map[string]any{
		"model":      o.cfg.Model,
		"max_tokens": maxOutputTokens,
		"messages": []any{
			map[string]any{"role": "system", "content": system},
			map[string]any{"role": "user", "content": []any{
				filePart(file, mimeType),
				map[string]any{"type": "text", "text": user},
			}},
		},
		"response_format": map[string]any{
			"type": "json_schema",
			"json_schema": map[string]any{
				"name":   "service_draft",
				"strict": true,
				"schema": schema,
			},
		},
		"provider": map[string]any{
			// Only providers that honour response_format...
			"require_parameters": true,
			// ...and that neither store nor train on the documents: receipts
			// carry names, phones and plate numbers.
			"data_collection": "deny",
		},
	}
	if o.cfg.ReasoningEffort != "" {
		req["reasoning"] = map[string]any{"effort": o.cfg.ReasoningEffort}
	}
	body, err := json.Marshal(req)
	if err != nil {
		return usage{}, err
	}

	var resp *chatResponse
	for attempt := 0; ; attempt++ {
		var retry bool
		resp, retry, err = o.post(ctx, body)
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

// filePart is the OpenAI-style content part for the document: images go as
// image_url, a PDF as a file.
func filePart(file []byte, mimeType string) map[string]any {
	dataURL := "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(file)
	if mimeType == "application/pdf" {
		return map[string]any{"type": "file", "file": map[string]any{
			"filename":  "document.pdf",
			"file_data": dataURL,
		}}
	}
	return map[string]any{"type": "image_url", "image_url": map[string]any{"url": dataURL}}
}

func (o *openRouter) post(ctx context.Context, body []byte) (resp *chatResponse, retry bool, err error) {
	url := strings.TrimRight(o.cfg.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, false, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+o.cfg.APIKey)

	res, err := o.http.Do(req)
	if err != nil {
		return nil, ctx.Err() == nil, fmt.Errorf("openrouter request: %w", err)
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return nil, true, fmt.Errorf("openrouter response: %w", err)
	}
	if res.StatusCode != http.StatusOK {
		// 402 (out of credits) and 4xx are not retried: they will fail again.
		retry = res.StatusCode == http.StatusTooManyRequests || res.StatusCode >= 500
		return nil, retry, fmt.Errorf("openrouter status %d: %s", res.StatusCode, truncate(string(raw), 500))
	}

	resp = new(chatResponse)
	if err := json.Unmarshal(raw, resp); err != nil {
		return nil, false, fmt.Errorf("openrouter response: %w", err)
	}
	// OpenRouter can answer 200 with an error from the upstream provider.
	if resp.Error != nil {
		code := resp.Error.Code
		return nil, code == http.StatusTooManyRequests || code >= 500,
			fmt.Errorf("openrouter error %d: %s", code, truncate(resp.Error.Message, 500))
	}
	return resp, false, nil
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string  `json:"content"`
			Refusal *string `json:"refusal"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
	Usage usage `json:"usage"`
}

func (r *chatResponse) text() (string, error) {
	if len(r.Choices) == 0 {
		return "", fmt.Errorf("%w: no choices", errUnreadable)
	}
	c := r.Choices[0]
	if c.Message.Refusal != nil && *c.Message.Refusal != "" {
		return "", fmt.Errorf("%w: refused (%s)", errUnreadable, truncate(*c.Message.Refusal, 200))
	}
	if c.FinishReason != "" && c.FinishReason != "stop" {
		return "", fmt.Errorf("%w: finish %s", errUnreadable, c.FinishReason)
	}
	text := stripFence(c.Message.Content)
	if text == "" {
		return "", fmt.Errorf("%w: empty answer", errUnreadable)
	}
	return text, nil
}

// stripFence removes a ```json ... ``` wrapper some models add even when
// asked for bare JSON.
func stripFence(s string) string {
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "```") {
		return s
	}
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimPrefix(s, "json")
	s = strings.TrimSuffix(strings.TrimSpace(s), "```")
	return strings.TrimSpace(s)
}
