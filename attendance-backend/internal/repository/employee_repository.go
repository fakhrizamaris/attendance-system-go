// FILE: internal/repository/employee_repository.go
package repository

import (
	"attendance-backend/internal/models"
	"database/sql"
	"errors"
)

type EmployeeRepository struct {
	db *sql.DB
}

func NewEmployeeRepository(db *sql.DB) *EmployeeRepository {
	return &EmployeeRepository{db: db}
}

func (r *EmployeeRepository) Create(employee *models.Employee) error {
	query := `
		INSERT INTO employees (email, password, full_name, phone, position)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(
		query,
		employee.Email,
		employee.Password,
		employee.FullName,
		employee.Phone,
		employee.Position,
	).Scan(&employee.ID, &employee.CreatedAt, &employee.UpdatedAt)
}

func (r *EmployeeRepository) GetByEmail(email string) (*models.Employee, error) {
	employee := &models.Employee{}
	query := `
		SELECT id, email, password, full_name, phone, position, is_active, created_at, updated_at
		FROM employees
		WHERE email = $1
	`
	err := r.db.QueryRow(query, email).Scan(
		&employee.ID,
		&employee.Email,
		&employee.Password,
		&employee.FullName,
		&employee.Phone,
		&employee.Position,
		&employee.IsActive,
		&employee.CreatedAt,
		&employee.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("employee not found")
	}
	return employee, err
}

func (r *EmployeeRepository) GetByID(id int) (*models.Employee, error) {
	employee := &models.Employee{}
	query := `
		SELECT id, email, password, full_name, phone, position, is_active, created_at, updated_at
		FROM employees
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&employee.ID,
		&employee.Email,
		&employee.Password,
		&employee.FullName,
		&employee.Phone,
		&employee.Position,
		&employee.IsActive,
		&employee.CreatedAt,
		&employee.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("employee not found")
	}
	return employee, err
}