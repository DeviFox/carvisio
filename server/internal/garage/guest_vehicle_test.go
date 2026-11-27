package garage

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGuestVehiclePreservesZeroMileage(t *testing.T) {
	const payload = `{
		"submissionId":"01234567-89ab-cdef-0123-456789abcdef",
		"make":" Toyota ","model":"Corolla","year":2009,"currentMileageKm":0,"vin":"ABCDE"
	}`
	var submission guestVehicleSubmission
	if err := json.Unmarshal([]byte(payload), &submission); err != nil {
		t.Fatal(err)
	}
	if err := submission.validate(); err != nil {
		t.Fatal(err)
	}
	if submission.Make != "Toyota" || submission.CurrentMileageKm == nil || *submission.CurrentMileageKm != 0 {
		t.Fatalf("unexpected submission: %+v", submission)
	}
	result, err := json.Marshal(guestVehicleRow{guestVehicleFields: submission.guestVehicleFields})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(result), `"currentMileageKm":0`) || strings.Contains(string(result), `"submissionId"`) {
		t.Fatalf("unexpected response: %s", result)
	}
}

func TestGuestVehicleListRequiresPermission(t *testing.T) {
	h := NewHandler(nil, nil, false)
	r := httptest.NewRequest(http.MethodGet, "/api/garage/guest-vehicles", nil)
	w := httptest.NewRecorder()
	h.listGuestVehicles(w, r)
	if w.Code != http.StatusNotFound || w.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("unexpected response: %d, %v", w.Code, w.Header())
	}
}
