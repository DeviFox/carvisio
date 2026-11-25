package mailer

import (
	"strings"
	"testing"
)

func TestBuildRejectsHeaderInjection(t *testing.T) {
	m := SMTP{From: "noreply@example.com", FromName: "carvisio"}
	_, err := m.build(Message{To: "me@example.com", ReplyTo: "a@b.ru\r\nBcc: x@y.ru", Subject: "s", Body: "b"})
	if err == nil {
		t.Fatal("expected an error for a line break in Reply-To")
	}
}

func TestBuildHeaders(t *testing.T) {
	m := SMTP{From: "noreply@example.com", FromName: "carvisio"}
	raw, err := m.build(Message{To: "me@example.com", ReplyTo: "guest@example.org", Subject: "Отзыв", Body: "Привет"})
	if err != nil {
		t.Fatal(err)
	}
	s := string(raw)
	for _, want := range []string{
		"From: \"carvisio\" <noreply@example.com>\r\n",
		"Reply-To: <guest@example.org>\r\n",
		"Subject: =?utf-8?q?",
		"Content-Transfer-Encoding: base64\r\n",
		"0J/RgNC40LLQtdGC", // "Привет" in base64
	} {
		if !strings.Contains(s, want) {
			t.Errorf("missing %q in:\n%s", want, s)
		}
	}
}
