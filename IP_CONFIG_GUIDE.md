# Hướng Dẫn Cấu Hình Kiểm Tra IP Cho Điểm Danh

## Mô Tả
Hệ thống hiện đã được cấu hình để chỉ cho phép điểm danh khi sinh viên sử dụng wifi của trường. Sinh viên sử dụng IP ngoài trường sẽ nhận được thông báo lỗi và không thể điểm danh.

## Cấu Hình IP Được Phép

### 1. Mở File Cấu Hình
Mở file `src/config/school-network.config.ts`

### 2. Thêm IP Của Trường

#### Thêm IP cụ thể:
```typescript
allowedIps: [
  '127.0.0.1',      // localhost (để testing)
  '203.162.10.1',   // IP cụ thể của trường
  '203.162.10.2',   // IP khác của trường
],
```

#### Thêm dải IP (CIDR notation):
```typescript
allowedRanges: [
  '192.168.1.0/24',  // Cho phép 192.168.1.0 - 192.168.1.255
  '10.0.0.0/16',     // Cho phép 10.0.0.0 - 10.0.255.255
],
```

### 3. Hướng Dẫn CIDR
- `/32` = 1 địa chỉ (ví dụ: `192.168.1.1/32`)
- `/24` = 256 địa chỉ (ví dụ: `192.168.1.0/24` = 192.168.1.0 - 192.168.1.255)
- `/16` = 65,536 địa chỉ (ví dụ: `192.168.0.0/16` = 192.168.0.0 - 192.168.255.255)
- `/8`  = 16,777,216 địa chỉ (ví dụ: `10.0.0.0/8` = 10.0.0.0 - 10.255.255.255)

## Cách Lấy IP Của Trường

### Windows:
```powershell
ipconfig
```
Tìm dòng "IPv4 Address"

### Linux/Mac:
```bash
ifconfig
# hoặc
ip addr
```

### Hoặc sử dụng online:
- Truy cập: https://whatismyipaddress.com/
- Sao chép IP hiển thị

## Bật/Tắt Tính Năng

### Tắt kiểm tra IP (cho testing):
```typescript
enabled: false,
```

### Bật lại kiểm tra IP:
```typescript
enabled: true,
```

## Testing

### 1. Test với localhost:
```bash
curl -X POST http://localhost:3000/api/attendance/record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sessionId": "session-id",
    "studentId": "B21DCCN001",
    "method": "face"
  }'
```

### 2. Kiểm tra IP hiện tại:
Server sẽ log IP trong console:
```
Attendance request from IP: 192.168.1.100
```

## Thông Báo Lỗi

Khi sinh viên không dùng wifi trường, họ sẽ nhận được:

**Status Code:** 403 Forbidden

**Response:**
```json
{
  "error": "Unauthorized network",
  "message": "Bạn chỉ có thể điểm danh khi sử dụng wifi của trường",
  "clientIp": "192.168.0.100"
}
```

## Lưu Ý Quan Trọng

### 1. Khi Deploy Lên Server
Nếu sử dụng proxy/load balancer (như Nginx, Cloudflare), cần cấu hình để forward IP thực của client:

**Nginx:**
```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```

**Cloudflare:**
Cloudflare tự động thêm header `CF-Connecting-IP`

### 2. IPv6
Middleware tự động xử lý IPv6, loại bỏ prefix `::ffff:` nếu có.

### 3. Localhost cho Development
Đã thêm sẵn `127.0.0.1` và `::1` để bạn có thể test local.

## Ví Dụ Cấu Hình Thực Tế

### Trường có 1 dải IP:
```typescript
export const SCHOOL_NETWORK_CONFIG = {
  allowedIps: [
    '127.0.0.1',
    '::1',
  ],
  allowedRanges: [
    '203.162.10.0/24', // Toàn bộ dải IP của trường
  ],
  enabled: true,
  errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
};
```

### Trường có nhiều tòa nhà:
```typescript
export const SCHOOL_NETWORK_CONFIG = {
  allowedIps: [
    '127.0.0.1',
    '::1',
  ],
  allowedRanges: [
    '192.168.1.0/24',  // Tòa A
    '192.168.2.0/24',  // Tòa B
    '192.168.3.0/24',  // Tòa C
    '10.0.0.0/16',     // Wifi sinh viên
  ],
  enabled: true,
  errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
};
```

## Troubleshooting

### Vấn đề: Sinh viên dùng wifi trường nhưng vẫn bị chặn
**Giải pháp:**
1. Check log để xem IP thực tế: `Attendance request from IP: xxx.xxx.xxx.xxx`
2. Thêm IP đó vào `allowedIps` hoặc `allowedRanges`

### Vấn đề: Không biết dải IP của trường
**Giải pháp:**
1. Tạm thời tắt kiểm tra: `enabled: false`
2. Thu thập IP từ log khi sinh viên điểm danh
3. Phân tích và tạo dải IP phù hợp
4. Bật lại: `enabled: true`

### Vấn đề: Testing local không được
**Giải pháp:**
Đảm bảo `127.0.0.1` và `::1` có trong `allowedIps`

## API Quản Lý IP (Nâng Cao)

Middleware có export các function để quản lý IP động:

```typescript
import { ipConfig } from './middlewares/ip-check.middleware';

// Thêm IP
ipConfig.addAllowedIp('203.162.10.100');

// Thêm dải IP
ipConfig.addAllowedRange('192.168.5.0/24');

// Xóa IP
ipConfig.removeAllowedIp('203.162.10.100');

// Lấy danh sách
const ips = ipConfig.getAllowedIps();
const ranges = ipConfig.getAllowedRanges();
```

**Lưu ý:** Thay đổi này chỉ tồn tại trong runtime. Để lưu vĩnh viễn, cần cập nhật file config.
