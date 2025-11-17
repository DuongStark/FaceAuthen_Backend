import { Request, Response, NextFunction } from 'express';
import { SCHOOL_NETWORK_CONFIG } from '../config/school-network.config';

// Danh sách IP được phép của trường (có thể cấu hình)
const ALLOWED_IPS = SCHOOL_NETWORK_CONFIG.allowedIps;

// Các dải IP của trường (CIDR notation)
const ALLOWED_IP_RANGES: string[] = SCHOOL_NETWORK_CONFIG.allowedRanges;

/**
 * Get client IP from request
 */
function getClientIp(req: Request): string {
  // Kiểm tra các headers phổ biến từ proxy/load balancer
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if IP is in CIDR range
 */
function isIpInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipToInt = (ipStr: string) => {
    return ipStr.split('.').reduce((int, oct) => (int << 8) + parseInt(oct), 0) >>> 0;
  };

  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

/**
 * Check if IP is allowed
 */
function isIpAllowed(ip: string): boolean {
  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Check exact matches
  if (ALLOWED_IPS.includes(cleanIp)) {
    return true;
  }

  // Check IP ranges
  for (const range of ALLOWED_IP_RANGES) {
    try {
      if (isIpInRange(cleanIp, range)) {
        return true;
      }
    } catch (error) {
      console.error(`Error checking IP range ${range}:`, error);
    }
  }

  return false;
}

/**
 * Middleware to check if request comes from school network
 */
export const checkSchoolNetwork = (req: Request, res: Response, next: NextFunction) => {
  // Kiểm tra nếu tính năng bị tắt
  if (!SCHOOL_NETWORK_CONFIG.enabled) {
    console.log('⚠️ IP check DISABLED - allowing all requests');
    return next();
  }

  const clientIp = getClientIp(req);
  const cleanIp = clientIp.replace(/^::ffff:/, '');
  
  console.log('=== IP CHECK DEBUG ===');
  console.log('Raw IP:', clientIp);
  console.log('Clean IP:', cleanIp);
  console.log('Allowed IPs:', ALLOWED_IPS);
  console.log('Allowed Ranges:', ALLOWED_IP_RANGES);
  console.log('Enabled:', SCHOOL_NETWORK_CONFIG.enabled);
  
  const isAllowed = isIpAllowed(clientIp);
  console.log('Is Allowed:', isAllowed);
  console.log('======================');

  if (!isAllowed) {
    console.log(`🚫 BLOCKED: IP ${cleanIp} not in allowed list`);
    return res.status(403).json({
      error: 'Unauthorized network',
      message: SCHOOL_NETWORK_CONFIG.errorMessage,
      clientIp: cleanIp,
    });
  }

  console.log(`✅ ALLOWED: IP ${cleanIp} is in allowed list`);
  next();
};

/**
 * Export configuration for external updates
 */
export const ipConfig = {
  getAllowedIps: () => ALLOWED_IPS,
  getAllowedRanges: () => ALLOWED_IP_RANGES,
  addAllowedIp: (ip: string) => {
    if (!ALLOWED_IPS.includes(ip)) {
      ALLOWED_IPS.push(ip);
    }
  },
  addAllowedRange: (range: string) => {
    if (!ALLOWED_IP_RANGES.includes(range)) {
      ALLOWED_IP_RANGES.push(range);
    }
  },
  removeAllowedIp: (ip: string) => {
    const index = ALLOWED_IPS.indexOf(ip);
    if (index > -1) {
      ALLOWED_IPS.splice(index, 1);
    }
  },
  removeAllowedRange: (range: string) => {
    const index = ALLOWED_IP_RANGES.indexOf(range);
    if (index > -1) {
      ALLOWED_IP_RANGES.splice(index, 1);
    }
  },
};
