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
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = decoded.userId;
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
        const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length > 0) {
          req.userId = decoded.userId;
          req.user = result.rows[0];
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
}
