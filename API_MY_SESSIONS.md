# API My Sessions - Lấy Danh Sách Session Của User

## Mô Tả

API endpoint cho phép user (giảng viên hoặc sinh viên) lấy danh sách tất cả các session điểm danh liên quan đến họ.

## Endpoint

```
GET /sessions/my-sessions
```

## Authentication

**Required**: YES  
**Header**: `Authorization: Bearer <token>`

## Phân Quyền

### Lecturer/Admin
- Trả về tất cả sessions từ các lớp họ dạy
- Bao gồm cả sessions đang active và đã kết thúc

### Student
- Trả về tất cả sessions từ các lớp họ tham gia
- Link qua email để tìm Student records
- Nếu chưa có Student records → trả về mảng rỗng `[]`

## Response Format

### Success Response (200 OK)

**Response Body:**
```json
[
  {
    "id": "session-uuid-1",
    "classId": "class-uuid-123",
    "className": "Lập Trình Cơ Bản",
    "classCode": "IT101",
    "lecturerName": "Giảng Viên Nguyễn Văn A",
    "scheduleSessionId": "schedule-session-uuid-456",
    "scheduleSession": {
      "id": "schedule-session-uuid-456",
      "sessionName": "Buổi 5",
      "sessionDate": "2024-01-15T00:00:00.000Z",
      "status": "COMPLETED"
    },
    "startAt": "2024-01-15T07:00:00.000Z",
    "endAt": "2024-01-15T09:00:00.000Z",
    "isActive": false,
    "totalAttendances": 38,
    "createdBy": "lecturer-uuid-abc",
    "createdAt": "2024-01-15T07:00:00.000Z"
  },
  {
    "id": "session-uuid-2",
    "classId": "class-uuid-456",
    "className": "Cấu Trúc Dữ Liệu",
    "classCode": "IT201",
    "lecturerName": "Giảng Viên Nguyễn Văn A",
    "scheduleSessionId": null,
    "scheduleSession": null,
    "startAt": "2024-01-10T07:00:00.000Z",
    "endAt": null,
    "isActive": true,
    "totalAttendances": 25,
    "createdBy": "lecturer-uuid-abc",
    "createdAt": "2024-01-10T07:00:00.000Z"
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID của session |
| `classId` | string | UUID của lớp học |
| `className` | string | Tên lớp học |
| `classCode` | string | Mã lớp học |
| `lecturerName` | string | Tên giảng viên |
| `scheduleSessionId` | string/null | UUID của buổi học trong lịch (nếu có) |
| `scheduleSession` | object/null | Thông tin buổi học trong lịch |
| `scheduleSession.id` | string | UUID của schedule session |
| `scheduleSession.sessionName` | string | Tên buổi học (VD: "Buổi 5") |
| `scheduleSession.sessionDate` | string | Ngày của buổi học |
| `scheduleSession.status` | string | Trạng thái: SCHEDULED, COMPLETED, CANCELLED |
| `startAt` | string | Thời gian bắt đầu session |
| `endAt` | string/null | Thời gian kết thúc session (null = đang active) |
| `isActive` | boolean | Session có đang active không |
| `totalAttendances` | number | Tổng số lượt điểm danh |
| `createdBy` | string | UUID của user tạo session |
| `createdAt` | string | Thời gian tạo session |

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Use Cases

### Use Case 1: Giảng Viên Xem Lịch Sử Điểm Danh

**Scenario:** Giảng viên muốn xem tất cả các phiên điểm danh đã tạo

**Request:**
```bash
curl -X GET http://localhost:3000/sessions/my-sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
[
  {
    "id": "session-1",
    "className": "Lập Trình Cơ Bản",
    "classCode": "IT101",
    "isActive": true,
    "totalAttendances": 30,
    "startAt": "2024-01-15T07:00:00.000Z",
    "endAt": null
  },
  {
    "id": "session-2",
    "className": "Lập Trình Cơ Bản",
    "classCode": "IT101",
    "isActive": false,
    "totalAttendances": 38,
    "startAt": "2024-01-10T07:00:00.000Z",
    "endAt": "2024-01-10T09:00:00.000Z"
  }
]
```

**Action:** 
- Hiển thị danh sách trong UI
- Filter theo lớp, theo ngày, theo trạng thái active
- Click vào session để xem chi tiết attendance

### Use Case 2: Sinh Viên Xem Lịch Sử Điểm Danh

**Scenario:** Sinh viên muốn xem các buổi học đã có session điểm danh

**Request:**
```bash
curl -X GET http://localhost:3000/sessions/my-sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
[
  {
    "id": "session-1",
    "className": "Lập Trình Cơ Bản",
    "classCode": "IT101",
    "lecturerName": "GV Nguyễn Văn A",
    "scheduleSession": {
      "sessionName": "Buổi 5",
      "sessionDate": "2024-01-15T00:00:00.000Z"
    },
    "isActive": true,
    "startAt": "2024-01-15T07:00:00.000Z"
  }
]
```

**Action:**
- Kiểm tra xem đã điểm danh chưa (call API `/attendance/:sessionId`)
- Hiển thị thông báo nếu có session đang active
- Cho phép điểm danh nếu session active

### Use Case 3: Sinh Viên Chưa Import Vào Lớp

**Scenario:** Student đã đăng ký nhưng chưa được import vào class nào

**Request:**
```bash
curl -X GET http://localhost:3000/sessions/my-sessions \
  -H "Authorization: Bearer <student-token>"
```

**Response:**
```json
[]
```

**Action:** Hiển thị thông báo "Bạn chưa tham gia lớp nào"

## Sắp Xếp & Filtering

### Sắp Xếp
- **Mặc định:** Sessions được sắp xếp theo `startAt` giảm dần (mới nhất lên đầu)

### Filtering (Client-side)
Có thể filter trên client:

```javascript
// Filter sessions đang active
const activeSessions = sessions.filter(s => s.isActive);

// Filter theo classId
const classSpecificSessions = sessions.filter(s => s.classId === 'class-uuid');

// Filter theo ngày
const todaySessions = sessions.filter(s => {
  const sessionDate = new Date(s.startAt);
  const today = new Date();
  return sessionDate.toDateString() === today.toDateString();
});

// Filter sessions có link với schedule
const scheduledSessions = sessions.filter(s => s.scheduleSessionId !== null);
```

## Performance Notes

- Endpoint tối ưu với `select` chỉ các field cần thiết
- Có index trên `classId` và `startAt`
- Với lecturer có nhiều lớp và nhiều sessions, response có thể lớn
- Recommend: Implement pagination nếu số lượng sessions > 100

## Example Frontend Code

### React/TypeScript

```typescript
interface Session {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  lecturerName: string;
  scheduleSessionId: string | null;
  scheduleSession: {
    id: string;
    sessionName: string;
    sessionDate: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  } | null;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  totalAttendances: number;
  createdBy: string;
  createdAt: string;
}

async function getMySessions(token: string): Promise<Session[]> {
  const response = await fetch('http://localhost:3000/sessions/my-sessions', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  
  return response.json();
}

// Usage
const sessions = await getMySessions(userToken);
console.log('Active sessions:', sessions.filter(s => s.isActive));
```

### Display in UI (Example)

```jsx
function MySessionsList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const token = localStorage.getItem('token');
        const data = await getMySessions(token);
        setSessions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSessions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Sessions</h2>
      {sessions.map(session => (
        <div key={session.id} className="session-card">
          <h3>{session.className} ({session.classCode})</h3>
          <p>Lecturer: {session.lecturerName}</p>
          {session.scheduleSession && (
            <p>Buổi: {session.scheduleSession.sessionName}</p>
          )}
          <p>Start: {new Date(session.startAt).toLocaleString()}</p>
          <p>Status: {session.isActive ? '🟢 Active' : '⚫ Ended'}</p>
          <p>Attendances: {session.totalAttendances}</p>
          <button onClick={() => viewDetails(session.id)}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Related APIs

- `GET /sessions/active/:classId` - Get active session of specific class
- `POST /sessions/start` - Start new session
- `POST /sessions/:id/end` - End session
- `GET /attendance/:sessionId` - Get attendances of session
- `GET /classes` - Get user's classes

## Testing

### Test as Lecturer

```bash
# 1. Login as lecturer
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "lecturer@uni.edu", "password": "lecturer123"}' \
  | jq -r '.token')

# 2. Get my sessions
curl -X GET http://localhost:3000/sessions/my-sessions \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### Test as Student

```bash
# 1. Login as student
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "d23dccn001@stu.ptit.edu.vn", "password": "password123"}' \
  | jq -r '.token')

# 2. Get my sessions
curl -X GET http://localhost:3000/sessions/my-sessions \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

## Changelog

### v1.0.0 (2024-11-26)
- Initial release
- Support for lecturer and student roles
- Include schedule session information
- Show active/inactive status
- Show total attendance count

---

**Note:** API này yêu cầu authentication. Đảm bảo bạn đã login và có JWT token hợp lệ.

