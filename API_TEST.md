# API Testing Guide

## Endpoints Site

### Base URL
```
http://localhost:3000
```

## Test với Swagger UI (Recommended)

1. Start server: `npm run dev`
2. Mở browser: `http://localhost:3000/api/api-docs`
3. Test trực tiếp trên Swagger UI

## Test với cURL hoặc Postman

### 1. Đăng ký (POST /api/auth/register)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User",
    "role": "student"
  }'
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "...",
    "email": "test@example.com",
    "displayName": "Test User",
    "role": "student"
  }
}
```

### 2. Đăng nhập (POST /api/auth/login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lecturer@uni.edu",
    "password": "lecturer123"
  }'
```

**Response 200:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "...",
    "email": "lecturer@uni.edu",
    "displayName": "Dr. John Smith",
    "role": "lecturer"
  }
}
```

### 3. Lấy thông tin user (GET /api/auth/me)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Đăng xuất (POST /api/auth/logout)
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Seed Accounts

**Lecturer:**
- Email: `lecturer@uni.edu`
- Password: `lecturer123`

**Student:**
- Email: `student@uni.edu`
- Password: `student123`

## Troubleshooting

### 404 Not Found
- Kiểm tra URL đúng: `/api/auth/register` (có `/api` prefix)
- Kiểm tra server đang chạy: `http://localhost:3000`
- Kiểm tra routes trong `src/routes/index.ts`

### Connection Error
- Kiểm tra `.env` file có DATABASE_URL
- Chạy: `npm run db:generate && npm run db:push`

### 500 Internal Server Error
- Xem logs trong terminal
- Kiểm tra database connection
- Kiểm tra Prisma schema
