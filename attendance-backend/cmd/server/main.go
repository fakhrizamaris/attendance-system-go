package main

import (
	"attendance-backend/internal/config"
	"attendance-backend/internal/database"
	"attendance-backend/internal/handlers"
	"attendance-backend/internal/middleware"
	"attendance-backend/internal/repository"
	"attendance-backend/internal/service"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Solusi 1: Gunakan godotenv.Load() tanpa parameter
	// Ini akan otomatis mencari .env di working directory
	if err := godotenv.Load(); err != nil {
		// Coba cari .env di beberapa lokasi
		// Dapatkan path executable
		ex, err := os.Executable()
		if err == nil {
			exPath := filepath.Dir(ex)
			// Coba load dari directory executable
			envPath := filepath.Join(exPath, ".env")
			if err := godotenv.Load(envPath); err != nil {
				// Coba dari parent directory
				envPath = filepath.Join(exPath, "..", ".env")
				if err := godotenv.Load(envPath); err != nil {
					// Coba dari parent's parent directory
					envPath = filepath.Join(exPath, "..", "..", ".env")
					if err := godotenv.Load(envPath); err != nil {
						log.Printf("Warning: Could not load .env file from any location")
						log.Printf("Make sure .env file exists in project root")
						// Tidak fatal, biarkan environment variables dari system
					}
				}
			}
		}
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Initialize database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize repositories
	employeeRepo := repository.NewEmployeeRepository(db)
	attendanceRepo := repository.NewAttendanceRepository(db)

	// Initialize services
	authService := service.NewAuthService(employeeRepo, cfg.JWTSecret)
	attendanceService := service.NewAttendanceService(attendanceRepo, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	attendanceHandler := handlers.NewAttendanceHandler(attendanceService)
	locationHandler := handlers.LocationHandler{GoogleAPIKey: cfg.GoogleMapsAPIKey}

	// Setup router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORS(cfg.CORSAllowedOrigins))
	router.Use(middleware.Logger())

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/login", authHandler.Login)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.POST("/attendance", attendanceHandler.Create)
		protected.GET("/attendance/history", attendanceHandler.GetHistory)
		protected.GET("/attendance/:id", attendanceHandler.GetByID)
		protected.GET("/profile", authHandler.GetProfile)
		protected.GET("/location/reverse-geocode", locationHandler.ReverseGeocode)
	}
	

	// Serve uploaded files
	router.Static("/uploads", cfg.UploadPath)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}