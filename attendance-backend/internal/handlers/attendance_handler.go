// FILE: internal/handlers/attendance_handler.go
package handlers

import (
	"attendance-backend/internal/models"
	"attendance-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AttendanceHandler struct {
	attendanceService *service.AttendanceService
}

func NewAttendanceHandler(attendanceService *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{attendanceService: attendanceService}
}

func (h *AttendanceHandler) Create(c *gin.Context) {
	employeeID := c.GetInt("employee_id")

	// Parse form data
	latitude, _ := strconv.ParseFloat(c.PostForm("latitude"), 64)
	longitude, _ := strconv.ParseFloat(c.PostForm("longitude"), 64)
	accuracy, _ := strconv.ParseFloat(c.PostForm("accuracy"), 64)
	address := c.PostForm("address")

	req := &models.CreateAttendanceRequest{
		Latitude:  latitude,
		Longitude: longitude,
		Accuracy:  accuracy,
		Address:   address,
	}

	// Get uploaded photo
	photoFile, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo is required"})
		return
	}

	// Create attendance
	attendance, err := h.attendanceService.Create(employeeID, req, photoFile)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Attendance recorded successfully",
		"data": attendance,
	})
}

func (h *AttendanceHandler) GetHistory(c *gin.Context) {
	employeeID := c.GetInt("employee_id")

	attendances, err := h.attendanceService.GetHistory(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attendances)
}

func (h *AttendanceHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	attendance, err := h.attendanceService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attendance not found"})
		return
	}

	// Check if requester is the owner
	employeeID := c.GetInt("employee_id")
	if attendance.EmployeeID != employeeID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, attendance)
}