package mailer

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

// SMTP sends mail through an SMTP server with a login, e.g. Yandex
// (smtp.yandex.com:465 with an app password). Port 465 speaks TLS from the
// first byte; any other port must offer STARTTLS. Plain text is never used,
// so the password never travels unencrypted.
type SMTP struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string // must be the mailbox the login belongs to (Yandex rejects others)
	FromName string // shown in the inbox, e.g. "carvisio"
}

const smtpTimeout = 20 * time.Second

func (m SMTP) Send(ctx context.Context, msg Message) error {
	body, err := m.build(msg)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(ctx, smtpTimeout)
	defer cancel()

	addr := net.JoinHostPort(m.Host, strconv.Itoa(m.Port))
	tlsConf := &tls.Config{ServerName: m.Host, MinVersion: tls.VersionTLS12}

	var conn net.Conn
	if m.Port == 465 {
		conn, err = (&tls.Dialer{Config: tlsConf}).DialContext(ctx, "tcp", addr)
	} else {
		conn, err = (&net.Dialer{}).DialContext(ctx, "tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("smtp dial: %w", err)
	}
	// net/smtp has no context support: the deadline bounds the whole session.
	if deadline, ok := ctx.Deadline(); ok {
		_ = conn.SetDeadline(deadline)
	}

	c, err := smtp.NewClient(conn, m.Host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("smtp hello: %w", err)
	}
	defer c.Close()

	if m.Port != 465 {
		if ok, _ := c.Extension("STARTTLS"); !ok {
			return errors.New("smtp: server does not offer STARTTLS")
		}
		if err := c.StartTLS(tlsConf); err != nil {
			return fmt.Errorf("smtp starttls: %w", err)
		}
	}
	if err := c.Auth(smtp.PlainAuth("", m.Username, m.Password, m.Host)); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err := c.Mail(m.From); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	if err := c.Rcpt(msg.To); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}
	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := w.Write(body); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return c.Quit()
}

// build renders the message as RFC 5322 text: UTF-8 subject in encoded-word
// form, the body in base64 so any language and line length passes intact.
func (m SMTP) build(msg Message) ([]byte, error) {
	// Header values come partly from visitors (Reply-To): a line break there
	// would let them add headers of their own.
	for _, v := range []string{msg.To, msg.ReplyTo, msg.Subject} {
		if strings.ContainsAny(v, "\r\n") {
			return nil, errors.New("mailer: line break in a header value")
		}
	}

	from := (&mail.Address{Name: m.FromName, Address: m.From}).String()
	domain := m.From[strings.LastIndex(m.From, "@")+1:]

	var b bytes.Buffer
	header := func(k, v string) { fmt.Fprintf(&b, "%s: %s\r\n", k, v) }
	header("From", from)
	header("To", (&mail.Address{Address: msg.To}).String())
	if msg.ReplyTo != "" {
		header("Reply-To", (&mail.Address{Address: msg.ReplyTo}).String())
	}
	header("Subject", mime.QEncoding.Encode("utf-8", msg.Subject))
	header("Date", time.Now().Format(time.RFC1123Z))
	header("Message-ID", "<"+randomID()+"@"+domain+">")
	header("MIME-Version", "1.0")
	header("Content-Type", "text/plain; charset=utf-8")
	header("Content-Transfer-Encoding", "base64")
	b.WriteString("\r\n")

	enc := base64.StdEncoding.EncodeToString([]byte(msg.Body))
	for len(enc) > 76 {
		b.WriteString(enc[:76] + "\r\n")
		enc = enc[76:]
	}
	b.WriteString(enc + "\r\n")
	return b.Bytes(), nil
}

func randomID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
