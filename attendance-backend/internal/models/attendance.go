// FILE: internal/models/attendance.go
package models

import "time"

type Attendance struct {
	ID                 int       `json:"id"`
	EmployeeID         int       `json:"employee_id"`
	Latitude           float64   `json:"latitude"`
	Longitude          float64   `json:"longitude"`
	Accuracy           float64   `json:"accuracy"`
	Address            string    `json:"address"`
	PhotoPath          string    `json:"photo_path"`
	PhotoURL           string    `json:"photo_url"`
	PhotoLatitude      *float64  `json:"photo_latitude"`
	PhotoLongitude     *float64  `json:"photo_longitude"`
	PhotoTimestamp     *time.Time `json:"photo_timestamp"`
	DeviceInfo         string    `json:"device_info"`
	IsSuspicious       bool      `json:"is_suspicious"`
	SuspiciousReasons  []string  `json:"suspicious_reasons"`
	CreatedAt          time.Time `json:"created_at"`
	
	// Relations
	Employee *Employee `json:"employee,omitempty"`
}

type CreateAttendanceRequest struct {
	Latitude       float64   `json:"latitude" binding:"required"`
	Longitude      float64   `json:"longitude" binding:"required"`
	Accuracy       float64   `json:"accuracy" binding:"required"`
	Address        string    `json:"address"`
	PhotoMetadata  string    `json:"photoMetadata"`
	SecurityChecks string    `json:"securityChecks"`
}