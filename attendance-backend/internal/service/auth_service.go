// FILE: internal/service/auth_service.go
package service

import (
	"attendance-backend/internal/models"
	"attendance-backend/internal/repository"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	employeeRepo *repository.EmployeeRepository
	jwtSecret    string
}

func NewAuthService(employeeRepo *repository.EmployeeRepository, jwtSecret string) *AuthService {
	return &AuthService{
		employeeRepo: employeeRepo,
		jwtSecret:    jwtSecret,
	}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.Employee, error) {
	// Check if email already exists
	existing, _ := s.employeeRepo.GetByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	employee := &models.Employee{
		Email:    req.Email,
		Password: string(hashedPassword),
		FullName: req.FullName,
		Phone:    req.Phone,
		Position: req.Position,
		IsActive: true,
	}

	if err := s.employeeRepo.Create(employee); err != nil {
		return nil, err
	}

	return employee, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	employee, err := s.employeeRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !employee.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := s.generateToken(employee.ID)
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token:    token,
		Employee: employee,
	}, nil
}

func (s *AuthService) generateToken(employeeID int) (string, error) {
	claims := jwt.MapClaims{
		"employee_id": employeeID,
		"exp":         time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) GetEmployeeByID(id int) (*models.Employee, error) {
	return s.employeeRepo.GetByID(id)
}