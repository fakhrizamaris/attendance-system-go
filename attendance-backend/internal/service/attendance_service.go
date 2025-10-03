// FILE: internal/service/attendance_service.go (Part 1)
package service

import (
	"attendance-backend/internal/config"
	"attendance-backend/internal/models"
	"attendance-backend/internal/repository"
	"attendance-backend/pkg/utils"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type AttendanceService struct {
	repo *repository.AttendanceRepository
	cfg  *config.Config
}

func NewAttendanceService(repo *repository.AttendanceRepository, cfg *config.Config) *AttendanceService {
	// Create upload directory if not exists
	os.MkdirAll(cfg.UploadPath, 0755)
	return &AttendanceService{repo: repo, cfg: cfg}
}

func (s *AttendanceService) Create(employeeID int, req *models.CreateAttendanceRequest, photoFile *multipart.FileHeader) (*models.Attendance, error) {
	// Validate GPS accuracy
	if req.Accuracy > s.cfg.MaxGPSAccuracy {
		return nil, fmt.Errorf("GPS accuracy too low: %.2fm (max: %.2fm)", req.Accuracy, s.cfg.MaxGPSAccuracy)
	}

	// Save photo
	photoPath, err := s.savePhoto(photoFile)
	if err != nil {
		return nil, err
	}

	// Extract EXIF data
	photoLat, photoLon, photoTime, err := utils.ExtractExifGPS(filepath.Join(s.cfg.UploadPath, photoPath))
	
	// Validate location
	suspiciousReasons := []string{}
	isSuspicious := false

	if photoLat != nil && photoLon != nil {
		distance := utils.CalculateDistance(req.Latitude, req.Longitude, *photoLat, *photoLon)
		if distance > s.cfg.MaxDistanceDifference {
			isSuspicious = true
			suspiciousReasons = append(suspiciousReasons, fmt.Sprintf("Location mismatch: %.2fm difference", distance))
		}
	} else {
		suspiciousReasons = append(suspiciousReasons, "Photo has no GPS data")
	}

	attendance := &models.Attendance{
		EmployeeID:        employeeID,
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		Accuracy:          req.Accuracy,
		Address:           req.Address,
		PhotoPath:         photoPath,
		PhotoLatitude:     photoLat,
		PhotoLongitude:    photoLon,
		PhotoTimestamp:    photoTime,
		IsSuspicious:      isSuspicious,
		SuspiciousReasons: suspiciousReasons,
	}

	if err := s.repo.Create(attendance); err != nil {
		// Delete uploaded photo if database insert fails
		os.Remove(filepath.Join(s.cfg.UploadPath, photoPath))
		return nil, err
	}

	attendance.PhotoURL = fmt.Sprintf("/uploads/%s", photoPath)
	return attendance, nil
}

func (s *AttendanceService) savePhoto(file *multipart.FileHeader) (string, error) {
	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	ext = strings.TrimPrefix(ext, ".")
	
	allowed := false
	for _, allowedExt := range s.cfg.AllowedExtensions {
		if ext == allowedExt {
			allowed = true
			break
		}
	}
	if !allowed {
		return "", errors.New("file type not allowed")
	}

	// Validate file size
	if file.Size > s.cfg.MaxUploadSize {
		return "", fmt.Errorf("file too large: %d bytes (max: %d bytes)", file.Size, s.cfg.MaxUploadSize)
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s_%s.%s", time.Now().Format("20060102_150405"), uuid.New().String()[:8], ext)
	
	// Open source file
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(filepath.Join(s.cfg.UploadPath, filename))
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copy file
	if _, err := dst.ReadFrom(src); err != nil {
		return "", err
	}

	return filename, nil
}

func (s *AttendanceService) GetHistory(employeeID int) ([]*models.Attendance, error) {
	attendances, err := s.repo.GetByEmployeeID(employeeID, 50)
	if err != nil {
		return nil, err
	}

	// Add photo URLs
	for _, a := range attendances {
		a.PhotoURL = fmt.Sprintf("/uploads/%s", a.PhotoPath)
	}

	return attendances, nil
}

func (s *AttendanceService) GetByID(id int) (*models.Attendance, error) {
	attendance, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	attendance.PhotoURL = fmt.Sprintf("/uploads/%s", attendance.PhotoPath)
	return attendance, nil
}