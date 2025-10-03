// FILE: internal/config/config.go
package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Server
	ServerHost string
	ServerPort string

	// JWT
	JWTSecret      string
	JWTExpiryHours int

	// Upload
	UploadPath          string
	MaxUploadSize       int64
	AllowedExtensions   []string

	// Security
	MaxGPSAccuracy         float64
	MaxDistanceDifference  float64
	RateLimitPerHour       int

	// CORS
	CORSAllowedOrigins []string
}

func Load() (*Config, error) {
	// Load .env file
	godotenv.Load()

	expiryHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE", "10485760"), 10, 64)
	maxGPSAccuracy, _ := strconv.ParseFloat(getEnv("MAX_GPS_ACCURACY", "100"), 64)
	maxDistanceDiff, _ := strconv.ParseFloat(getEnv("MAX_DISTANCE_DIFFERENCE", "200"), 64)
	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT_PER_HOUR", "10"))

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "attendance_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnv("SERVER_PORT", "8080"),

		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpiryHours: expiryHours,

		UploadPath:        getEnv("UPLOAD_PATH", "./uploads"),
		MaxUploadSize:     maxUploadSize,
		AllowedExtensions: strings.Split(getEnv("ALLOWED_EXTENSIONS", "jpg,jpeg,png"), ","),

		MaxGPSAccuracy:        maxGPSAccuracy,
		MaxDistanceDifference: maxDistanceDiff,
		RateLimitPerHour:      rateLimit,

		CORSAllowedOrigins: strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ","),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

