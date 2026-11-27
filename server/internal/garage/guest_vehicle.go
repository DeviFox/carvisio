package garage

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/DeviFox/carfolio/server/internal/auth"
	"github.com/DeviFox/carfolio/server/internal/httpx"
	"github.com/jackc/pgx/v5"
)

type guestVehicleFields struct {
	Make             string  `json:"make"`
	Model            string  `json:"model"`
	Year             int     `json:"year"`
	FuelType         *string `json:"fuelType,omitempty"`
	Engine           *string `json:"engine,omitempty"`
	BodyType         *string `json:"bodyType,omitempty"`
	VIN              *string `json:"vin,omitempty"`
	CurrentMileageKm *Km     `json:"currentMileageKm,omitempty"`
}

type guestVehicleSubmission struct {
	SubmissionID string `json:"submissionId"`
	guestVehicleFields
}

func (s *guestVehicleSubmission) validate() error {
	v := checker{path: "guestVehicle"}
	v.id("submissionId", s.SubmissionID)
	s.Make = strings.TrimSpace(s.Make)
	s.Model = strings.TrimSpace(s.Model)
	if s.Make == "" || s.Model == "" {
		v.fail("make/model", "required")
	}
	v.text("make", s.Make, maxNameLen)
	v.text("model", s.Model, maxNameLen)
	if s.Year < minYear || s.Year > maxYear {
		v.fail("year", "out of range")
	}
	v.optText("fuelType", s.FuelType, maxNameLen)
	v.optText("engine", s.Engine, maxNameLen)
	v.optOneOf("bodyType", s.BodyType, bodyTypes)
	if s.VIN != nil && !vinPattern.MatchString(*s.VIN) {
		v.fail("vin", "bad format")
	}
	return v.err
}

func (h *Handler) saveGuestVehicle(w http.ResponseWriter, r *http.Request) {
	if !h.guestLimiter.Allow(httpx.ClientIP(r, h.trustProxy)) {
		httpx.Error(w, http.StatusTooManyRequests, "too many submissions")
		return
	}
	var submission guestVehicleSubmission
	err := httpx.ReadJSONWith(w, r, &submission, httpx.ReadOptions{MaxBytes: 8 << 10})
	if err == nil {
		err = submission.validate()
	}
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.store.saveGuestVehicle(r.Context(), submission); err != nil {
		h.serverError(w, "save guest vehicle", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Store) saveGuestVehicle(ctx context.Context, g guestVehicleSubmission) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO guest_vehicle_submissions (submission_id, make, model, year, fuel_type, engine, body_type, vin, current_mileage_km)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (submission_id) DO NOTHING`,
		g.SubmissionID, g.Make, g.Model, g.Year, g.FuelType, g.Engine, g.BodyType, g.VIN, g.CurrentMileageKm)
	return err
}

type guestVehicleRow struct {
	ID         int64     `json:"id"`
	ReceivedAt time.Time `json:"receivedAt"`
	guestVehicleFields
}

type guestVehiclePage struct {
	Vehicles   []guestVehicleRow `json:"vehicles"`
	NextBefore int64             `json:"nextBefore,omitempty"`
}

func (h *Handler) listGuestVehicles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if !auth.UserFrom(r.Context()).CanViewOtherVehicles {
		httpx.Error(w, http.StatusNotFound, "not found")
		return
	}
	var before *int64
	if cursor := r.URL.Query().Get("before"); cursor != "" {
		id, err := strconv.ParseInt(cursor, 10, 64)
		if err != nil || id < 1 {
			httpx.Error(w, http.StatusBadRequest, "invalid cursor")
			return
		}
		before = &id
	}
	page, err := h.store.listGuestVehicles(r.Context(), before)
	if err != nil {
		h.serverError(w, "list guest vehicles", err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, page)
}

func (s *Store) listGuestVehicles(ctx context.Context, before *int64) (guestVehiclePage, error) {
	const pageSize = 100
	rows, err := s.db.Query(ctx, `
		SELECT id, make, model, year, fuel_type, engine, body_type, vin, current_mileage_km, received_at
		FROM guest_vehicle_submissions
		WHERE id < coalesce($1::bigint, 9223372036854775807)
		ORDER BY id DESC LIMIT $2`, before, pageSize+1)
	if err != nil {
		return guestVehiclePage{}, err
	}
	vehicles, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (guestVehicleRow, error) {
		var v guestVehicleRow
		err := row.Scan(&v.ID, &v.Make, &v.Model, &v.Year, &v.FuelType, &v.Engine, &v.BodyType, &v.VIN, &v.CurrentMileageKm, &v.ReceivedAt)
		return v, err
	})
	if err != nil {
		return guestVehiclePage{}, err
	}
	page := guestVehiclePage{Vehicles: vehicles}
	if len(vehicles) > pageSize {
		page.Vehicles = vehicles[:pageSize]
		page.NextBefore = vehicles[pageSize-1].ID
	}
	return page, nil
}
