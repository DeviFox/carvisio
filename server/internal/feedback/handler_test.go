package feedback

import (
	"strings"
	"testing"
)

func TestValidate(t *testing.T) {
	ok := Entry{Message: "Не сохраняется пробег"}
	cases := []struct {
		name string
		e    Entry
		bad  bool
	}{
		{"plain", ok, false},
		{"empty", Entry{}, true},
		{"too long", Entry{Message: strings.Repeat("я", maxMessageRunes+1)}, true},
		{"max length in runes", Entry{Message: strings.Repeat("я", maxMessageRunes)}, false},
		{"email", Entry{Message: "x", Email: "a@b.ru"}, false},
		{"email with name", Entry{Message: "x", Email: "Bob <a@b.ru>"}, true},
		{"email header injection", Entry{Message: "x", Email: "a@b.ru\r\nBcc: c@d.ru"}, true},
		{"page", Entry{Message: "x", Page: "/car/?id=1"}, false},
		{"page not a path", Entry{Message: "x", Page: "https://evil.example"}, true},
	}
	for _, c := range cases {
		if got := validate(c.e) != ""; got != c.bad {
			t.Errorf("%s: invalid = %v, want %v", c.name, got, c.bad)
		}
	}
}

func TestSubjectLine(t *testing.T) {
	got := subjectLine("Первая строка\n\nвторая   строка")
	if got != "Первая строка вторая строка" {
		t.Errorf("got %q", got)
	}
	long := subjectLine(strings.Repeat("ж", 100))
	if n := len([]rune(long)); n != 60 || !strings.HasSuffix(long, "…") {
		t.Errorf("long subject: %d runes, %q", n, long)
	}
}
