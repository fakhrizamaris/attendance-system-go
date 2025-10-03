// FILE: internal/models/employee.go
package models

import "time"

type Employee struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	FullName  string    `json:"full_name"`
	Phone     string    `json:"phone"`
	Position  string    `json:"position"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	Phone    string `json:"phone"`
	Position string `json:"position"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token    string    `json:"token"`
	Employee *Employee `json:"employee"`
}