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
		"heic": {heic, ""}, // Claude does not take HEIC; the browser sends JPEG
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
			{"title": "Замена подшипника ступицы пер. прав.", "lineKind": "labor", "component": "none",
			 "suggestedName": "Ступичный подшипник", "suggestedCategory": "suspension",
			 "suggestedAxle": "front", "suggestedSide": "right", "eventType": "replacement"},
			{"title": "Лампа", "lineKind": "part", "component": "none", "suggestedName": "Лампа ближнего",
			 "suggestedCategory": "electrical", "suggestedAxle": "front", "suggestedSide": "sideways",
			 "eventType": "replacement"},
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
	if len(res.Items) != 4 {
		t.Fatalf("items = %d; want 4 (blank title dropped)", len(res.Items))
	}
	oil, filter, labor, lamp := res.Items[0], res.Items[1], res.Items[2], res.Items[3]
	if oil.ComponentID == nil || *oil.ComponentID != "id-2" || *oil.CostMinorUnits != 320000 {
		t.Errorf("oil = %+v", oil)
	}
	if filter.ComponentID != nil || !filter.Uncertain || filter.EventType != "repair" ||
		filter.SuggestedComponent == nil || filter.SuggestedComponent.Category != "other" {
		t.Errorf("filter = %+v", filter)
	}
	if sc := labor.SuggestedComponent; sc == nil || sc.Category != "suspension" ||
		sc.Axle == nil || *sc.Axle != "front" || sc.Side == nil || *sc.Side != "right" {
		t.Errorf("labor suggestion = %+v; want suspension, front right", sc)
	}
	// Electrical parts are not positioned in the app: axle and side are dropped.
	if sc := lamp.SuggestedComponent; sc == nil || sc.Axle != nil || sc.Side != nil {
		t.Errorf("lamp suggestion = %+v; want no position", sc)
	}
	if len(res.Warnings) < 4 || res.Warnings[0] != "Чек помят" {
		t.Errorf("warnings = %q", res.Warnings)
	}
}

// fakeOpenRouter answers chat/completions with content and records the
// request it got.
func fakeOpenRouter(t *testing.T, content string, gotReq *map[string]any) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" || r.Header.Get("Authorization") != "Bearer key" {
			t.Errorf("unexpected request %s auth=%q", r.URL.Path, r.Header.Get("Authorization"))
		}
		json.NewDecoder(r.Body).Decode(gotReq)
		json.NewEncoder(w).Encode(map[string]any{
			"choices": []any{map[string]any{"message": map[string]any{"content": content}, "finish_reason": "stop"}},
			"usage":   map[string]any{"prompt_tokens": 1000, "completion_tokens": 100, "cost": 0.0005},
		})
	}))
}

func newTestHandler(baseURL string) *Handler {
	return NewHandler(Config{APIKey: "key", Model: "test/model", BaseURL: baseURL, ReasoningEffort: "low"},
		slog.New(slog.NewTextHandler(io.Discard, nil)))
}

const padsAnswer = `{"document":{"kind":"work_order","date":"2025-10-01","mileageKm":120500,"currency":"RUB",
	"total":"5400","shop":"Сервис"},"items":[{"title":"Колодки передние","lineKind":"part",
	"cost":"2400","component":"c1","suggestedName":null,"suggestedCategory":null,"suggestedAxle":null,
	"suggestedSide":null,"eventType":"replacement","uncertain":false}],"warnings":[]}`

func TestRecognizeEndToEnd(t *testing.T) {
	var gotReq map[string]any
	// Some models wrap JSON in a code fence even under structured output.
	fake := fakeOpenRouter(t, "```json\n"+padsAnswer+"\n```", &gotReq)
	defer fake.Close()

	front := "front"
	ctx := Context{Components: []ContextComponent{{ID: "11111111-1111-1111-1111-111111111111",
		Name: "Тормозные колодки", Category: "brakes", Axle: &front}}}
	rec := httptest.NewRecorder()
	newTestHandler(fake.URL).recognize(rec, multipartRequest(t, []byte("\xff\xd8\xff\xe0\x00\x10JFIF fake"), ctx))

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

	req, _ := json.Marshal(gotReq)
	for _, want := range []string{
		`"model":"test/model"`,
		`"reasoning":{"effort":"low"}`,
		`"strict":true`,
		`"data_collection":"deny"`,     // receipts carry personal data
		`"enum":["c1","none"]`,         // only this request's components
		`"additionalProperties":false`, // strict mode
		`"type":"image_url"`,           // a photo goes as an image
		`data:image/jpeg;base64,`,      // inline, not a URL
		`c1: Тормозные колодки [brakes, перед]`, // the prompt names the axle
	} {
		if !strings.Contains(string(req), want) {
			t.Errorf("request lacks %s:\n%s", want, req)
		}
	}
	if strings.Contains(string(req), "temperature") {
		t.Errorf("temperature must be left to the model (Claude rejects it): %s", req)
	}
}

func TestRecognizeSendsPDFAsFile(t *testing.T) {
	var gotReq map[string]any
	fake := fakeOpenRouter(t, padsAnswer, &gotReq)
	defer fake.Close()

	rec := httptest.NewRecorder()
	newTestHandler(fake.URL).recognize(rec, multipartRequest(t, []byte("%PDF-1.7\n..."), Context{}))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rec.Code, rec.Body)
	}
	req, _ := json.Marshal(gotReq)
	if !strings.Contains(string(req), `"type":"file"`) || !strings.Contains(string(req), `data:application/pdf;base64,`) {
		t.Errorf("PDF not sent as a file part: %s", req)
	}
}

func TestRecognizeUpstreamErrorIn200(t *testing.T) {
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"error":{"code":400,"message":"provider rejected the image"}}`))
	}))
	defer fake.Close()

	rec := httptest.NewRecorder()
	newTestHandler(fake.URL).recognize(rec, multipartRequest(t, []byte("\xff\xd8\xff\xe0 fake"), Context{}))
	if rec.Code != http.StatusBadGateway {
		t.Errorf("status %d; want 502", rec.Code)
	}
}

func TestRecognizeRejectsLargePhoto(t *testing.T) {
	big := append([]byte("\xff\xd8\xff\xe0\x00\x10JFIF"), make([]byte, maxImageBytes)...)
	rec := httptest.NewRecorder()
	newTestHandler("http://unused").recognize(rec, multipartRequest(t, big, Context{}))
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status %d; want 413", rec.Code)
	}
}

func TestRecognizeRejectsBadFile(t *testing.T) {
	h := newTestHandler("http://unused")
	rec := httptest.NewRecorder()
	h.recognize(rec, multipartRequest(t, []byte("<html>not an image</html>"), Context{}))
	if rec.Code != http.StatusUnsupportedMediaType {
		t.Errorf("status %d; want 415", rec.Code)
	}
}

func TestRecognizeNotConfigured(t *testing.T) {
	h := NewHandler(Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
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
