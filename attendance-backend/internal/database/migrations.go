// FILE: internal/database/migrations.go
package database

import "database/sql"

func Migrate(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS employees (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			full_name VARCHAR(255) NOT NULL,
			phone VARCHAR(50),
			position VARCHAR(100),
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP 
		)`,
		
		`CREATE TABLE IF NOT EXISTS attendances (
			id SERIAL PRIMARY KEY,
			employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
			latitude DOUBLE PRECISION NOT NULL,
			longitude DOUBLE PRECISION NOT NULL,
			accuracy DOUBLE PRECISION NOT NULL,
			address TEXT,
			photo_path VARCHAR(500) NOT NULL,
			photo_latitude DOUBLE PRECISION,
			photo_longitude DOUBLE PRECISION,
			photo_timestamp TIMESTAMP,
			device_info TEXT,
			is_suspicious BOOLEAN DEFAULT false,
			suspicious_reasons TEXT[],
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		)`,
		
		`CREATE INDEX IF NOT EXISTS idx_attendances_employee_id ON attendances(employee_id)`,
		`CREATE INDEX IF NOT EXISTS idx_attendances_created_at ON attendances(created_at DESC)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	return nil
}