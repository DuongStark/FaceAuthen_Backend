# API Thông Báo và Thống Kê Nâng Cao

## ⚡ Tính Năng Tự Động

### Thông báo nhắc nhở buổi học (Automatic Session Reminders)

**Hệ thống tự động gửi thông báo** cho tất cả sinh viên trong lớp trước **30 phút** khi sắp đến giờ học.

**Cách hoạt động:**
- ✅ Cron job chạy mỗi **5 phút** kiểm tra lịch học
- ✅ Nếu có buổi học sắp diễn ra trong **30-35 phút tới**, gửi thông báo tự động
- ✅ Mỗi buổi học chỉ gửi thông báo **1 lần duy nhất**
- ✅ Chỉ gửi cho các buổi học có status = `SCHEDULED`

**Thông tin trong thông báo:**
- Tên buổi học (VD: "Buổi 1")
- Tên lớp
- Thời gian còn lại (VD: "còn 30 phút")
- Phòng học
- Link đến chi tiết schedule

**Ví dụ thông báo nhận được:**
```json
{
  "id": "notif-uuid-abc",
  "type": "SESSION_REMINDER",
  "title": "Nhắc nhở: Buổi học sắp diễn ra",
  "message": "Buổi 5 - Toán Cao Cấp A1 sẽ bắt đầu sau 30 phút. Phòng: A101",
  "data": {
    "sessionId": "session-uuid-123",
    "scheduleId": "schedule-uuid-456",
    "classId": "class-uuid-789",
    "sessionDate": "2024-09-05T00:00:00.000Z",
    "startTime": "07:00",
    "room": "A101"
  },
  "isRead": false,
  "createdAt": "2024-09-05T06:30:00.000Z"
}
```

**Cấu hình:**
- File: `src/services/notification.service.ts`
- Cron schedule: `*/5 * * * *` (mỗi 5 phút)
- Thời gian nhắc trước: 30-35 phút

---

## Thông Báo (Notifications)

### 1. Lấy thông báo của người dùng
**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `unreadOnly` (boolean, optional): Chỉ lấy thông báo chưa đọc

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-uuid-1",
      "userId": "user-uuid-123",
      "type": "SCHEDULE_CREATED",
      "title": "Lịch học mới",
      "message": "Lịch học Toán Cao Cấp đã được tạo cho học kỳ 1 2024-2025",
      "data": {
        "scheduleId": "schedule-uuid-abc",
        "classId": "class-uuid-def"
      },
      "isRead": false,
      "createdAt": "2024-09-01T10:00:00.000Z",
      "readAt": null
    }
  ],
  "unreadCount": 5
}
```

---

### 2. Đánh dấu thông báo đã đọc
**PATCH** `/api/notifications/:notificationId/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "notif-uuid-123",
    "isRead": true,
    "readAt": "2024-09-02T08:00:00.000Z"
  }
}
```

---

### 3. Đánh dấu tất cả thông báo đã đọc
**PATCH** `/api/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### 4. Xóa thông báo
**DELETE** `/api/notifications/:notificationId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification deleted"
}
```

---

### 5. Tạo thông báo cho 1 sinh viên (Admin/Giảng viên)
**POST** `/api/notifications/create-for-student`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "studentId": "D23DCCN001",
  "type": "GENERAL",
  "title": "Thông báo cá nhân",
  "message": "Bạn cần bổ sung ảnh khuôn mặt để điểm danh",
  "data": {
    "reason": "missing_face_image"
  }
}
```

**Loại thông báo (type):**
- `SCHEDULE_CREATED`: Lịch học mới được tạo
- `SCHEDULE_UPDATED`: Lịch học được cập nhật
- `SCHEDULE_CANCELLED`: Lịch học bị hủy
- `SESSION_REMINDER`: Nhắc nhở buổi học sắp diễn ra
- `ATTENDANCE_MARKED`: Điểm danh thành công
- `GENERAL`: Thông báo chung

**Response:**
```json
{
  "message": "Notification created successfully",
  "notification": {
    "id": "notif-uuid-123",
    "userId": "user-uuid-456",
    "type": "GENERAL",
    "title": "Thông báo cá nhân",
    "message": "Bạn cần bổ sung ảnh khuôn mặt để điểm danh",
    "isRead": false,
    "createdAt": "2024-11-25T10:00:00.000Z",
    "recipient": {
      "studentId": "D23DCCN001",
      "name": "Nguyễn Văn An",
      "email": "d23dccn001@stu.ptit.edu.vn",
      "class": "Toán Cao Cấp A1"
    }
  }
}
```

**Lỗi có thể gặp:**
```json
// Student không tồn tại
{
  "error": "Student not found",
  "message": "Student D23DCCN001 not found"
}

// Sinh viên chưa có User account
{
  "error": "User account not found",
  "message": "Student D23DCCN001 (Nguyễn Văn An) does not have a user account yet"
}

// Giảng viên gửi cho sinh viên không phải lớp của mình
{
  "error": "You can only send notifications to students in your own classes"
}
```

---

### 6. Tạo thông báo cho cả lớp (Admin/Giảng viên)
**POST** `/api/notifications/create-for-class`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "classId": "class-uuid-abc",
  "type": "SCHEDULE_CREATED",
  "title": "Lịch học mới",
  "message": "Lịch học Toán Cao Cấp đã được tạo",
  "data": {
    "scheduleId": "schedule-uuid-123"
  }
}
```

**Response:**
```json
{
  "message": "Notifications created successfully",
  "count": 40
}
```

---

## Thống Kê Nâng Cao (Admin)

### 7. Tổng quan hệ thống (Admin Dashboard)
**GET** `/api/statistics/admin/overview`

**Response:**
```json
{
  "overview": {
    "totalClasses": 15,
    "totalStudents": 450,
    "totalLecturers": 8,
    "totalSessions": 120,
    "overallAttendanceRate": 85.50,
    "overallAbsentRate": 14.50
  },
  "details": {
    "totalExpectedAttendances": 5400,
    "totalActualAttendances": 4617,
    "totalMissedAttendances": 783
  }
}
```

**Giải thích:**
- `totalClasses`: Tổng số lớp trong hệ thống
- `totalStudents`: Tổng số sinh viên
- `totalLecturers`: Tổng số giảng viên
- `totalSessions`: Tổng số buổi học
- `overallAttendanceRate`: Tỷ lệ điểm danh trung bình (%)
- `overallAbsentRate`: Tỷ lệ vắng trung bình (%)

---

### 8. Thống kê theo tuần (Biểu đồ)
**GET** `/api/statistics/admin/weekly`

**Query Parameters:**
- `startDate` (date, optional): Ngày bắt đầu (mặc định: 4 tuần trước)
- `endDate` (date, optional): Ngày kết thúc (mặc định: hôm nay)

**Example:**
```
GET /api/statistics/admin/weekly?startDate=2024-08-01&endDate=2024-09-01
```

**Response:**
```json
{
  "period": {
    "startDate": "2024-08-01T00:00:00.000Z",
    "endDate": "2024-09-01T00:00:00.000Z"
  },
  "weeklyStats": [
    {
      "weekStart": "2024-08-05T00:00:00.000Z",
      "weekEnd": "2024-08-11T23:59:59.999Z",
      "totalSessions": 30,
      "totalExpected": 1200,
      "totalAttended": 1050,
      "totalAbsent": 150,
      "attendanceRate": 87.50,
      "absentRate": 12.50
    },
    {
      "weekStart": "2024-08-12T00:00:00.000Z",
      "weekEnd": "2024-08-18T23:59:59.999Z",
      "totalSessions": 28,
      "totalExpected": 1120,
      "totalAttended": 952,
      "totalAbsent": 168,
      "attendanceRate": 85.00,
      "absentRate": 15.00
    }
  ]
}
```

**Sử dụng cho biểu đồ:**
- Trục X: `weekStart` hoặc `weekEnd`
- Trục Y: `attendanceRate` hoặc `absentRate`
- Có thể vẽ biểu đồ đường (line chart) hoặc cột (bar chart)

---

## Use Cases

### Use Case 1: Học sinh xem thông báo lịch học
```javascript
// 1. Lấy tất cả thông báo chưa đọc
GET /api/notifications?unreadOnly=true

// 2. Đánh dấu một thông báo đã đọc
PATCH /api/notifications/{notificationId}/read

// 3. Xem chi tiết lịch học từ data.scheduleId
GET /api/schedules/{scheduleId}/sessions
```

### Use Case 2: Giảng viên gửi thông báo cá nhân
```javascript
// Gửi thông báo cho 1 sinh viên cụ thể
POST /api/notifications/create-for-student
{
  "studentId": "D23DCCN001",  // ← Chỉ cần mã sinh viên
  "type": "GENERAL",
  "title": "Nhắc nhở",
  "message": "Bạn cần bổ sung ảnh khuôn mặt"
}
```

### Use Case 3: Giảng viên thông báo lịch học mới
```javascript
// 1. Tạo lịch học
POST /api/schedules/create

// 2. Thông báo cho cả lớp
POST /api/notifications/create-for-class
{
  "classId": "class-uuid",
  "type": "SCHEDULE_CREATED",
  "title": "Lịch học mới",
  "message": "Lịch học Toán Cao Cấp đã được tạo"
}
```

### Use Case 4: Hệ thống tự động nhắc nhở (AUTO)
```javascript
// Không cần gọi API - Hệ thống tự động!

// Khi nào: Trước 30 phút mỗi buổi học
// Ai nhận: Tất cả sinh viên trong lớp
// Nội dung: Thông tin buổi học + phòng học

// Sinh viên chỉ cần:
GET /api/notifications?unreadOnly=true
// -> Sẽ thấy thông báo nhắc nhở tự động
```

### Use Case 5: Admin xem dashboard thống kê
```javascript
// 1. Lấy tổng quan
GET /api/statistics/admin/overview

// 2. Lấy biểu đồ 4 tuần gần nhất
GET /api/statistics/admin/weekly

// 3. Vẽ biểu đồ từ weeklyStats
// - Line chart: attendance rate theo tuần
// - Bar chart: số lượng absent/attended
```

---

## 🔧 Cấu Hình Nâng Cao

### Thay đổi thời gian nhắc trước

Mặc định: **30 phút trước**

Để thay đổi, sửa file `src/services/notification.service.ts`:

```typescript
// Dòng 62-63
const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);  // Đổi 30 thành số phút mong muốn
const in35Minutes = new Date(now.getTime() + 35 * 60 * 1000);  // Đổi 35 = 30 + 5
```

### Thay đổi tần suất kiểm tra

Mặc định: **Mỗi 5 phút**

Để thay đổi, sửa file `src/services/notification.service.ts`:

```typescript
// Dòng 138
cron.schedule('*/5 * * * *', async () => {
  // */5 = mỗi 5 phút
  // */1 = mỗi 1 phút (không khuyến khích - tốn tài nguyên)
  // */10 = mỗi 10 phút
})
```

**Cron syntax:**
- `*/5 * * * *` - Mỗi 5 phút
- `*/10 * * * *` - Mỗi 10 phút
- `0 * * * *` - Mỗi giờ (phút 0)
- `0 6,12,18 * * *` - 6h, 12h, 18h mỗi ngày

### Tắt tính năng tự động

Trong file `src/index.ts`, comment dòng:

```typescript
// startNotificationScheduler(); // ← Comment dòng này để tắt
```

---

## 📊 Monitoring

### Xem log scheduler

Khi server chạy, bạn sẽ thấy log mỗi 5 phút:

```
🔔 Running notification scheduler...
🔍 Found 3 upcoming sessions
📢 Sent reminder for: Buổi 5 - Toán Cao Cấp A1
📢 Sent reminder for: Buổi 3 - Lập Trình Java
📢 Sent reminder for: Buổi 7 - Cơ Sở Dữ Liệu
✅ Sent 120 notifications for class abc-123-def
```

### Kiểm tra thông báo đã gửi

```sql
-- Trong PostgreSQL
SELECT 
  type,
  title,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN is_read = true THEN 1 END) as read_count
FROM notifications
WHERE type = 'SESSION_REMINDER'
  AND created_at >= NOW() - INTERVAL '1 day'
GROUP BY type, title;
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Thời gian server phải đúng**: Đảm bảo server timezone đúng, nếu không thông báo sẽ gửi sai giờ
2. **Không gửi trùng**: Hệ thống tự động check để không gửi thông báo trùng cho cùng 1 buổi học
3. **Chỉ gửi cho SCHEDULED**: Buổi học đã COMPLETED hoặc CANCELLED sẽ không nhận thông báo
4. **Database performance**: Nếu có nhiều lớp, nên thêm index cho bảng `schedule_sessions`:
   ```sql
   CREATE INDEX idx_session_date_status ON schedule_sessions(session_date, status);
   ```

---

## 🚀 Testing

### Test thông báo tự động

1. Tạo một lịch học sắp diễn ra trong 30-35 phút:
```bash
POST /api/schedules/create
{
  "classId": "your-class-id",
  "name": "Test Schedule",
  "startDate": "2024-11-25",
  "endDate": "2024-11-25",
  "daysOfWeek": [1],  # Thứ 2
  "startTime": "18:30",  # Giờ hiện tại + 30 phút
  "endTime": "20:00"
}
```

2. Chờ 5 phút (hoặc restart server để chạy ngay)

3. Check thông báo:
```bash
GET /api/notifications?unreadOnly=true
```

4. Xem log server để đảm bảo scheduler đã chạy

---

## Database Schema

### Notification Table
```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String           // Student's user ID
  type      NotificationType
  title     String
  message   String
  data      Json?            // Additional data
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  readAt    DateTime?
}

enum NotificationType {
  SCHEDULE_CREATED
  SCHEDULE_UPDATED
  SCHEDULE_CANCELLED
  SESSION_REMINDER
  ATTENDANCE_MARKED
  GENERAL
}
```
