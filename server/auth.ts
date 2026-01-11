import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from './db';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2024';
const SALT_ROUNDS = 10;

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  const idString = String(userId);
  const token = jwt.sign({ userId: idString }, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error: any) {
    return null;
  }
}

export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.admin_token || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role === 'admin' || String(decoded.userId) === '1') {
      return next();
    }
    
    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token || (req.query.token as string);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const result = await pool.query('SELECT id, email, name, is_pro FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = result.rows[0].id;
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const userId = decoded.userId;
        const result = await pool.query('SELECT id, email, name, is_pro FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
          req.userId = result.rows[0].id;
          req.user = result.rows[0];
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
}
