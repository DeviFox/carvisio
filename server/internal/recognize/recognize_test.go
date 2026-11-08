package recognize

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestParseMoney(t *testing.T) {
	ok := map[string]int64{
		"3200":     320000,
		"3200.5":   320050,
		"3 200,50": 320050,
		"3 200":    320000,
		"0.99":     99,
		"4520.00₽": 452000,
	}
	for in, want := range ok {
		if got, err := parseMoney(in); err != nil || got != want {
			t.Errorf("parseMoney(%q) = %d, %v; want %d", in, got, err, want)
		}
	}
	for _, in := range []string{"", "-100", "12.345", "abc", "1.2.3", "9999999999999"} {
		if _, err := parseMoney(in); err == nil {
			t.Errorf("parseMoney(%q): want error", in)
		}
	}
}

func TestParseDate(t *testing.T) {
	today := time.Date(2026, 11, 6, 12, 0, 0, 0, time.UTC)
	for in, want := range map[string]bool{
		"2025-03-14": true,
		"2026-11-07": true, // tomorrow: time zones
		"2026-11-09": false,
		"1949-12-31": false,
		"14.03.2025": false,
	} {
		if _, got := parseDate(in, today); got != want {
			t.Errorf("parseDate(%q) ok = %v; want %v", in, got, want)
		}
	}
}

func TestDetectType(t *testing.T) {
	heic := append([]byte{0, 0, 0, 24}, []byte("ftypheic\x00\x00\x00\x00")...)
	for name, tc := range map[string]struct {
		b    []byte
		want string
	}{
		"jpeg": {[]byte("\xff\xd8\xff\xe0\x00\x10JFIF"), "image/jpeg"},
		"png":  {[]byte("\x89PNG\r\n\x1a\n\x00\x00"), "image/png"},
		"pdf":  {[]byte("%PDF-1.7\n"), "application/pdf"},
		"heic": {heic, "image/heic"},
		"text": {[]byte("hello"), ""},
		"html": {[]byte("<html><body>"), ""},
	} {
		if got := detectType(tc.b); got != tc.want {
			t.Errorf("%s: detectType = %q; want %q", name, got, tc.want)
		}
	}
}

func TestNormalizeDropsBadValues(t *testing.T) {
	var out modelOutput
	mustJSON(t, `{
		"document": {"kind": "invoice", "date": "2099-01-01", "mileageKm": -5,
		             "currency": "rub", "total": "abc", "shop": "  "},
		"items": [
			{"title": "Масло 5W-30", "lineKind": "fluid", "cost": "3 200,00", "component": "c2",
			 "eventType": "fluid_service", "uncertain": false},
			{"title": "Фильтр салона", "lineKind": "part", "cost": "??", "component": "c9",
			 "suggestedName": "Салонный фильтр", "suggestedCategory": "nonsense", "eventType": "explode"},
			{"title": "Работа", "lineKind": "labor", "component": "none",
			 "suggestedName": "Работа", "eventType": "repair"},
			{"title": "   ", "lineKind": "part", "component": "none", "eventType": "repair"}
		],
		"warnings": ["Чек помят"]
	}`, &out)
	comps := []ContextComponent{{ID: "id-1", Name: "Колодки"}, {ID: "id-2", Name: "Моторное масло"}}

	res := normalize(out, comps, time.Date(2026, 11, 6, 0, 0, 0, 0, time.UTC))

	d := res.Document
	if d.Kind != "other" || d.Date != nil || d.MileageKm != nil || d.TotalMinorUnits != nil || d.Shop != nil {
		t.Errorf("document not cleaned: %+v", d)
	}
	if d.Currency == nil || *d.Currency != "RUB" {
		t.Errorf("currency = %v; want RUB", d.Currency)
	}
	if len(res.Items) != 3 {
		t.Fatalf("items = %d; want 3 (blank title dropped)", len(res.Items))
	}
	oil, filter, labor := res.Items[0], res.Items[1], res.Items[2]
	if oil.ComponentID == nil || *oil.ComponentID != "id-2" || *oil.CostMinorUnits != 320000 {
		t.Errorf("oil = %+v", oil)
	}
	if filter.ComponentID != nil || !filter.Uncertain || filter.EventType != "repair" ||
		filter.SuggestedComponent == nil || filter.SuggestedComponent.Category != "other" {
		t.Errorf("filter = %+v", filter)
	}
	if labor.SuggestedComponent != nil {
		t.Errorf("labor got a suggested component: %+v", labor.SuggestedComponent)
	}
	if len(res.Warnings) < 4 || res.Warnings[0] != "Чек помят" {
		t.Errorf("warnings = %q", res.Warnings)
	}
}

func TestRecognizeEndToEnd(t *testing.T) {
	var gotReq map[string]any
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1beta/models/test-model:generateContent" || r.Header.Get("X-Relay-Token") != "secret" {
			t.Errorf("unexpected request %s token=%q", r.URL.Path, r.Header.Get("X-Relay-Token"))
		}
		json.NewDecoder(r.Body).Decode(&gotReq)
		answer := `{"document":{"kind":"work_order","date":"2025-10-01","mileageKm":120500,"currency":"RUB",
			"total":"5400","shop":"Сервис"},"items":[{"title":"Колодки передние","lineKind":"part",
			"cost":"2400","component":"c1","eventType":"replacement","uncertain":false}],"warnings":[]}`
		json.NewEncoder(w).Encode(map[string]any{
			"candidates":    []any{map[string]any{"content": map[string]any{"parts": []any{map[string]any{"text": answer}}}, "finishReason": "STOP"}},
			"usageMetadata": map[string]any{"promptTokenCount": 1000, "candidatesTokenCount": 100},
		})
	}))
	defer fake.Close()

	h := NewHandler(GeminiConfig{BaseURL: fake.URL, Model: "test-model", RelayToken: "secret"},
		slog.New(slog.NewTextHandler(io.Discard, nil)))
	front := "front"
	ctx := Context{Components: []ContextComponent{{ID: "11111111-1111-1111-1111-111111111111",
		Name: "Тормозные колодки", Category: "brakes", Axle: &front}}}

	rec := httptest.NewRecorder()
	h.recognize(rec, multipartRequest(t, []byte("\xff\xd8\xff\xe0\x00\x10JFIF fake"), ctx))

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rec.Code, rec.Body)
	}
	var res Result
	mustJSON(t, rec.Body.String(), &res)
	if *res.Document.TotalMinorUnits != 540000 || *res.Document.MileageKm != 120500 {
		t.Errorf("document = %+v", res.Document)
	}
	if len(res.Items) != 1 || *res.Items[0].ComponentID != ctx.Components[0].ID {
		t.Errorf("items = %+v", res.Items)
	}

	// The schema offers exactly this request's labels and the prompt names the axle.
	schema, _ := json.Marshal(gotReq["generationConfig"])
	if !strings.Contains(string(schema), `"enum":["c1","none"]`) {
		t.Errorf("component enum missing from schema: %s", schema)
	}
	contents, _ := json.Marshal(gotReq["contents"])
	if !strings.Contains(string(contents), "c1: Тормозные колодки [brakes, перед]") {
		t.Errorf("component list missing from prompt: %s", contents)
	}
}

func TestRecognizeRejectsBadFile(t *testing.T) {
	h := NewHandler(GeminiConfig{BaseURL: "http://unused", Model: "m", RelayToken: "t"},
		slog.New(slog.NewTextHandler(io.Discard, nil)))
	rec := httptest.NewRecorder()
	h.recognize(rec, multipartRequest(t, []byte("<html>not an image</html>"), Context{}))
	if rec.Code != http.StatusUnsupportedMediaType {
		t.Errorf("status %d; want 415", rec.Code)
	}
}

func TestRecognizeNotConfigured(t *testing.T) {
	h := NewHandler(GeminiConfig{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	rec := httptest.NewRecorder()
	h.recognize(rec, multipartRequest(t, []byte("%PDF-1.7"), Context{}))
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status %d; want 503", rec.Code)
	}
}

func multipartRequest(t *testing.T, file []byte, ctx Context) *http.Request {
	t.Helper()
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	c, _ := json.Marshal(ctx)
	mw.WriteField("context", string(c))
	fw, _ := mw.CreateFormFile("file", "doc")
	fw.Write(file)
	mw.Close()
	r := httptest.NewRequest(http.MethodPost, "/api/recognize", &body)
	r.Header.Set("Content-Type", mw.FormDataContentType())
	return r
}

func mustJSON(t *testing.T, s string, v any) {
	t.Helper()
	if err := json.Unmarshal([]byte(s), v); err != nil {
		t.Fatal(err)
	}
}
