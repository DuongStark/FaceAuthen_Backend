# Hướng Dẫn API: Lấy Lịch Học Của Sinh Viên

## API Endpoint

```http
GET /api/schedules/my-schedules
Authorization: Bearer <student-token>
```

## Mô Tả

API này trả về **tất cả các buổi học cụ thể** của sinh viên hiện tại. 

- Nếu sinh viên có 45 buổi học → API trả về mảng có **45 phần tử**
- Mỗi phần tử là một buổi học với thông tin chi tiết về:
  - Thời gian bắt đầu và kết thúc **đầy đủ** (ngày + giờ)
  - Tên buổi học, phòng học, giảng viên
  - Trạng thái buổi học
  - Thông tin điểm danh (nếu đã mở)

## Request

### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Không cần parameters hoặc body

API tự động lấy thông tin từ token của sinh viên đang đăng nhập.

## Response

### Success Response (200 OK)

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
  },
  {
    "id": "session-uuid-3",
    "sessionName": "Buổi 3",
    "sessionDate": "2024-09-06T00:00:00.000Z",
    "startDateTime": "2024-09-06T07:00:00.000Z",
    "endDateTime": "2024-09-06T09:00:00.000Z",
    "status": "CANCELLED",
    "note": "Nghỉ lễ Quốc Khánh",
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
    "updatedAt": "2024-09-05T10:00:00.000Z"
  }
]
```

### Error Response

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Nguyên nhân:** Không có token hoặc token không hợp lệ.

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
**Nguyên nhân:** Lỗi server.

---

## Chi Tiết Các Trường Dữ Liệu

### Thông tin buổi học

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID của buổi học |
| `sessionName` | string | Tên buổi học (VD: "Buổi 1", "Buổi 2") |
| `sessionDate` | ISO 8601 | Ngày học (chỉ có ngày, giờ = 00:00:00) |
| `startDateTime` | ISO 8601 | **Thời gian bắt đầu đầy đủ** (ngày + giờ) |
| `endDateTime` | ISO 8601 | **Thời gian kết thúc đầy đủ** (ngày + giờ) |
| `status` | string | Trạng thái: `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `note` | string \| null | Ghi chú (VD: "Nghỉ lễ") |

### Thông tin lớp học

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `class.id` | string | ID lớp học |
| `class.name` | string | Tên lớp học |
| `class.code` | string | Mã lớp học |
| `lecturerName` | string | Tên giảng viên |

### Thông tin lịch học

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `schedule.id` | string | ID lịch học |
| `schedule.name` | string | Tên lịch (VD: "Học kỳ 1 2024-2025") |
| `schedule.room` | string | Phòng học (VD: "A101") |
| `schedule.description` | string \| null | Mô tả lịch học |

### Thông tin điểm danh

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `attendanceSession` | object \| null | Thông tin điểm danh (null nếu chưa mở) |
| `attendanceSession.id` | string | ID session điểm danh |
| `attendanceSession.actualStartAt` | ISO 8601 | Thời gian thực tế mở điểm danh |
| `attendanceSession.actualEndAt` | ISO 8601 | Thời gian thực tế đóng điểm danh |
| `attendanceSession.attendanceCount` | number | Số lượng sinh viên đã điểm danh |

---

## Ví Dụ Sử Dụng

### JavaScript/TypeScript (Fetch API)

```javascript
const token = 'your-student-token';

fetch('http://localhost:8386/api/schedules/my-schedules', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(sessions => {
    console.log(`Tổng số buổi học: ${sessions.length}`);
    
    sessions.forEach(session => {
      const startDate = new Date(session.startDateTime);
      const endDate = new Date(session.endDateTime);
      
      console.log(`
        ${session.sessionName}
        Lớp: ${session.class.name} (${session.class.code})
        Giảng viên: ${session.lecturerName}
        Phòng: ${session.schedule.room}
        Thời gian: ${startDate.toLocaleString('vi-VN')} - ${endDate.toLocaleString('vi-VN')}
        Trạng thái: ${session.status}
      `);
    });
  })
  .catch(error => console.error('Error:', error));
```

### cURL

```bash
curl -X GET http://localhost:8386/api/schedules/my-schedules \
  -H "Authorization: Bearer your-student-token" \
  -H "Content-Type: application/json"
```

### Axios (React/Vue)

```javascript
import axios from 'axios';

const getMySchedules = async () => {
  try {
    const response = await axios.get('http://localhost:8386/api/schedules/my-schedules', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const sessions = response.data;
    console.log(`Tổng số buổi học: ${sessions.length}`);
    return sessions;
  } catch (error) {
    console.error('Error fetching schedules:', error);
  }
};
```

---

## Định Dạng Thời Gian

API sử dụng chuẩn **ISO 8601** cho tất cả thời gian.

### Ví dụ:
```
"2024-09-02T07:00:00.000Z"
```

- `2024-09-02`: Ngày (năm-tháng-ngày)
- `T`: Ký tự phân cách
- `07:00:00.000`: Giờ (giờ:phút:giây.mili giây)
- `Z`: Múi giờ UTC

### Chuyển đổi sang giờ Việt Nam:

```javascript
const isoString = "2024-09-02T07:00:00.000Z";
const date = new Date(isoString);

// Hiển thị theo múi giờ Việt Nam
console.log(date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
// Output: "2/9/2024, 14:00:00" (UTC+7)
```

---

## Trạng Thái Buổi Học

| Trạng thái | Mô tả |
|-----------|-------|
| `SCHEDULED` | Buổi học đã được lên lịch, chưa diễn ra |
| `COMPLETED` | Buổi học đã hoàn thành |
| `CANCELLED` | Buổi học đã bị hủy (VD: nghỉ lễ) |

---

## Lưu Ý Quan Trọng

### 1. Sắp Xếp
- Các buổi học được sắp xếp theo **thời gian tăng dần** (từ buổi sớm nhất đến muộn nhất)

### 2. Tất Cả Lớp
- API trả về buổi học từ **TẤT CẢ các lớp** mà sinh viên tham gia
- Nếu sinh viên học 3 môn, API sẽ trả về buổi học của cả 3 môn

### 3. Phân Biệt Thời Gian
- `sessionDate`: Chỉ có ngày (giờ = 00:00:00)
- `startDateTime` & `endDateTime`: Có **đầy đủ ngày + giờ cụ thể**
- `actualStartAt` & `actualEndAt`: Thời gian **thực tế** mở/đóng điểm danh (có thể khác với lịch)

### 4. attendanceSession
- `null`: Chưa mở điểm danh cho buổi học này
- `object`: Đã mở điểm danh, có thông tin chi tiết

---

## Workflow Sử Dụng

### Bước 1: Lấy danh sách buổi học
```http
GET /api/schedules/my-schedules
```

### Bước 2: Hiển thị trên UI
- Hiển thị danh sách tất cả buổi học
- Có thể lọc theo:
  - Lớp học (`class.id`)
  - Trạng thái (`status`)
  - Thời gian (`startDateTime`)

### Bước 3: Xem chi tiết
- Nhấp vào buổi học để xem chi tiết
- Kiểm tra `attendanceSession` để biết đã điểm danh hay chưa

---

## Ví Dụ Thực Tế

### Sinh viên có 2 môn học:
- **Toán Cao Cấp**: Thứ 2, 4, 6 (7h-9h) - 45 buổi
- **Lập Trình Python**: Thứ 3, 5 (13h-15h) - 30 buổi

→ API sẽ trả về **75 phần tử** (45 + 30), sắp xếp theo thời gian.

---

## Hỗ Trợ

Nếu có vấn đề, vui lòng kiểm tra:
1. Token có hợp lệ không?
2. Token có phải của **sinh viên** không? (role = `student`)
3. Sinh viên đã được thêm vào lớp chưa?
4. Lớp đã có lịch học chưa?

