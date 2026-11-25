package httpx

import (
	"net"
	"net/http"
)

// ClientIP is the visitor's address for rate limits. Behind nginx
// (trustProxy) it comes from X-Real-IP; otherwise from the connection, since
// a client can put anything in that header.
func ClientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if ip := r.Header.Get("X-Real-IP"); ip != "" {
			return ip
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
