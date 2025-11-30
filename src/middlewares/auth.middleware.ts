import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware để extract và verify JWT token
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Attach user info to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware để yêu cầu authentication
 */
export const requireAuth = verifyToken;

/**
 * Alias cho verifyToken để dễ sử dụng
 */
export const authenticate = verifyToken;

/**
 * Middleware để yêu cầu role cụ thể
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware cho lecturer hoặc admin
 */
export const requireLecturer = requireRole('lecturer', 'admin');

/**
 * Middleware chỉ cho admin
 */
export const requireAdmin = requireRole('admin');
