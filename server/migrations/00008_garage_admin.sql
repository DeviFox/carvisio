-- +goose Up
ALTER TABLE users ADD COLUMN can_view_other_vehicles boolean NOT NULL DEFAULT false;

UPDATE users SET can_view_other_vehicles = true
WHERE id = '9b6e594e-6b62-4f24-b68e-fb4b3db160e6';

CREATE INDEX vehicles_id_idx ON vehicles (id);

-- +goose Down
DROP INDEX vehicles_id_idx;
ALTER TABLE users DROP COLUMN can_view_other_vehicles;
