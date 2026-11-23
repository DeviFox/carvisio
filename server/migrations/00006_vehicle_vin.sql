-- +goose Up
-- The car's VIN, or the body (frame) number on cars sold without one, e.g.
-- Japanese domestic models: "NZE121-1234567". Optional; stored upper-case
-- without spaces, as the client normalizes it.
ALTER TABLE vehicles
    ADD COLUMN vin text CHECK (vin ~ '^[A-Z0-9-]{5,20}$');

-- +goose Down
ALTER TABLE vehicles DROP COLUMN vin;
