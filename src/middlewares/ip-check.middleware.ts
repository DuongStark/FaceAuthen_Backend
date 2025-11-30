import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

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
 * Check if IP is allowed (async - reads from database)
 */
async function isIpAllowed(ip: string): Promise<boolean> {
  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Get all active allowed IPs from database
  const allowedIPs = await prisma.allowedIP.findMany({
    where: { isActive: true },
  });

  // Check exact matches (SINGLE type)
  const singleIPs = allowedIPs.filter(ip => ip.type === 'SINGLE');
  if (singleIPs.some(item => item.ipAddress === cleanIp)) {
    return true;
  }

  // Check IP ranges (RANGE type)
  const rangeIPs = allowedIPs.filter(ip => ip.type === 'RANGE');
  for (const range of rangeIPs) {
    try {
      if (isIpInRange(cleanIp, range.ipAddress)) {
        return true;
      }
    } catch (error) {
      console.error(`Error checking IP range ${range.ipAddress}:`, error);
    }
  }

  return false;
}

/**
 * Get IP config from database
 */
async function getIPConfig() {
  let config = await prisma.iPConfig.findFirst();
  
  // Return default config if not exists
  if (!config) {
    return {
      enabled: true,
      errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
    };
  }

  return config;
}

/**
 * Middleware to check if request comes from school network
 */
export const checkSchoolNetwork = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get config from database
    const config = await getIPConfig();

    // Kiểm tra nếu tính năng bị tắt
    if (!config.enabled) {
      console.log('⚠️ IP check DISABLED - allowing all requests');
      return next();
    }

    const clientIp = getClientIp(req);
    const cleanIp = clientIp.replace(/^::ffff:/, '');
    
    console.log('=== IP CHECK DEBUG ===');
    console.log('Raw IP:', clientIp);
    console.log('Clean IP:', cleanIp);
    console.log('Enabled:', config.enabled);
    
    const isAllowed = await isIpAllowed(clientIp);
    console.log('Is Allowed:', isAllowed);
    console.log('======================');

    if (!isAllowed) {
      console.log(`🚫 BLOCKED: IP ${cleanIp} not in allowed list`);
      return res.status(403).json({
        error: 'Unauthorized network',
        message: config.errorMessage,
        clientIp: cleanIp,
      });
    }

    console.log(`✅ ALLOWED: IP ${cleanIp} is in allowed list`);
    next();
  } catch (error) {
    console.error('Error in IP check middleware:', error);
    // In case of database error, allow the request but log the error
    console.log('⚠️ IP check ERROR - allowing request due to database error');
    next();
  }
};

/**
 * Export helper functions for external use
 */
export const ipCheckHelpers = {
  getClientIp,
  isIpInRange,
  isIpAllowed,
  getIPConfig,
};
