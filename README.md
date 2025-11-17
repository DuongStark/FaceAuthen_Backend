# Education Management Backend

Backend API với PostgreSQL, Prisma ORM, và Swagger UI.

## Features

- 🔐 JWT Authentication
- 👥 Role-based access (lecturer, student, admin)
- 📚 Class & Student management
- 📄 CSV import students
- 👤 Face Recognition (Descriptors)
- 🎯 Session Management
- ✅ Attendance Tracking
- 🔄 Realtime Updates (SSE)
- 🛡️ Anti-Duplicate Protection
- 🌐 **School Network IP Check** (chỉ cho phép điểm danh từ wifi trường)
- 📖 Swagger documentation

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Setup Supabase

Tạo project tại https://supabase.com và lấy connection string:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
```

### 3. Setup Database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Start Server
```bash
npm run dev
```

- API: http://localhost:3000
- Docs: http://localhost:3000/api-docs
- Login: `lecturer@uni.edu` / `lecturer123`

## Commands

- `npm run dev` - Start development server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create migration
- `npm run db:seed` - Seed data
- `npm run db:studio` - View database

## CSV Format

```csv
studentId,name,email
SV001,Nguyen Van A,sv001@student.uni.edu
SV002,Tran Thi B,sv002@student.uni.edu
```

## API

### Auth
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `GET /auth/me` - Thông tin user
- `POST /auth/logout` - Đăng xuất

### Faces
- `POST /faces/upload` - Upload face descriptor
- `GET /faces/gallery/:classId` - Lấy gallery

### Sessions
- `POST /sessions/start` - Mở phiên
- `POST /sessions/:id/end` - Đóng phiên
- `GET /sessions/active/:classId` - Lấy phiên đang mở

### Attendance
- `POST /attendance/record` - Ghi điểm danh
- `GET /attendance/:sessionId` - Danh sách điểm danh
- `GET /attendance/:sessionId/subscribe` - Subscribe realtime

Xem full docs tại `/api-docs`.

Xem chi tiết: [API_ATTENDANCE.md](./API_ATTENDANCE.md)

## Tech Stack

- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- Server-Sent Events (SSE)
- Swagger UI
- TypeScript

## Documentation

- [API_TEST.md](./API_TEST.md) - API Testing Guide
- [API_ATTENDANCE.md](./API_ATTENDANCE.md) - Faces & Attendance Guide
- [IP_CONFIG_GUIDE.md](./IP_CONFIG_GUIDE.md) - **School Network IP Configuration** 🆕
