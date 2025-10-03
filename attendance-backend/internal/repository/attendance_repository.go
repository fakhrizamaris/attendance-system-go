// FILE: internal/repository/attendance_repository.go
package repository

import (
	"attendance-backend/internal/models"
	"database/sql"

	"github.com/lib/pq"
)

type AttendanceRepository struct {
	db *sql.DB
}

func NewAttendanceRepository(db *sql.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) Create(attendance *models.Attendance) error {
	query := `
		INSERT INTO attendances (
			employee_id, latitude, longitude, accuracy, address,
			photo_path, photo_latitude, photo_longitude, photo_timestamp,
			device_info, is_suspicious, suspicious_reasons
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at
	`
	return r.db.QueryRow(
		query,
		attendance.EmployeeID,
		attendance.Latitude,
		attendance.Longitude,
		attendance.Accuracy,
		attendance.Address,
		attendance.PhotoPath,
		attendance.PhotoLatitude,
		attendance.PhotoLongitude,
		attendance.PhotoTimestamp,
		attendance.DeviceInfo,
		attendance.IsSuspicious,
		pq.Array(attendance.SuspiciousReasons),
	).Scan(&attendance.ID, &attendance.CreatedAt)
}

func (r *AttendanceRepository) GetByEmployeeID(employeeID int, limit int) ([]*models.Attendance, error) {
	query := `
		SELECT id, employee_id, latitude, longitude, accuracy, address,
		       photo_path, photo_latitude, photo_longitude, photo_timestamp,
		       device_info, is_suspicious, suspicious_reasons, created_at
		FROM attendances
		WHERE employee_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.Query(query, employeeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attendances []*models.Attendance
	for rows.Next() {
		a := &models.Attendance{}
		err := rows.Scan(
			&a.ID,
			&a.EmployeeID,
			&a.Latitude,
			&a.Longitude,
			&a.Accuracy,
			&a.Address,
			&a.PhotoPath,
			&a.PhotoLatitude,
			&a.PhotoLongitude,
			&a.PhotoTimestamp,
			&a.DeviceInfo,
			&a.IsSuspicious,
			pq.Array(&a.SuspiciousReasons),
			&a.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		attendances = append(attendances, a)
	}
	return attendances, nil
}

func (r *AttendanceRepository) GetByID(id int) (*models.Attendance, error) {
	a := &models.Attendance{}
	query := `
		SELECT a.id, a.employee_id, a.latitude, a.longitude, a.accuracy, a.address,
		       a.photo_path, a.photo_latitude, a.photo_longitude, a.photo_timestamp,
		       a.device_info, a.is_suspicious, a.suspicious_reasons, a.created_at,
		       e.id, e.email, e.full_name, e.phone, e.position
		FROM attendances a
		JOIN employees e ON a.employee_id = e.id
		WHERE a.id = $1
	`
	employee := &models.Employee{}
	err := r.db.QueryRow(query, id).Scan(
		&a.ID,
		&a.EmployeeID,
		&a.Latitude,
		&a.Longitude,
		&a.Accuracy,
		&a.Address,
		&a.PhotoPath,
		&a.PhotoLatitude,
		&a.PhotoLongitude,
		&a.PhotoTimestamp,
		&a.DeviceInfo,
		&a.IsSuspicious,
		pq.Array(&a.SuspiciousReasons),
		&a.CreatedAt,
		&employee.ID,
		&employee.Email,
		&employee.FullName,
		&employee.Phone,
		&employee.Position,
	)
	if err != nil {
		return nil, err
	}
	a.Employee = employee
	return a, nil
}