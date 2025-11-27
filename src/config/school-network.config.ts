/**
 * School Network Configuration
 * Cấu hình IP được phép cho hệ thống điểm danh
 */

export const SCHOOL_NETWORK_CONFIG = {
  // Danh sách IP cụ thể được phép
  allowedIps: [
    // localhost IPv6
    // Thêm các IP cụ thể của trường ở đây
    // Ví dụ:
    '113.190.142.206',
    '222.252.29.85'
    // '203.162.10.1',
    // '203.162.10.2',
  ],

  // Danh sách dải IP được phép (CIDR notation)
  allowedRanges: [
    // Thêm các dải IP của trường ở đây
    // Ví dụ:
    // '192.168.1.0/24', // Toàn bộ dải 192.168.1.0 - 192.168.1.255
    // '10.0.0.0/8',     // Toàn bộ dải 10.0.0.0 - 10.255.255.255
    // '172.16.0.0/12',  // Toàn bộ dải 172.16.0.0 - 172.31.255.255
  ],

  // Có bật kiểm tra IP không (có thể tắt cho testing)
  enabled: true,

  // Message lỗi khi không phải wifi trường
  errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
};

/**
 * Hướng dẫn cấu hình:
 * 
 * 1. Thêm IP cụ thể vào allowedIps:
 *    allowedIps: ['203.162.10.1', '203.162.10.2'],
 * 
 * 2. Thêm dải IP vào allowedRanges (CIDR):
 *    allowedRanges: ['192.168.1.0/24'],
 *    - /24 = 256 địa chỉ (192.168.1.0 - 192.168.1.255)
 *    - /16 = 65,536 địa chỉ (192.168.0.0 - 192.168.255.255)
 *    - /8  = 16,777,216 địa chỉ (10.0.0.0 - 10.255.255.255)
 * 
 * 3. Tắt kiểm tra IP cho testing:
 *    enabled: false,
 * 
 * 4. Để lấy IP hiện tại của bạn:
 *    - Windows: chạy lệnh 'ipconfig' trong cmd
 *    - Linux/Mac: chạy lệnh 'ifconfig' hoặc 'ip addr'
 * 
 * 5. Lưu ý khi deploy:
 *    - Nếu dùng proxy/load balancer, IP thực sự sẽ được lấy từ header X-Forwarded-For
 *    - Cần cấu hình proxy để forward đúng IP của client
 */
