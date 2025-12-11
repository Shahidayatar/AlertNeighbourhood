import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../services/userService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - doesn't block if no token, but populates user if present
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = findUserById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
      }
    }
  } catch (err) {
    // Silent fail for optional auth
  }

  next();
}
