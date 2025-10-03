// FILE: README.md
# Attendance System Backend

Backend API untuk sistem absensi karyawan dengan deteksi lokasi dan verifikasi foto.

## Features

- ✅ JWT Authentication
- ✅ GPS Location Tracking
- ✅ Photo Upload with EXIF Validation
- ✅ Fake Location Detection
- ✅ PostgreSQL Database
- ✅ RESTful API
- ✅ Docker Support

## Prerequisites

- Go 1.21+
- PostgreSQL 15+
- (Optional) Docker & Docker Compose

## Installation

### Manual Setup

1. **Clone & Setup**
```bash
cd attendance-backend
cp .env.example .env
# Edit .env sesuai konfigurasi Anda
```

2. **Install Dependencies**
```bash
go mod download
```

3. **Setup Database**
```bash
# Buat database
createdb attendance_db

# Migration akan otomatis jalan saat aplikasi start
```

4. **Run Application**
```bash
go run cmd/server/main.go
```

Server akan jalan di `http://localhost:8080`

### Docker Setup

1. **Build & Run dengan Docker Compose**
```bash
docker-compose up -d
```

2. **Check Logs**
```bash
docker-compose logs -f backend
```

3. **Stop Services**
```bash
docker-compose down
```

## API Endpoints

### Authentication

**Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "081234567890",
  "position": "Developer"
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "employee": {...}
}
```

**Get Profile**
```bash
GET /api/profile
Authorization: Bearer {token}
```

### Attendance

**Create Attendance**
```bash
POST /api/attendance
Authorization: Bearer {token}
Content-Type: multipart/form-data

Fields:
- photo: file
- latitude: float
- longitude: float
- accuracy: float
- address: string
```

**Get History**
```bash
GET /api/attendance/history
Authorization: Bearer {token}
```

**Get by ID**
```bash
GET /api/attendance/:id
Authorization: Bearer {token}
```

## Project Structure

```
attendance-backend/
├── cmd/server/          # Application entry point
├── internal/
│   ├── config/         # Configuration
│   ├── database/       # Database connection & migrations
│   ├── handlers/       # HTTP handlers
│   ├── middleware/     # Middleware (auth, cors, logger)
│   ├── models/         # Data models
│   ├── repository/     # Database layer
│   └── service/        # Business logic
├── pkg/
│   └── utils/          # Utilities (exif, distance)
├── uploads/            # Uploaded files
├── .env               # Environment variables
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=attendance_db

# Server
SERVER_PORT=8080

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY_HOURS=24

# Upload
UPLOAD_PATH=./uploads
MAX_UPLOAD_SIZE=10485760

# Security
MAX_GPS_ACCURACY=100
MAX_DISTANCE_DIFFERENCE=200
```

## Testing

```bash
# Test Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Test Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Health Check
curl http://localhost:8080/health
```

## Security Features

1. **JWT Authentication** - Token-based auth
2. **Password Hashing** - bcrypt
3. **GPS Validation** - Akurasi & jarak
4. **EXIF Extraction** - GPS dari foto
5. **Suspicious Detection** - Auto flag kecurangan
6. **CORS Protection** - Whitelist origins
7. **File Validation** - Type & size limits

## License

MIT