# Hướng Dẫn Sử Dụng Hệ Thống Lịch Học & Thống Kê

## Tổng Quan

Hệ thống đã được nâng cấp để hỗ trợ:
- ✅ **Tạo lịch học** theo thời khóa biểu cố định
- ✅ **Tự động tạo các buổi học** dựa trên ngày trong tuần
- ✅ **Điểm danh theo buổi học** đã lên lịch
- ✅ **Thống kê chi tiết** về tỷ lệ có mặt/vắng mặt

## Cách Thức Hoạt Động

### 1. Tạo Lịch Học (Schedule)
Giảng viên tạo lịch học cho lớp với thông tin:
- Thời gian: từ ngày ... đến ngày ...
- Ngày học: thứ 2, 4, 6 (hoặc các ngày khác)
- Giờ học: 7h-9h
- Phòng học: A101

**Hệ thống sẽ tự động tạo các buổi học (ScheduleSession)** dựa trên lịch.

### 2. Điểm Danh
Khi đến buổi học, giảng viên mở session điểm danh và sinh viên điểm danh như cũ.

### 3. Thống Kê
Xem thống kê chi tiết:
- Từng sinh viên: bao nhiêu buổi có mặt, vắng mặt, tỷ lệ %
- Cả lớp: danh sách tất cả sinh viên với thống kê
- Từng buổi học: ai có mặt, ai vắng

---

## API Endpoints

### 📅 QUẢN LÝ LỊCH HỌC

#### 1. Tạo Lịch Học
```http
POST /api/schedules/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "class-uuid",
  "name": "Học kỳ 1 2024-2025",
  "startDate": "2024-09-01",
  "endDate": "2025-01-15",
  "daysOfWeek": [1, 3, 5],  // 0=CN, 1=T2, 2=T3, ..., 6=T7
  "startTime": "07:00",
  "endTime": "09:00",
  "room": "A101",
  "description": "Lớp Toán Cao Cấp"
}
```

**Response:**
```json
{
  "message": "Schedule created successfully",
  "schedule": {
    "id": "schedule-uuid",
    "name": "Học kỳ 1 2024-2025",
    "totalSessions": 45
  }
}
```

#### 2. Lấy Danh Sách Lịch Học Của Lớp
```http
GET /api/schedules/class/:classId
```

**Response:**
```json
[
  {
    "id": "schedule-uuid",
    "name": "Học kỳ 1 2024-2025",
    "startDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2025-01-15T00:00:00.000Z",
    "daysOfWeek": [1, 3, 5],
    "startTime": "07:00",
    "endTime": "09:00",
    "room": "A101",
    "_count": {
      "scheduleSessions": 45
    }
  }
]
```

#### 3. Lấy Tất Cả Buổi Học Của Sinh Viên
```http
GET /api/schedules/my-schedules
Authorization: Bearer <token>
```

**Mô tả:** API này trả về **tất cả các buổi học cụ thể** của sinh viên. Nếu có 45 buổi học thì sẽ có 45 phần tử trong mảng. Mỗi phần tử có thông tin chi tiết về thời gian bắt đầu và kết thúc theo ngày giờ cụ thể.

**Response:**
```json
[
  {
    "id": "session-uuid-1",
    "sessionName": "Buổi 1",
    "sessionDate": "2024-09-02T00:00:00.000Z",
    "startDateTime": "2024-09-02T07:00:00.000Z",
    "endDateTime": "2024-09-02T09:00:00.000Z",
    "status": "COMPLETED",
    "note": null,
    "class": {
      "id": "abc-123-def-456",
      "name": "Toán Cao Cấp A1",
      "code": "MATH101"
    },
    "lecturerName": "Nguyễn Văn A",
    "schedule": {
      "id": "schedule-uuid-1",
      "name": "Học kỳ 1 2024-2025",
      "room": "A101",
      "description": "Lớp Toán Cao Cấp"
    },
    "attendanceSession": {
      "id": "attendance-session-uuid",
      "actualStartAt": "2024-09-02T07:05:00.000Z",
      "actualEndAt": "2024-09-02T09:10:00.000Z",
      "attendanceCount": 38
    },
    "createdAt": "2024-09-01T00:00:00.000Z",
    "updatedAt": "2024-09-01T00:00:00.000Z"
  },
  {
    "id": "session-uuid-2",
    "sessionName": "Buổi 2",
    "sessionDate": "2024-09-04T00:00:00.000Z",
    "startDateTime": "2024-09-04T07:00:00.000Z",
    "endDateTime": "2024-09-04T09:00:00.000Z",
    "status": "SCHEDULED",
    "note": null,
    "class": {
      "id": "abc-123-def-456",
      "name": "Toán Cao Cấp A1",
      "code": "MATH101"
    },
    "lecturerName": "Nguyễn Văn A",
    "schedule": {
      "id": "schedule-uuid-1",
      "name": "Học kỳ 1 2024-2025",
      "room": "A101",
      "description": "Lớp Toán Cao Cấp"
    },
    "attendanceSession": null,
    "createdAt": "2024-09-01T00:00:00.000Z",
    "updatedAt": "2024-09-01T00:00:00.000Z"
  }
]
```

**Lưu ý:**
- `startDateTime` và `endDateTime`: Thời gian chính xác của buổi học (ngày + giờ)
- `status`: Trạng thái buổi học (SCHEDULED/COMPLETED/CANCELLED)
- `attendanceSession`: Thông tin điểm danh thực tế (null nếu chưa mở điểm danh)
- API sẽ trả về **tất cả buổi học** từ các lớp mà sinh viên tham gia, sắp xếp theo thời gian tăng dần

#### 4. Lấy Danh Sách Buổi Học Của Một Lịch
```http
GET /api/schedules/:scheduleId/sessions
```

**Response:**
```json
[
  {
    "id": "session-uuid-1",
    "sessionName": "Buổi 1",
    "sessionDate": "2024-09-02T00:00:00.000Z",
    "status": "COMPLETED",
    "sessions": [
      {
        "id": "attendance-session-uuid",
        "startAt": "2024-09-02T07:00:00.000Z",
        "endAt": "2024-09-02T09:00:00.000Z",
        "_count": {
          "attendances": 38
        }
      }
    ]
  },
  {
    "id": "session-uuid-2",
    "sessionName": "Buổi 2",
    "sessionDate": "2024-09-04T00:00:00.000Z",
    "status": "SCHEDULED",
    "sessions": []
  }
]
```

#### 5. Cập Nhật Trạng Thái Buổi Học
```http
PATCH /api/schedules/sessions/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "CANCELLED",
  "note": "Nghỉ lễ"
}
```

#### 6. Xóa Lịch Học
```http
DELETE /api/schedules/:scheduleId
Authorization: Bearer <token>
```

---

### 📊 THỐNG KÊ ĐIỂM DANH

#### 1. Thống Kê Của Một Sinh Viên
```http
GET /api/statistics/student/:studentId/class/:classId
```

**Ví dụ:**
```http
GET /api/statistics/student/B21DCCN001/class/class-uuid
```

**Response:**
```json
{
  "student": {
    "studentId": "B21DCCN001",
    "name": "Nguyễn Văn An",
    "email": "an@student.edu"
  },
  "statistics": {
    "totalSessions": 45,
    "attendedSessions": 42,
    "absentSessions": 3,
    "attendanceRate": 93.33
  },
  "sessions": [
    {
      "sessionId": "session-uuid-1",
      "sessionName": "Buổi 1",
      "sessionDate": "2024-09-02T00:00:00.000Z",
      "status": "COMPLETED",
      "attended": true,
      "attendanceTime": "2024-09-02T07:05:00.000Z"
    },
    {
      "sessionId": "session-uuid-2",
      "sessionName": "Buổi 2",
      "sessionDate": "2024-09-04T00:00:00.000Z",
      "status": "COMPLETED",
      "attended": false,
      "attendanceTime": null
    }
  ]
}
```

#### 2. Thống Kê Cả Lớp
```http
GET /api/statistics/class/:classId
```

**Response:**
```json
{
  "classId": "class-uuid",
  "totalSessions": 45,
  "totalStudents": 40,
  "students": [
    {
      "studentId": "B21DCCN001",
      "name": "Nguyễn Văn An",
      "email": "an@student.edu",
      "totalSessions": 45,
      "attendedSessions": 42,
      "absentSessions": 3,
      "attendanceRate": 93.33
    },
    {
      "studentId": "B21DCCN002",
      "name": "Trần Thị Bình",
      "email": "binh@student.edu",
      "totalSessions": 45,
      "attendedSessions": 45,
      "absentSessions": 0,
      "attendanceRate": 100.00
    }
  ]
}
```

#### 3. Thống Kê Một Buổi Học
```http
GET /api/statistics/session/:scheduleSessionId
```

**Response:**
```json
{
  "session": {
    "id": "session-uuid",
    "name": "Buổi 1",
    "date": "2024-09-02T00:00:00.000Z",
    "status": "COMPLETED"
  },
  "statistics": {
    "totalStudents": 40,
    "attendedStudents": 38,
    "absentStudents": 2,
    "attendanceRate": 95.00
  },
  "attended": [
    {
      "studentId": "B21DCCN001",
      "name": "Nguyễn Văn An",
      "method": "face",
      "matchedAt": "2024-09-02T07:05:00.000Z"
    }
  ],
  "absent": [
    {
      "studentId": "B21DCCN003",
      "name": "Phạm Văn Cường"
    }
  ]
}
```

---

## Workflow Sử Dụng

### Bước 1: Giảng Viên Tạo Lịch Học
```bash
POST /api/schedules/create
```
→ Hệ thống tự động tạo 45 buổi học (ví dụ)

### Bước 2: Xem Lịch Học
```bash
GET /api/schedules/class/:classId
GET /api/schedules/:scheduleId/sessions
```
→ Xem tất cả các buổi đã được tạo

### Bước 3: Điểm Danh Như Cũ
```bash
POST /api/sessions/start  # Mở session điểm danh
POST /api/attendance/record  # Sinh viên điểm danh
```

### Bước 4: Xem Thống Kê
```bash
GET /api/statistics/student/:studentId/class/:classId  # Thống kê 1 sinh viên
GET /api/statistics/class/:classId  # Thống kê cả lớp
GET /api/statistics/session/:sessionId  # Thống kê 1 buổi
```

---

## Ví Dụ Thực Tế

### Tạo Lịch Học Môn Toán
```bash
curl -X POST http://localhost:8386/api/schedules/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "abc-123",
    "name": "Toán Cao Cấp - HK1 2024",
    "startDate": "2024-09-01",
    "endDate": "2024-12-31",
    "daysOfWeek": [1, 3, 5],
    "startTime": "07:00",
    "endTime": "09:00",
    "room": "A101"
  }'
```

### Xem Thống Kê Sinh Viên
```bash
curl http://localhost:8386/api/statistics/student/B21DCCN001/class/abc-123
```

---

## Lưu Ý

1. **Ngày trong tuần** (daysOfWeek):
   - **0 = Chủ Nhật**
   - **1 = Thứ Hai** 
   - **2 = Thứ Ba**
   - **3 = Thứ Tư**
   - **4 = Thứ Năm**
   - **5 = Thứ Sáu**
   - **6 = Thứ Bảy**
   
   **Ví dụ:**
   - `[1, 3, 5]` = Thứ 2, 4, 6
   - `[2, 4]` = Thứ 3, 5
   - `[1, 2, 3, 4, 5]` = Thứ 2 đến Thứ 6

2. **Kiểm tra trùng lịch**: Hệ thống sẽ tự động kiểm tra và không cho phép tạo 2 lịch học trùng thời gian cho cùng 1 lớp. Nếu có lịch trùng, bạn sẽ nhận được lỗi 400 với danh sách các lịch đang trùng.

2. **Trạng thái buổi học** (SessionStatus):
   - `SCHEDULED`: Đã lên lịch
   - `COMPLETED`: Đã hoàn thành
   - `CANCELLED`: Đã hủy

3. **Migration**: Chạy lệnh sau để tạo database:
   ```bash
   npx prisma migrate dev --name add-schedule-system
   npx prisma generate
   ```

4. **Testing**: Restart server sau khi chạy migration
   ```bash
   npm run dev
   ```
