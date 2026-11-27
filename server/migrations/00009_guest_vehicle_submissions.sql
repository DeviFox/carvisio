-- +goose Up
CREATE TABLE guest_vehicle_submissions (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id      uuid NOT NULL UNIQUE,
    make               text NOT NULL,
    model              text NOT NULL,
    year               smallint NOT NULL,
    fuel_type          text,
    engine             text,
    body_type          text,
    vin                text,
    current_mileage_km integer CHECK (current_mileage_km >= 0),
    received_at        timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE guest_vehicle_submissions;
