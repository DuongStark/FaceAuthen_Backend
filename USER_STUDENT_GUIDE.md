# User & Student Management Guide

## Kiến trúc Database

### 2 Tables chính:

1. **User** - Authentication & Authorization
   - Dùng cho đăng nhập/đăng ký
   - Có các role: `lecturer`, `student`, `admin`
   - Primary key: `uid`

2. **Student** - Business Logic (Class Management)
   - Thuộc về một Class
   - Được lecturer import vào class
   - Link với User qua `email`
   - Primary key: `id`, có `studentId` (mã sinh viên)

---

## Workflow Hoàn Chỉnh

### **Scenario 1: Lecturer tạo class và import students**

#### Bước 1: Lecturer đăng nhập
```bash
POST /auth/login
{
  "email": "lecturer@uni.edu",
  "password": "lecturer123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJI...",
  "user": {
    "role": "lecturer"
  }
}
```

#### Bước 2: Tạo class
```bash
POST /classes
Authorization: Bearer <token>
{
  "name": "Web Development 2024",
  "code": "CS101",
  "description": "Introduction to Web Development"
}
```

Response:
```json
{
  "message": "Class created successfully",
  "class": {
    "id": "class-uuid-123",
    "name": "Web Development 2024",
    "code": "CS101"
  }
}
```

#### Bước 3: Import students vào class
```bash
POST /classes/class-uuid-123/students/import
Authorization: Bearer <token>
{
  "students": [
    {
      "studentId": "SV001",
      "name": "Nguyen Van A",
      "email": "sv001@student.uni.edu"
    },
    {
      "studentId": "SV002",
      "name": "Tran Thi B",
      "email": "sv002@student.uni.edu"
    }
  ]
}
```

Response:
```json
{
  "message": "Students imported successfully",
  "count": 2
}
```

**Lúc này:**
- ✅ Bảng `Student` có 2 records
- ❌ Bảng `User` chưa có (students chưa đăng ký)

---

### **Scenario 2: Student đăng ký tài khoản**

#### Student tự đăng ký với email đã được import
```bash
POST /auth/register
{
  "email": "sv001@student.uni.edu",  // ← Email khớp với Student đã import
  "password": "password123",
  "displayName": "Nguyen Van A",
  "role": "student"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user-uuid-456",
    "email": "sv001@student.uni.edu",
    "role": "student"
  }
}
```

**Lúc này:**
- ✅ Bảng `User` có record với email `sv001@student.uni.edu`
- ✅ Bảng `Student` có record với email `sv001@student.uni.edu`
- ✅ Link qua `email`

---

### **Scenario 3: Student login và điểm danh**

#### Bước 1: Login
```bash
POST /auth/login
{
  "email": "sv001@student.uni.edu",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJI...",
  "user": {
    "uid": "user-uuid-456",
    "email": "sv001@student.uni.edu",
    "role": "student"
  },
  "studentInfo": [
    {
      "id": "student-db-id",
      "studentId": "SV001",
      "name": "Nguyen Van A",
      "classId": "class-uuid-123",
      "class": {
        "id": "class-uuid-123",
        "name": "Web Development 2024",
        "code": "CS101"
      }
    }
  ]
}
```

**⭐ Quan trọng:** Response có thêm `studentInfo` - tự động link với Student records qua email!

#### Bước 2: Upload face descriptor
```bash
POST /faces/upload
Authorization: Bearer <token>
{
  "studentId": "SV001",  // ← Dùng studentId từ studentInfo
  "descriptor": [0.1, 0.2, 0.3, ...]
}
```

#### Bước 3: Điểm danh
```bash
POST /attendance/record
Authorization: Bearer <token>
{
  "sessionId": "session-uuid",
  "studentId": "SV001",
  "method": "face"
}
```

---

## API Endpoints

### Classes Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/classes` | Lecturer | Tạo class mới |
| GET | `/classes` | Any | Lấy danh sách classes của user |
| GET | `/classes/:id` | Any | Chi tiết class |
| PUT | `/classes/:id` | Lecturer | Update class |
| DELETE | `/classes/:id` | Lecturer | Xóa class |
| POST | `/classes/:id/students/import` | Lecturer | Import students |

---

## Quy trình thực tế

### **Đầu học kỳ:**
1. ✅ Admin/Lecturer tạo tài khoản
2. ✅ Lecturer tạo class
3. ✅ Lecturer import danh sách sinh viên (từ CSV)
   - Lúc này chỉ có records trong bảng `Student`

### **Students tự đăng ký:**
4. ✅ Sinh viên tự đăng ký với email đã được import
   - Tạo record trong bảng `User`
   - Link với `Student` qua email

### **Trong học kỳ:**
5. ✅ Lecturer mở session điểm danh
6. ✅ Students login và điểm danh bằng face
7. ✅ Lecturer xem danh sách điểm danh realtime

---

## Lợi ích của cách thiết kế này:

✅ **Tách biệt concerns**: Auth riêng, Business logic riêng
✅ **Linh hoạt**: 1 student có thể học nhiều class
✅ **Không bắt buộc register trước**: Lecturer có thể import trước
✅ **Dễ quản lý**: Lecturer control danh sách students
✅ **Scalable**: Dễ mở rộng cho nhiều học kỳ, nhiều năm

---

## FAQs

### **Q: Nếu student chưa register thì sao?**
A: Vẫn có record trong bảng `Student`, nhưng không login được. Khi register với email khớp sẽ tự động link.

### **Q: 1 student có thể học nhiều class?**
A: Có! Bảng `Student` có thể có nhiều records với cùng email nhưng khác `classId`.

### **Q: Nếu email trong User và Student không khớp?**
A: API sẽ trả về `studentInfo: null`. Student cần liên hệ lecturer để update email.

### **Q: Có cần migrate database không?**
A: Không! Cách này giữ nguyên schema hiện tại, chỉ link qua email.
