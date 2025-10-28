# Faces & Attendance API

## Overview

Hệ thống điểm danh với face recognition, realtime attendance tracking, và anti-duplicate protection.

## Database Schema

### FaceDescriptor
- Store face descriptors cho mỗi student
- Descriptor là mảng số float (tính toán bởi client)

### Session
- Quản lý phiên điểm danh
- startAt: Thời gian bắt đầu
- endAt: Thời gian kết thúc (null = đang active)

### Attendance
- Ghi điểm danh
- Anti-duplicate: < 120s giữa 2 lần ghi
- method: 'face' | 'manual'

## API Endpoints

### Faces

**1. Upload Face Descriptor**
```
POST /api/faces/upload
Authorization: Bearer <token>
{
  "studentId": "SV001",
  "descriptor": [0.1, 0.2, 0.3, ...]
}
```

**2. Get Face Gallery**
```
GET /api/faces/gallery/:classId
```

Response:
```json
[
  {
    "studentId": "SV001",
    "descriptors": [[...], [...]]
  }
]
```

### Sessions

**1. Start Session**
```
POST /api/sessions/start
Authorization: Bearer <token>
{
  "classId": "class-001"
}
```

**2. End Session**
```
POST /api/sessions/:id/end
Authorization: Bearer <token>
```

**3. Get Active Session**
```
GET /api/sessions/active/:classId
```

### Attendance

**1. Record Attendance**
```
POST /api/attendance/record
Authorization: Bearer <token>
{
  "sessionId": "session-123",
  "studentId": "SV001",
  "method": "face",
  "matchedAt": "2024-01-01T10:00:00Z"
}
```

Anti-duplicate: Chặn 2 lần ghi trong 120s

**2. List Attendance**
```
GET /api/attendance/:sessionId
```

**3. Subscribe Realtime (SSE)**
```
GET /api/attendance/:sessionId/subscribe
```

Opens Server-Sent Events connection for realtime updates.

## Realtime Updates

Sử dụng Server-Sent Events (SSE) để broadcast attendance updates:

```javascript
const eventSource = new EventSource('/api/attendance/session-123/subscribe');

eventSource.onmessage = (event) => {
  const attendance = JSON.parse(event.data);
  console.log('New attendance:', attendance);
};
```

## Anti-Duplicate Logic

```javascript
1. Query last attendance: WHERE sessionId=X AND studentId=Y ORDER BY matchedAt DESC LIMIT 1
2. Check time diff: now - last.matchedAt
3. If < 120s → Reject with error
4. If >= 120s → Accept
```

## Workflow

### Lecturer Start Session
1. POST /api/sessions/start
2. Lấy sessionId
3. Mở SSE connection: GET /api/attendance/:sessionId/subscribe

### Student Record Attendance
1. FE capture face → calculate descriptor
2. POST /api/attendance/record
3. Server validates + anti-duplicate
4. Broadcast to all listeners

### Lecturer View Attendance
- Realtime: SSE connection auto-updates
- Manual refresh: GET /api/attendance/:sessionId

## Testing

### Test Accounts
- Lecturer: `lecturer@uni.edu` / `lecturer123`
- Student: `student@uni.edu` / `student123`

### Test Flow
1. Login as lecturer
2. Start session for class
3. Subscribe to attendance updates
4. Login as student (another browser/tab)
5. Record attendance
6. See realtime update in lecturer view

### Test Anti-Duplicate
1. Record attendance
2. Record again within 2 minutes → Should be rejected
3. Record after 2 minutes → Should be accepted

## Security

- Only lecturer/admin can start/end sessions
- Anyone can record attendance (for testing)
- Face descriptors require authentication
- Anti-duplicate prevents spam
